## MODIFIED Requirements

### Requirement: Propose workflow creation

The system SHALL provide a `propose` workflow that creates a change and generates all artifacts in one step. 生成的 propose skill 内容 SHALL 在正文开头通过 `## Workflow Stage` 表格声明制品生成边界，包含 Stage、Allowed、Forbidden 三行。当 Smart Routing 读取 Design Summary 且其 Testing Strategy 包含过时测试信息时，系统 SHALL 将 Test Maintenance 分发到 design.md（过时原因）和 tasks.md（具体更新/删除操作）。

#### Scenario: Basic propose invocation
- **WHEN** user invokes `/opsx:propose "add user authentication"`
- **THEN** the system SHALL create a change directory with kebab-case name
- **THEN** the system SHALL create `.openspec.yaml` in the change directory (via `openspec new change`)
- **THEN** the system SHALL generate all artifacts needed for implementation: proposal.md, design.md, specs/, tasks.md

#### Scenario: Propose with existing change name
- **WHEN** user invokes `/opsx:propose` with a name that already exists
- **THEN** the system SHALL ask if user wants to continue existing change or create new
- **THEN** if "continue": the system SHALL resume artifact generation from last completed state
- **THEN** if "create new": the system SHALL prompt for a new name
- **THEN** in non-interactive mode: the system SHALL fail with error suggesting to use a different name

#### Scenario: Propose skill 声明制品生成阶段边界表格

- **WHEN** 生成 `openspec-propose` skill 内容
- **THEN** 输出 SHALL 在正文首个章节包含 `## Workflow Stage` 表格
- **AND** 表格 SHALL 包含 Stage 行标记为 `PROPOSE` 并说明为制品生成阶段（不实施代码）
- **AND** 表格 SHALL 包含 Forbidden 行声明禁止实施代码、修改现有项目文件
- **AND** 表格 SHALL 位于 `## Flow` 等其他章节之前

#### Scenario: Design Summary 过时测试分发

- **WHEN** Smart Routing 检测到 Design Summary 的 Testing Strategy 包含 "Test Maintenance" 子节
- **THEN** 系统 SHALL 将过时原因（哪个架构变更导致）写入 design.md 的 Testing Strategy 部分
- **AND** 系统 SHALL 将具体操作（文件的更新/删除动作）生成为 tasks.md 中的独立需求
- **AND** 若 Design Summary 不包含过时测试信息，系统 SHALL 正常跳过此步骤
