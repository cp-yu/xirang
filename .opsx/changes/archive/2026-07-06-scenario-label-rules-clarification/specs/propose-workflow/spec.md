## MODIFIED Requirements

### Requirement: Propose applies spec content boundary
`propose` workflow SHALL 在生成 `specs` artifact 时应用 schema 提供的 `Spec content boundary`。Scenario operation labels (`[ADDED]`、`[MODIFIED]`、`[REMOVED]`) 是 change-local metadata，仅 `## MODIFIED Requirements` 下每个 scenario 必须带标签标注变更类型；`## ADDED Requirements` 下 scenario 隐式全部新增不加标签；`## REMOVED Requirements` 无 scenario。

#### Scenario: [MODIFIED] Specs generation routes non-behavior content
- **WHEN** `/opsx:propose` 创建 `specs` artifact
- **THEN** prompt SHALL 指示 agent 应用返回的 `Spec content boundary`
- **AND** 非行为内容 SHALL 分发到 `design.md`、`tasks.md`、`proposal.md` 或 `opsx-delta.yaml`，而不是 requirements

#### Scenario: Propose does not duplicate boundary rules
- **WHEN** `/opsx:propose` 引用 spec content boundary
- **THEN** 应依赖 `openspec instructions specs --change "<name>" --json` 返回的 boundary
- **AND** SHALL NOT 在 propose workflow template 中定义独立冲突分类表

#### Scenario: [ADDED] MODIFIED requirement 下每个 scenario 必须有标签
- **WHEN** `/opsx:propose` 生成 `## MODIFIED Requirements` block
- **THEN** 每个 scenario 标题 MUST 携带 `[ADDED]`、`[MODIFIED]` 或 `[REMOVED]`
- **AND** 无标签 scenario 将被 validator 拒绝

#### Scenario: [ADDED] ADDED requirement 下不加标签
- **WHEN** `/opsx:propose` 生成 `## ADDED Requirements` block
- **THEN** scenario 标题 SHALL 不加 operation label
- **AND** 隐式语义为全部新增

#### Scenario: [MODIFIED] Scenario labels 保持 change-local
- **WHEN** `/opsx:propose` 在生成的 instructions 或 artifacts 中说明 scenario operation labels
- **THEN** 应说明 labels 是 change-local metadata
- **AND** 应说明 sync/archive 在写入 formal specs 前清洗 `[ADDED]` 和 `[MODIFIED]` labels，并省略 `[REMOVED]` scenario blocks

#### Scenario: [REMOVED] 未变化 scenario 可免标签
- **WHEN** `/opsx:propose` 生成一个 requirement 下部分 scenarios 实际未变化
- **THEN** 该场景不再成立：MODIFIED 下所有 scenario 均须带标签，不区分"已变化"与"未变化"
