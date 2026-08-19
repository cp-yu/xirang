---
entity: element-declaration
identity: authored-views
kind: element
parent: view-composition
title: Authored Views
definition: Authored Views 是由用户显式声明并作为 Semantic Model 组成持久化的 Views。Authored View 记录用户选择的呈现视角，规定需要选择和组织的语义信息；其声明可以持续存在并具有稳定 identity，但不为其呈现的语义对象增加规范性语义。
---

## Requirements

### Requirement: 由用户显式声明

Authored View SHALL 由用户显式声明。

#### Scenario: 用户未声明 View

- **WHEN** 模型没有用户声明的 Authored View
- **THEN** `views` 分区可保持为空

### Requirement: 持久化 View Definition

Authored View SHALL 以 `views` 分区中的单个无正文 Markdown 单元持久化 View Definition；该定义 SHALL 作为 Web View Selection descriptor 使用，不要求生成独立 Browser route。

#### Scenario: 加载 Authored View

- **WHEN** CLI 读取一个 View Definition File
- **THEN** 它从 frontmatter 加载 Authored View selection descriptor

### Requirement: 声明 View Identity

Authored View SHALL 声明稳定 `identity`。

#### Scenario: 引用 Authored View

- **WHEN** 系统寻址一个持久化 View
- **THEN** 使用该 View identity

### Requirement: 声明选择范围

Authored View SHALL 声明 `include`，其值 SHALL 为 `*` 或 Element identity 列表，并 MAY 声明 Element identity 列表 `exclude`；缺失或空 `exclude` SHALL 等价于空集合。系统 SHALL 先形成 include 选择闭包，再以 exclude 优先剪除每个匹配 Element 的完整 descendants 子树，且 focus、展开或 Relationship endpoint 映射 SHALL NOT 重新引入被排除内容。

#### Scenario: 选择并排除子树

- **WHEN** `include` 选择一个 ancestor 且 `exclude` 列出其 descendant
- **THEN** 该 descendant 与全部后代不属于 View Selection
- **AND** ancestor 的其他未排除后代仍属于选择闭包

#### Scenario: exclude 缺失

- **WHEN** Authored View 未声明 `exclude` 或声明空列表
- **THEN** Browser 不额外排除任何 included content

#### Scenario: exclude 包含未知 identity

- **WHEN** `exclude` 引用目标 Semantic Model 中不存在的 Element identity
- **THEN** 模型校验返回 `ERROR`

### Requirement: 声明可选 View 属性

Authored View MAY 声明 `of`、`title` 与 `autoLayout`，其中 `of` SHALL 为单个 Element identity。

#### Scenario: 声明 Element 上下文

- **WHEN** 用户将 Authored View 绑定到一个 Element
- **THEN** `of` 引用该 Element identity

### Requirement: 形成 Descendants 选择闭包

Authored View SHALL 将每个 included Element 的 descendants 纳入选择闭包，使 focus 与就地展开能够逐层显露闭包内内容；显露 SHALL 只改变 runtime projection，SHALL NOT 扩大持久化选择或修改 View Definition。

#### Scenario: 展开 included Element

- **WHEN** 用户在 Authored View 中展开 included Element 的 descendant container
- **THEN** Browser 显示选择闭包内且未被排除的 children
- **AND** Authored View 文件保持不变

#### Scenario: Relationship 指向选择外邻居

- **WHEN** 选择闭包内 Element 与选择外 Element 存在 Relationship
- **THEN** 该 Relationship SHALL NOT 将选择外邻居引入 View

### Requirement: 使用 Virtual Projection Root

当 Authored View 的最小顶层选择包含多个互不包含的 Elements 时，Browser SHALL 使用仅供 projection、layout 与 breadcrumb 的非语义 virtual root；该 root SHALL NOT 成为 Element、进入 Semantic Model、显示 Element Details 或持久化到 Authored View。

#### Scenario: Authored View 包含多个顶层 Elements

- **WHEN** View Selection 包含多个彼此独立的顶层 Elements
- **THEN** Browser 在同一 Graphviz projection 中以 virtual root 组织它们
- **AND** breadcrumb 首项使用 Authored View title 或 identity

#### Scenario: Model 存在唯一 Project Root

- **WHEN** View Selection 是 Model 且存在唯一 Project Root
- **THEN** Browser 使用真实 Project Root
- **AND** 不创建可见 virtual root

### Requirement: 参与统一层级浏览

Authored View SHALL 在单一 Web route 中作为 View Selection，并 SHALL 支持与 Model 相同的 focus、下钻、breadcrumb、就地展开、Model Selection 与 Presentation Mode；旧独立 Authored View route SHALL NOT 作为另一种呈现入口继续存在。

#### Scenario: 选择 Authored View

- **WHEN** 用户在 View Selection 选择一个 Authored View
- **THEN** Browser 在该 View 对当前 Model 实例的解析边界内呈现，并支持统一层级浏览交互

### Requirement: 对被浏览 Model 实例解析

Authored View 的选择闭包 SHALL 对被浏览 Model 实例解析：`include: '*'` SHALL 选择该实例的全体元素；include 列表中不存在于该实例的 identity SHALL 不产生选择；解析结果为空的 View SHALL 在该 Model 上下文的 View Selection 中不可选。

#### Scenario: 全量 include 在 Candidate 上扩集

- **WHEN** 一个 `include: '*'` 的 Authored View 应用于含新增元素的 Candidate
- **THEN** 选择闭包包含该 Candidate 的全体元素，包括 baseline 中不存在的元素

#### Scenario: 实例外 identity 自然丢弃

- **WHEN** Authored View 的 include 列表包含被浏览 Model 实例中不存在的 identity
- **THEN** 该 identity 不产生选择，也不使投影失败

#### Scenario: 空解析不可选

- **WHEN** Authored View 对被浏览 Model 实例的解析结果为空
- **THEN** 该 View 在该 Model 上下文的 View Selection 中不可选
