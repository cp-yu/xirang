## Context

`xirang verify` 当前的命令面与状态模型把一件事拆成了多个互相耦合的机制：按 `phase1/phase2` 编号的两个阶段、用 `--type` 重复判别输入类别、把"优化尚未收口"编码成 `PENDING_VERIFICATION`、用一组增量动词（`add/retain/resolve/invalidate/reject/merge/masterChallenge`）表达多轮 reconciliation。协议规则只存在于实现分支中，Agent 要组织合法输入只能读源码或反复试错。

语义模型里这个环节（`verify`）的定义本来就是"由 Review 与 Optimization 共同完成"，而 `review` 的第一条 Requirement 已经写着"每次 Apply 修改项目后执行"。也就是说，真正驱动流程的是**代码是否已经过 Review**，而不是相位编号。本次设计把命令面与记录模型按这个事实重建。

约束：不改动 freshness、seal、archive 的严格度；不引入兼容层（`framework-identity` 已声明无兼容层合同）；跨平台路径一律使用 Node.js path API。

## Goals / Non-Goals

**Goals:**

- 把命令面收敛为 `xirang quality` 的四个入口，并让入口条件全部建立在可机器判定的事实上。
- 让状态只有一个来源：当前代码与历史 Review 记录的 fingerprint 关系。
- 让 Agent 不再手写协议细节：字段、枚举、示例与状态约束由实现常量派生并投影到 help 与 reference。
- 让失败输出可直接行动：字段路径、期待值、当前状态、修正方式，以及当前状态下的合法后续操作。
- 完整保留原有保障（Review 由 clean-context reviewer 执行、优化入口必须先通过 Review、归档门禁、失败方向记录、回滚后状态正确）。

**Non-Goals:**

- 不改变 Review 与 Optimization 自身的判断标准，也不放松任何既有门禁。
- 不新增 Element，不重排 `quality` 的 sibling 维度；本次只做 identity 改名与 Contract 重写。
- 不提供 `verify`、`--type`、`phase1`、`phase2`、`PENDING_VERIFICATION` 的兼容别名。
- 不在本次实现 v2 记录格式的自动迁移（见 Migration Plan）。

## Decisions

### 1. 状态由代码状态定义，活动由状态选择

**决定**：`clean` 当且仅当存在一条 Review 记录满足"result 为 `PASS` 或 `PASS_WITH_WARNINGS`"且"其 fingerprint 与当前代码一致"；否则为 `dirty`。Review 的入口条件是 `dirty`，Optimization 的入口条件是 `clean`。

**理由**：`review` 的 Contract 已经规定每次修改后都要执行 Review；相位编号没有承载额外语义，却要求 Agent 记住"现在在第几相位"。改为代码状态后，入口条件全部可机器判定，CLI 仍然是真门禁而不是记录器。

**考虑过的替代**：保留相位编号但去掉 `--type`。被否，因为编号与状态之间没有一一对应关系（优化轮次可以任意多），编号只会成为需要额外维护的映射。

### 2. `clean` 按 fingerprint 匹配任意历史记录，而不是只看最新一条

**决定**：状态判定遍历记录（或日志），寻找一条与当前代码 fingerprint 一致的通过记录；最新记录为 `FAIL_NEEDS_CORRECTIONS` 但工作区已回滚到更早的通过状态时，状态仍为 `clean`。

**理由**：失败轮次会回滚实现，此时最新记录是失败、但代码与更早的通过状态一致。只看最新一条会把回滚后的正确状态误判为 `dirty`，导致无法继续优化。

**考虑过的替代**：回滚后删除失败记录。被否，因为失败方向与失败原因必须保留供后续避免重复。

### 3. Optimization 以"轮"为单位提交台账，动词集合删除

**决定**：每轮提交一份台账（`directions` 候选、`selected` 选中方向、可选的上一轮 `attempt`、收口的 `stopReason`）。方向状态收缩为 `pending | selected | implemented | verified | failed | rejected | deferred`；撤销判断改为"带理由与证据的字段要求"。

**理由**：`add/retain/resolve/invalidate/reject/merge/masterChallenge` 存在的唯一理由是表达"相对上一版台账的增量"。单轮提交没有上一版可比较，这批动词只是必须记住的额外词汇。撤销必须带理由与证据这条约束保留，但改成普通字段要求。

### 4. 两级计数取代单层 `optRetries`

**决定**：`optimization.directionLimit` 限制可选取的新方向数；`optimization.directionRetries` 限制同一方向的失败次数；成功方向不消耗失败额度，方向数用尽后只能收口。

**理由**：原设计只有"同一方向失败上限"，没有总量上限；而进展判定依赖连续两轮 reconciliation 的签名比较，这在单轮提交模型下不存在。方向数上限以可判定的方式补上"不要无限优化"，失败上限继续承担"不要反复撞同一面墙"。

