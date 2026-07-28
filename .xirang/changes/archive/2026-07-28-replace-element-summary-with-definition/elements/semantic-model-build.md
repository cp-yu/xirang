---
entity: element-declaration
identity: semantic-model-build
kind: capability
parent: realization-process
title: Semantic Model Build
definition: 在授权范围和依据下构建或重建完整 Candidate Semantic Model 的过程。
---

## MODIFIED Requirements

### Requirement: 按 BFS 语义层编写 Candidate
Semantic Model Build SHALL 依次编写 Metamodel、Element Declarations 与 hierarchy、Element Contracts、Relationships、Authored Views；每个 Declaration SHALL 在对应 Contract 之前完成完整 Definition，并在每层完成后执行针对该层的 Agent 检查。

#### Scenario: 中间层尚不完整
- **WHEN** required Contracts 尚未在 Declaration 层之后写入
- **THEN** Build 不对故意不完整的中间状态要求完整 candidate validate

### Requirement: 保留独立整体约束
Element Contract 中只复述 Declaration Definition 或 sibling Requirements 语义并集且不增加规范承诺的条目 SHALL NOT 成为 Requirement；独立的不变量、顺序、原子性、一致性或完成条件 SHALL 保留为 Requirement。

#### Scenario: 父级定义跨子能力顺序
- **WHEN** 整体 Element 需要约束多个子行为的顺序
- **THEN** Build 保留该整体 Requirement

## ADDED Requirements

### Requirement: 编写完整 Element Definition
Semantic Model Build SHALL 结合 Element 的 parent、children 与 siblings 编写完整 Definition，使 Agent 可仅从 Declaration 与相邻层级上下文识别该 Element 的概念身份、独立理由和范围边界。

#### Scenario: Definition 只是标题换写
- **WHEN** Candidate Declaration 未完整表达 Element 的概念身份或边界
- **THEN** Build 在进入 Contract 层前修正该 Definition

### Requirement: 独立审查 Definition 质量
Candidate semantic review SHALL 检查每个 Definition 是否完整、是否混入 Contract 或实现语义，以及是否与 parent、children 或 siblings 重复、冲突或发生边界漂移。

#### Scenario: Clean-context Review 发现概念边界冲突
- **WHEN** 两个 Elements 的 Definitions 无法区分各自独立概念范围
- **THEN** review 返回阻塞 finding，Build 修正 Candidate 或返回 Modeling Decision Gate
