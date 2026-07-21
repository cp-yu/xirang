# ai-tool-paths Specification

## Purpose
Define AI tool path metadata used to generate OPSX skills and commands in tool-specific directories.
## Requirements
### Requirement: AIToolOption skillsDir field

The `AIToolOption` interface SHALL include an optional `skillsDir` field for skill generation path configuration.

#### Scenario: Interface includes skillsDir field

- **WHEN** a tool entry is defined in `AI_TOOLS` that supports skill generation
- **THEN** it SHALL include a `skillsDir` field specifying the project-local base directory (e.g., `.claude`)

#### Scenario: Skills path follows Agent Skills spec

- **WHEN** generating skills for a tool with `skillsDir: '.claude'`
- **THEN** skills SHALL be written to `<projectRoot>/<skillsDir>/skills/`
- **AND** the `/skills` suffix is appended per Agent Skills specification

### Requirement: Path configuration for supported tools

The `AI_TOOLS` array SHALL include `skillsDir` for tools that support the Agent Skills specification.

#### Scenario: Claude Code paths defined

- **WHEN** looking up the `claude` tool
- **THEN** `skillsDir` SHALL be `.claude`

#### Scenario: Cursor paths defined

- **WHEN** looking up the `cursor` tool
- **THEN** `skillsDir` SHALL be `.cursor`

#### Scenario: Windsurf paths defined

- **WHEN** looking up the `windsurf` tool
- **THEN** `skillsDir` SHALL be `.windsurf`

#### Scenario: Tools without skillsDir

- **WHEN** a tool has no `skillsDir` defined
- **THEN** skill generation SHALL error with message indicating the tool is not supported

### Requirement: Cross-platform path handling

The system SHALL handle paths correctly across operating systems.

#### Scenario: Path construction on Windows

- **WHEN** constructing skill paths on Windows
- **THEN** the system SHALL use `path.join()` for all path construction
- **AND** SHALL NOT hardcode forward slashes

#### Scenario: Path construction on Unix

- **WHEN** constructing skill paths on macOS or Linux
- **THEN** the system SHALL use `path.join()` for consistency

### Requirement: 显式的 command-generation 支持元数据

`AIToolOption` SHALL NOT expose adapter-backed command generation support as an active workflow delivery capability.

#### Scenario: Codex 声明不支持 adapter-backed commands

- **WHEN** 在 `AI_TOOLS` 中查找 `codex` 工具
- **THEN** Codex SHALL be treated the same as other tools for skills-only workflow generation
- **AND** 调用方 SHALL NOT branch on Codex command support capability

#### Scenario: 回退行为保持确定性

- **WHEN** 某个工具未声明 command-generation 支持元数据
- **THEN** 系统 SHALL use skills-only generation behavior
- **AND** SHALL NOT resolve command generation behavior through helper fallback, registry lookup, pattern matching, or historical inference

### Requirement: Codex skill 路径保持项目本地化

Codex workflow 安装 SHALL 只使用仓库内受管的项目本地 skills 路径。

#### Scenario: Codex skills 路径遵循 Agent Skills 规约

- **WHEN** 为 Codex 生成 OPSX workflow 制品
- **THEN** 系统 SHALL 将它们写入 `<projectRoot>/.codex/skills/`
- **AND** SHALL NOT 指向任何全局 Codex prompt 目录
- **AND** 路径构造 SHALL 在所有受支持平台上使用 `path.join()` 或 `path.resolve()`

### Requirement: AIToolOption agentsDir 与 agentFormat 字段

`AIToolOption` 接口 SHALL 包含可选字段 `agentsDir?: string` 与 `agentFormat?: 'markdown' | 'toml'`，用于声明该工具是否支持 tool-native subagent artifact 及其原生格式。

`agentsDir` 表示 subagent artifact 的项目本地基础目录（如 `.claude`）。`agentFormat` 表示该工具 subagent artifact 的原生文件格式。Subagent artifact 写入路径 SHALL 为 `path.join(projectRoot, agentsDir, 'agents', `${name}.${ext}`)`，其中 `ext` 由 `agentFormat` 决定（`markdown` → `md`，`toml` → `toml`）。

#### Scenario: 接口包含 agentsDir 与 agentFormat 字段

- **WHEN** 某工具 entry 在 `AI_TOOLS` 中声明支持 tool-native subagent artifact
- **THEN** 该 entry SHALL 包含 `agentsDir` 字段，指定项目本地基础目录（如 `.claude`）
- **AND** SHALL 包含 `agentFormat` 字段，取值为 `'markdown'` 或 `'toml'`

#### Scenario: Claude Code 声明 markdown agent format

- **WHEN** 查找 `claude` 工具
- **THEN** `agentsDir` SHALL 为 `.claude`
- **AND** `agentFormat` SHALL 为 `'markdown'`

#### Scenario: Codex 声明 toml agent format

- **WHEN** 查找 `codex` 工具
- **THEN** `agentsDir` SHALL 为 `.codex`
- **AND** `agentFormat` SHALL 为 `'toml'`

#### Scenario: Pi 与 OpenCode 声明 markdown agent format

- **WHEN** 查找 `pi` 与 `opencode` 工具
- **THEN** `pi` 的 `agentsDir` SHALL 为 `.pi`，`agentFormat` SHALL 为 `'markdown'`
- **AND** `opencode` 的 `agentsDir` SHALL 为 `.opencode`，`agentFormat` SHALL 为 `'markdown'`

#### Scenario: 未声明 agentsDir 的工具不生成 subagent artifact

- **WHEN** 某工具未声明 `agentsDir`
- **THEN** subagent artifact 生成 SHALL 跳过该工具
- **AND** SHALL NOT 抛出异常

### Requirement: Subagent artifact 路径遵循工具原生规范

为支持 tool-native subagent artifact 的工具生成 OPSX internal subagent 制品时，系统 SHALL 将它们写入 `<projectRoot>/<agentsDir>/agents/<name>.<ext>`，SHALL NOT 指向任何全局 agent 目录。

路径构造 SHALL 在所有受支持平台上使用 `path.join()` 或 `path.resolve()`，MUST NOT 硬编码路径分隔符。Subagent artifact 基础目录 MAY 与 `skillsDir` 相同，但写入时 SHALL 分别落到 `agents/` 与 `skills/` 子目录。

#### Scenario: Codex subagent artifact 路径遵循工具原生规范

- **WHEN** 为 Codex 生成 `opsx-reviewer` subagent artifact
- **THEN** 系统 SHALL 将其写入 `<projectRoot>/.codex/agents/opsx-reviewer.toml`
- **AND** SHALL NOT 指向任何全局 Codex agent 目录
- **AND** 路径构造 SHALL 使用 `path.join()`

#### Scenario: Claude subagent artifact 路径写入 agents 子目录

- **WHEN** 为 Claude Code 生成 `opsx-impact-sweeper` subagent artifact
- **THEN** 系统 SHALL 将其写入 `<projectRoot>/.claude/agents/opsx-impact-sweeper.md`
- **AND** SHALL NOT 写入 `<projectRoot>/.claude/skills/opsx-impact-sweeper/`

#### Scenario: Windows 路径构造一致

- **WHEN** 在 Windows 上构造 subagent artifact 路径
- **AND** `agentsDir` 为 `.codex`，`agentFormat` 为 `toml`，`name` 为 `opsx-optimizer`
- **THEN** 路径 SHALL 为 `path.join(projectRoot, '.codex', 'agents', 'opsx-optimizer.toml')`
- **AND** SHALL 使用 `path.join()` 而非硬编码正斜杠

