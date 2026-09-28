---
entity: element-declaration
identity: internal-subagent-generation
kind: element
parent: agent-workbench-projection
title: Internal Subagent Generation
definition: Internal Subagent Generation 定义 internal subagent 制品的生成契约：显式注册 `xirang-reviewer` 与 `xirang-optimizer`、per-tool subagent artifact 渲染、写入路径、工具元数据声明、init/update 集成、旧 internal 制品清理、权限模型编码与用户自定义 model 保留。
---

## Specification

### Section: Internal subagent 模板注册

系统 SHALL 在共享常量中显式注册两个 internal subagents：`xirang-reviewer` 与 `xirang-optimizer`。该常量 SHALL NOT 通过目录扫描、glob filtering 或 regex inference 推断成员。Internal subagents SHALL NOT 注册到 workflow manifest，SHALL NOT 生成用户可调用 workflow surface。

- **显式注册两个 internal subagents**

  - 读取 internal subagent 模板常量
  - SHALL 只包含 `xirang-reviewer` 与 `xirang-optimizer` 两个显式条目

- **Internal subagents 不进入 workflow manifest**

  - 系统枚举用户可调用 workflow surface
  - 列表 SHALL NOT 包含 `xirang-reviewer` 或 `xirang-optimizer`

- **internal subagent 列表显式排除 implementer**
  - 系统渲染 internal subagent artifact
  - internal subagent 列表 SHALL 只包含 `xirang-reviewer` 与 `xirang-optimizer`
  - internal subagent 列表 SHALL NOT 包含 `xirang-implementer`

- **源模型字段为语义字段**
  - 读取某个 `SubagentTemplate`
  - SHALL 至少包含 `name`、`description`、`prompt` 三个必填字段
  - MAY 包含 `tools`、`disallowedTools`、`model`、`mode`、`metadata` 语义字段
  - SHALL NOT 包含任何工具特定 frontmatter 字段名
### Section: Per-tool subagent artifact 渲染

系统 SHALL 通过渲染函数把统一 `SubagentTemplate` 渲染为 tool-native subagent artifact 内容：Claude、Pi 与 OpenCode 使用 Markdown 与工具原生 frontmatter，Codex 使用 TOML。所有 renderer SHALL 仅在 `template.model` 存在且不等于 `"inherit"` 时输出 `model`。

- **Claude renderer 输出 Markdown agent 文件**

  - 为 Claude 渲染 reviewer 模板
  - 返回内容 SHALL 以 YAML frontmatter 开头并包含 `name`、`description`、`tools`
  - frontmatter 后 SHALL 跟 Markdown body 承载 prompt

- **Codex renderer 输出 TOML**

  - 为 Codex 渲染模板
  - 返回内容 SHALL 为合法 TOML
  - SHALL 包含 `name`、`description`、`developer_instructions`、`sandbox_mode`

- **显式设置 model 时输出 model 字段**

  - `template.model` 设为非 `"inherit"` 的具体模型标识
  - 所有 renderer SHALL 输出对应 `model`

- **Pi renderer 输出 foreground guidance**
  - 为 `xirang-reviewer` 或 `xirang-optimizer` 渲染 Pi artifact
  - frontmatter SHALL 包含 `name`、`description`、`tools`
  - `description` SHALL 追加 Pi-only 提示：`Pi callers: run foreground and omit timeoutMs/maxRuntimeMs.`
  - 其他工具 renderer SHALL NOT 追加该提示

- **TOML multiline 安全转义**
  - template `prompt` 包含三引号序列或反斜杠字面量
  - Codex renderer SHALL 安全转义并保持合法 TOML

- **OpenCode renderer 输出 subagent mode 与 permission**
  - 调用 `generateSubagentContent(template, 'opencode', version)`
  - frontmatter SHALL 包含 `mode: subagent`
  - SHALL 至少声明 `permission.edit: deny`
### Section: Subagent artifact 写入路径

系统 SHALL 将渲染后的 artifact 写入 `path.join(projectRoot, tool.agentsDir, 'agents', '<name>.<ext>')`，路径构造使用 `path.join()`。Subagent artifact 目录名与文件名 SHALL 定义为显式常量。

- **Windows 上 reviewer 路径一致**

  - 在 Windows 上为 Claude 写入 reviewer artifact
  - 写入路径 SHALL 通过 `path.join(projectRoot, '.claude', 'agents', '<name>.md')` 构造
  - SHALL 使用平台原生路径分隔符

- **Codex artifact 使用 toml 扩展名**
  - 为 Codex 写入 `xirang-optimizer`
  - 文件扩展名 SHALL 为 `.toml`
  - 路径 SHALL 通过 `path.join()` 构造

- **Markdown artifact 使用 md 扩展名**
  - 为 Pi 写入 `xirang-reviewer`
  - 文件扩展名 SHALL 为 `.md`
