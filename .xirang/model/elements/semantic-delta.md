---
entity: element-declaration
identity: semantic-delta
kind: element
parent: change
title: Semantic Delta
definition: Semantic Delta 是 Change 的规范性组成，由一组相对于当前 Semantic Model 声明的 Semantic Delta Entries 构成。它与当前 Semantic Model 共同唯一确定 Expected Semantic Model；持久化于 `.xirang/changes/<change>/` 的四分区，其修改语为 ADDED、MODIFIED 与 REMOVED。
---

## Requirements

### Requirement: 唯一确定目标模型
Semantic Delta SHALL 由一组 Semantic Delta Entries 构成，并与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

#### Scenario: 应用完整 Delta
- **WHEN** 同一 Change 的全部 Entries 一并应用
- **THEN** 结果是唯一的 Expected Semantic Model

### Requirement: 与 Model 同构存储
Semantic Delta SHALL 持久化于 `.xirang/changes/<change>/` 的四个模型分区，并在 Model 单元字段基础上为每个 Entry 携带 operation。

#### Scenario: 加载 Change Delta
- **WHEN** CLI 读取一个活动 Change
- **THEN** CLI 从四分区联合加载全部 Entries 而不从 Plan 推断缺失语义
#### Scenario: 创建结构 delta
- **WHEN** change 修改 Metamodel、elements、containment 或 semantic relationships
- **THEN** SHALL 在 `.xirang/changes/<name>/` 对应分区（`metamodel/`、`elements/` Declaration Entry、`relationships/`）写入 delta 单元
- **AND** 使用与 Model 同构的单元记法并携带 operation 字段
#### Scenario: 结构模块与 Contract 同属一个 delta
- **WHEN** change 同时修改结构与 Element Contracts
- **THEN** Metamodel、Element Declaration 与 Relationship operations SHALL 写入对应分区单元
- **AND** Requirement operations SHALL 写入对应 change-local `elements/` 单元正文
- **AND** 系统 SHALL 共同 materialize 一个 Target Semantic Model
### Requirement: 不污染目标状态
Delta operation 与变更历史 SHALL 只属于 Change，SHALL NOT 成为 Expected Semantic Model 或同步后 Semantic Model 的组成。

#### Scenario: 同步 Delta
- **WHEN** Semantic Delta 成功应用到正式模型
- **THEN** 结果只保留目标语义内容而不保留修改语

### Requirement: 使用统一修改语
Semantic Delta 的修改语 SHALL 只有 ADDED、MODIFIED 与 REMOVED；ADDED 与 MODIFIED 携带对应实体的完整目标内容，REMOVED 只声明需要移除实体的 identity。

#### Scenario: 修改现有实体
- **WHEN** 一个现有实体在目标状态中内容变化
- **THEN** MODIFIED Entry 直接声明其完整目标态而不叙述变化过程

#### Scenario: 改变 kind 使用 MODIFIED Declaration
- **WHEN** element 的 kind、Definition、title 或 parent 在相同稳定 identity 下发生变化
- **THEN** delta SHALL 使用携带完整目标态的 `MODIFIED` Element Declaration
- **AND** 该 Element 的稳定 identity SHALL 保持不变
#### Scenario: identity 变化使用 REMOVED + ADDED
- **WHEN** element 的稳定 identity 本身发生变化
- **THEN** delta SHALL 使用 `REMOVED` old element 与一个完整 `ADDED` new element
- **AND** MUST NOT 使用 `MODIFIED` 改变 identity
#### Scenario: 禁止 raw extend reconciliation
- **WHEN** skill 指导 delta authoring
- **THEN** MUST NOT 将 raw LikeC4 `extend` 描述为 canonical operation
- **AND** SHALL 指引使用 identity-level 单元记法
### Requirement: 在 Entry 粒度表达 operation
Delta 中的 Metamodel、View 与 Element Declaration Entry SHALL 在 frontmatter 携带 `operation`；Element Contract 的 Requirement Entries SHALL 通过 `## ADDED Requirements`、`## MODIFIED Requirements` 与 `## REMOVED Requirements` 分节获得修改语；Relationship entries SHALL 各自携带 operation（仅 ADDED 或 REMOVED，endpoint/kind 变化以 REMOVED 旧 tuple 与 ADDED 新 tuple 表达）。

#### Scenario: 仅修改 Element Contract
- **WHEN** Delta 只改变一个 Element 的 Requirements
- **THEN** Element frontmatter 只用于定位且不声明 Declaration operation

### Requirement: 支持 Element 单元内独立 Entries
一个 Element Delta 单元 SHALL 能独立表达 Declaration Entry 与零到多个 Requirement Entries；仅修改 Declaration 时正文 SHALL 为空。

#### Scenario: 同时修改声明和契约
- **WHEN** 一个 Element 的 parent 与多个 Requirements 均需改变
- **THEN** 同一单元分别以 frontmatter operation 和 Requirements 分节表达完整目标 Entries

### Requirement: 禁止冲突操作
同一 identity 在一个 Semantic Delta 中 SHALL NOT 出现冲突操作；`ADDED` identity 已存在、`MODIFIED`/`REMOVED` identity 不存在、声明 MODIFIED 无有效变化 SHALL 被验证拒绝。

#### Scenario: 检测身份前置条件
- **WHEN** `ADDED` identity 已存在于当前模型，或 `MODIFIED`/`REMOVED` identity 不存在
- **THEN** validation SHALL 返回包含 operation、identity 与 source location 的 ERROR

#### Scenario: 声明 MODIFIED 无有效变化
- **WHEN** `MODIFIED` payload 与当前模型聚合相同
- **THEN** validation SHALL 返回 operation reconciliation ERROR
#### Scenario: Operation identity precondition
- **WHEN** `ADDED` identity 已存在，或 `MODIFIED`/`REMOVED` identity 不存在
- **THEN** SHALL 返回包含 operation、identity 与 source location 的 ERROR
#### Scenario: Declared MODIFIED 无 effective change
- **WHEN** `MODIFIED` payload 与 Formal aggregate 相同
- **THEN** validation SHALL 返回 operation reconciliation ERROR
#### Scenario: 同一 identity operation 冲突
- **WHEN** 同一 identity 出现多个不构成合法 structural replacement 的 operations
- **THEN** validation SHALL 返回 conflict ERROR
- **AND** MUST NOT 依赖 source order 选择 operation
### Requirement: 联合验证 Kind 目标
Metamodel Entry 以 Element Kinds 与 Relationship Kinds 的稳定 identity 识别对象；Kind 变化 SHALL 与 Expected Semantic Model 中的 Element Declarations 与 Relationships 联合理解。

#### Scenario: 修改 Kind 约束
- **WHEN** delta `MODIFIED` element kind 或 relationship kind
- **THEN** payload SHALL 包含该 identity 的完整目标 constraints
- **AND** Expected Model 中全部 elements 与 relationships SHALL 重新验证
