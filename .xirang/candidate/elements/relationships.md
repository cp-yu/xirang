---
entity: element-declaration
identity: relationships
kind: element
parent: semantic-model
title: Relationships
definition: Relationships 是 Elements 之间显式的、类型化的语义联系。每个 Relationship 连接 source Element 与 target Element，并使用由 Metamodel 声明的 Relationship Kind，表达 Elements 之间的协作、依赖或约束；它补充 Hierarchical Elements 无法表达的联系。
---

## Requirements

### Requirement: 表达跨层级语义联系
Relationship SHALL 以 source Element identity、Relationship Kind identity 与 target Element identity 表达层级结构无法表达的协作、依赖或约束。

#### Scenario: 建立语义联系
- **WHEN** 两个 Elements 存在需要显式表达的协作关系
- **THEN** 模型以 Metamodel 已声明的 Relationship Kind 连接二者

### Requirement: 以全部内容确定 identity
Relationship identity SHALL 由有方向的 source、kind 与 target 三元组完整确定，并且 Relationship SHALL NOT 包含其他字段或 MODIFIED 状态。

#### Scenario: 改变关系端点
- **WHEN** source、kind 或 target 任一项变化
- **THEN** 该变化表示移除旧 Relationship 并新增不同 Relationship

### Requirement: 保持容器无语义
Relationship 容器 SHALL 仅包含 `relationships` 列表，条目 SHALL 仅含 `source`、`kind` 与 `target`；文件名、路径和分组方式 SHALL NOT 参与 identity 或语义。

#### Scenario: 按不同 Kind 重新分组
- **WHEN** 相同 Relationship entries 被移动到不同容器文件
- **THEN** 模型比较不报告语义差异

### Requirement: 保持关系词汇精确
Relationship SHALL 使用 Metamodel 声明的 Relationship Kind；containment 派生语义（`belongs_to`、`refines`、`abstracts`）SHALL NOT 作为持久化 relationship edges。

#### Scenario: 持久化 containment 关系被拒绝
- **WHEN** 模型显式声明 `belongs_to`、`refines` 或 `abstracts` edge
- **THEN** validation SHALL 返回重复语义 ERROR

### Requirement: 校验关系端点
Relationship endpoints SHALL 引用可解析 Elements，并遵守 Metamodel 可选 `sourceKinds` 与 `targetKinds`；未声明 endpoint constraint 时默认开放。

#### Scenario: Endpoint 约束违规
- **WHEN** relationship endpoint kind 不满足显式 Metamodel constraint
- **THEN** validation SHALL 返回包含 relation 与 endpoint kinds 的 ERROR
