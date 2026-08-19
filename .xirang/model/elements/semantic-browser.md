---
entity: element-declaration
identity: semantic-browser
kind: element
parent: web
title: Semantic Browser
definition: Semantic Browser 是 Web 中面向用户的三维正交浏览编排层，将 Model Selection、View Selection 与 Presentation Mode 作为独立维度组合，形成统一的运行时呈现状态。Model Selection 选择当前被浏览的 Model 实例：当前 Semantic Model（baseline）、唯一 active Candidate（若存在）或某一活动 Change 的 Expected Semantic Model；三者作为 Model 值在编排上同构，Candidate 与 Change 不是独立的编排维度。View Selection 从 Full Model 与 Authored Views 中选择当前视角，View Definition 对被浏览 Model 实例解析。Presentation Mode 在 Model 为 baseline 时锁定 complete，其余 Model 提供 complete、complete-with-diff 与 diff-only 三态，差异语义统一为相对当前 Semantic Model baseline。Semantic Browser 不承载规范性语义，不持久化呈现状态，不负责投影计算与差异视觉表达。
---

## Requirements

### Requirement: 三维正交组合呈现状态

Semantic Browser SHALL 以 Model Selection、View Selection 与 Presentation Mode 三个独立维度组合形成统一的运行时呈现状态。Model Selection SHALL 从当前 Semantic Model（baseline）、唯一 active Candidate（若存在）与活动 Changes 的 Expected Semantic Model 中选择被浏览的 Model 实例；baseline SHALL 以 URL 省略编码，Candidate 与 Change SHALL 分别以 `model=candidate` 与 `model=change:<identity>` 编码，SHALL NOT 形成 Change 独立编排维度。View Selection SHALL 从 Full Model 与 Authored Views 中选择当前视角，且 SHALL 只提供对当前 Model 实例解析非空的 Views。Presentation Mode SHALL 在 Model 为 baseline 时锁定为 `complete`，其余 Model SHALL 提供 `complete`、`complete-with-diff` 与 `diff-only` 三态，默认值按 Model 值区分：Candidate 为 `complete`，活动 Change 为 `complete-with-diff`；差异语义 SHALL 统一为相对 baseline Semantic Model。

#### Scenario: 选择 Candidate 后切换 Mode

- **WHEN** 用户在 Model Selection 选中 active Candidate
- **THEN** Presentation Mode 控件解锁并默认为 `complete`
- **AND** 用户可在 `complete`、`complete-with-diff` 与 `diff-only` 三态之间切换

#### Scenario: 选择 Change 后切换 Mode

- **WHEN** 用户在 Model Selection 选中一个活动 Change 的 Expected Semantic Model
- **THEN** Presentation Mode 控件解锁并默认为 `complete-with-diff`
- **AND** 用户可在三态之间切换

#### Scenario: baseline 时 Mode 锁定

- **WHEN** Model Selection 为 baseline Semantic Model
- **THEN** Presentation Mode 锁定为 `complete`，不提供 Mode 切换选项

#### Scenario: 空解析 View 不可选

- **WHEN** 某 Authored View 对当前 Model 实例解析结果为空
- **THEN** View Selection 不提供该 View

### Requirement: 所选 Model 消失时收敛状态

当当前选中的 Model 值消失（Candidate 被 promote 或移除、活动 Change 被归档或移除）时，Semantic Browser SHALL 在收到不含该 Model 值的 manifest 后回退 baseline、将 Presentation Mode 回到 `complete`，并清除来自该 Model projection 的 expanded set 与失效 focus；旧 Model 的 diff 状态与投影 SHALL NOT 残留。

#### Scenario: Candidate 被 promote 后收敛

- **WHEN** 用户 promote Candidate 后 manifest 刷新且不含 `candidate` source
- **THEN** Model Selection 回退 baseline，Presentation Mode 回到 `complete`

#### Scenario: 查看中的 Change 被归档

- **WHEN** 用户正在浏览一个活动 Change 且该 Change 被移到 `changes/archive/`
- **THEN** Model Selection 回退 baseline，Presentation Mode 回到 `complete`
- **AND** 不残留该 Change 的 diff overlay 或就地展开状态
