---
entity: element-declaration
identity: internal-subagent-generation
kind: element
parent: agent-workbench-projection
title: Internal Subagent Generation
definition: Internal Subagent Generation 定义 internal subagent 制品的生成契约：显式注册 `xirang-reviewer` 与 `xirang-optimizer`、per-tool subagent artifact 渲染、写入路径、工具元数据声明、init/update 集成、旧 internal 制品清理、权限模型编码与用户自定义 model 保留。
---

## Requirements

### Requirement: Internal subagent 模板注册

系统 SHALL 在共享常量中显式注册两个 internal subagents：`xirang-reviewer` 与 `xirang-optimizer`。该常量 SHALL NOT 通过目录扫描、glob filtering 或 regex inference 推断成员。Internal subagents SHALL NOT 注册到 workflow manifest，SHALL NOT 生成用户可调用 workflow surface。

#### Scenario: 显式注册两个 internal subagents

- **WHEN** 读取 internal subagent 模板常量
- **THEN** SHALL 只包含 `xirang-reviewer` 与 `xirang-optimizer` 两个显式条目

#### Scenario: Internal subagents 不进入 workflow manifest

- **WHEN** 系统枚举用户可调用 workflow surface
- **THEN** 列表 SHALL NOT 包含 `xirang-reviewer` 或 `xirang-optimizer`
#### Scenario: internal subagent 列表显式排除 implementer
- **WHEN** 系统渲染 internal subagent artifact
- **THEN** internal subagent 列表 SHALL 只包含 `xirang-reviewer` 与 `xirang-optimizer`
- **AND** internal subagent 列表 SHALL NOT 包含 `xirang-implementer`
#### Scenario: 源模型字段为语义字段
- **WHEN** 读取某个 `SubagentTemplate`
- **THEN** SHALL 至少包含 `name`、`description`、`prompt` 三个必填字段
- **AND** MAY 包含 `tools`、`disallowedTools`、`model`、`mode`、`metadata` 语义字段
- **AND** SHALL NOT 包含任何工具特定 frontmatter 字段名
### Requirement: Per-tool subagent artifact 渲染

系统 SHALL 通过渲染函数把统一 `SubagentTemplate` 渲染为 tool-native subagent artifact 内容：Claude、Pi 与 OpenCode 使用 Markdown 与工具原生 frontmatter，Codex 使用 TOML。所有 renderer SHALL 仅在 `template.model` 存在且不等于 `"inherit"` 时输出 `model`。

#### Scenario: Claude renderer 输出 Markdown agent 文件

- **WHEN** 为 Claude 渲染 reviewer 模板
- **THEN** 返回内容 SHALL 以 YAML frontmatter 开头并包含 `name`、`description`、`tools`
- **AND** frontmatter 后 SHALL 跟 Markdown body 承载 prompt

#### Scenario: Codex renderer 输出 TOML

- **WHEN** 为 Codex 渲染模板
- **THEN** 返回内容 SHALL 为合法 TOML
- **AND** SHALL 包含 `name`、`description`、`developer_instructions`、`sandbox_mode`

#### Scenario: 显式设置 model 时输出 model 字段

- **WHEN** `template.model` 设为非 `"inherit"` 的具体模型标识
- **THEN** 所有 renderer SHALL 输出对应 `model`
#### Scenario: Pi renderer 输出 foreground guidance
- **WHEN** 为 `xirang-reviewer` 或 `xirang-optimizer` 渲染 Pi artifact
- **THEN** frontmatter SHALL 包含 `name`、`description`、`tools`
- **AND** `description` SHALL 追加 Pi-only 提示：`Pi callers: run foreground and omit timeoutMs/maxRuntimeMs.`
- **AND** 其他工具 renderer SHALL NOT 追加该提示
#### Scenario: TOML multiline 安全转义
- **WHEN** template `prompt` 包含三引号序列或反斜杠字面量
- **THEN** Codex renderer SHALL 安全转义并保持合法 TOML
#### Scenario: OpenCode renderer 输出 subagent mode 与 permission
- **WHEN** 调用 `generateSubagentContent(template, 'opencode', version)`
- **THEN** frontmatter SHALL 包含 `mode: subagent`
- **AND** SHALL 至少声明 `permission.edit: deny`
### Requirement: Subagent artifact 写入路径

系统 SHALL 将渲染后的 artifact 写入 `path.join(projectRoot, tool.agentsDir, 'agents', '<name>.<ext>')`，路径构造使用 `path.join()`。Subagent artifact 目录名与文件名 SHALL 定义为显式常量。

#### Scenario: Windows 上 reviewer 路径一致

- **WHEN** 在 Windows 上为 Claude 写入 reviewer artifact
- **THEN** 写入路径 SHALL 通过 `path.join(projectRoot, '.claude', 'agents', '<name>.md')` 构造
- **AND** SHALL 使用平台原生路径分隔符
#### Scenario: Codex artifact 使用 toml 扩展名
- **WHEN** 为 Codex 写入 `xirang-optimizer`
- **THEN** 文件扩展名 SHALL 为 `.toml`
- **AND** 路径 SHALL 通过 `path.join()` 构造
#### Scenario: Markdown artifact 使用 md 扩展名
- **WHEN** 为 Pi 写入 `xirang-reviewer`
- **THEN** 文件扩展名 SHALL 为 `.md`
### Requirement: Tool metadata 声明 subagent 支持

