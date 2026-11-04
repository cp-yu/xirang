---
entity: "element-declaration"
identity: "internal-subagent-generation"
kind: "element"
parent: "agent-workbench-projection"
title: "Internal Subagent Generation"
definition: "Internal Subagent Generation 是框架内部 Agent 的工具原生制品投影能力，独立承载显式注册、按工具渲染、按角色配置权限、安装更新及用户模型设置保留；覆盖 Reviewer、Optimizer 与 Experimenter，不形成用户工作流，也不承担各角色的任务执行。"
---

## MODIFIED Sections

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
  - Reviewer SHALL 声明 `permission.edit: deny`；Optimizer 与 Experimenter SHALL 按角色可写能力生成 edit 权限，不继承统一 deny

### Section: 按角色编码工具原生权限

生成制品 SHALL 在工具原生字段编码角色权限。Reviewer 允许 read/search/bash、拒绝 edit/write 或等价 read-only sandbox，禁止借 Bash 绕过。Optimizer 在委托范围内允许读取、搜索、编写、编辑与测试；Experimenter 允许实验所需读写执行。

- Claude 的 Optimizer/Experimenter tools 包含 Read、Grep、Glob、Bash、Write、Edit；Pi 包含 read、grep、find、bash、write、edit。
- OpenCode Reviewer edit 为 deny，Optimizer/Experimenter edit 为 allow；bash 沿用工具执行授权配置。
- Codex Reviewer 为 read-only，Optimizer/Experimenter 为 workspace-write。
- 保持 Pi-only foreground 提示、用户 model 保留和 TOML 转义规则。
- 生成/更新通过既有显式注册及受管清单处理，相关引用可达；不按名称模式覆盖用户文件。
