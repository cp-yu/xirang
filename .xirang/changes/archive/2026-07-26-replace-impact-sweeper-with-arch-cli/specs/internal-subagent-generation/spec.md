---
element: cap.ai.internal-subagent-generation
---

## MODIFIED Requirements

### Requirement: Internal subagent 模板注册

系统 SHALL 在 `src/core/shared/subagent-generation.ts` 中提供 `INTERNAL_SUBAGENT_TEMPLATES` 常量，显式注册两个 internal subagents：`xirang-reviewer` 与 `xirang-optimizer`。该常量 SHALL NOT  通过目录扫描、glob filtering 或 regex inference 推断成员。

Internal subagents SHALL NOT 注册到 `WorkflowManifestRegistry`，SHALL NOT 生成用户可调用 workflow surface，也 SHALL NOT 生成 slash command。

#### Scenario: 显式注册两个 internal subagents

- **WHEN** 读取 `INTERNAL_SUBAGENT_TEMPLATES` 常量
- **THEN** SHALL 只包含 `xirang-reviewer` 与 `xirang-optimizer` 两个显式条目
- **AND** 每个 entry SHALL 提供统一的 `SubagentTemplate` 源模型

#### Scenario: Internal subagents 不进入 workflow manifest

- **WHEN** 系统枚举用户可调用 workflow surface
- **THEN** 列表 SHALL NOT 包含 `xirang-reviewer` 或 `xirang-optimizer`
- **AND** 这些角色 SHALL 保持 internal-only

#### Scenario: 源模型字段为语义字段

- **WHEN** 读取某个 `SubagentTemplate`
- **THEN** SHALL 至少包含 `name`、`description`、`prompt` 三个必填字段
- **AND** MAY 包含 `tools`、`disallowedTools`、`model`、`mode`、`metadata` 语义字段
- **AND** SHALL NOT 包含任何工具特定 frontmatter 字段名

### Requirement: Per-tool subagent artifact 渲染

系统 SHALL 通过 `generateSubagentContent(template, toolId, version)` 把统一 `SubagentTemplate` 渲染为 tool-native subagent artifact 内容。渲染 SHALL 按 `toolId` 分派到对应 renderer：Claude、Pi 与 OpenCode 使用 Markdown 与工具原生 frontmatter，Codex 使用 TOML。

所有 renderer SHALL 仅在 `template.model` 存在且不等于 `"inherit"` 时输出 `model`。Renderer SHALL NOT 复用 workflow invocation transform 管线；若需要 transform context，SHALL 使用独立的 `artifactType: 'subagent'`。

#### Scenario: Claude renderer 输出 Markdown agent 文件

- **WHEN** 调用 `generateSubagentContent(template, 'claude', version)` 且 template 为 `xirang-reviewer`
- **THEN** 返回内容 SHALL 以 YAML frontmatter 开头并包含 `name`、`description`、`tools`
- **AND** frontmatter 后 SHALL 跟 Markdown body 承载 `prompt`
- **AND** SHALL NOT 出现其他工具专属字段

#### Scenario: Pi renderer 输出 foreground guidance

- **WHEN** 为 `xirang-reviewer` 或 `xirang-optimizer` 渲染 Pi artifact
- **THEN** frontmatter SHALL 包含 `name`、`description`、`tools`
- **AND** `description` SHALL 追加 Pi-only 提示：`Pi callers: run foreground and omit timeoutMs/maxRuntimeMs.`
- **AND** 其他工具 renderer SHALL NOT 追加该提示

#### Scenario: OpenCode renderer 输出 subagent mode 与 permission

- **WHEN** 调用 `generateSubagentContent(template, 'opencode', version)`
- **THEN** frontmatter SHALL 包含 `mode: subagent`
- **AND** SHALL 至少声明 `permission.edit: deny`

#### Scenario: Codex renderer 输出 TOML

- **WHEN** 调用 `generateSubagentContent(template, 'codex', version)`
- **THEN** 返回内容 SHALL 为合法 TOML
- **AND** SHALL 包含 `name`、`description`、`developer_instructions`、`sandbox_mode`
- **AND** SHALL NOT 以 Markdown frontmatter 开头

