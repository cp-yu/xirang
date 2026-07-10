---
capabilities:
  - cap.ai.propose-smart-routing
  - cap.ai.workflow-templates
---
## Purpose

The propose workflow SHALL combine change creation and artifact generation into a single command, reducing friction for new users while teaching them the OpenSpec workflow through embedded guidance.
## Requirements
### Requirement: Propose workflow creation

The system SHALL provide a `propose` workflow that creates a change and generates all artifacts in one step. 生成的 propose skill 内容 SHALL 在正文开头通过 `## Workflow Stage` 表格声明制品生成边界，包含 Stage、Allowed、Forbidden 三行。当 Smart Routing 读取 Design Summary 且其 Testing Strategy 包含过时测试信息时，系统 SHALL 将 Test Maintenance 分发到 design.md（过时原因）和 tasks.md（具体更新/删除操作）。当 Design Summary 的 Testing Strategy 包含 One-time Verification 子节时，系统 SHALL 将这些项分发为 tasks.md 中不创建 persistent 测试文件的 evidence-only Check。

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

#### Scenario: Design Summary One-time Verification 分发

- **WHEN** Smart Routing 检测到 Design Summary 的 Testing Strategy 包含 `One-time Verification` 子节
- **THEN** 系统 SHALL 将这些项生成为 tasks.md 中的 evidence-only Check，且 SHALL NOT 创建 persistent 测试文件
- **AND** absence 断言 SHALL 通过 `Verifies: <path> REMOVED Requirement "<name>"` 锁定，一次性 smoke 命令 SHALL 通过普通 `Verifies:` 锁定

### Requirement: Propose workflow onboarding UX
The `propose` workflow SHALL include explanatory output to help new users understand the process.

#### Scenario: First-time user guidance
- **WHEN** user invokes `/opsx:propose`
- **THEN** the system SHALL explain what artifacts will be created (proposal.md, design.md, specs/, tasks.md)
- **THEN** the system SHALL indicate next step (`/opsx:apply` to implement)

#### Scenario: Artifact creation progress
- **WHEN** the system creates each artifact
- **THEN** the system SHALL show progress (e.g., "✓ Created proposal.md")

### Requirement: Propose workflow creates the full planning set
The `propose` workflow SHALL create the same planning artifacts that were previously produced by scaffold-plus-generation flows.

#### Scenario: Equivalent artifact result
- **WHEN** user invokes `/opsx:propose "feature name"`
- **THEN** the result SHALL create the change directory and the planning artifacts in one step
- **THEN** the same directory structure and artifacts SHALL be created
- **THEN** console output MAY differ (propose includes onboarding explanations)

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

### Requirement: Propose 消费共享 artifact language contract
`$openspec-propose` workflow SHALL 在生成 proposal、specs、design 和 tasks 时消费共享 `Document Language Contract` 与 artifact instructions 中的 `configProjection.prompt.fragments`，使新写或改写的 natural-language prose 跟随 `proseLanguage`。

#### Scenario: Propose template 包含共享语言契约
- **WHEN** propose skill template 被组装
- **THEN** template SHALL 包含共享 `Document Language Contract`
- **AND** contract SHALL 指示 agent 保留 canonical tokens，同时让 artifact prose fields 跟随 `proseLanguage`

#### Scenario: Propose 不增加额外语言自检流程
- **WHEN** propose workflow 创建 artifact
- **THEN** workflow SHALL 根据 artifact instructions 和共享 language contract 撰写 artifact
- **AND** workflow SHALL NOT 要求每个 artifact 完成前执行额外 non-canonical English prose scan

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

### Requirement: Propose pre-write delta reference guidance

The propose workflow SHALL mention `openspec check-delta` before writing change-local specs when the workflow guidance describes spec artifact generation. The guidance SHALL instruct agents to run the command with target spec ids and planned `--added`, `--modified`, `--removed`, and `--renamed-from` requirement headers, and SHALL treat Missing existing-reference checks and duplicate ADDED checks as blocking before writing specs.

#### Scenario: Propose guidance includes check-delta before writing specs
- **WHEN** the generated `openspec-propose` skill describes the specs generation flow
- **THEN** it SHALL include `openspec check-delta`
- **AND** SHALL mention `--added`, `--modified`, `--removed`, and `--renamed-from`
- **AND** SHALL place the guidance before writing change-local specs

#### Scenario: Propose guidance distinguishes pre-write blocking from post-write validation
- **WHEN** the generated `openspec-propose` skill describes validation around specs
- **THEN** it SHALL treat `openspec check-delta` Missing and Conflict results as blocking before writing specs
- **AND** SHALL keep post-propose validation warning-only
- **AND** SHALL continue to mention `openspec validate --change "<name>" --artifacts specs --json` for post-write specs validation

#### Scenario: Propose does not create a reference file only for short check-delta guidance
- **WHEN** `openspec-propose` has no existing `referenceFiles` entry for specs authoring guidance
- **THEN** the check-delta guidance SHALL remain concise in the main skill instructions
- **AND** SHALL NOT require adding a new `referenceFiles` entry only to hold the command synopsis

