---
operation: MODIFIED
entity: element-declaration
identity: "internal-subagent-generation"
kind: "capability-specification"
parent: "agent-workbench-projection"
title: "Internal Subagent Generation"
definition: "Internal Subagent Generation 是框架内部 Agent 的工具原生制品投影能力，独立承载显式注册、按工具渲染、按角色配置权限、安装更新及用户模型设置保留；覆盖 Reviewer、Optimizer 与 Experimenter，不形成用户工作流，也不承担各角色的任务执行。"
---

## ADDED Sections

### Section: Scope and Non-goals

内部 Agent 制品交付 SHALL 为 Reviewer、Optimizer、Experimenter 生成工具原生角色文件，维护角色内容、权限表达、安装路径及用户模型设置。内部角色不注册为用户工作流，制品生成不执行其受托任务。

### Section: Business Logic

共享注册 SHALL 显式包含 xirang-reviewer、xirang-optimizer、xirang-experimenter，不按目录/glob/regex 推断成员。模板包含 name、description、prompt，可带 tools、disallowedTools、model、mode、metadata、referenceFiles 等语义字段，工具专属 frontmatter 由适配负责。Experimenter 内容承担实验设计、执行、证据及范围边界。

工具元数据通过 agentsDir 与 agentFormat 声明支持：Claude、Pi、OpenCode 使用 Markdown，Codex 使用 TOML。制品位于项目根下工具 agentsDir 的 agents/<name>.<ext>，目录/文件名称显式登记，使用平台路径解析；Markdown 扩展名 .md，Codex 为 .toml，TOML 字符串正确转义。

setup/update SHALL 通过共享生成流程交付角色及 workflow skills。模板 model 仅明确且非 inherit 时输出；更新文件有用户非 inherit model 时保留并注入新生成内容，其余受管内容按模板刷新。受管清理按显式名单及文件 ownership/header 证据处理，同名不足以证明所有权。

Reviewer 生成面 SHALL 不设专属工具白名单、Edit/Write 否决或只读沙箱：Claude/Pi 省略限定 tools，OpenCode 允许 edit，Codex 使用与可写 Agent 相同工作区沙箱；实际操作仍受只读角色约束，不得修改项目、Change、Quality、checkpoint 或 Git history。Optimizer/Experimenter 在委托范围内可写。Pi Reviewer 指导后台运行以取得环境扩展工具并等待完整结果，Pi Optimizer 使用前台调用指导。

### Section: Edge Cases and Exception Handling

未声明 agentsDir 的工具 SHALL 不生成角色制品，但不阻塞 Project Build 的 Candidate 工作。既有或模板 model 为 inherit 时不作为显式模型字段输出；首次生成未指定 model 时省略。用户同名非受管文件 SHALL 保留，不因名称匹配被清理或覆盖。跨平台定位不得依赖固定斜杠；角色工具可用不构成角色写入授权。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 四种工具格式

Claude/Pi/OpenCode 的三个角色为 Markdown .md；Codex 对应为 TOML .toml，路径均在各自项目工具 agents 目录，Windows/POSIX 定位同一逻辑目标。

#### Acceptance Case: 保留用户模型

既有 xirang-reviewer Markdown 含用户 model，update 保留它；Codex xirang-reviewer.toml 中 model = "gpt-5" 更新后仍为 gpt-5，其余受管内容刷新。

#### Acceptance Case: inherit 与首次生成

model 为 inherit 的覆盖不保留为显式字段；首次生成模板无 model 时输出不含 model。

#### Acceptance Case: 权限与受管边界

Reviewer 可用环境工具但指导保持只读；用户创建同名且无受管标记的文件，setup/update 保留原样。

#### Acceptance Case: 无内部 Agent 支持

当前工具没有 agentsDir，不生成角色文件；Build 仍可通过 Candidate 编写、校验、确认与提升完成。

## REMOVED Sections

### Section: Internal subagent 模板注册

### Section: Per-tool subagent artifact 渲染

### Section: Subagent artifact 写入路径

### Section: Tool metadata 声明 subagent 支持

### Section: Init 与 Update 集成 subagent artifact 生成

### Section: 旧 internal skill 目录迁移 cleanup

### Section: 用户自定义 model 值在 update 时保留

### Section: 按角色编码工具原生权限
