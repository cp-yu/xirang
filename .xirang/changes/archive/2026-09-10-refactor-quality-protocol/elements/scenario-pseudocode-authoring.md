---
entity: element-declaration
identity: scenario-pseudocode-authoring
kind: element
parent: scenario
title: Scenario Pseudocode Authoring
definition: Scenario Pseudocode Authoring 定义 Scenario 中使用伪代码块表达调用序列与算法流程的规范：伪代码块标注 `pseudocode` 语言、标识符引用稳定 identity，且验证器不强制校验伪代码语法。
---
## MODIFIED Requirements

### Requirement: 伪代码引用稳定 identity

伪代码中的标识符 SHALL 引用 Semantic Model 中的稳定 Element identity。

#### Scenario: 引用 element identity

- **WHEN** 在伪代码中引用模型元素
- **THEN** SHALL 使用稳定 identity（如 `apply`、`quality`）
- **AND** 示例：`apply.execute()`、`quality.review()`

#### Scenario: 引用关系语义

- **GIVEN** 模型包含 `apply -[precedes]-> review`
- **WHEN** 伪代码表达时序
- **THEN** SHALL 在注释中引用：`// apply precedes review`

#### Scenario: 解析 stable elementId
- **GIVEN** Contract pseudo-code 引用 `payment.authorize`
- **WHEN** Agent 读取该 Spec
- **THEN** SHALL 将其作为 Xirang identity 查询
- **AND** SHALL NOT 从 dot segments 猜测固定 domain/capability 层级
