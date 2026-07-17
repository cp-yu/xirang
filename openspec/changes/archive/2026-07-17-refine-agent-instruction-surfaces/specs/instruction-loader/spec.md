## ADDED Requirements

### Requirement: Artifact current state projection

Instruction loader SHALL 将 artifact completion state 投影为独立的结构化 `currentState`，并与 definition、dependencies、instruction、template 和 config projection 分离。该状态 SHALL 只包含完成状态、当前 output paths 与可选 completion marker 状态，MUST NOT 嵌入文件内容。

#### Scenario: Existing outputs 被投影为路径
- **WHEN** instruction loader 为已有 output 的 artifact 生成 instructions
- **THEN** `currentState.completed` SHALL 反映 artifact completion detection 结果
- **AND** `currentState.outputs` SHALL 包含当前匹配的 canonical output paths
- **AND** SHALL NOT 读取并嵌入这些 output 的内容

#### Scenario: Completion marker 独立于 outputs
- **WHEN** artifact 通过 completion marker 完成
- **THEN** `currentState.completed` SHALL 为 `true`
- **AND** `currentState.outputs` MAY 为空
- **AND** `currentState.completionMarker` SHALL 分别包含 marker path 与 `present: true`

#### Scenario: Absent completion marker 仍暴露预期路径
- **WHEN** artifact 定义 completion marker 但该 marker 不存在
- **THEN** `currentState.completionMarker.path` SHALL 指向预期 marker path
- **AND** `currentState.completionMarker.present` SHALL 为 `false`

### Requirement: Schema workspace state resolution

Instruction loader SHALL 根据 resolved schema 选择 completion state 的 workspace root。Spec-driven artifacts SHALL 使用目标 change directory；Bootstrap artifacts SHALL 使用共享的 `openspec/bootstrap/` workspace。显式 schema 选择 MUST NOT 导致 Bootstrap state 从 `openspec/changes/<name>/` 读取。

#### Scenario: Spec-driven state 使用 change root
- **WHEN** loader 为 spec-driven change 生成 artifact instructions
- **THEN** completion detection 与 output resolution SHALL 使用 `openspec/changes/<name>/`

#### Scenario: Bootstrap state 使用 bootstrap root
- **WHEN** loader 使用 `bootstrap` schema 生成 phase instructions
- **THEN** completion detection、dependency state 与 output resolution SHALL 使用 `openspec/bootstrap/`
- **AND** 已存在的 Bootstrap phase outputs SHALL 从该 workspace 被识别
