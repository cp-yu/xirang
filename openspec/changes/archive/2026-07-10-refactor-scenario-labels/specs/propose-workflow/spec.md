## MODIFIED Requirements

### Requirement: Propose applies spec content boundary

`propose` workflow SHALL 在生成 `specs` artifact 时应用 schema 提供的 `Spec content boundary`。Scenario operation labels SHALL be generated only by the explicit `openspec scenario-labels "<name>" --write` command after post-write validation, and remain change-local review metadata for sync/archive review.

#### Scenario: Specs generation routes non-behavior content

- **WHEN** `/opsx:propose` 创建 `specs` artifact
- **THEN** prompt SHALL 指示 agent 应用返回的 `Spec content boundary`
- **AND** 非行为内容 SHALL 分发到 `design.md`、`tasks.md`、`proposal.md` 或 `opsx-delta.yaml`，而不是 requirements

#### Scenario: Propose does not duplicate boundary rules

- **WHEN** `/opsx:propose` 引用 spec content boundary
- **THEN** 应依赖 `openspec instructions specs --change "<name>" --json` 返回的 boundary
- **AND** SHALL NOT 在 propose workflow template 中定义独立冲突分类表

#### Scenario: Propose guidance delegates scenario labels to explicit CLI command

- **WHEN** `/opsx:propose` 在 specs 生成指引中说明 scenario operation labels
- **THEN** the guidance SHALL instruct agents to run `openspec scenario-labels "<name>" --write` after post-write validation
- **AND** SHALL NOT describe scenario labels as automatically handled by `validate` or `sync`

#### Scenario: ADDED requirement 下不加标签

- **WHEN** `/opsx:propose` 生成 `## ADDED Requirements` block
- **THEN** scenario 标题 SHALL 不加 operation label
- **AND** 隐式语义为全部新增

#### Scenario: Scenario labels 保持 change-local

- **WHEN** `/opsx:propose` 在生成的 instructions 或 artifacts 中说明 scenario operation labels
- **THEN** 应说明 labels 是 change-local metadata
- **AND** 应说明 sync/archive 消费并清洗已有 labels，但不生成 labels

### Requirement: Post-propose staged validation guidance

The propose workflow SHALL guide agents to validate generated specs and OPSX delta through artifact-scoped validate commands while keeping post-propose validation warning-only. After validation and the single repair pass, the workflow SHALL instruct agents to run `openspec scenario-labels "<name>" --write` and SHALL NOT require a second validation after that command.

#### Scenario: Propose guidance includes staged validation commands

- **WHEN** the generated `openspec-propose` skill describes post-propose validation
- **THEN** it SHALL include `openspec validate --change "<name>" --artifacts specs --json`
- **AND** SHALL include `openspec validate --change "<name>" --artifacts opsx-delta --json`
- **AND** SHALL describe these commands as staged checks for generated specs and `opsx-delta.yaml`

#### Scenario: Propose guidance keeps full validation available

- **WHEN** the generated `openspec-propose` skill describes final post-propose validation
- **THEN** it SHALL include `openspec validate --change "<name>" --json` as the full change validation command
- **AND** SHALL keep validation warning-only for the propose workflow
- **AND** SHALL NOT instruct agents to run `openspec sync` during post-propose validation

#### Scenario: Propose runs scenario-labels after validation

- **WHEN** post-propose validation and the optional single repair pass are complete
- **THEN** the generated `openspec-propose` skill SHALL instruct agents to run `openspec scenario-labels "<name>" --write`
- **AND** SHALL state that this command is trusted programmatic metadata generation and does not require a second validate pass
