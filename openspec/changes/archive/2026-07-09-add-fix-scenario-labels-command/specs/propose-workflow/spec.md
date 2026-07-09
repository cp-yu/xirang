## MODIFIED Requirements

### Requirement: Propose applies spec content boundary

`propose` workflow SHALL 在生成 `specs` artifact 时应用 schema 提供的 `Spec content boundary`。Scenario operation labels are automatically handled by the OpenSpec CLI after validation and remain change-local review metadata for sync/archive review.

#### Scenario: Specs generation routes non-behavior content
- **WHEN** `/opsx:propose` 创建 `specs` artifact
- **THEN** prompt SHALL 指示 agent 应用返回的 `Spec content boundary`
- **AND** 非行为内容 SHALL 分发到 `design.md`、`tasks.md`、`proposal.md` 或 `opsx-delta.yaml`，而不是 requirements

#### Scenario: Propose does not duplicate boundary rules
- **WHEN** `/opsx:propose` 引用 spec content boundary
- **THEN** 应依赖 `openspec instructions specs --change "<name>" --json` 返回的 boundary
- **AND** SHALL NOT 在 propose workflow template 中定义独立冲突分类表

#### Scenario: Propose guidance delegates scenario labels to CLI
- **WHEN** `/opsx:propose` 在 specs 生成指引中说明 scenario operation labels
- **THEN** the guidance SHALL include `Scenario operation labels are automatically handled by the OpenSpec CLI after validation and remain change-local review metadata for sync/archive review.`

#### Scenario: ADDED requirement 下不加标签
- **WHEN** `/opsx:propose` 生成 `## ADDED Requirements` block
- **THEN** scenario 标题 SHALL 不加 operation label
- **AND** 隐式语义为全部新增

#### Scenario: Scenario labels 保持 change-local
- **WHEN** `/opsx:propose` 在生成的 instructions 或 artifacts 中说明 scenario operation labels
- **THEN** 应说明 labels 是 change-local metadata
- **AND** 应说明 sync/archive review 使用自动处理后的 labels
