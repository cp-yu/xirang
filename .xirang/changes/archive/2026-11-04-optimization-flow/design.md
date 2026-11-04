## Context

采用完整确认记录 `20261103T031501Z-1c618bb0`，版本 `725c09f70054886338cc60b22da54d8bb62499c701b3debbb5eb812e1873d5b3`。24 条均 accepted，其中 22 条 normative、2 条 informative，无 pending。复用该记录表达的 Design Summary：受托 Opt 自主执行，主 Agent 负责范围与最终风险验证，CLI 保留确定性证据和完成条件校验。

当前 `src/core/quality/{types,validators,state,protocol}.ts` 将 directions、selected、计数和终态贯穿命令、记录与模板；`state.ts` 只重读 evidenceFiles，缺失文件被跳过，无法保证新建文件进入新鲜度判断。Review/Optimization 保存时计算指纹也不足以证明早先测试的状态。`src/core/config-schema.ts` 与 `global-config.ts` 实际包含 directionLimit/directionRetries，项目配置与 projection 另含 minImpactLevel，因此两条配置链均在范围内。

提示候选来自已提供的 `optimization-prompts/candidates.md`，仅作撰写证据，不覆盖确认来源。候选中的 CLI action 占位须按下述接口绑定；不得原样部署。用户将优化取舍交给模型的理由保留为设计依据，不宣称本次已测得模型能力；较早已删除记录不作为来源，不恢复每项全量测试、批末必做 Review 或强制二分。

## Goals / Non-Goals

**Goals:**

- 用少量委托、报告、执行证据和主 Agent 结论代替逐方向状态机，允许一次委托合并多项工作和跨委托累计验证。
- 让实际测试/Review 的状态关联可审查，拒绝把稍后报告的状态冒充被验证状态。
- 将代码、配置、协议投影、角色原生权限、Apply/Archive/Sync 集成和对应行为验证作为同一闭环交付。

**Non-Goals:**

- 不改变普通 Apply 任务级 TDD、隔离建立、任务失败计数或非优化阶段的独立 Review 纪律。
- 不新增或重排 Elements、Kinds、Relationships、Views，不更名既有 identities。
- 不支持旧方向协议、自动迁移或第二条兼容执行路径；不清理用户代码、历史和 commits/checkpoints。
- 不把此次指定撰写/测试模型变成永久框架语义；不建立长期维护的 prompt 锁词套件。

## Decisions

### 1. 委托、证据与最终结论共用一个版本化记录存储

保留 `.quality-state.json` 作为当前投影、`.quality-log.jsonl` 作为 append-only 来源，采用明确的新 `contractVersion`。历史记录不可改写；不支持旧版本时返回结构化诊断，不以字段默认空数组归一化成新状态。日志先写、快照后写，快照与日志不一致时阻止完成并报告恢复缺口。版本更新使用同一当前记录版本比较，拒绝过期写入；CLI 生成记录 ID、委托 ID、验证 ID、时间与指纹。

记录仅关联以下内容：独立 Review；委托起点和实际报告；测试运行结果；主 Agent 最终验证安排/结论；可恢复及最终成功 checkpoint。恢复同一委托使用同一 delegationId；只有主 Agent 新探索建立新委托。保留旧记录和已放弃尝试以供判断，但不从历史自动复活最终完成状态。

报告使用一份自然语言正文，必要机械关联另存，不同时维护重复 Markdown 报告和机器方向台账。四类报告内容由 Opt 负责写全、主 Agent 负责审查；CLI 检查正文非空、关联和声明状态，不对自然语言充分性打分。未完成/放弃事项在正文交代，无此类事项明确说明；CLI 使用一个 `unresolved` 布尔声明供完成门禁，不能把它当作自然语言无问题的证明。

### 2. 小型公开接口替换方向 API

以下命令/字段是对已确认机制的工程落地选择，未作为用户确认的原文。都放在现有 `quality` namespace，支持 `--json`；结构输入支持 `--input` 与文件输入 `--from`，共用同一解析器。保留统一 `ok`、`code`、`diagnostics`、`allowedNextOperations` 与现有退出码类别；不再注册旧 `quality optimize`，旧输入返回明确 unsupported/unknown 诊断，禁止兼容转发。

