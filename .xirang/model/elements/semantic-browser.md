---
entity: element-declaration
identity: semantic-browser
kind: element
parent: web
title: Semantic Browser
definition: Semantic Browser 是 Web 中面向用户的三维正交浏览编排层，将 View Selection、Change Selection 与 Presentation Mode 作为独立维度组合，形成统一的运行时呈现状态。View Selection 从 Model View 与 Authored Views 中选择当前视角；Change Selection 从活动 Changes 与唯一 active Candidate（若存在）中选择叠加内容，或选择 None；Presentation Mode 在 Change 或 Candidate 被选中时提供 complete、complete-with-diff 与 diff-only 三态，默认为 complete-with-diff，无 Change 与 Candidate 时锁定为 complete。Semantic Browser 不承载规范性语义，不持久化呈现状态，不负责投影计算与差异视觉表达。
---

## Requirements

### Requirement: 三维正交组合呈现状态

Semantic Browser SHALL 以 View Selection、Change Selection 与 Presentation Mode 三个独立维度组合形成统一的运行时呈现状态。View Selection SHALL 从 Model View 与 Authored Views 中选择当前视角；Change Selection SHALL 从活动 Changes 与唯一 active Candidate（若存在）中选择叠加内容，或选择 None，并 SHALL 以 reserved identifier `candidate` 表示 Candidate 选项；Presentation Mode SHALL 在 Change 或 Candidate 被选中时提供 `complete`、`complete-with-diff` 与 `diff-only` 三态，无 Change 与 Candidate 时 SHALL 锁定为 `complete`。

#### Scenario: 选择 Change 后切换 Mode

- **WHEN** 用户在 Change Selection 选中一个活动 Change
- **THEN** Presentation Mode 控件解锁并默认为 `complete-with-diff`
- **AND** 用户可在三态之间切换

#### Scenario: 选择 Candidate 后切换 Mode

- **WHEN** 用户在 Change Selection 选中 Candidate（`change=candidate`）
- **THEN** Presentation Mode 控件解锁并默认为 `complete-with-diff`
- **AND** 用户可在 `complete`、`complete-with-diff`、`diff-only` 三态之间切换

#### Scenario: 无 Change 时 Mode 锁定

- **WHEN** Change Selection 为 None
- **THEN** Presentation Mode 锁定为 `complete`，不提供 Mode 切换控件

### Requirement: Candidate 作为 Change Selection 特殊选项

active Candidate 存在时，Semantic Browser SHALL 在 Change Selection 中提供唯一 `candidate` 选项；该选项以 reserved identifier `candidate` 路由到 `manifest.candidate` source，而非 `manifest.changes` 中的普通 Change；Candidate 选中时 SHALL NOT 提供 Change 与 Candidate 的同时选择。

#### Scenario: 首页 Candidate 入口

- **WHEN** active Candidate 存在且用户点击首页 Candidate 入口卡片
- **THEN** Browser 以 `change=candidate&mode=complete-with-diff` 状态打开 Semantic Browser
- **AND** Change Selection 显示 Candidate 为当前选项

#### Scenario: Candidate 不存在时不显示

- **WHEN** manifest 中不含 `candidate` 字段
- **THEN** Change Selection 中不出现 Candidate 选项

### Requirement: Candidate 生命周期变化时收敛状态

当 active Candidate 被 promote 或移除时，Semantic Browser SHALL 在收到不含 `candidate` 字段的 manifest 后清空 Candidate Selection、将 Presentation Mode 回到 `complete`，并清除来自 Candidate projection 的 expanded set；旧 Candidate 的 diff 状态与投影 SHALL NOT 残留。

#### Scenario: Candidate 被 promote 后收敛

- **WHEN** 用户 promote Candidate 后 manifest 刷新且不含 `candidate` 字段
- **THEN** Change Selection 恢复为 None，Presentation Mode 回到 `complete`
