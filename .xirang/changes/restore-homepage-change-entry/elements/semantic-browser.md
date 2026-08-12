---
operation: MODIFIED
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## ADDED Requirements

### Requirement: 首页提供 Candidate 与活动 Change 快速入口

Semantic Browser 首页 SHALL 为 Candidate View、Candidate Diff View 与每个活动 Change 提供快速入口卡片：Candidate 卡片 SHALL 以对应 `view` 状态打开单一 route（Candidate View 为 `view=candidate`，Candidate Diff View 为 `view=candidate-diff`）；活动 Change 卡片 SHALL 以 `change=<name>` 与 `mode=diff-only` 状态打开单一 route。活动 Change SHALL NOT 因首页入口而形成独立 View source、route 或持久 identity。

#### Scenario: 从首页打开 Candidate View

- **WHEN** 用户在首页点击 Candidate View 卡片
- **THEN** Browser 以 `view=candidate` 状态打开单一 route 并呈现 Candidate View
- **AND** 不创建独立 View entry

#### Scenario: 从首页打开活动 Change 差异

- **WHEN** 用户在首页点击一个活动 Change 的卡片
- **THEN** Browser 以 `change=<name>` 与 `mode=diff-only` 状态打开单一 route
- **AND** 呈现该 Change 的 diff-only 投影与 Change 审查面板
- **AND** 该 Change 仍只存在于 Change Selection，不进入 View Selection 列表

#### Scenario: 无活动 Change 时隐藏入口

- **WHEN** 不存在活动 Change
- **THEN** 首页 SHALL 不呈现活动 Change 快速入口区块
