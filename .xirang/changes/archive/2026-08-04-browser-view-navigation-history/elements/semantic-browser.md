---
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## ADDED Requirements

### Requirement: URL 编码导航状态并响应浏览器前进后退

Semantic Browser SHALL 将 Model View、Candidate View、Candidate Diff View 与 Change-derived View 的导航状态编码为 URL 查询参数——`source` 表示所选 Xirang source、`focus` 表示当前 focus Element identity、`mode` 表示 diff 显示模式——并将下钻、breadcrumb 跳转、source 切换与 full/diff 切换呈现为浏览器历史步；浏览器前进/后退 SHALL 按 URL 恢复对应导航状态，同步 SHALL NOT 产生循环或重复历史条目。

#### Scenario: 下钻与 breadcrumb 跳转作为历史步

- **WHEN** 用户双击进入具有 children 的 Element，或点击 breadcrumb 中的祖先 Element
- **THEN** Browser 将新 focus 写入 URL 并新增历史步
- **AND** 浏览器后退恢复先前 focus、当前层布局与 breadcrumb

#### Scenario: source 切换作为历史步

- **WHEN** 用户在 View source 选择器中切换 Model View、Candidate View、Candidate Diff View 或 Change-derived View
- **THEN** Browser 将所选 source 写入 URL 并新增历史步
- **AND** focus 在同一步内重置为适用目标模型的 Project Root

#### Scenario: full/diff 切换作为历史步

- **WHEN** 用户在支持切换的 Change-derived View 中切换 Full context 与 Diff only
- **THEN** Browser 将 mode 写入 URL 并新增历史步
- **AND** 浏览器后退恢复先前显示模式

#### Scenario: 浏览器前进后退恢复导航状态

- **WHEN** 用户使用浏览器前进或后退
- **THEN** Browser 按 URL 中的 source、focus 与 mode 恢复对应导航状态
- **AND** 同步不产生循环或重复历史条目

#### Scenario: 深链定位导航状态

- **WHEN** 用户直接打开携带 source、focus 或 mode 参数的 View URL
- **THEN** Browser 按参数建立对应 source、focus 与显示模式

#### Scenario: Authored View 不携带导航参数

- **WHEN** 用户导航到 Authored View 路由
- **THEN** Xirang 导航参数不作用于该 View
- **AND** 该 View 的 URL 不保留 source、focus 或 mode 参数
