---
entity: element-declaration
identity: authored-views
kind: element
parent: view-composition
title: Authored Views
definition: Authored Views 是由用户显式声明并作为 Semantic Model 组成持久化的 Views。Authored View 记录用户选择的呈现视角，规定需要选择和组织的语义信息；其声明可以持续存在并具有稳定 identity，但不为其呈现的语义对象增加规范性语义。
---

## ADDED Requirements

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

Authored View SHALL 在单一 Semantic Browser route 中作为 View Selection，并 SHALL 支持与 Model 相同的 focus、下钻、breadcrumb、就地展开、Change Selection 与 Presentation Mode；旧独立 Authored View route SHALL NOT 作为另一种呈现入口继续存在。

#### Scenario: 选择 Authored View

- **WHEN** 用户在 View Selection 中选择一个 Authored View
- **THEN** Controller 在同一 Browser route 请求该 View 的 runtime projection
- **AND** 三个独立控件保持可用

## MODIFIED Requirements

### Requirement: 持久化 View Definition

Authored View SHALL 以 `views` 分区中的单个无正文 Markdown 单元持久化 View Definition；该定义 SHALL 作为 Semantic Browser View Selection descriptor 使用，不要求生成独立 Browser route。

#### Scenario: 加载 Authored View

- **WHEN** CLI 读取一个 View Definition File
- **THEN** 它从 frontmatter 加载 Authored View selection descriptor

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
