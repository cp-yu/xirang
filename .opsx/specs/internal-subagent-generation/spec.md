---
element: project.root/domain.ai_integration/cap.ai.subagent-generation
---

# internal-subagent-generation Specification

## Purpose
Define the reviewed Subagent Artifact Generation contract for Internal subagent 模板注册; Per-tool subagent artifact 渲染; Subagent artifact 写入路径; and 5 additional reviewed Requirements.
## Requirements
### Requirement: Internal subagent 模板注册

系统 SHALL 在 `src/core/shared/subagent-generation.ts` 中提供 `INTERNAL_SUBAGENT_TEMPLATES` 常量，显式注册三个 internal subagent：`opsx-reviewer`、`opsx-optimizer`、`opsx-impact-sweeper`。该常量 SHALL NOT 包含 `opsx-implementer`，且 SHALL NOT 通过目录扫描、glob filtering 或 regex inference 推断成员。

Internal subagent SHALL NOT 注册到 `WorkflowManifestRegistry`，SHALL NOT 生成用户可调用 workflow surface，也 SHALL NOT 生成 slash command。

#### Scenario: 显式注册三个 internal subagent

- **WHEN** 读取 `INTERNAL_SUBAGENT_TEMPLATES` 常量
- **THEN** SHALL 包含 `opsx-reviewer`、`opsx-optimizer`、`opsx-impact-sweeper` 三个显式条目
- **AND** SHALL NOT 包含 `opsx-implementer`
- **AND** 每个 entry SHALL 提供统一的 `SubagentTemplate` 源模型

#### Scenario: Internal subagent 不进入 workflow manifest

- **WHEN** 系统枚举用户可调用 workflow surface
- **THEN** 列表 SHALL NOT 包含 `opsx-reviewer`、`opsx-optimizer` 或 `opsx-impact-sweeper`
- **AND** 这些角色 SHALL 保持 internal-only

#### Scenario: 源模型字段为语义字段

- **WHEN** 读取某个 `SubagentTemplate`
- **THEN** SHALL 至少包含 `name`、`description`、`prompt` 三个必填字段
- **AND** MAY 包含 `tools`、`disallowedTools`、`model`、`mode`、`metadata` 语义字段
- **AND** SHALL NOT 包含任何工具特定 frontmatter 字段名（如 `display_name`、`sandbox_mode`、`permission`）

### Requirement: Per-tool subagent artifact 渲染

系统 SHALL 通过 `generateSubagentContent(template, toolId, version)` 把统一 `SubagentTemplate` 渲染为 tool-native subagent artifact 内容。渲染 SHALL 按 `toolId` 分派到对应 renderer：

- `claude` SHALL 渲染为 Markdown + YAML frontmatter（含 `name`、`description`、`tools`）
- `pi` SHALL 渲染为 Markdown + YAML frontmatter（含 `name`、`description`、`tools`）
- `opencode` SHALL 渲染为 Markdown + YAML frontmatter（含 `description`、`mode: subagent`、`permission`）
- `codex` SHALL 渲染为 TOML（含 `name`、`description`、`developer_instructions`、`sandbox_mode`）

所有 renderer SHALL 仅在 `template.model` 存在且不等于 `"inherit"` 时在 frontmatter 中输出 `model` 字段。当 `template.model` 为 `undefined` 或 `"inherit"` 时，SHALL NOT 输出 `model` 行，由工具自身的 fallback 机制决定模型。

Renderer SHALL NOT 复用 workflow invocation transform 管线（如 `/opsx:<slug>` 替换）。若需要 transform context，SHALL 使用独立的 `artifactType: 'subagent'`。

#### Scenario: Claude renderer 输出 Markdown agent 文件

- **WHEN** 调用 `generateSubagentContent(template, 'claude', version)` 且 template 为 `opsx-reviewer`
- **THEN** 返回内容 SHALL 以 YAML frontmatter 开头，包含 `name: opsx-reviewer`、`description`、`tools`
- **AND** frontmatter 后 SHALL 跟 Markdown body 承载 `prompt`
- **AND** SHALL NOT 出现 `display_name`、`sandbox_mode` 或 `permission` 等其他工具字段

#### Scenario: Pi renderer 输出含 name 的 Markdown agent 文件

- **WHEN** 调用 `generateSubagentContent(template, 'pi', version)`
- **THEN** frontmatter SHALL 包含 `name`（取值为 `template.name`）、`description`、`tools`
- **AND** 对 `opsx-reviewer`、`opsx-optimizer`、`opsx-impact-sweeper`，`description` SHALL 追加 Pi-only 提示：`Pi callers: run foreground and omit timeoutMs/maxRuntimeMs.`
- **AND** 其他工具 renderer SHALL NOT 追加该 Pi-only 提示
- **AND** SHALL NOT 包含 `display_name`、`disallowed_tools` 或 `enabled`
- **AND** 工具权限通过 `tools` allowlist 表达（仅列 read/grep/find/bash，未列出的工具不可用）

#### Scenario: OpenCode renderer 输出 subagent mode 与 permission

