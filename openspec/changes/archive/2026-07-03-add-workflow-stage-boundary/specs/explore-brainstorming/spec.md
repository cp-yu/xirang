## ADDED Requirements

### Requirement: Explore 使用 todo 跟踪流程

`openspec-explore` SHALL 在 todo 工具可用时，把 Superpowers explore 阶段记录为 checklist，并在阶段完成时更新 checklist。该 checklist SHALL 覆盖 context exploration、visual companion decision、one-question clarification、options comparison、section-by-section approval、Design Summary self-review 和 propose handoff。

#### Scenario: 主 instructions 要求 todo 跟踪

- **WHEN** 系统生成 `openspec-explore` skill 内容
- **THEN** 主 instructions SHALL 声明在 todo 可用时，必须在读取 context 前跟踪 mandatory exploration flow
- **AND** 主 instructions SHALL 要求随着阶段完成 tick 对应 checklist 项

#### Scenario: Superpowers reference 要求 context 前建立 checklist

- **WHEN** agent 读取 `openspec/references/openspec-explore-supperpowers-style.md`
- **THEN** reference SHALL 要求在读取项目 context 前创建 todo checklist
- **AND** checklist SHALL 包含 context、visual decision、one question、options、section approvals、self-review 和 handoff 阶段

#### Scenario: Todo checklist 不改变只读边界

- **WHEN** explore 使用 todo checklist 跟踪流程
- **THEN** checklist SHALL 只表示 explore 对话流程进度
- **AND** checklist SHALL NOT 授权 main explore agent 创建、编辑或删除项目文件或 OpenSpec 制品