### 5. 收口随时允许，终态由 `stopReason` 推导

**决定**：收口不需要先用尽方向数。`stopReason` 取值 `USER_DECLINED | NO_ACTIONABLE | DIRECTION_REJECTED | DIRECTION_LIMIT_REACHED | UNSAFE`，映射到 `SKIPPED | NOT_NEEDED | (IMPROVED|DEGRADED) | ABORTED_UNSAFE`。

**理由**：optimizer 常常确实找不到值得做的方向，用户也可能中途决定不优化。把"停下"建模为需要理由的收口，既允许提前终止，又让"做完了"与"被截断"在审查时可区分。

**考虑过的替代**：新增 `IMPROVED_TRUNCATED` 之类终态。被否，因为会让归档门禁的终态集合持续膨胀；理由字段已经能表达差异。

### 6. 方向 ID 由 CLI 分配，Agent 永不手写

**决定**：新方向在输入中省略 `id`，CLI 分配稳定 ID 并在输出中回显；后续引用一律使用回显的 ID。help 与 reference 不暴露 ID 正则。

**理由**：ID 格式是 CLI 的实现细节，暴露正则等于要求 Agent 手写实现相关约束；项目规则也要求 `Prefer explicit lookups over pattern matching or regex`。同轮内新增方向之间的依赖继续用 `{ "actionIndex": n }` 表达，由 CLI 在落盘前替换。

### 7. 统一输出形状与退出码

**决定**：成功返回 `ok: true` 与 `allowedNextOperations`；入口或状态条件不满足返回 `ok: false`、稳定 `code`、`diagnostics` 与 `allowedNextOperations`（exit 1）；输入形状非法返回 `ok: false`、`code: INVALID_INPUT` 与 `diagnostics`（exit 2）。`diagnostics[]` 元素为 `{path, expected, actual, fix}`。seal 归一到同一形状。

**理由**：现状有四种互不相同的输出形状（`{ok,nextStep,result}`、`{ok:false,reason}`、`{ok:false,errors}`、`{valid,errors}`），且退出码 1/2 的语义没有任何地方写明。统一后，Agent 可以只依据 `code` 与 `diagnostics` 决定下一步，无需读源码。

### 8. 协议说明只有一个来源，投影到 help 与 reference

**决定**：新增 `src/core/quality/protocol.ts` 作为唯一来源，组装既有枚举、字段与需求描述，渲染到 `xirang quality` 的 help（含 `review` 与 `optimize` 子命令）与 apply/archive skill 的 reference 文档。

**理由**：现状的手写说明已经与实现漂移（模型仍要求 `FILES_REQUIRED`，文档仍写 `git stash` checkpoint）。派生后，静态可枚举的部分不再可能漂移；只有"静态结构表达不了的状态约束"仍需人写，但只有一份。

**考虑过的替代**：把协议放在独立的 `--json` 出口。被否，因为 help 已经是 Agent 必然访问的入口，多开一个命令面不会增加信息量，只会增加一个可能漂移的出口。

### 9. 记录拆分为快照与 append-only 日志

**决定**：`.quality-state.json` 是门禁唯一读取入口（覆盖写）；`.quality-log.jsonl` 是 append-only 历史（每轮一行）。写入顺序为先日志后快照；两者不一致时按保守方向判为 `dirty`。

**理由**：现有 `.verify-result.json` 是快照，每次写入整份覆盖，因此 FAIL → 修 → 重新验证会丢掉上一轮记录——而这正是"需要记住失败方向"的场景。日志承担历史，快照承担门禁读取，避免门禁逻辑退化为扫描历史。

**考虑过的替代**：只保留日志并由门禁推导状态。被否，因为 `refreshQualityEvidenceAfterSync` 需要在 sync 后原地更新指纹，而 append-only 日志不能原地修改。

### 10. identity 改名一次性完成，不留别名

**决定**：`verify` → `quality`，其余 8 个 `verify-*` / `*-verify-*` identity 按 proposal 的架构来源表同步改名；关系端点随之改写。

**理由**：identity 是唯一稳定引用；保留旧名会让模型同时存在两套措辞，正是本次要消除的问题。旧名只出现在 `.xirang/changes/archive/**` 与 `.xirang/history/**` 中，作为历史证据不参与解析。

### 11. 记录中的字段命名

**决定**：record 类型字段为 `kind: "review" | "optimize"`；Review 记录沿用 `result`、`issues`、`tasksFileHash`、`evidenceFiles`、`evidenceFingerprint`、`evidenceFingerprintEntries`、`gitHeadCommit` 与 `contractVersion`；Optimization 记录使用 `directions`、`selected`、`attempt`、`histories`、`stopReason`、`terminal`、`directionsUsed`。方向 ID 前缀继续使用 `OPT-`。

