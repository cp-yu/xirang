---
entity: element-declaration
identity: xirang-diff-overlay
kind: element
parent: web
title: Xirang Diff Overlay
definition: Xirang Diff Overlay 是 Web 在 LikeC4 DiagramView 上的语义差异视觉表达层，将 Change 或 Candidate 的 Semantic Delta 以 outline 颜色、diff badge 与 dim 透明度叠加在可见节点与边上，使差异信息不通过投影计算就能可视化。它独立建模以隔离差异呈现与投影计算的边界；包含 complete-with-diff 与 diff-only 两种 Mode 的差异视觉呈现与 Metamodel diff 折叠，不包含投影基准选择、base model 生成与 Contract 投递。
---

## MODIFIED Requirements

### Requirement: 呈现语义差异视觉表达

Xirang Diff Overlay SHALL 在活动 Change 的 Presentation Mode 为 `complete-with-diff` 或 `diff-only`、以及 Candidate 的 Presentation Mode 为 `diff-only` 时，以 outline 颜色、diff badge 与 dim 透明度标记可见节点与边的 ADDED、MODIFIED、REMOVED operation。活动 Change 的 `complete-with-diff` projection SHALL 使用 change-only target sources 并叠加差异标记；`diff-only` projection SHALL 使用 formal+change 或 formal+candidate union sources 并仅投影 changed elements 与必要上下文。Candidate 的 `complete` Mode SHALL NOT 激活该 overlay。单字符 diff badge glyph 为 `+`（U+002B PLUS SIGN）、`~`（U+007E TILDE）、`−`（U+2212 MINUS SIGN），分别表示 ADDED、MODIFIED、REMOVED。

#### Scenario: Change complete-with-diff

- **WHEN** 用户选择活动 Change 且 Mode 为 `complete-with-diff`
- **THEN** Browser 呈现 Change target projection
- **AND** 可见节点与边以 outline 与 badge 标记其 operation

#### Scenario: Change diff-only

- **WHEN** 用户选择活动 Change 且 Mode 为 `diff-only`
- **THEN** Browser 仅投影 changed elements、ancestors 与 relationship endpoints
- **AND** 差异标记与 complete-with-diff 一致

#### Scenario: Candidate diff-only

- **WHEN** 用户选择 `change=candidate&mode=diff-only`
- **THEN** Browser 仅投影 Candidate changed elements 与必要上下文
- **AND** 差异标记与 Change diff-only 一致

#### Scenario: Candidate complete 不叠加 overlay

- **WHEN** 用户选择 `change=candidate` 且 Mode 为 `complete`
- **THEN** Browser 不叠加 outline、badge 或 dim 差异标记