`AIToolOption` SHALL 通过可选字段 `agentsDir` 与 `agentFormat` 声明该工具是否支持 tool-native subagent artifact。未声明 `agentsDir` 的工具 SHALL NOT 生成 subagent artifact。

#### Scenario: 四个目标工具声明 agentsDir 与 agentFormat

- **WHEN** 查询 `claude`、`pi`、`opencode`、`codex` 的 `AIToolOption`
- **THEN** 每个工具 SHALL 声明 `agentsDir`
- **AND** `claude`、`pi`、`opencode` SHALL 声明 `agentFormat: 'markdown'`
- **AND** `codex` SHALL 声明 `agentFormat: 'toml'`

### Requirement: Init 与 Update 集成 subagent artifact 生成
`xirang setup` 与 `xirang update` SHALL 通过 shared ArtifactSyncEngine 生成 workflow skills 和 internal subagent artifacts；Project Build 的完成 SHALL NOT 依赖 subagent artifact availability。

#### Scenario: Setup 生成 subagent artifacts
- **WHEN** 用户执行 `xirang setup` 并选择支持 internal subagents 的工具
- **THEN** 系统 SHALL 生成 managed internal subagent artifacts
- **AND** SHALL 同时生成 `xirang-build` workflow skill
#### Scenario: Build 不依赖 subagents
- **WHEN** Agent 运行 `xirang-build`，且当前工具不支持 internal subagents
- **THEN** Build SHALL 仍可通过 Candidate authoring、validation 和 promotion 完成
- **AND** SHALL NOT 因缺少 subagent artifact 而改变 Candidate contract
### Requirement: 旧 internal skill 目录迁移 cleanup

Setup/update SHALL 使用显式 managed name list 清理退役 internal artifacts。删除前 SHALL 验证现有 ownership/header 能证明文件由 Xirang 生成；系统 MUST NOT 仅凭文件名、glob 或 regex 删除文件。

#### Scenario: 用户同名文件保持不变

- **WHEN** 用户创建了同名 agent 或 skill 文件且该文件不具有 Xirang generated ownership/header
- **THEN** setup/update SHALL 保留该文件
- **AND** SHALL NOT 因名称匹配而删除
#### Scenario: Cleanup 跨平台构造路径
- **WHEN** 在 Windows、macOS 或 Linux 上执行 cleanup
- **THEN** 所有候选路径 SHALL 由 `path.join()` 和显式受管名称构造
- **AND** 行为 SHALL 在支持平台上一致
### Requirement: Generated subagent artifact 编码只读权限模型

Generated reviewer 与 optimizer artifacts SHALL 在工具原生字段中声明式编码只读权限模型：允许 read/search/bash，拒绝 edit/write。Renderer SHALL 在 prompt body 中明确 subagent MUST NOT 通过 Bash 绕过只读边界。

#### Scenario: Reviewer artifact 声明 read-only 权限

- **WHEN** 渲染 reviewer 的任一工具 artifact
- **THEN** artifact SHALL 声明 edit/write 拒绝或等价 sandbox mode
- **AND** SHALL 允许 read/search/bash
#### Scenario: Optimizer artifact 声明 read-only 权限
- **WHEN** 渲染 `xirang-optimizer` artifact
- **THEN** artifact SHALL 声明 edit/write 拒绝
- **AND** SHALL 在 prompt 中禁止 Bash 文件修改操作
#### Scenario: 权限模型与 subagent-self-read 一致
- **WHEN** 读取任一 generated internal subagent artifact
- **THEN** 声明的工具权限 SHALL 与 `subagent-self-read` Element 的 Contract（`elements/subagent-self-read.md` 单元）中对应角色一致
- **AND** SHALL NOT 出现允许 edit/write 的字段
### Requirement: 用户自定义 model 值在 update 时保留

ArtifactSyncEngine 在写入 subagent artifact 前，SHALL 检查目标文件是否已存在；若已存在文件包含用户显式设置的 `model` 值（非 `"inherit"`），SHALL 将该值注入重新生成的内容中。

#### Scenario: Markdown agent 文件的用户 model 被保留

- **WHEN** 某工具的 agents 目录下已存在 reviewer 文件
- **AND** 其 frontmatter 包含用户自定义 model
- **AND** 用户执行 `xirang update`
- **THEN** 重新生成的文件 SHALL 包含该 model 值
- **AND** 其余内容 SHALL 为模板重新生成的最新内容

#### Scenario: model 值为 inherit 时不保留

- **WHEN** 已存在的 agent 文件的 model 值为 `"inherit"`
- **AND** 用户执行 `xirang update`
- **THEN** 重新生成的 agent 文件 SHALL NOT 包含 `model` 字段
#### Scenario: TOML agent 文件的用户 model 被保留
- **WHEN** 某工具的 `agents/` 目录下已存在 `xirang-reviewer.toml`
- **AND** 其中包含 `model = "gpt-5"`
- **AND** 用户执行 `xirang update`
- **THEN** 重新生成的 `xirang-reviewer.toml` SHALL 包含 `model = "gpt-5"`
#### Scenario: 首次生成不带 model 字段
- **WHEN** agent 文件不存在（首次 `xirang setup` 或 `xirang update`）
- **AND** `template.model` 未设置
- **THEN** 生成的 agent 文件 SHALL NOT 包含 `model` 字段