**理由**：复用现有字段名可以把改动集中在语义变化处，避免测试与审查同时承担重命名噪音；`evidenceFingerprint*` 描述的是证据指纹而非 verify 命令，改名不会带来语义收益。

## Risks / Trade-offs

- [逐波门禁减少] 单轮提交后 CLI 无法阻止 agent 跳过 optimizer 直接实现优化 → 入口条件是 `clean`、收口必须携带台账、日志留痕，且 Review 仍由 clean-context reviewer 执行；残余风险明确接受。
- [证据完备性成为状态前提] fingerprint 只覆盖提交的 `evidenceFiles`，遗漏文件会误判 `clean` → Review 提交要求证据覆盖本次改动集合，`status` 输出显示证据范围。
- [快照与日志非原子] 中途失败可能只写其一 → 先日志后快照，不一致时保守判 `dirty`（fail-closed），不静默通过。
- [identity 改名破坏稳定引用] 历史归档与日志中的旧名不再解析 → 一次性完成、不留别名；归档目录只读且不参与解析。
- [迁移期活动 change] `unify-candidate-change-modes` 与 `browser-candidate-review` 的旧 `.verify-result.json` 不再被读取 → 二者当前 freshness 已是 `STALE`，本就需要重新验证；实现期间不开启新的 apply 流程。
- [reference 变长] 协议说明并入 reference 后可能触及 200/500 行上限 → 协议主投影放 help，reference 只保留流程所需部分。
- [手写部分仍可能滞后] "静态结构表达不了的状态约束"依旧是人写的文字 → 与实现共用同一批导出常量，并把退役 token 清零纳入验证。

### Test Maintenance

- `test/commands/verify.test.ts`：改名并重写为 `test/commands/quality.test.ts`，保留其作为 CLI 契约唯一权威位置的骨架。
- `test/core/verify/freshness.test.ts`：改名为 `test/core/quality/state.test.ts`，保留 fingerprint 与跨平台路径用例，判定部分按"匹配当前代码"重写。
- `test/core/verify/result-validator.test.ts`：改名为 `test/core/quality/validators.test.ts`，删除废弃形状用例。
- `test/commands/sync.test.ts`、`test/core/archive.test.ts`、`test/commands/artifact-workflow.test.ts`、`test/core/list.test.ts`：改断言以匹配新命令名与状态字段。
- `test/core/templates/apply-change.test.ts`、`test/core/templates/fragments/xirang-fragments.test.ts`：改写 token 与顺序断言；精确文本断言只保留协议 token、fail-closed 门禁、禁止操作与已退役 token。
- `test/core/project-config.test.ts`、`test/core/config-schema.test.ts`：改断言以匹配新的 optimization 配置键。
- `test/core/templates/skill-templates-parity.test.ts`：更新钉住的生成内容哈希。
- `test/skills/skill-template-length-validation.test.ts`：确认 reference 变更后仍在上限内。
- 删除：`--type` 判别、`begin-implementation` 模式、`actions` 全套、`INCOMPLETE_RECONCILIATION`、`UNKNOWN_FINDING_DEPENDENCY`、`CONTRADICTORY_OPTIMIZATION_STATUS`、stalled、`masterChallenge`、`PHASE2_DONE`、方向 ID 正则断言与 `affectedFileHashes` 相关用例。

## Migration Plan

1. 先完成模型与协议改动（命令面、记录模型、派生投影），再改调用方与生成面。
2. 记录格式 v1 → v2 不做自动迁移：缺失 v2 字段时按空集合读取；旧 `.verify-result.json` 因文件名变化不再被读取，`status` 报告为 `MISSING`，按正常流程重新取得 Review 记录。
3. 回滚策略：本 change 不产生运行时数据迁移；回滚即 `git revert` 相关提交，并删除可能已生成的 `.quality-state.json` / `.quality-log.jsonl`。
4. `.apply-isolation.json` 的 `phase2BaselineCommit` 随相位词汇一并改名为 `optimizationBaselineCommit`；该字段由 agent 在 Optimization 开始时写入，不带兼容读取路径，进行中的 change 重新建立 baseline 即可。
5. 记录读取遵循"空集合"契约：`optimization` 缺少 `directions`、`histories`、`directionsUsed` 时按空数组/0 读取；`evidenceFiles` 为空的记录（旧格式）在状态判定中一律视为 `dirty`，Review 输入也拒绝空 `evidenceFiles`，避免出现"无证据即恒为 clean"的 fail-open 路径。

## Open Questions

无。字段级命名与默认值已在本设计与 Element Contracts 中确定；`directionLimit` 默认 3、`directionRetries` 默认 2。
