---
entity: element-declaration
identity: tool-paths
kind: element
parent: agent-tool-integration
title: Tool Paths
definition: Tool Paths 定义 AI 工具路径元数据：`AIToolOption` 的 `skillsDir`、`agentsDir` 与 `agentFormat` 字段，skills/subagent artifact 的写入路径规则与跨平台路径处理。
---

## Specification

### Section: AIToolOption skillsDir field

`AIToolOption` 接口 SHALL 为支持 skill 生成的工具包含可选 `skillsDir` 字段。

- **Interface includes skillsDir field**

  - 在 `AI_TOOLS` 中定义支持 skill 生成的工具条目
  - 它 SHALL 包含指定项目本地基础目录（如 `.claude`）的 `skillsDir` 字段

- **Skills path follows Agent Skills spec**

  - 为 `skillsDir: '.claude'` 的工具生成 skills
  - skills SHALL 写入 `<projectRoot>/<skillsDir>/skills/`

### Section: Path configuration for supported tools

`AI_TOOLS` 数组 SHALL 为支持 Agent Skills spec 的工具包含 `skillsDir`。

- **Claude Code paths defined**

  - 查找 `claude` 工具
  - `skillsDir` SHALL 为 `.claude`

- **Tools without skillsDir**

  - 工具未定义 `skillsDir`
  - skill generation SHALL 以指示不支持的错误退出

- **Cursor paths defined**
  - looking up the `cursor` tool
  - `skillsDir` SHALL be `.cursor`

- **Windsurf paths defined**
  - looking up the `windsurf` tool
  - `skillsDir` SHALL be `.windsurf`
### Section: AIToolOption agentsDir 与 agentFormat 字段

`AIToolOption` 接口 SHALL 包含可选字段 `agentsDir` 与 `agentFormat`，用于声明该工具是否支持 tool-native subagent artifact 及其原生格式。Subagent artifact 写入路径 SHALL 为 `path.join(projectRoot, agentsDir, 'agents', '<name>.<ext>')`。

- **Claude Code 声明 markdown agent format**

  - 查找 `claude` 工具
  - `agentsDir` SHALL 为 `.claude`
  - `agentFormat` SHALL 为 `'markdown'`

- **Codex 声明 toml agent format**

  - 查找 `codex` 工具
  - `agentsDir` SHALL 为 `.codex`
  - `agentFormat` SHALL 为 `'toml'`

- **未声明 agentsDir 的工具不生成 subagent artifact**

  - 某工具未声明 `agentsDir`
  - subagent artifact 生成 SHALL 跳过该工具
  - SHALL NOT 抛出异常

- **接口包含 agentsDir 与 agentFormat 字段**
  - 某工具 entry 在 `AI_TOOLS` 中声明支持 tool-native subagent artifact
  - 该 entry SHALL 包含 `agentsDir` 字段，指定项目本地基础目录（如 `.claude`）
  - SHALL 包含 `agentFormat` 字段，取值为 `'markdown'` 或 `'toml'`

- **Codex subagent artifact 路径遵循工具原生规范**
  - 为 Codex 生成 `xirang-reviewer` subagent artifact
  - 系统 SHALL 将其写入 `<projectRoot>/.codex/agents/xirang-reviewer.toml`
  - SHALL NOT 指向任何全局 Codex agent 目录
  - 路径构造 SHALL 使用 `path.join()`

- **Pi 与 OpenCode 声明 markdown agent format**
  - 查找 `pi` 与 `opencode` 工具
  - `pi` 的 `agentsDir` SHALL 为 `.pi`，`agentFormat` SHALL 为 `'markdown'`
  - `opencode` 的 `agentsDir` SHALL 为 `.opencode`，`agentFormat` SHALL 为 `'markdown'`

- **Claude subagent artifact 路径写入 agents 子目录**
  - 为 Claude Code 生成 `xirang-reviewer` subagent artifact
  - 系统 SHALL 将其写入 `<projectRoot>/.claude/agents/xirang-reviewer.md`
  - SHALL NOT 写入 `<projectRoot>/.claude/skills/xirang-reviewer/`

- **未声明 agentsDir 的工具不生成 subagent artifact（internal-subagent-generation）**
  - 某 `AIToolOption` 未声明 `agentsDir`
  - `ArtifactSyncEngine` SHALL NOT 为该工具写入任何 subagent artifact
  - SHALL NOT 抛出异常
### Section: 显式的 command-generation 支持元数据

`AIToolOption` SHALL NOT 将 adapter-backed command generation 暴露为 active workflow delivery capability；未声明时使用 skills-only 生成行为。

- **回退行为保持确定性**

  - 某工具未声明 command-generation 支持元数据
  - 系统 SHALL 使用 skills-only generation behavior
  - SHALL NOT 通过 helper fallback、registry lookup 或模式匹配解析 command generation

- **Codex 声明不支持 adapter-backed commands**
  - 在 `AI_TOOLS` 中查找 `codex` 工具
  - Codex SHALL be treated the same as other tools for skills-only workflow generation
  - 调用方 SHALL NOT branch on Codex command support capability
### Section: Codex skill 路径保持项目本地化

Codex workflow 安装 SHALL 只使用仓库内受管的项目本地 skills 路径。

- **Codex skills 路径遵循 Agent Skills 规约**

  - 为 Codex 生成 workflow 制品
  - 系统 SHALL 将它们写入 `<projectRoot>/.codex/skills/`
  - SHALL NOT 指向任何全局 Codex prompt 目录
  - 路径构造 SHALL 在所有受支持平台上使用 `path.join()` 或 `path.resolve()`

### Section: 跨平台路径处理

系统 SHALL 在所有支持平台上使用 `path.join()` 或 `path.resolve()` 构造路径，不硬编码路径分隔符。

- **Path construction on Windows**

  - 在 Windows 上构造 skills 或 agents 路径
  - 系统 SHALL 使用 `path.join()`
  - SHALL NOT hardcode forward slashes

- **Path construction on Unix**
  - constructing skill paths on macOS or Linux
  - the system SHALL use `path.join()` for consistency

- **Windows 路径构造一致**
  - 在 Windows 上构造 subagent artifact 路径
  - `agentsDir` 为 `.codex`，`agentFormat` 为 `toml`，`name` 为 `xirang-optimizer`
  - 路径 SHALL 为 `path.join(projectRoot, '.codex', 'agents', 'xirang-optimizer.toml')`
  - SHALL 使用 `path.join()` 而非硬编码正斜杠
