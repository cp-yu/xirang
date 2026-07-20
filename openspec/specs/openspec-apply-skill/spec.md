# openspec-apply-skill Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: apply skill SHALL 读取 LikeC4 架构上下文

apply skill SHALL 指导 Agent 使用 `openspec arch query` 读取 LikeC4 架构上下文。

#### Scenario: 查询受影响的 capabilities

- **WHEN** Agent 开始 apply 任务
- **AND** task 涉及特定 capability
- **THEN** skill SHALL 指导运行 `openspec arch query <capability-id> --relations --depth 2`
- **AND** Agent SHALL 使用查询结果理解架构上下文

#### Scenario: 理解 metadata 中的 specs 引用

- **WHEN** arch query 返回 capability metadata
- **THEN** Agent SHALL 读取 `metadata.specs` 数组
- **AND** Agent SHALL 知道去哪里查找 behavioral specs

### Requirement: apply skill SHALL 指导理解伪代码

skill SHALL 帮助 Agent 理解 specs 中的伪代码引用。

#### Scenario: 解析 LikeC4 element IDs

- **GIVEN** spec 包含伪代码 `apply.task_executor.execute()`
- **WHEN** Agent 读取该 spec
- **THEN** skill SHALL 说明这是 LikeC4 element ID
- **AND** Agent SHALL 知道对应 apply domain 的 task_executor capability
- **AND** Agent SHALL 将其作为实现位置的语义提示

### Requirement: apply skill SHALL 在实现前查询架构

skill SHALL 要求 Agent 在实现代码前先理解架构。

#### Scenario: 架构优先的实现流程

- **WHEN** Agent 开始实现 task
- **THEN** skill SHALL 要求先执行：
  1. 运行 `openspec arch query` 理解受影响的 capabilities
  2. 读取对应的 specs
  3. 查看现有代码实现
  4. 再开始编码
