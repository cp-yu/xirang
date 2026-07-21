## ADDED Requirements

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

为支持 tool-native subagent artifact 的工具生成 OpenSpec internal subagent 制品时，系统 SHALL 将它们写入 `<projectRoot>/<agentsDir>/agents/<name>.<ext>`，SHALL NOT 指向任何全局 agent 目录。

路径构造 SHALL 在所有受支持平台上使用 `path.join()` 或 `path.resolve()`，MUST NOT 硬编码路径分隔符。Subagent artifact 基础目录 MAY 与 `skillsDir` 相同，但写入时 SHALL 分别落到 `agents/` 与 `skills/` 子目录。

#### Scenario: Codex subagent artifact 路径遵循工具原生规范

- **WHEN** 为 Codex 生成 `openspec-reviewer` subagent artifact
- **THEN** 系统 SHALL 将其写入 `<projectRoot>/.codex/agents/openspec-reviewer.toml`
- **AND** SHALL NOT 指向任何全局 Codex agent 目录
- **AND** 路径构造 SHALL 使用 `path.join()`

#### Scenario: Claude subagent artifact 路径写入 agents 子目录

- **WHEN** 为 Claude Code 生成 `openspec-impact-sweeper` subagent artifact
- **THEN** 系统 SHALL 将其写入 `<projectRoot>/.claude/agents/openspec-impact-sweeper.md`
- **AND** SHALL NOT 写入 `<projectRoot>/.claude/skills/openspec-impact-sweeper/`

#### Scenario: Windows 路径构造一致

- **WHEN** 在 Windows 上构造 subagent artifact 路径
- **AND** `agentsDir` 为 `.codex`，`agentFormat` 为 `toml`，`name` 为 `openspec-optimizer`
- **THEN** 路径 SHALL 为 `path.join(projectRoot, '.codex', 'agents', 'openspec-optimizer.toml')`
- **AND** SHALL 使用 `path.join()` 而非硬编码正斜杠
