---
entity: element-declaration
identity: authored-views
kind: element
parent: view-composition
title: Authored Views
definition: Authored Views 是由用户显式声明并作为 Semantic Model 组成持久化的 Views。Authored View 记录用户选择的呈现视角，规定需要选择和组织的语义信息；其声明可以持续存在并具有稳定 identity，但不为其呈现的语义对象增加规范性语义。
---

## MODIFIED Requirements

### Requirement: 持久化 View Definition

Authored View SHALL 以 `views` 分区中的单个无正文 Markdown 单元持久化 View Definition；该定义 SHALL 作为 Web View Selection descriptor 使用，不要求生成独立 Browser route。

#### Scenario: 加载 Authored View

- **WHEN** CLI 读取一个 View Definition File
- **THEN** 它从 frontmatter 加载 Authored View selection descriptor

### Requirement: 参与统一层级浏览

Authored View SHALL 在单一 Web route 中作为 View Selection，并 SHALL 支持与 Model 相同的 focus、下钻、breadcrumb、就地展开、Change Selection 与 Presentation Mode；旧独立 Authored View route SHALL NOT 作为另一种呈现入口继续存在。

#### Scenario: 选择 Authored View

- **WHEN** 用户在 View Selection 中选择一个 Authored View
- **THEN** Controller 在同一 Browser route 请求该 View 的 runtime projection
- **AND** 三个独立控件保持可用