- **WHEN** 调用 `generateSubagentContent(template, 'opencode', version)`
- **THEN** frontmatter SHALL 包含 `mode: subagent`
- **AND** SHALL 包含 `permission` 块，至少声明 `edit: deny`
- **AND** impact-sweeper 的 renderer 输出 SHALL 通过工具权限与 prompt body 共同表达全程只读约束

#### Scenario: Codex renderer 输出 TOML

- **WHEN** 调用 `generateSubagentContent(template, 'codex', version)`
- **THEN** 返回内容 SHALL 为合法 TOML
- **AND** SHALL 包含 `name`、`description`、`developer_instructions`、`sandbox_mode` 字段
- **AND** `developer_instructions` SHALL 使用三引号 multiline string 承载 `prompt`
- **AND** SHALL NOT 以 Markdown frontmatter 开头

#### Scenario: 显式设置 model 时输出 model 字段

- **WHEN** `template.model` 设为非 `"inherit"` 的具体模型标识（如 `"claude-sonnet-4"`）
- **THEN** 所有 renderer SHALL 在 frontmatter 中输出 `model` 字段
- **AND** 值 SHALL 等于 `template.model` 设置的值

#### Scenario: TOML multiline 安全转义

- **WHEN** template `prompt` 包含三引号序列 `"""` 或反斜杠字面量
- **THEN** Codex renderer SHALL 对三引号序列转义
- **AND** SHALL 对反斜杠字面量转义
- **AND** 输出 SHALL 仍是合法 TOML

### Requirement: Subagent artifact 写入路径

系统 SHALL 通过 `ArtifactSyncEngine.writeSubagents()` 把渲染后的 subagent artifact 写入到 `path.join(projectRoot, tool.agentsDir, 'agents', `${name}.${ext}`)`，其中 `ext` 由 `tool.agentFormat` 决定（`markdown` → `md`，`toml` → `toml`）。路径构造 SHALL 使用 `path.join()`，MUST NOT 硬编码路径分隔符。

Subagent artifact 目录名与文件名 SHALL 定义为显式常量，MUST NOT 通过字符串模式匹配或正则表达式推断。

#### Scenario: 跨平台路径一致

- **WHEN** 在 Windows 上为 Claude Code 写入 `opsx-reviewer` subagent artifact
- **AND** `tool.agentsDir` 为 `.claude`，`tool.agentFormat` 为 `markdown`
- **THEN** 写入路径 SHALL 为 `path.join(projectRoot, '.claude', 'agents', 'opsx-reviewer.md')`
- **AND** 在 Windows 上 SHALL 使用反斜杠分隔符
- **AND** SHALL 使用 `path.join()` 而非硬编码正斜杠

#### Scenario: Codex artifact 写入 .toml 扩展名

- **WHEN** 为 Codex 写入 `opsx-optimizer` subagent artifact
- **THEN** 文件扩展名 SHALL 为 `.toml`
- **AND** 路径 SHALL 为 `path.join(projectRoot, '.codex', 'agents', 'opsx-optimizer.toml')`

#### Scenario: Markdown artifact 写入 .md 扩展名

- **WHEN** 为 Pi 写入 `opsx-impact-sweeper` subagent artifact
- **THEN** 文件扩展名 SHALL 为 `.md`
- **AND** 路径 SHALL 为 `path.join(projectRoot, '.pi', 'agents', 'opsx-impact-sweeper.md')`

### Requirement: Tool metadata 声明 subagent 支持

`AIToolOption` SHALL 通过可选字段 `agentsDir?: string` 与 `agentFormat?: 'markdown' | 'toml'` 声明该工具是否支持 tool-native subagent artifact 及其原生格式。未声明 `agentsDir` 的工具 SHALL NOT 生成 subagent artifact。

对支持的工具，`agentsDir` 与 `skillsDir` MAY 相同（如 `.claude`），但写入时 SHALL 分别落到 `agents/` 与 `skills/` 子目录。

#### Scenario: 四个目标工具声明 agentsDir 与 agentFormat

- **WHEN** 查询 `claude`、`pi`、`opencode`、`codex` 的 `AIToolOption`
- **THEN** 每个工具 SHALL 声明 `agentsDir`（分别为 `.claude`、`.pi`、`.opencode`、`.codex`）
- **AND** `claude`、`pi`、`opencode` SHALL 声明 `agentFormat: 'markdown'`
- **AND** `codex` SHALL 声明 `agentFormat: 'toml'`

#### Scenario: 未声明 agentsDir 的工具不生成 subagent artifact

- **WHEN** 某 `AIToolOption` 未声明 `agentsDir`
- **THEN** `ArtifactSyncEngine` SHALL NOT 为该工具写入任何 subagent artifact
- **AND** SHALL NOT 抛出异常

### Requirement: Init 与 Update 集成 subagent artifact 生成
`opsx setup` 与 `opsx update` SHALL 通过 shared ArtifactSyncEngine 生成 workflow skills 和 internal subagent artifacts；Project Build 的完成 SHALL NOT 依赖 subagent artifact availability。

