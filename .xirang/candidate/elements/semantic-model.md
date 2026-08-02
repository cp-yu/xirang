---
entity: element-declaration
identity: semantic-model
kind: domain
parent: project.root
title: Semantic Model
definition: Semantic Model 是项目用户意图的完整结构化规范表达，独立建模以统一声明项目是什么并为 Agent 导航、验证和演进提供依据。它包含 Metamodel、Hierarchical Elements、Relationships 与 Views，不包含单次演进的 Semantic Delta、Change Plan 或落实这些意图的 Realization 过程。
---

## Requirements

### Requirement: 完整表达项目语义

Semantic Model SHALL 在可扩展 Metamodel 约束下，以任意深度的 Hierarchical Elements、显式 Relationships 与 Views 完整表达项目用户意图。

#### Scenario: Agent 理解项目

- **WHEN** Agent 导航或验证项目
- **THEN** Agent 可从模型获得所需层级、契约和关系而无需猜测

### Requirement: 使用稳定 identity

Semantic Model SHALL 只以稳定 identity 引用语义对象，且文件路径、目录结构与语法位置 SHALL NOT 构成 identity 或层级语义。

#### Scenario: 移动存储单元

- **WHEN** 一个语义实体的文件被移动但 identity 与内容不变
- **THEN** 模型语义保持不变

### Requirement: 完整四分区持久化

Semantic Model SHALL 完整持久化于 `.xirang/model/` 的 `metamodel`、`elements`、`relationships` 与 `views` 四个分区。

#### Scenario: 加载正式模型

- **WHEN** CLI 读取 `.xirang/model/`
- **THEN** CLI 联合四个分区构建完整模型

### Requirement: 使用 Element 存储单元

`elements` 中每个 Markdown 单元 SHALL 表达一个 Element Declaration 及其至多一个 Element Contract。

#### Scenario: 加载 Element 单元

- **WHEN** CLI 读取 `elements` 分区中的 Markdown 单元
- **THEN** 它联合 frontmatter Declaration 与正文 Contract 构建一个 Element

### Requirement: 使用 Metamodel 存储单元

`metamodel` 中每个 Markdown 单元 SHALL 表达一个 Element Kind 或 Relationship Kind。

#### Scenario: 加载 Kind 单元

- **WHEN** CLI 读取 `metamodel` 分区中的 Markdown 单元
- **THEN** 它依据 entity 加载一个 Kind

### Requirement: 使用 Authored View 存储单元

`views` 中每个 Markdown 单元 SHALL 表达一个 Authored View。

#### Scenario: 加载 View 单元

- **WHEN** CLI 读取 `views` 分区中的 Markdown 单元
- **THEN** 它依据 frontmatter 加载一个 Authored View

### Requirement: 使用 Relationship 列表容器

`relationships` 文件 SHALL 仅作为任意多条 Relationship 的结构化列表容器。

#### Scenario: 重组 Relationship 文件

- **WHEN** Relationship entries 在容器文件之间重新分组但三元组集合不变
- **THEN** 模型语义保持不变

### Requirement: 自声明实体类型

除 Relationship 与 Requirement 的结构化标识外，每个 Markdown 单元 SHALL 在 frontmatter 以 `entity` 声明自身类型；分区 SHALL NOT 决定 entity type，错置单元 SHALL 按自声明解析并产生 `ENTITY_PARTITION_MISMATCH` WARNING。

#### Scenario: Element 单元位于错误分区

- **WHEN** 一个自声明 `element-declaration` 的单元出现在非 `elements` 分区
- **THEN** 加载器按 Element 解析、报告 warning，且不因该 warning 判定模型无效

### Requirement: 约束 Identity 语法

持久 identity SHALL 匹配 `[A-Za-z0-9._-]+`，SHALL NOT 包含路径分隔符或文件系统保留字符。

#### Scenario: Identity 含路径分隔符

- **WHEN** 一个模型实体声明不合法 identity
- **THEN** CLI 拒绝该模型

### Requirement: 保持 Kind Identity 全局唯一

Element Kind 与 Relationship Kind identities 在 Metamodel 内 SHALL 全局唯一。

#### Scenario: 两类 Kind 使用相同 Identity

- **WHEN** Metamodel 声明重复 Kind identity
- **THEN** CLI 拒绝该模型

### Requirement: 不以 LikeC4 持久化语义

LikeC4 SHALL NOT 参与 Semantic Model 的规范持久化。

#### Scenario: 保存正式模型

- **WHEN** 系统写入 `.xirang/model/`
- **THEN** 只写入四分区源而不写入 `.c4`