| 接口 | 输入与作用 |
| --- | --- |
| `quality review <change> --begin --input <json>` | `scope` 为 baseline/incremental/defect-repair，`assignment` 为实际范围说明，可引用累计 delegationIds。CLI 捕获审查起点状态并生成 reviewId。缺省普通 Review 保持基线 Change 级意义。 |
| `quality review <change> --review <id> --version <version> --input <json>` | 提交该独立 Reviewer 的现有 verdict/issues/evidenceFiles/summary/writeBackPlan；关联起点与结束状态。目标代码在审查过程中变化时保留结论但标为不适用，不能满足完成条件。针对性 summary 只声明实际范围；CLI 生成 scope/state，不要求 Reviewer 手写哈希。 |
| `quality delegation <change> --input <json>` | `action: start` 携带 scope、可选 constraints、baselineReviewId、recoveryCommit；CLI 验证实际可恢复起点并生成 delegationId。`action: save` 携带 delegationId、version、report、evidenceIds、`delivery: progress|delivered`、unresolved；可以修正交付而不重新发现方向。`action: skip` 记录配置禁用或用户明确拒绝的理由。 |
| `quality verification <change> [--delegation <id>] -- <executable> <args...>` | CLI 直接执行测试，捕获运行前后状态、命令、cwd、stdout/stderr、exit code 或终止情况，生成 evidenceId。无 shell 字符串拼接，继承既有工具授权和进程环境。 |
| `quality conclusion <change> --version <version> --input <json>` | `action: plan` 保存主 Agent 的累计 delegationIds、验证范围和理由、所需测试说明、所需 reviewIds、未受影响旧成功证据的适用判断，以及当前 Change 已确认基线缺陷的修复/Review 关联。`action: complete` 引用该计划及真实 evidenceIds/reviewIds，保存最终理由与结果并检查当前关联。无新增固定风险审批身份。 |
| `quality checkpoint <change> --kind baseline|intermediate|successful --commit <sha>` | 关联 Agent 保存的实际可恢复 Git commit。baseline 关联独立 Review；intermediate 按需；successful 只在当前最终结论及所需通过验证成立后关联。CLI 生成记录身份与状态指纹，不按方向命名。 |
| `quality status <change>` / `quality seal <change>` | status 只读列明基线、委托、证据、计划、结论、checkpoint 及缺口；seal 校验同一完成条件并输出 seal hash。 |

`save` 也是放弃、暂停和交回主 Agent 的保存通道，不为每种场景增加独立表单或候选状态。放弃事项、原因和处理结果当时进入报告历史；最终交付汇总保留结果与失败尝试。原 delegationId 可多次 save，delivered 后主 Agent 退回修正使用同一委托更新；新 save/代码变化使依赖旧交付版本的最终结论需重判。未交付的中断状态不能完成。

确认的基线缺陷由主 Agent 在现有 conclusion 计划声明中关联问题、修复和 `defect-repair` Review，允许直接修复或继续委托 Opt。CLI 检查被声明的修复与必需独立 Review 关联，不从自然语言自动分类缺陷；Agent 不得隐瞒或将真实缺陷改记为可放弃优化。任何 required Review 未执行、失败或过期都阻止完成；无需额外 Review 时保存判断及理由，不调用 Review 入口伪造 PASS。

不新增方向 ID、排序、依赖调度、重试、最大轮数或价值等级。一次初始 Opt 交付后可以直接评估收尾，也可以新 fresh 探索；conclusion 支持覆盖多个交付的累计变化，不要求每轮先通过新的 Review。

### 3. 执行时证据与文件集合新鲜度

用 Git tracked 文件与非 ignored untracked 文件的当前集合生成代码状态 manifest，显式排除 CLI 自有质量记录和运行证据输出，保留现有 evidenceFiles 作为审查导航及额外输入。实现与测试的新建、删除、移动进入集合比较；删除用原路径缺失表示，不静默跳过。路径使用 Node.js path API 解析，持久化项目相对 POSIX 路径并稳定排序。内容哈希和文件集合决定状态，不使用 mtime 或 HEAD 单独判定；仅 HEAD 推进保留 informational 语义。

测试通过 `quality verification` 实际执行，记录运行前、运行后 manifest，结果不一致则证据保留但不视为当前成功。运行非零或中断同样保存真实输出，进程返回失败，不吞掉失败。输出存储在显式受管的 Change-local quality evidence 位置，排除自身写入导致的指纹递归；不排除普通新增实现或测试。没有可信执行捕获的旧手工 PASS 字符串不能转成新 evidenceId。

Review 使用 begin/submit 的同样前后状态关联，Reviewer 保持只读。CRITICAL writeback 保留先写 tasks 再保存审查记录的顺序，tasksFileHash 仍记录最终 tasks；机械任务勾选/质量输出不被误判为实现变化，Delta/design 等审查依据的变化仍须检查。主 Agent 计划指明实际必需验证，CLI 检查引用结果、版本、范围关联和状态适用；选择覆盖是否足够仍是主 Agent 责任。

这里保留完整运行时 manifest 以发现差异，不把差异一律解释成所有既有测试都失效。主 Agent 按实际变化和依赖影响判断受影响验证；原成功证据仍适用时，在 conclusion 中另存 `applicability`（原 evidenceId 或 reviewId、适用范围、实际差异依据与理由），CLI 自动关联当前状态及版本，保留原始运行记录。它表示主 Agent 对适用性的判断，不冒充在新状态执行测试或 Review；没有此判断且状态不匹配的证据不能满足完成条件。CLI 检查真实成功结果、引用及当前判断版本，不代替主 Agent 判断自然语言论证是否充分，失败/缺失或已确认受影响未补齐的结果不可豁免。

