---
entity: element-declaration
identity: scenario-pseudocode-authoring
kind: capability
parent: scenario
title: Scenario Pseudocode Authoring
definition: Scenario Pseudocode Authoring 定义 Scenario 中使用伪代码块表达调用序列与算法流程的规范：伪代码块标注 `pseudocode` 语言、标识符引用稳定 identity，且验证器不强制校验伪代码语法。
---

## Requirements

### Requirement: Scenario 支持伪代码表达调用序列

Scenario 中 SHALL 允许使用伪代码块表达调用序列和算法流程。

#### Scenario: 使用伪代码表达调用链

- **GIVEN** contract 描述 apply workflow 执行流程
- **WHEN** 编写 scenario
- **THEN** SHALL 允许包含标注语言为 `pseudocode` 的伪代码块

### Requirement: 伪代码引用稳定 identity

伪代码中的标识符 SHALL 引用 Semantic Model 中的稳定 Element identity。

#### Scenario: 引用 capability elements

- **WHEN** 在伪代码中引用模型元素
- **THEN** SHALL 使用稳定 identity（如 `apply`、`verify`）
- **AND** 示例：`apply.execute()`、`verify.review()`

#### Scenario: 引用关系语义

- **GIVEN** 模型包含 `apply -[precedes]-> review`
- **WHEN** 伪代码表达时序
- **THEN** SHALL 在注释中引用：`// apply precedes review`
#### Scenario: 解析 stable elementId
- **GIVEN** Contract pseudo-code 引用 `payment.authorize`
- **WHEN** Agent 读取该 Spec
- **THEN** SHALL 将其作为 Xirang identity 查询
- **AND** SHALL NOT 从 dot segments 猜测固定 domain/capability 层级
### Requirement: Scenario 支持混合表达

一个 scenario SHALL 允许同时使用 WHEN/THEN 和伪代码。

#### Scenario: 混合使用

- **WHEN** 编写复杂 scenario
- **THEN** SHALL 允许同时包含行为描述与标注为 `pseudocode` 的调用序列块

### Requirement: 伪代码验证为可选

Xirang 验证 MUST NOT 强制验证伪代码语法。

#### Scenario: 伪代码语法自由

- **GIVEN** contract 包含伪代码块
- **WHEN** 运行验证
- **THEN** MUST NOT 解析或验证伪代码语法
- **AND** 伪代码仅作为人类和 Agent 可读文档