### Section: Tool metadata 声明 subagent 支持

`AIToolOption` SHALL 通过可选字段 `agentsDir` 与 `agentFormat` 声明该工具是否支持 tool-native subagent artifact。未声明 `agentsDir` 的工具 SHALL NOT 生成 subagent artifact。

- **四个目标工具声明 agentsDir 与 agentFormat**

  - 查询 `claude`、`pi`、`opencode`、`codex` 的 `AIToolOption`
  - 每个工具 SHALL 声明 `agentsDir`
  - `claude`、`pi`、`opencode` SHALL 声明 `agentFormat: 'markdown'`
  - `codex` SHALL 声明 `agentFormat: 'toml'`

### Section: Init 与 Update 集成 subagent artifact 生成
`xirang setup` 与 `xirang update` SHALL 通过 shared ArtifactSyncEngine 生成 workflow skills 和 internal subagent artifacts；Project Build 的完成 SHALL NOT 依赖 subagent artifact availability。

- **Setup 生成 subagent artifacts**
  - 用户执行 `xirang setup` 并选择支持 internal subagents 的工具
  - 系统 SHALL 生成 managed internal subagent artifacts
  - SHALL 同时生成 `xirang-build` workflow skill

- **Build 不依赖 subagents**
  - Agent 运行 `xirang-build`，且当前工具不支持 internal subagents
  - Build SHALL 仍可通过 Candidate authoring、validation 和 promotion 完成
  - SHALL NOT 因缺少 subagent artifact 而改变 Candidate contract
### Section: 旧 internal skill 目录迁移 cleanup

Setup/update SHALL 使用显式 managed name list 清理退役 internal artifacts。删除前 SHALL 验证现有 ownership/header 能证明文件由 Xirang 生成；系统 MUST NOT 仅凭文件名、glob 或 regex 删除文件。

- **用户同名文件保持不变**

  - 用户创建了同名 agent 或 skill 文件且该文件不具有 Xirang generated ownership/header
  - setup/update SHALL 保留该文件
  - SHALL NOT 因名称匹配而删除

- **Cleanup 跨平台构造路径**
  - 在 Windows、macOS 或 Linux 上执行 cleanup
  - 所有候选路径 SHALL 由 `path.join()` 和显式受管名称构造
  - 行为 SHALL 在支持平台上一致
### Section: Generated subagent artifact 编码只读权限模型

Generated reviewer 与 optimizer artifacts SHALL 在工具原生字段中声明式编码只读权限模型：允许 read/search/bash，拒绝 edit/write。Renderer SHALL 在 prompt body 中明确 subagent MUST NOT 通过 Bash 绕过只读边界。

- **Reviewer artifact 声明 read-only 权限**

  - 渲染 reviewer 的任一工具 artifact
  - artifact SHALL 声明 edit/write 拒绝或等价 sandbox mode
  - SHALL 允许 read/search/bash

- **Optimizer artifact 声明 read-only 权限**
  - 渲染 `xirang-optimizer` artifact
  - artifact SHALL 声明 edit/write 拒绝
  - SHALL 在 prompt 中禁止 Bash 文件修改操作

- **权限模型与 subagent-self-read 一致**
  - 读取任一 generated internal subagent artifact
  - 声明的工具权限 SHALL 与 `subagent-self-read` Element 的 Contract（`elements/subagent-self-read.md` 单元）中对应角色一致
  - SHALL NOT 出现允许 edit/write 的字段
### Section: 用户自定义 model 值在 update 时保留

ArtifactSyncEngine 在写入 subagent artifact 前，SHALL 检查目标文件是否已存在；若已存在文件包含用户显式设置的 `model` 值（非 `"inherit"`），SHALL 将该值注入重新生成的内容中。

- **Markdown agent 文件的用户 model 被保留**

  - 某工具的 agents 目录下已存在 reviewer 文件
  - 其 frontmatter 包含用户自定义 model
  - 用户执行 `xirang update`
  - 重新生成的文件 SHALL 包含该 model 值
  - 其余内容 SHALL 为模板重新生成的最新内容

- **model 值为 inherit 时不保留**

  - 已存在的 agent 文件的 model 值为 `"inherit"`
  - 用户执行 `xirang update`
  - 重新生成的 agent 文件 SHALL NOT 包含 `model` 字段

- **TOML agent 文件的用户 model 被保留**
  - 某工具的 `agents/` 目录下已存在 `xirang-reviewer.toml`
  - 其中包含 `model = "gpt-5"`
  - 用户执行 `xirang update`
  - 重新生成的 `xirang-reviewer.toml` SHALL 包含 `model = "gpt-5"`

- **首次生成不带 model 字段**
  - agent 文件不存在（首次 `xirang setup` 或 `xirang update`）
  - `template.model` 未设置
  - 生成的 agent 文件 SHALL NOT 包含 `model` 字段