例如 A 在 S1 局部测试通过，随后独立优化 B 并在 S2 测试通过，主 Agent 可据差异和依赖证据确认 A 仍适用，不强制重跑 A。B 若改变 A 依赖的公共 helper，须检查实际影响并补齐受影响验证。后续代码再变化使最终结论及其适用判断需要重判，不自动沿用。该细化落实“重新判断受影响验证”和累计局部测试的确认，不增加强制全量测试或 Review。真实运行输出与执行时状态不可被报告保存操作改写。

### 4. 恢复与 checkpoint 使用现有 Git 能力

复用现有 Git commit 作为可恢复位置，但不创建逐方向 commits，不要求固定命名。Agent 在修改前保存或复用内容匹配的真实基线 commit；已有匹配 commit 不创建空提交。Opt 可按需要创建中间 commit，主 Agent 在最终所需验证通过后保存或复用内容匹配的最终 commit 并调用 checkpoint 关联。CLI 比较实际代码状态与 commit，不能仅接受一个可解析但内容不对应的 SHA。基线 Review 关联与不可变 Apply baseCommit 分开保留，不从当前 HEAD 重建隔离身份。

失败时优先局部修复/撤销并运行受影响测试。不得默认整仓 `reset --hard`/`clean -fd`；需要恢复基线时明确辨认本次优化改动并保留记录、历史及无关工作，不能证明可靠则停止。中断先由主 Agent 确认旧写入者停止，接手者核对记录和磁盘，原委托续跑，不假定最后保存完整。CLI 不承担外部 Agent 进程检测。失败诊断单独 reference 提供拆分/二分/组合检查等可选方法，方法不是门禁算法。

### 5. 同一完成投影贯穿 Apply、Sync 与 Archive

`checkQualityState` 的消费方改为读取明确义务和证据关联，不继续把 clean/dirty 单一 Review 匹配作为路由。`instructions apply` 保留已有公开状态词：缺基线 needs_review；已有基线而委托/最终验证未完成 needs_optimize；完整完成后 all_done。恢复不明与旧格式单独诊断。普通任务未完成、无 tracks 的 ready、普通 Apply correction 等行为保留。

Sync/Archive 使用与 seal 相同的完成判断，不另建风险逻辑。现有显式 `--no-verify` 授权通道及语义编译门禁不在本次重设计；默认路径仍严格验证完整证据。Archive summary 区分基线 Review、实际追加 Review、无需追加的判断及放弃事项。

Sync 原先重算 evidence hashes 会改写历史验证状态；将其改为记录一次只包含实际模型输出的确定性转换关联。原始测试/Review manifest 不变，转换前完整结论与实际输出及转换后模型状态相连，供紧接的 Archive 消费；转换不能覆盖实施代码变化或未列出的外部文件变化。Sync 事务语义保持，关联失败报告“模型已同步、质量关联失败”的真实结果，不能宣称完成。实现新增/删除、Sync 后外部修改仍阻止复用。该选择是对确认的证据真实性与现有 Sync 集成的忠实落地，不赋予 CLI 自然语言判断权。

### 6. 配置、生成面和测试维护在一个实现闭环

项目与全局 config 的有效 optimization 只保留 enabled，默认 true；schema、`config-projection.ts`、`config-prompts.ts` 的序列化与示例、设置键校验、defaults materialization、normalized projection 和 help 一并去掉 directionLimit/directionRetries/minImpactLevel。加载旧键时明确警告其路径并不纳入有效配置，设置旧键拒绝写入，磁盘文件不自动改写。其他配置的 resilient parsing、未知字段、Propose 静默忽略等规则保持。

更新 `optimizer.ts`、`apply-change.ts`、`reviewer.ts`、`quality-execution-model.ts`、`archive-change.ts`、共享协议生成源与 reference 注册。按候选整段替换 Opt/Step 4/recovery，删除退休方向 fragments 和必读旧 Opt refs；新失败诊断 reference 从显式 registry 导出。原生权限使用现有 SubagentTemplate：Opt 加 write/edit、取消 deny，Codex workspace-write；Reviewer 仍只读。用户 model 保留、Pi foreground 规则、工具中立 prompt、平台路径和受管 ownership 保护保持。

