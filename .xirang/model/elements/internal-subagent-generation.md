---
entity: element-declaration
identity: internal-subagent-generation
kind: element
parent: agent-workbench-projection
title: Internal Subagent Generation
definition: Internal Subagent Generation 是框架内部 Agent 的工具原生制品投影能力，独立承载显式注册、按工具渲染、按角色配置权限、安装更新及用户模型设置保留；覆盖 Reviewer、Optimizer 与 Experimenter，不形成用户工作流，也不承担各角色的任务执行。
---

## Specification

### Section: Internal subagent 模板注册

系统 SHALL 在共享常量中显式注册 xirang-reviewer、xirang-optimizer 与 xirang-experimenter，成员不通过目录扫描、glob 或 regex 推断，不包含 xirang-implementer。内部角色不注册到 workflow manifest，不生成用户可调用 workflow 或实验 skill。

SubagentTemplate 至少有 name、description、prompt，可使用 tools、disallowedTools、model、mode、metadata、referenceFiles 等语义字段，不包含工具专属 frontmatter 字段名。Experimenter 模板 SHALL 承载实验设计、执行、证据交付与角色边界。

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
  - Reviewer、Optimizer SHALL 声明 `permission.edit: deny`；Experimenter SHALL 按可编写实验的角色能力生成 edit 权限，不继承统一 deny

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

支持原生 subagent 的工具 SHALL 经现有显式列表和安装流程生成/更新三种角色；更新已有 Experimenter 时同样保留非 inherit 的用户 model。新增角色不改变 workflow 集合，不添加独立安装入口；受管清理仍按显式名单与 ownership 检查，不删除用户同名非受管文件。

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

### Section: 按角色编码工具原生权限

生成制品 SHALL 在工具原生字段中编码角色权限。Reviewer、Optimizer 允许 read/search/bash，拒绝 edit/write 或使用等价 read-only sandbox；prompt 禁止借 Bash 绕过只读，与 subagent-self-read 对应角色一致。Experimenter 允许读取、搜索、编写、编辑与执行实验，不得只在 prompt 宣称可写却仍由统一只读字段阻止。

- Claude 的 Experimenter tools 包含 Read、Grep、Glob、Bash、Write、Edit；Pi 包含 read、grep、find、bash、write、edit。
- OpenCode 的 Reviewer、Optimizer edit 为 deny，Experimenter edit 为 allow；bash 沿用工具的执行授权配置。
- Codex 的评估角色 sandbox_mode 为 read-only，Experimenter 为 workspace-write。
- Pi-only 的 Reviewer、Optimizer foreground 提示与其他工具的模型输出、TOML 转义规则继续按对应角色渲染。
