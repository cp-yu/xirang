## Context

当前 Pre-flight Scan 挂于 Apply，输入为 Formation 时已冻结的 change-local 制品；其确定性部分由 Agent 手工执行。`validateTaskStructure` 已存在于 `src/core/parsers/task-structure.ts` 但未接入任何 CLI 门禁。`xirang validate --change` 目前只校验四分区 Semantic Delta，不校验 tasks.md 结构。

## Goals / Non-Goals

**Goals:**
- 计划一致性复核与收尾确定性验证成为 Propose 的 `post-propose-validation` 门禁，Apply 不再承担 Pre-flight。
- 确定性校验由 CLI 承担：`validateTaskStructure` 接入 `xirang validate --change`，并新增跨任务文件冲突与依赖顺序检测。
- 消除 `definition-first authoring` 术语歧义，统一为制品定义先行写作。

**Non-Goals:**
- 不改变 Apply 的实现纪律（isolation、TDD、recovery、verify integration）。
- 不在 Apply 准备阶段重跑 validate 防 drift；drift 由实现纪律与 Phase 1 Reviewer 兜底。
- 不重构 Semantic Delta 其他语义，不改 Metamodel 与 Authored Views。

## Decisions

**D1：门禁内部顺序——语义复核在前，确定性校验在最后。**
理由：语义复核与用户裁决会修改制品，Agent 概率性输出可能破坏格式或使锚点失配；确定性校验必须落在最终制品上作为收尾 gate（lint-last）。备选：确定性先行的早期失败——被否，因为 authoring 过程中已有穿插校验，早期信号不丢。

**D2：语义复核默认自行修正，仅意图不对齐时询问用户。**
理由：复核发生在 Formation 内，作者有能力直接修正；Apply 的 Pre-flight 需要询问是因为实现阶段回写 Formation 制品需要用户裁决，Propose 阶段无此约束。仅当矛盾反映与用户意图或已确认决策不对齐时呈现给用户。

**D3：门禁建模为 `propose-workflow` 的 child 而非 sibling。**
理由：门禁与制品生成共同构成 propose workflow 的"形成与验证"构成，parent 归属 workflow 表达同一执行单元；备选挂于 `propose` 与 `apply` 的 flat siblings 模式，被否——收尾门禁是 workflow 的组成活动。

**D4：确定性检查下沉 CLI 而非留在 Agent。**
理由：确定性操作由 CLI 承担是框架既定原则，Agent 不得手工重做；接线后 Propose 与 Apply 共享同一道门。新增三项检查对应 Pre-flight 的确定性残部：任务计划文件冲突检测、任务依赖顺序检测、Check 锚点与 Scenario 标题匹配。

**D5：术语统一为制品定义先行写作。**
理由：`definition-first authoring` 与 Definition Framing 语义混淆。改名覆盖 4 处 Requirement 与 3 处 Definition 及引用文本；改名即 REMOVED + ADDED。

## Risks / Trade-offs

- [接线后现有 change 可能首次暴露任务结构报错] → 在 One-time Verification 中对现有 change 试跑确认，报错即修复制品。
- [apply skill Step 2 删除产生悬空引用] → 同步清理 `xirang-apply-step-2-preflight-scan.md`、apply 流程模板与生成 skill。
- [`post-propose-validation` 与 `artifact-authoring` 拆分可能过度] → 两 child 均为可选契约，行为职责保留在 `propose-workflow` Contract，Definition 只定身份与边界。
- [门禁增加 Propose 时长] → 语义复核为形成阶段既有审查的收束，确定性校验为 CLI 一次命令，成本可忽略。
