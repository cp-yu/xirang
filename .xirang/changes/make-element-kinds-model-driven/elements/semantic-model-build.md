---
operation: MODIFIED
entity: element-declaration
identity: semantic-model-build
kind: element
parent: realization-process
title: Semantic Model Build
definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
---

## MODIFIED Requirements

### Requirement: Element Kind 是语义标签不约束层级

Semantic Model Build 编写 Element Declaration 时 SHALL 将 Element Kind 视为项目定义的语义标签，而非层级约束：优先选择最能准确表达该 Element 语义的最具体既有 Kind；当无合适 Kind 时，通过 Metamodel 新增或细化 Kind，而不是削弱 Element 的语义仅因能通过验证就使用泛化 Kind。任何 Kind 可出现在任意深度，父 Element 的 Kind 不限制子 Element 的 Kind。层级只表达抽象→细化。`parent` 字段必需，children 由 parents 推导获得。

#### Scenario: 跨 kind 层级

- **WHEN** Agent 编写一个 element 其为任意 Kind
- **THEN** Build SHALL 接受该层级结构
- **AND** SHALL NOT 因 kind 不匹配白名单而拒绝

#### Scenario: 无合适 Kind 时通过 Metamodel 新增

- **WHEN** 项目当前没有 Kind 能准确表达 Element 的语义
- **THEN** Build SHALL 在 Metamodel 中新增或细化一个 Kind
- **AND** SHALL NOT 使用一个虽然可验证但语义不匹配的泛化 Kind