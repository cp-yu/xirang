## MODIFIED Requirements

### Requirement: Propose applies spec content boundary
`propose` workflow SHALL 在生成 `specs` artifact 时应用 schema 提供的 `Spec content boundary`。当生成的 change-local specs 包含完整 MODIFIED requirement blocks 且只有部分 scenarios 受影响时，workflow SHALL 允许将 scenario operation labels 作为 change-local review/sync metadata 使用，并 SHALL 保持 labels 不属于 formal spec 内容的边界。

#### Scenario: Specs generation routes non-behavior content
- **WHEN** `/opsx:propose` 创建 `specs` artifact
- **THEN** prompt SHALL 指示 agent 应用返回的 `Spec content boundary`
- **AND** 非行为内容 SHALL 分发到 `design.md`、`tasks.md`、`proposal.md` 或 `opsx-delta.yaml`，而不是 requirements

#### Scenario: Propose does not duplicate boundary rules
- **WHEN** `/opsx:propose` 引用 spec content boundary
- **THEN** 应依赖 `openspec instructions specs --change "<name>" --json` 返回的 boundary
- **AND** SHALL NOT 在 propose workflow template 中定义独立冲突分类表

#### Scenario: Scenario labels 标记局部变化
- **WHEN** `/opsx:propose` 生成一个 `## MODIFIED Requirements` block，其中未变化和已变化的 scenarios 都需要展示
- **THEN** 生成的 change-local spec MAY 用 `#### Scenario: [ADDED] <title>`、`#### Scenario: [MODIFIED] <title>` 或 `#### Scenario: [REMOVED] <title>` 标记受影响的 scenario headings
- **AND** 未变化 scenario headings SHALL 保持 unlabeled

#### Scenario: Scenario labels 保持 change-local
- **WHEN** `/opsx:propose` 在生成的 instructions 或 artifacts 中说明 scenario operation labels
- **THEN** 应说明 labels 是 change-local metadata
- **AND** 应说明 sync/archive 在写入 formal specs 前清洗 `[ADDED]` 和 `[MODIFIED]` labels，并省略 `[REMOVED]` scenario blocks
