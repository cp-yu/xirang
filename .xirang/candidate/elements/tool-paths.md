---
entity: element-declaration
identity: tool-paths
kind: capability
parent: agent-tool-integration
title: Tool Paths
definition: Tool Paths 定义 AI 工具路径元数据：`AIToolOption` 的 `skillsDir`、`agentsDir` 与 `agentFormat` 字段，skills/subagent artifact 的写入路径规则与跨平台路径处理。
---

## Requirements

### Requirement: AIToolOption skillsDir field

`AIToolOption` 接口 SHALL 为支持 skill 生成的工具包含可选 `skillsDir` 字段。

#### Scenario: Interface includes skillsDir field

- **WHEN** 在 `AI_TOOLS` 中定义支持 skill 生成的工具条目
- **THEN** 它 SHALL 包含指定项目本地基础目录（如 `.claude`）的 `skillsDir` 字段

#### Scenario: Skills path follows Agent Skills spec

- **WHEN** 为 `skillsDir: '.claude'` 的工具生成 skills
- **THEN** skills SHALL 写入 `<projectRoot>/<skillsDir>/skills/`

### Requirement: Path configuration for supported tools

`AI_TOOLS` 数组 SHALL 为支持 Agent Skills spec 的工具包含 `skillsDir`。

#### Scenario: Claude Code paths defined

- **WHEN** 查找 `claude` 工具
- **THEN** `skillsDir` SHALL 为 `.claude`

#### Scenario: Tools without skillsDir

- **WHEN** 工具未定义 `skillsDir`
- **THEN** skill generation SHALL 以指示不支持的错误退出
#### Scenario: Cursor paths defined
- **WHEN** looking up the `cursor` tool
- **THEN** `skillsDir` SHALL be `.cursor`
#### Scenario: Windsurf paths defined
- **WHEN** looking up the `windsurf` tool
- **THEN** `skillsDir` SHALL be `.windsurf`
### Requirement: AIToolOption agentsDir 与 agentFormat 字段

`AIToolOption` 接口 SHALL 包含可选字段 `agentsDir` 与 `agentFormat`，用于声明该工具是否支持 tool-native subagent artifact 及其原生格式。Subagent artifact 写入路径 SHALL 为 `path.join(projectRoot, agentsDir, 'agents', '<name>.<ext>')`。

#### Scenario: Claude Code 声明 markdown agent format

- **WHEN** 查找 `claude` 工具
- **THEN** `agentsDir` SHALL 为 `.claude`
- **AND** `agentFormat` SHALL 为 `'markdown'`

#### Scenario: Codex 声明 toml agent format

- **WHEN** 查找 `codex` 工具
- **THEN** `agentsDir` SHALL 为 `.codex`
- **AND** `agentFormat` SHALL 为 `'toml'`

#### Scenario: 未声明 agentsDir 的工具不生成 subagent artifact

- **WHEN** 某工具未声明 `agentsDir`
- **THEN** subagent artifact 生成 SHALL 跳过该工具
- **AND** SHALL NOT 抛出异常
#### Scenario: 接口包含 agentsDir 与 agentFormat 字段
- **WHEN** 某工具 entry 在 `AI_TOOLS` 中声明支持 tool-native subagent artifact
- **THEN** 该 entry SHALL 包含 `agentsDir` 字段，指定项目本地基础目录（如 `.claude`）
- **AND** SHALL 包含 `agentFormat` 字段，取值为 `'markdown'` 或 `'toml'`
#### Scenario: Codex subagent artifact 路径遵循工具原生规范
- **WHEN** 为 Codex 生成 `xirang-reviewer` subagent artifact
- **THEN** 系统 SHALL 将其写入 `<projectRoot>/.codex/agents/xirang-reviewer.toml`
- **AND** SHALL NOT 指向任何全局 Codex agent 目录
- **AND** 路径构造 SHALL 使用 `path.join()`
#### Scenario: Pi 与 OpenCode 声明 markdown agent format
- **WHEN** 查找 `pi` 与 `opencode` 工具
- **THEN** `pi` 的 `agentsDir` SHALL 为 `.pi`，`agentFormat` SHALL 为 `'markdown'`
- **AND** `opencode` 的 `agentsDir` SHALL 为 `.opencode`，`agentFormat` SHALL 为 `'markdown'`
#### Scenario: Claude subagent artifact 路径写入 agents 子目录
- **WHEN** 为 Claude Code 生成 `xirang-reviewer` subagent artifact
- **THEN** 系统 SHALL 将其写入 `<projectRoot>/.claude/agents/xirang-reviewer.md`
- **AND** SHALL NOT 写入 `<projectRoot>/.claude/skills/xirang-reviewer/`
#### Scenario: 未声明 agentsDir 的工具不生成 subagent artifact（internal-subagent-generation）
- **WHEN** 某 `AIToolOption` 未声明 `agentsDir`
- **THEN** `ArtifactSyncEngine` SHALL NOT 为该工具写入任何 subagent artifact
- **AND** SHALL NOT 抛出异常
### Requirement: 显式的 command-generation 支持元数据

`AIToolOption` SHALL NOT 将 adapter-backed command generation 暴露为 active workflow delivery capability；未声明时使用 skills-only 生成行为。

#### Scenario: 回退行为保持确定性

- **WHEN** 某工具未声明 command-generation 支持元数据
- **THEN** 系统 SHALL 使用 skills-only generation behavior
- **AND** SHALL NOT 通过 helper fallback、registry lookup 或模式匹配解析 command generation
#### Scenario: Codex 声明不支持 adapter-backed commands
- **WHEN** 在 `AI_TOOLS` 中查找 `codex` 工具
- **THEN** Codex SHALL be treated the same as other tools for skills-only workflow generation
- **AND** 调用方 SHALL NOT branch on Codex command support capability
### Requirement: Codex skill 路径保持项目本地化

Codex workflow 安装 SHALL 只使用仓库内受管的项目本地 skills 路径。

#### Scenario: Codex skills 路径遵循 Agent Skills 规约

- **WHEN** 为 Codex 生成 workflow 制品
- **THEN** 系统 SHALL 将它们写入 `<projectRoot>/.codex/skills/`
- **AND** SHALL NOT 指向任何全局 Codex prompt 目录
- **AND** 路径构造 SHALL 在所有受支持平台上使用 `path.join()` 或 `path.resolve()`

### Requirement: 跨平台路径处理

系统 SHALL 在所有支持平台上使用 `path.join()` 或 `path.resolve()` 构造路径，不硬编码路径分隔符。

#### Scenario: Path construction on Windows

- **WHEN** 在 Windows 上构造 skills 或 agents 路径
- **THEN** 系统 SHALL 使用 `path.join()`
- **AND** SHALL NOT hardcode forward slashes
#### Scenario: Path construction on Unix
- **WHEN** constructing skill paths on macOS or Linux
- **THEN** the system SHALL use `path.join()` for consistency
#### Scenario: Windows 路径构造一致
- **WHEN** 在 Windows 上构造 subagent artifact 路径
- **AND** `agentsDir` 为 `.codex`，`agentFormat` 为 `toml`，`name` 为 `xirang-optimizer`
- **THEN** 路径 SHALL 为 `path.join(projectRoot, '.codex', 'agents', 'xirang-optimizer.toml')`
- **AND** SHALL 使用 `path.join()` 而非硬编码正斜杠
