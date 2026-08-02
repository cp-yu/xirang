---
entity: element-declaration
identity: metamodel
kind: capability
parent: semantic-model
title: Metamodel
definition: Semantic Model 使用的可扩展语义记法。它声明用于表达 Hierarchical Elements 的 Element Kinds 与用于表达 Relationships 的 Relationship Kinds，并可为每种 Kind 定义其所有实例共享的语义。
---

## Requirements

### Requirement: 声明模型记法

Metamodel SHALL 以稳定 identity 声明 Element Kinds 与 Relationship Kinds，并可规定各 Kind 的共享语义、契约策略、层级约束与关系端点约束。

#### Scenario: 验证模型实体

- **WHEN** Element 或 Relationship 引用一个 Kind
- **THEN** 该 Kind 在 Metamodel 中存在且实体满足其约束

### Requirement: 联合理解 Kind 变更

Metamodel Kind 的变化 SHALL 与使用该 Kind 的 Element Declarations 或 Relationships 联合验证。

#### Scenario: 修改 Kind 约束

- **WHEN** 一个 Kind 的共享约束发生变化
- **THEN** 目标模型中的全部相关实例按新约束重新验证

### Requirement: 使用规范 Kind 字段

Element Kind SHALL 声明 `identity` 与 `contract`，并可声明 `root`、`parents`、`children`；Relationship Kind SHALL 声明 `identity`，并可声明 `sourceKinds` 与 `targetKinds`。Kind 正文可表达其所有实例共享的语义。

#### Scenario: 声明受约束 Relationship Kind

- **WHEN** Relationship Kind 限制允许的端点类型
- **THEN** Metamodel 以 sourceKinds 与 targetKinds 声明并由模型验证器执行约束

### Requirement: 默认开放 nesting

未声明的 Kind pair constraint 不构成隐式禁止；显式声明的 parent/child 约束 SHALL 由验证器执行。

#### Scenario: 未声明约束时通过

- **WHEN** parent kind 与 child kind 均存在且 Metamodel 未声明对应限制
- **THEN** containment SHALL 通过验证，不因深度或 kind pair 未列入固定表而失败

### Requirement: 管理内置 Perspective Kind

Metamodel SHALL 将 `perspective` 作为持久化且受 Xirang 管理的内置 Element Kind；新模型 SHALL 包含规范声明，旧模型缺失且尚未使用该 Kind 时 SHALL 保持可读并报告迁移 WARNING，已存在声明与内置定义冲突或被重定义时 SHALL 报告 ERROR。

#### Scenario: 新模型声明 Perspective Kind

- **WHEN** CLI 建立新 Semantic Model 或 clean Candidate
- **THEN** `metamodel` 分区包含符合内置定义的 `perspective` 声明

#### Scenario: 读取缺失声明的旧模型

- **WHEN** 旧模型未声明且未使用 `perspective`
- **THEN** Validator 保持模型可读并返回可操作的迁移 WARNING

#### Scenario: 内置声明发生冲突

- **WHEN** 模型中的 `perspective` 声明与内置 contract、parents、children 或共享语义不一致
- **THEN** Validator 返回 ERROR 且系统不覆盖该声明
