---
entity: element-declaration
identity: internal-subagent-generation
kind: element
parent: agent-workbench-projection
title: Internal Subagent Generation
definition: Internal Subagent Generation 是框架内部 Agent 的工具原生制品投影能力，独立承载显式注册、按工具渲染、按角色配置权限、安装更新及用户模型设置保留；覆盖 Reviewer、Optimizer 与 Experimenter，不形成用户工作流，也不承担各角色的任务执行。
---

## MODIFIED Sections

### Section: Per-tool subagent artifact 渲染

系统 SHALL 从统一 `SubagentTemplate` 渲染 Claude、Pi、OpenCode 的 Markdown 与 Codex 的 TOML，只有 `template.model` 明确且不为 `inherit` 时输出模型字段，并保留现有 TOML 转义、用户模型设置及显式安装路径规则。Reviewer 的 Claude/Pi 制品 SHALL 省略限定工具集合的 `tools` 字段，使环境的正常工具可用；OpenCode Reviewer 允许 edit；Codex Reviewer 使用与可写 Agent 相同的工作区沙箱。Pi Reviewer 制品 SHALL 提示后台运行以加载可用的环境扩展工具并等待完整结果，不保留 foreground-only 提示；Pi Optimizer 的前台提示不因此改变。

### Section: 按角色编码工具原生权限

系统 SHALL 使 Reviewer 生成面不设专属 read/search/bash 工具白名单、Edit/Write 否决或只读沙箱；Reviewer 的实际操作仍受只读职责指令约束，不得因此修改项目、Change、Quality、Checkpoint 或 Git history。Optimizer 和 Experimenter 保持委托范围内原有的可写能力。所有工具的生成与更新仍按现有显式注册及受管清单处理，保留非 `inherit` 用户 model 与跨平台路径构造，不按名称猜测或覆盖用户非受管文件。
