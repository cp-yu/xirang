# opsx-semantic-model Specification

## Purpose
This specification records behavior introduced by change unify-opsx-semantic-model. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: OPSX Semantic Model SHALL 统一表达 human intent

OPSX SHALL 将 LikeC4 graph modules 与 Markdown contract modules 解释为同一个权威 OPSX Semantic Model。系统与 Agent guidance MUST NOT 将它们描述为两套并列 source，也 MUST NOT 要求独立持久化 IR 才能消费该模型。

#### Scenario: Agent 读取统一模型
- **WHEN** Agent 需要理解或实现项目 intent
- **THEN** SHALL 读取 `.opsx/architecture/**/*.c4` 中的 graph semantics
- **AND** SHALL 读取 `.opsx/specs/**/*.md` 中与相关 elements 对应的 contracts
- **AND** SHALL 将两类 modules 作为同一个 OPSX Semantic Model 消费

#### Scenario: 程序化解析不创建第二权威模型
- **WHEN** CLI 为 query、validation、sync 或 view 临时解析 source files
- **THEN** 解析结果 MAY 作为运行时实现数据
- **AND** MUST NOT 被持久化或声明为独立 source of truth

### Requirement: Metamodel SHALL 定义可编译 element vocabulary

OPSX LikeC4 profile SHALL 通过显式 language version 与 Metamodel 定义 element kinds、每种 kind 的 `contractPolicy`、可选 parent/child constraints、relationship kinds 与可选 endpoint constraints。未声明 nesting constraint 时 SHALL 默认开放，而不是隐式套用 `project / domain / capability` 三层 taxonomy。

#### Scenario: 默认开放 nesting
- **WHEN** parent kind 与 child kind 均存在且 Metamodel 未声明对应限制
- **THEN** nesting SHALL 通过 Metamodel validation
- **AND** SHALL NOT 因 depth 或 kind pair 未列入固定表而失败

#### Scenario: 显式 constraint 生效
- **WHEN** element kind 声明 allowed parent 或 child kinds
- **AND** model 使用不允许的 nesting pair
- **THEN** validation SHALL 返回包含 parent、child 与 kind 的 ERROR

### Requirement: Project Root SHALL 是唯一最高抽象

每个新版 OPSX Semantic Model SHALL 恰好包含一个 Project Root Element。Project Root SHALL 无 parent，并 SHALL 通过 authored summary 与 Project Specs 表达 project-level intent、scope、success criteria 与 global invariants。

#### Scenario: 唯一 Project Root
- **WHEN** model 包含一个标记为 root 的 project element 且其他 elements 均可追溯到该 root
- **THEN** root validation SHALL 通过

#### Scenario: Root 缺失或重复
- **WHEN** model 不包含 Project Root 或包含多个 Project Roots
- **THEN** validation SHALL 返回 ERROR
- **AND** SHALL 列出检测到的 root element IDs

### Requirement: Element identity SHALL 与 containment path 分离

每个 element SHALL 包含全局唯一、稳定的 `elementId` 与非空 `summary`。LikeC4 FQN SHALL 仅表示当前 source navigation path；移动 element 到其他 parent MUST NOT 要求改变 `elementId`、Spec binding 或 canonical query identity。

#### Scenario: Element 移动保持 identity
- **GIVEN** element 的 `elementId` 为 `payment.authorize`
- **WHEN** element 从一个 parent 移动到另一个合法 parent
- **THEN** FQN MAY 改变
- **AND** `elementId`、对应 Specs 与 semantic relation identity SHALL 保持不变

#### Scenario: 重复 elementId 被拒绝
- **WHEN** 两个 elements 声明同一 `elementId`
- **THEN** validation SHALL 返回 ERROR
- **AND** SHALL 报告两个 elements 的 FQN

### Requirement: Containment SHALL 表达 abstraction refinement

每个非 root element SHALL 恰好拥有一个 parent，containment SHALL 无环。Parent SHALL 表达 children 的高层 abstraction，child SHALL refinement parent；`belongs_to`、`refines` 与 `abstracts` MUST NOT 作为重复的 persisted relationship edges。

#### Scenario: 多层 refinement 合法
- **WHEN** model 使用任意深度的 single-parent nesting
- **AND** 所有可选 Metamodel constraints 均满足
- **THEN** containment validation SHALL 通过
- **AND** query SHALL 能返回 parent、children 与 depth

#### Scenario: Parent authored abstraction 与派生 overview 分离
- **WHEN** view 展示一个包含 children 的 parent
- **THEN** SHALL 显示 parent 自身的 authored summary 或 contract
- **AND** SHALL 从 children 确定性派生 Refinement Overview
- **AND** MUST NOT 要求 parent Specs 复制 child contracts

### Requirement: Element Contract SHALL 遵循 kind policy

一个 element MAY 拥有多个 Specs，每个 Spec SHALL 恰好绑定一个 element。Metamodel `contractPolicy: required` 的 element MUST 拥有至少一个 Spec；`contractPolicy: optional` 的 element MAY 拥有零个 Specs。

#### Scenario: Required contract 完整
- **WHEN** required element 至少有一个 Spec 通过 singular binding 指向其 `elementId`
- **THEN** contract completeness SHALL 通过

#### Scenario: Required contract 缺失
- **WHEN** required element 没有任何对应 Spec
- **THEN** validation SHALL 返回 source completeness ERROR

#### Scenario: Optional contract 缺失
- **WHEN** optional element 没有对应 Spec
- **THEN** validation SHALL 通过且 MUST NOT 报缺失 contract warning

### Requirement: Language version SHALL 控制 dialect 演进

OPSX graph source SHALL 使用显式 language version 选择 model semantics。缺失 version 的现有 LikeC4 source SHALL 作为 legacy profile 读取；系统 MUST NOT 静默将 legacy source 写成新版本。

#### Scenario: 新版 source 选择 v1 semantics
- **WHEN** graph source 声明 language version `1`
- **THEN** parser 与 validator SHALL 启用 Project Root、通用 elementId、Metamodel constraints 与 singular Spec binding 规则

#### Scenario: Legacy source 保持可读
- **WHEN** graph source 未声明 language version
- **THEN** reader SHALL 使用 legacy rules
- **AND** 写入新版 source SHALL 要求显式 migration 与 human authorization