所有 model-context skill/reference/instruction 修改由 `shuaiapi-gpt/gpt-6-astra` 在获得完整记录、当前语义、候选、确定接口和相关源文本后撰写，包括修订与最终接口绑定；实际运行路由作为证据保存。测试使用 `bigmodel/glm-5.3-flash`，最多 8 个并发场景执行者；后续 Opt 与独立 Review 使用 `llmgw/gpt-6.1-sol`。场景在隔离临时工作区使用实际受管生成制品，记录 tools/files/tests/persistence/decision-gates 的动作与效果，不以最终回答或字符串断言代替。可以多轮纠正，保留失败轨迹与复验依据。这只是本 Change 的执行安排。

既有行为所有者包括 `test/commands/quality.test.ts`、`test/core/quality/{state,validators,log,protocol}.test.ts`、`test/core/{config-schema,global-config,project-config}.test.ts`、`test/commands/{config,artifact-workflow,sync}.test.ts`、`test/core/shared/{subagent-generation,skill-generation}.test.ts`、`test/core/templates/{sync-engine,apply-change,optimizer-template,reviewer-template,archive-change}.test.ts`、`test/core/archive.test.ts`、`test/core/change-sync.partitions.test.ts` 和 `test/integration/{archive-workflow,sync-workflow}.test.ts`。修改或替换原 owner，不新增平行方向套件。旧方向计数/排名/强制轮换和只读 Opt 的测试因目标行为被替代而删除或重写；无行为意义的 prompt 锁词断言移除，原生权限、协议最小输入可执行性、受管生成/清理保留持久行为测试。prompt 行动验证为一次性证据，不增加长期维护的自然语言原文测试。

### 7. 来源与父层约束的核对边界

角色/执行组将父层 `change-implementation`、`quality`、`agent`、`apply`、`apply-role` 的承诺同时改写，避免子层允许委托但父层仍要求每项 Review。证据/恢复组保留执行时关联、放弃当时保存、无进展停止、A/B 磁盘核对、可修缺陷不永久锁死及基线缺陷必需独立 Review。完成/集成组贯穿 configuration、permissions、instructions、Sync/Archive，保留普通 Apply 行为。

已读且无需改变的上层条款：`project.root#保留用户授权` 与 `保持稳定成功标准` 保留授权和证据审查；`realization#Participants 承担协作职责`、`以两个维度完整描述落实` 与 `允许跨维度语义覆盖` 已表达各层完整职责；`realization-process#推进过程维度组织` 仅组织过程；`change-realization#按形成、实现、收束推进` 已要求仅以有效验证进入 Closure；`participants#Agents 依据语义与证据推进` 与 `agents#组织独立评估` 保留依据和独立审查，并未要求每项优化审查；`cli#保持 Agent 与 CLI 职责分离` 已禁止 CLI 替代语义判断；`deterministic-operations#持久化验证证据` 保留确定性证据责任。

`agent-workbench-projection#物化共享片段与 references`、`维护 internal subagent 制品`、`保持生成产物行为等价` 和 `project-tooling-configuration#保持配置一致` 已覆盖本次受管投影，不新增角色或 workflow。`optimizer-smells#优化候选信号` 已明确非穷尽且信号不强制产生事项，可继续使用。`config-projection#Workflow surfaces 共享统一 projection contract` 已要求消费者共用归一化投影，`archive-role#通过 CLI 编排 Closure` 与 `限定 Closure 制品处理范围` 已明确按有效 Closure 规则操作，均无需新增条款。`reviewer-cleanliness` 中固定任务文件归属及逐方向 Review 的实际条款则纳入 Delta 修订。`recovery-protocol` 的固定 3-strike 属于普通 Apply task recovery，不延伸到 Opt；本次只在优化集成处限定适用边界。各 unit 只替换受影响 Sections，保留其他准确原文。

## Risks / Trade-offs

- 完整代码 manifest 会发现验证后工作区的所有文件差异 → 保留原证据，由主 Agent 根据实际差异、范围和依赖明确判断未受影响证据是否仍适用；CLI 关联判断与当前状态，不自动重绑旧测试或强制重跑全部验证。
- 前后捕获不能证明外部进程在验证中短暂修改又恢复的每个瞬间 → 遵守单写入者工作纪律，保留运行范围和输出，发现并发或状态不可信时不得完成；不引入后台文件监控或通用进程管理。
- scoped Review 被旧整 Change summary 消费方误读 → 将 assignment/scope 由 CLI 关联，所有投影与门禁共同更新，保留普通基线输出逻辑。
- prompt 声称可写而原生权限仍只读，或旧 fragments 重新附加 → 原生生成行为测试加实际 Agent 编辑轨迹验证，并按显式注册核查旧引用清理。
- 老活动质量格式阻塞继续 → 原样保留并诊断，由主 Agent/用户决定下一步，不为便利自动转换、删除或伪造新完成结果。
- 自然语言报告和风险范围是否充分不由 CLI 证明 → 由主 Agent 和独立审查承担真实语义判断，自动校验仅保证关联、版本与声明条件。
