## Context

Propose 的 active runtime surface 由 `src/core/templates/workflows/propose.ts` 生成，并经 transform 与 update 管线物化为各工具 Skill。当前模板、三个重复 formal Specs、project/global config 与 `check-delta` CLI 共同维护 routing 和 validation，形成多重行为权威。Git 考古确认 `check-delta` 由 `ca316674` 引入，只提供写入前 Requirement header comparison；最终 `validateChangeDeltaSpecs()` 已保留相同的确定性 post-write gate。

本变更跨越 prompt generation、config、CLI、Specs 与 OPSX，但不引入新依赖。历史 `openspec/changes/archive/**` 和 bootstrap history 保持只读。

## Goals / Non-Goals

**Goals:**
- 以 semantic readiness 替代字符数和技术关键词评分。
- 明确 new change、existing change 与 ID 冲突的 identity 语义。
- 在 readiness 通过或用户显式 override 前保持文件系统不变。
- 让 validation ERROR 阻塞 ready-for-apply，WARNING 保持非阻塞。
- 去除重复 validation、重复 Specs、无效 routing config 与 `check-delta` CLI。
- 在写 labels 前审查 deterministic preview，阻止非预期 scenario operations。

**Non-Goals:**
- 不改变 Explore 的 brainstorming 合同。
- 不改变 `validateChangeDeltaSpecs()` 的 Requirement header 交叉检查。
- 不改变 scenario-labels 的推导算法、sync 清洗语义或 archive history。
- 不实现 change rename、自动替代 ID 或新的 readiness runtime API。

## Decisions

### 1. Semantic readiness 取代评分模型

没有已确认 `Design Summary` 时，Propose 检查 problem、impact scope、approach、verification method 与 unresolved Behavior/Architecture Source decisions。缺项时在对话中列出缺口并停止；用户明确 override 后可继续，但关键 source decision 仍一次询问一个。

拒绝保留 `100 字 + 3/5`：该规则偏向 API/数据模型类功能开发，无法稳定判断 prompt、文档、重构或窄修改是否可编译。

### 2. Readiness 先于 change 创建

Propose 先只读获取 active changes、existing artifacts、formal Specs、formal OPSX 与必要 implementation evidence，再形成 provisional source impact 并判断 readiness。只有 readiness 通过或用户 override 后才执行 `openspec new change` 或更新指定 existing change。

Existing change 的 readiness 使用现有 artifacts、当前输入、`Design Summary` 与 formal/current evidence 的合并上下文，不要求本轮重复完整设计。

### 3. Change identity 不包含 rename 语义

用户明确更新 existing change 时原地更新；明确创建 new change 时若派生 ID 已存在则要求另一个 ID；仅在意图不明确且 ID 冲突时询问“更新现有 change，还是创建独立 change”。禁止覆盖、自动续写、重命名或自动生成替代 ID。

### 4. 删除 routing config，保留 silent-read compatibility

从 project/global config 类型、Schema、默认值、normalized projection 与 `config set` 白名单移除 `propose.smartRouting` 和 `propose.requireExplore`。旧磁盘配置中的 `propose` 节点加载时静默丢弃，不警告、不改写文件、不进入返回配置。Global config 的其他 unknown fields 仍保持 forward-compatible preservation。

### 5. 删除 `check-delta`

删除 CLI 实现、注册、tests、formal Spec、OPSX node 与 Propose guidance。Agent authoring 前已读取 formal Specs；写入后 combined validation 继续通过 `validateChangeDeltaSpecs()` 检查 MODIFIED/ADDED/REMOVED/RENAMED header compatibility。删除只移除重复 preflight，不移除最终安全门禁。

### 6. 单一 Propose behavior owner

将仍有效的 routing、authoring、validation、labels 与 summary 合并进 `propose-workflow`。删除 `propose-smart-routing` 与 `opsx-propose-skill` formal Specs；删除所有 Requirements 后，现有 sync 的 `shouldDeleteRebuiltSpec()` 会删除空 formal `spec.md`。

### 7. Combined validation 与分级 gate

最终流程只运行一次 `openspec validate --change "<name>" --json`，覆盖 Specs delta 与 OPSX delta。`proposal.md`、`design.md` 按 resolved definitions/templates 轻量检查，`tasks.md` 使用 deterministic task structure validation。ERROR 触发最多一轮修复并复检，残留 ERROR 阻塞 ready-for-apply；WARNING 只披露。Propose 不运行 sync。

拒绝强制依次运行 Specs-scoped、OPSX-scoped 与 combined validation：combined 命令只是合并前两者，重复执行不增加覆盖。

### 8. Preview-first scenario labels

Combined validation 通过后先运行 `openspec scenario-labels "<name>" --preview --json`，将 ADDED/MODIFIED/REMOVED suggestions 与 proposal Behavior Source 和目标 delta 对照。非预期 operation 阻塞并要求修正 Spec、重新 validation 与 preview；审查通过后才运行 `--write`。仅因 deterministic write 不再执行第二次 validate。

### 9. Prompt 只保留编排合同

Prompt 使用 canonical CLI 与外部行为，不复制 validator 内部函数名。路由判定不写入 `proposal.md`。状态仅在 readiness、blocker 与最终 summary 三个节点输出，不逐 artifact 播报。

### 10. 生成制品只通过 update 管线刷新

实现只修改模板源和生成管线依赖源码，不直接编辑受管 Skill。完成 source/test 修改后运行 `node bin/openspec.js update --force .`，再更新 parity hash 并验证生成内容。

## Risks / Trade-offs

- [Risk] 删除 pre-write CLI 后 header 错误更晚暴露。→ Combined validation 改为阻断 gate，并允许单轮修复。
- [Risk] 旧 `propose` 配置看似仍在文件中。→ 加载结果与 config query 明确不再暴露该节点；不自动改写以尊重用户文件。
- [Risk] 删除 formal Specs 时遗漏仍有效行为。→ 先在 change-local `propose-workflow` 完整定义目标行为，再以 removal-only deltas 删除重复 Specs。
- [Risk] label preview 误把遗漏 scenario 识别为删除。→ 非预期 operation 阻塞，修正后重新 validation 与 preview。
- [Risk] CLI removal 影响外部脚本。→ 这是批准的 breaking change；最终 summary 明确列出 removal，核心 post-write validator 保留。
- [Risk] 跨平台 command introspection 测试漂移。→ 依赖 Commander registry/introspection 的现有确定性测试，不增加路径字符串拼接机制。

## Migration Plan

1. 先以 RED tests 固定 semantic readiness、identity、validation、labels、config retirement 与 CLI removal 合同。
2. 修改 config 与 CLI source，删除旧 surface。
3. 重构 Propose template source，刷新生成 Skill。
4. 更新 formal Specs 与 OPSX，并清理 active stale references。
5. 运行 focused、full、strict Specs、OPSX、lint、build 与 diff checks。

回滚时整体恢复 template、config 与 CLI commits；不得只恢复 `check-delta` 注册或旧配置字段而留下 Specs/OPSX 不一致。

## Open Questions

None.
