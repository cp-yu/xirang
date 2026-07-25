---
element: ai_integration.workflow_templates
---
## MODIFIED Requirements

### Requirement: apply skill SHALL 读取 LikeC4 架构上下文

Apply skill SHALL 指导 Agent 从 Project Root 开始读取 Target OPSX Semantic Model，并使用 `opsx arch query` 按 stable `elementId` 导航 abstraction/refinement hierarchy、owned Specs 与 semantic relationships。

#### Scenario: [ADDED] 查询受影响 elements
- **WHEN** Agent 开始 apply task
- **AND** task 涉及特定 element
- **THEN** SHALL 运行 `opsx arch query <elementId> --relations --depth 2`
- **AND** SHALL 理解 parent abstraction、child refinements 与 relevant relationships

#### Scenario: [ADDED] 读取 element-owned Specs
- **WHEN** query 返回 Specs
- **THEN** Agent SHALL 读取 registry 派生的 Spec paths
- **AND** MUST NOT 依赖 `metadata.specs`

#### Scenario: [ADDED] 从 Project Root 建立整体上下文
- **WHEN** task 的局部 element 缺少足够 context
- **THEN** Agent SHALL 沿 parent chain 回溯到足以解释 intent 的 abstraction
- **AND** SHALL 按需下钻而非一次加载整个模型

#### Scenario: [REMOVED] 查询受影响的 capabilities

- **WHEN** Agent 开始 apply 任务
- **AND** task 涉及特定 capability
- **THEN** skill SHALL 指导运行 `opsx arch query <capability-id> --relations --depth 2`
- **AND** Agent SHALL 使用查询结果理解架构上下文

#### Scenario: [REMOVED] 理解 metadata 中的 specs 引用

- **WHEN** arch query 返回 capability metadata
- **THEN** Agent SHALL 读取 `metadata.specs` 数组
- **AND** Agent SHALL 知道去哪里查找 behavioral specs

### Requirement: apply skill SHALL 指导理解伪代码

Skill SHALL 将 Specs 中的 element references 解释为 stable `elementId`，并通过 query 解析其当前 FQN、kind、contracts 与 relationships。

#### Scenario: [ADDED] 解析 stable elementId
- **GIVEN** Spec pseudo-code 引用 `payment.authorize`
- **WHEN** Agent 读取该 Spec
- **THEN** SHALL 将其作为 OPSX elementId 查询
- **AND** SHALL NOT 从 dot segments 猜测固定 domain/capability 层级

#### Scenario: [REMOVED] 解析 LikeC4 element IDs

- **GIVEN** spec 包含伪代码 `apply.task_executor.execute()`
- **WHEN** Agent 读取该 spec
- **THEN** skill SHALL 说明这是 LikeC4 element ID
- **AND** Agent SHALL 知道对应 apply domain 的 task_executor capability
- **AND** Agent SHALL 将其作为实现位置的语义提示

### Requirement: apply skill SHALL 在实现前查询架构

Skill SHALL 要求 Agent 在实现前按以下顺序消费 Target Semantic Model 与 current code evidence。

#### Scenario: [ADDED] 语义优先的实现流程
- **WHEN** Agent 开始实现 task
- **THEN** SHALL 依次：
  1. 查询 affected elements 与 refinement context
  2. 读取 element-owned Specs
  3. 解释 relevant semantic relationships
  4. 使用 CodeGraph 或 ACE/`rg`/`read` 获取 current implementation evidence
  5. 开始编码
- **AND** code evidence MUST NOT 静默覆盖 approved Semantic Delta

#### Scenario: [REMOVED] 架构优先的实现流程

- **WHEN** Agent 开始实现 task
- **THEN** skill SHALL 要求先执行：
  1. 运行 `opsx arch query` 理解受影响的 capabilities
  2. 读取对应的 specs
  3. 查看现有代码实现
  4. 再开始编码