#### Scenario: Setup 生成 subagent artifacts
- **WHEN** 用户执行 `opsx setup` 并选择支持 internal subagents 的工具
- **THEN** 系统 SHALL 生成 managed internal subagent artifacts
- **AND** SHALL 同时生成 `opsx-build` workflow skill

#### Scenario: Build 不依赖 subagents
- **WHEN** Agent 运行 `opsx-build`，且当前工具不支持 internal subagents
- **THEN** Build SHALL 仍可通过 Candidate authoring、validation 和 promotion 完成
- **AND** SHALL NOT 因缺少 subagent artifact 而改变 Candidate contract

### Requirement: 旧 internal skill 目录迁移 cleanup
Setup/update SHALL 使用显式 managed name list 清理旧 internal skill artifacts，并 SHALL NOT 清理 user-authored agents。

#### Scenario: Cleanup 使用显式列表
- **WHEN** managed old internal skill artifacts 存在
- **THEN** setup/update SHALL 只删除显式列出的 managed names
- **AND** SHALL 保留 user-authored agent files

### Requirement: Generated subagent artifact 编码 subagent-self-read 权限模型

Generated subagent artifact SHALL 在工具原生字段中声明式编码 `subagent-self-read` 规约定义的权限模型。具体编码由 per-tool renderer 负责映射：

- reviewer 与 optimizer：read/search/bash 允许，edit/write 拒绝
- impact-sweeper：read/search/git ls-files 允许，edit/write 拒绝，直接返回 canonical JSON object

Renderer SHALL 在 prompt body 中明确 impact-sweeper MUST NOT 通过 Bash 绕过只读边界。

#### Scenario: Reviewer artifact 声明 read-only 权限

- **WHEN** 渲染 `opsx-reviewer` 的 Claude / Pi / OpenCode / Codex artifact
- **THEN** artifact SHALL 在工具原生字段中声明 edit/write 拒绝（或等价 sandbox_mode）
- **AND** SHALL 允许 read/search/bash

#### Scenario: Impact sweeper 全程只读

- **WHEN** 渲染 `opsx-impact-sweeper` artifact
- **THEN** artifact SHALL 通过工具原生字段声明 edit/write 拒绝
- **AND** SHALL 在 prompt body 中声明不得创建、修改、删除或覆盖任何文件
- **AND** SHALL 声明不得通过 Bash 绕过只读边界

#### Scenario: 权限模型与 subagent-self-read 一致

- **WHEN** 读取任一 generated subagent artifact
- **THEN** 声明的工具权限 SHALL 与 `.opsx/specs/subagent-self-read/spec.md` 中对应角色的权限模型一致
- **AND** SHALL NOT 出现允许 edit/write 的字段

### Requirement: 用户自定义 model 值在 update 时保留

`ArtifactSyncEngine.writeSubagents()` SHALL 在写入 subagent artifact 前，检查目标文件是否已存在。若已存在的 agent 文件的 frontmatter 中包含用户显式设置的 `model` 值（非 `"inherit"`），SHALL 将该值注入重新生成的内容中，确保 `opsx update` 与 `opsx update --force` 不覆盖用户自定义的模型选择。

对于 Markdown 格式（Claude/Pi/OpenCode），SHALL 从 YAML frontmatter 中解析 `model` 字段；对于 TOML 格式（Codex），SHALL 从 `model = "..."` 行中提取。当值为 `"inherit"` 时 SHALL 视为未设置，不做注入。

#### Scenario: Markdown agent 文件的用户 model 被保留

- **WHEN** 某工具的 `agents/` 目录下已存在 `opsx-reviewer.md`
- **AND** 其 YAML frontmatter 中包含 `model: "anthropic/claude-sonnet-4"`
- **AND** 用户执行 `opsx update`
- **THEN** 重新生成的 `opsx-reviewer.md` SHALL 包含 `model: "anthropic/claude-sonnet-4"`
- **AND** 其余内容 SHALL 为模板重新生成的最新内容

#### Scenario: TOML agent 文件的用户 model 被保留

- **WHEN** 某工具的 `agents/` 目录下已存在 `opsx-reviewer.toml`
- **AND** 其中包含 `model = "gpt-5"`
- **AND** 用户执行 `opsx update`
- **THEN** 重新生成的 `opsx-reviewer.toml` SHALL 包含 `model = "gpt-5"`

#### Scenario: model 值为 inherit 时不保留

- **WHEN** 已存在的 agent 文件的 model 值为 `"inherit"`
- **AND** 用户执行 `opsx update`
- **THEN** 重新生成的 agent 文件 SHALL NOT 包含 `model` 字段
- **AND** `"inherit"` 视为 sentinel 表示无自定义覆盖

#### Scenario: 首次生成不带 model 字段

- **WHEN** agent 文件不存在（首次 `opsx init` 或 `opsx update`）
- **AND** `template.model` 未设置
- **THEN** 生成的 agent 文件 SHALL NOT 包含 `model` 字段