### Requirement: 整体生成 LikeC4 缓存

`.c4` SHALL 由完整 Semantic Model 整体生成到 `.xirang/.cache-likec4/`。

#### Scenario: 生成可视化源

- **WHEN** CLI 为模型生成 LikeC4 表示
- **THEN** 产物只写入缓存

### Requirement: 不回写生成期结构

生成期局部名与嵌套结构 SHALL NOT 回写 Semantic Model。

#### Scenario: LikeC4 派生局部名

- **WHEN** 生成器为当前输出分配局部名
- **THEN** 该名称不成为持久 identity

### Requirement: 只以 Identity 建立引用

`parent`、Relationship endpoints、Kind 的 `parents`、`children`、`sourceKinds`、`targetKinds` 以及 View 的 `of`、`include` SHALL 只引用对应语义对象的 identity。

#### Scenario: 被引用单元改名

- **WHEN** 一个存储文件改名但其中实体 identity 不变
- **THEN** 全部语义引用仍解析到同一实体

### Requirement: 建立 Identity Source Index

加载器 SHALL 建立 `identity → source module` 索引。

#### Scenario: 定位语义实体来源

- **WHEN** CLI 需要读取或重写一个实体
- **THEN** 它通过 identity 索引定位对应存储单元

### Requirement: 保持文件组织非规范

目录内文件名与位置 SHALL 只作为组织约定；默认可使用 `elements/<identity>.md`、`metamodel/<kind identity>.md`、`views/<view identity>.md` 并按 Relationship Kind 分组容器，但偏离默认 SHALL NOT 改变模型语义。

#### Scenario: 使用非默认文件名

- **WHEN** 有效单元使用不同文件名
- **THEN** 加载与模型比较依据 entity 和 identity 正常处理该单元

### Requirement: 保持 Requirement Name 唯一

同一 Element Contract 内的 Requirement names SHALL 唯一。

#### Scenario: Contract 包含重名 Requirements

- **WHEN** Validator 发现同一 Contract 中两个 Requirements 使用相同 name
- **THEN** Validator 返回 `DUPLICATE_REQUIREMENT_NAME` ERROR

### Requirement: 保持 Scenario Name 唯一

同一 Requirement 内的 Scenario names SHALL 唯一。

#### Scenario: Requirement 包含重名 Scenarios

- **WHEN** Validator 发现同一 Requirement 中两个 Scenarios 使用相同 name
- **THEN** Validator 返回 `DUPLICATE_SCENARIO_NAME` ERROR

### Requirement: 要求 Requirement 包含 Scenario

每个 Requirement SHALL 至少包含一个 Scenario。

#### Scenario: Requirement 没有 Scenario

- **WHEN** Validator 发现 Requirement 的 Scenarios 为空
- **THEN** Validator 返回 `MISSING_REQUIREMENT_SCENARIO` ERROR

### Requirement: 验证 Element Kind 引用

每个 Element Declaration 的 `kind` SHALL 引用已声明的 Element Kind。

#### Scenario: Element 使用未声明 Kind

- **WHEN** Validator 无法在 Metamodel 中解析 Element 的 kind
- **THEN** Validator 返回 `UNDECLARED_ELEMENT_KIND` ERROR

### Requirement: 验证 Relationship Kind 引用

每个 Relationship 的 `kind` SHALL 引用已声明的 Relationship Kind。

#### Scenario: Relationship 使用未声明 Kind

- **WHEN** Validator 无法在 Metamodel 中解析 Relationship 的 kind
- **THEN** Validator 返回 `UNDECLARED_RELATIONSHIP_KIND` ERROR

### Requirement: 验证 Kind Constraint 引用

Element Kind 的 `parents`、`children` 与 Relationship Kind 的 `sourceKinds`、`targetKinds` SHALL 只引用已声明的 Element Kinds；该引用闭包 SHALL NOT 要求 `parents` 与 `children` 机械对称。

#### Scenario: Constraint 引用未声明 Kind

- **WHEN** Validator 在任一 Kind constraint 字段发现无法解析的 identity
- **THEN** Validator 返回 `UNRESOLVED_KIND_REFERENCE` ERROR

### Requirement: 验证 Authored View 引用

Authored View 的 `of` 与 list-form `include` SHALL 只引用已声明的 Elements；`include: '*'` SHALL 不要求逐项引用检查。

#### Scenario: View 引用未声明 Element

- **WHEN** Validator 无法解析 `of` 或 list-form `include` 中的 Element identity
- **THEN** Validator 返回 `UNRESOLVED_VIEW_REFERENCE` ERROR
