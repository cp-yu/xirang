## Context

当前 `apply-workflow` 的 Element Contract 与 `src/core/templates/workflows/apply-change.ts` 同时描述了两类不同性质的内容：一类是 Change Implementation 必须满足的 TDD、证据、状态转换和独立验证门禁；另一类是 Phase 0 由谁执行、tasks 是否串行、是否使用 `.apply-steps` 或 coding subagent 等实现编排选择。后者不应成为 Semantic Model 的规范来源。

本 Change 不改变 Apply 的目标状态、Semantic Delta 消费、Required Corrections、clean-context Review/Optimization/Seal 或 Change Closure 入口。它只调整 Contract 与 canonical Agent instruction projection 的边界，并同步维护已有测试。

## Goals / Non-Goals

**Goals:**

- 让 `apply-workflow` 只规范 task-level TDD、证据、阶段门禁和状态恢复。
- 让 `task-decomposition` 只规范独立 task loop、Check 进度、上下文补足和失败恢复。
- 移除对 Master agent、串行或并行方式、`.apply-steps` 和 coding subagent 的规范性声明。
- 保持 Semantic Model、canonical template、CLI instruction projection 和测试的一致性。

**Non-Goals:**

- 不取消 task-level TDD，也不改变每个 task 的独立闭环边界。
- 不允许 Apply 在正常编排中重新合并已形成的 tasks；task 边界仍由 Propose 形成和校验。
- 不修改 Verify 的 Reviewer、Optimizer、Checkpoint、Seal 或 Change Closure 行为。
- 不把任意一种被移除的实现方式新增为 `MAY` 或其他正向 Contract。
- 不重写 `.xirang/changes/archive/**` 中的历史 Change。

## Decisions

1. **用中性 Contract 替代执行主体 Contract。**

   `apply-workflow` 的 Phase 0 Requirement 改为描述 workflow 如何处理 pending Checks 和 TDD 证据，不再出现 Master agent 作为规范主体。`task-decomposition` 同样保留 task-level TDD 与 evidence gate，但移除具体实现方法优先级和执行主体绑定。

   备选方案是保留旧 Requirement，再追加一段“Agent 可自由编排”。不采用该方案，因为旧 Requirement 中的 `SHALL`/`SHALL NOT` 仍会继续约束 Agent，新增正向许可也会把灰色区域重新形式化。

2. **保留 task loop 与 Change-level Review barrier。**

   每个 task 已在 Propose 阶段按可独立实现和验证的 TDD 闭环形成。Apply 只执行这些既有闭环，不提供常规 task 合并操作。单个 task 完成不触发阶段切换；所有 tasks 和 Required Corrections 完成后，才进入统一 Change-level Review。该 barrier 不规定 loops 的串行、并行或委托方式。

3. **canonical template 是唯一 lowering source。**

   只修改 `src/core/templates/workflows/apply-change.ts`，通过既有 skill generation pipeline 产生各工具 projection。生成目录不作为独立规范源直接维护。

4. **测试按行为风险而不是 prose 表面维护。**

   保留状态分支、TDD loop、Review barrier、恢复和 projection 完整性的可观察验证。删除依赖完整说明句、固定行数或 template payload hash 的脆弱断言。对“没有声明具体编排方式”的 active source 检查使用一次性命令验证，不增加把解释性 prose 固化为 persistent test 的测试。

5. **历史归档保持只读。**

   当前模型与 active canonical template 是本 Change 的 authority。历史 archive 记录保留当时的设计语义，不因当前 Contract 调整而改写。

## Risks / Trade-offs

- [Risk] Agent 可能选择不合适的 Phase 0 编排方式 → 保留 task-level TDD、Check evidence、Change-level Review 和 clean-context Verify 作为结果门禁。
- [Risk] 旧禁令残留在 canonical template 或 CLI fixture → 使用 active-source 搜索、生成 instruction 检查和 targeted tests 复核。
- [Risk] 删除编排约束时误删 TDD 或 Review 语义 → Semantic Delta 使用完整目标 Requirement，测试继续覆盖状态和阶段边界。
- [Trade-off] 不再通过 Contract 规定并行、subagent 或中间材料 → 交由 Agent 依据当前 Change、项目证据和运行环境自主编排，框架只保留可验证结果要求。