#### Scenario: 显式设置 model 时输出 model 字段

- **WHEN** `template.model` 设为非 `"inherit"` 的具体模型标识
- **THEN** 所有 renderer SHALL 输出对应 `model`

#### Scenario: TOML multiline 安全转义

- **WHEN** template `prompt` 包含三引号序列或反斜杠字面量
- **THEN** Codex renderer SHALL 安全转义并保持合法 TOML

### Requirement: Subagent artifact 写入路径

系统 SHALL 通过 `ArtifactSyncEngine.writeSubagents()` 把渲染后的 artifact 写入 `path.join(projectRoot, tool.agentsDir, 'agents', `${name}.${ext}`)`，其中 `ext` 由 `tool.agentFormat` 决定。路径构造 SHALL 使用 `path.join()`，MUST NOT 硬编码路径分隔符。Subagent artifact 目录名与文件名 SHALL 定义为显式常量，MUST NOT 通过字符串模式或 regex 推断。

#### Scenario: Windows 上 reviewer 路径一致

- **WHEN** 在 Windows 上为 Claude 写入 `xirang-reviewer` 且 `tool.agentsDir` 为 `.claude`
- **THEN** 写入路径 SHALL 通过 `path.join(projectRoot, '.claude', 'agents', 'xirang-reviewer.md')` 构造
- **AND** SHALL 使用平台原生路径分隔符

#### Scenario: Codex artifact 使用 toml 扩展名

- **WHEN** 为 Codex 写入 `xirang-optimizer`
- **THEN** 文件扩展名 SHALL 为 `.toml`
- **AND** 路径 SHALL 通过 `path.join()` 构造

#### Scenario: Markdown artifact 使用 md 扩展名

- **WHEN** 为 Pi 写入 `xirang-reviewer`
- **THEN** 文件扩展名 SHALL 为 `.md`

### Requirement: 旧 internal skill 目录迁移 cleanup

Setup/update SHALL 使用显式 managed name list 清理退役 internal artifacts。该列表 SHALL 覆盖支持工具的受管 agent 与旧 internal skill 位置。删除前 SHALL 验证现有 ownership/header 能证明文件由 Xirang 生成；系统 MUST NOT 仅凭文件名、glob 或 regex 删除文件。

#### Scenario: 用户同名文件保持不变

- **WHEN** 用户创建了同名 agent 或 skill 文件且该文件不具有 Xirang generated ownership/header
- **THEN** setup/update SHALL 保留该文件
- **AND** SHALL NOT 因名称匹配而删除

#### Scenario: Cleanup 跨平台构造路径

- **WHEN** 在 Windows、macOS 或 Linux 上执行 cleanup
- **THEN** 所有候选路径 SHALL 由 `path.join()` 和显式受管名称构造
- **AND** 行为 SHALL 在支持平台上一致

### Requirement: Generated subagent artifact 编码 subagent-self-read 权限模型

Generated reviewer 与 optimizer artifacts SHALL 在工具原生字段中声明式编码 `subagent-self-read` 权限模型：允许 read/search/bash，拒绝 edit/write。Renderer SHALL 在 prompt body 中明确 subagent MUST NOT 通过 Bash 绕过只读边界。

#### Scenario: Reviewer artifact 声明 read-only 权限

- **WHEN** 渲染 `xirang-reviewer` 的 Claude、Pi、OpenCode 或 Codex artifact
- **THEN** artifact SHALL 声明 edit/write 拒绝或等价 `sandbox_mode`
- **AND** SHALL 允许 read/search/bash

#### Scenario: Optimizer artifact 声明 read-only 权限

- **WHEN** 渲染 `xirang-optimizer` artifact
- **THEN** artifact SHALL 声明 edit/write 拒绝
- **AND** SHALL 在 prompt 中禁止 Bash 文件修改操作

#### Scenario: 权限模型与 subagent-self-read 一致

- **WHEN** 读取任一 generated internal subagent artifact
- **THEN** 声明的工具权限 SHALL 与 `.xirang/specs/subagent-self-read/spec.md` 中对应角色一致
- **AND** SHALL NOT 出现允许 edit/write 的字段
