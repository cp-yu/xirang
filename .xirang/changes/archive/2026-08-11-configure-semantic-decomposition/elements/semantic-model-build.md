---
entity: element-declaration
identity: semantic-model-build
kind: element
parent: realization-process
title: Semantic Model Build
definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
---

## ADDED Requirements

### Requirement: 按项目配置形成 Candidate hierarchy

Semantic Model Build SHALL 在 Modeling Decision Gate 与首次 Candidate hierarchy 写入前消费 normalized `decomposition`。当选择 `method` 时，Agent SHALL 将该 opaque 方法名作为结构拆分方法而不要求 CLI 展开其知识；当选择 `skill` 时，Agent SHALL 调用该逻辑 skill。拆分指导只决定 Element abstraction/refinement 使用的分解坐标系，SHALL NOT 覆盖用户授权、证据权威、Element Contract 或 Relationship 语义。

#### Scenario: 使用 Agent 已知方法

- **WHEN** `decomposition.method` 为当前 Agent 明确理解的 `c4`
- **THEN** Build 使用 Agent 已有的 C4 知识形成 Candidate hierarchy
- **AND** 不从 CLI 请求或编造 C4 方法论 payload

#### Scenario: 方法名无法明确理解

- **WHEN** 当前 Agent 不能明确理解配置的方法名或该方法对当前项目存在多个结构解释
- **THEN** Build 在相关 hierarchy 写入前一次询问用户
- **AND** MUST NOT 猜测相近方法或静默改用 C4

#### Scenario: 调用项目自有拆分 skill

- **WHEN** `decomposition.skill` 配置为一个当前工具可调用的逻辑名称
- **THEN** Build 在结构决策前调用该 skill 并遵循其拆分指导
- **AND** 继续对每个 sibling set 执行单维度、MECE 与 BFS 检查

#### Scenario: skill 不可用时停止结构形成

- **WHEN** 配置的 skill 找不到、调用失败或未返回足以形成结构的指导
- **THEN** Build fail closed 并报告该逻辑名称
- **AND** 不以默认方法继续写入 Candidate hierarchy

#### Scenario: 独立语义审查检查拆分一致性

- **WHEN** Candidate 进入 clean-context semantic review
- **THEN** review 检查 hierarchy 是否一致应用已选择的拆分指导
- **AND** 检查同一 sibling set 未混合不相容的职责、生命周期、部署或实现维度
