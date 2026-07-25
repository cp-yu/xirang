## ADDED Requirements

### Requirement: Bootstrap phase instruction projection

`openspec bootstrap instructions [phase]` SHALL 在 JSON 与 text modes 投影同一 phase file definitions 与 definition-first authoring guidance。Pre-init、active phase 与 completed retained workspace SHALL 使用同一 projection contract；phase-specific lifecycle guidance SHALL 在共享 authoring guidance 之后提供。

#### Scenario: JSON mode 投影 phase definitions
- **WHEN** Agent 执行 `openspec bootstrap instructions [phase] --json`
- **THEN** response SHALL 包含当前 target phase 的 `fileDefinitions`
- **AND** `instruction` SHALL 先声明如何消费 file definitions，再包含 phase-specific guidance
- **AND** pre-init SHALL 使用 init phase definitions

#### Scenario: Text mode 在 instruction 前投影 definitions
- **WHEN** Agent 执行 `openspec bootstrap instructions [phase]`
- **THEN** output SHALL 在 `<instruction>` 前包含 `<file_definitions>`
- **AND** definitions SHALL 与同一状态下 JSON mode 返回的 file IDs 一致
- **AND** output MUST NOT 将 definitions 复制为 authored source content

#### Scenario: Completed workspace 保持 projection contract
- **WHEN** retained Bootstrap workspace 已 completed
- **THEN** instruction output SHALL 继续投影 target phase 的 file definitions
- **AND** SHALL 在共享 authoring guidance 后提供显式 restart guidance
