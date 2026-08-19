## Why

当前 Apply Phase 0 的 Semantic Model 与生成模板把 Master agent、串行执行、`.apply-steps` 和 coding subagent 写成强制或禁止规则，限制了 Agent 在既有验证门禁内选择合适实现编排的空间。需要将这些实现选择移出规范，同时保留 task-level TDD、证据要求和 Change-level Review 门禁。

## What Changes

- **BREAKING**：Apply Phase 0 不再声明固定执行主体、串行或并行方式、`.apply-steps` 使用方式或 coding subagent 方式。
- 保留每个 task 的独立 TDD loop、Check 证据、Required Corrections、统一 Change-level Review 及 clean-context Verify 门禁。
- 同步修改 Semantic Model、canonical Apply workflow template 和受影响测试，使生成的 Agent 工作面与新 Contract 一致。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `apply-workflow`: 保留 Phase 0 的 task-level TDD、非运行时制品验证、Check 证据和统一 Verify 门禁，移除对执行主体、串并行方式、`.apply-steps` 与 coding subagent 的规范。
- `task-decomposition`: 保留 task-level TDD、Checks 进度、语义上下文和失败恢复，移除 Master agent 直接执行及具体实现方法优先级的规范。

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- `apply-workflow`: 调整 Element Definition 与 Contract 边界，使其表达 Apply workflow 的状态分支、TDD 闭环和验证门禁，不再把具体 Phase 0 编排方式作为概念边界。
- `task-decomposition`: 调整 Element Definition 与 Contract 边界，使其表达 task-level TDD、证据和诊断恢复，不再绑定执行主体或实现方法。

#### Removed Elements

- None

#### Architecture Relations

- None

## Impact

- `.xirang/model/elements/apply-workflow.md`
- `.xirang/model/elements/task-decomposition.md`
- `src/core/templates/workflows/apply-change.ts`
- `test/core/templates/apply-change.test.ts`
- `test/commands/artifact-workflow.test.ts`
- `test/core/templates/skill-templates-parity.test.ts`
- 生成的 `xirang-apply-change` skill projection 需要通过 canonical template 重新生成或验证。
