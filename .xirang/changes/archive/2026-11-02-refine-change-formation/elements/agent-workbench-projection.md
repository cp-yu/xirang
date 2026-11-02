---
entity: element-declaration
identity: agent-workbench-projection
kind: element
parent: project-tooling-configuration
title: Agent 工作面投影与同步
definition: Agent 工作面投影与同步是 CLI 中维护息壤托管的 Agent 工作面及其 instructions、templates 与 references 的能力。它通过共享 artifact sync engine 与 canonical workflow manifest 生成六个固定 workflow skills 与 internal subagent artifacts，将共享片段与 references 物化到项目本地，并保证生成产物的行为等价与长度约束。
---

## MODIFIED Sections

### Section: 维护 internal subagent 制品

系统 SHALL 显式注册 `xirang-reviewer`、`xirang-optimizer` 与 `xirang-experimenter` 三个 internal subagents，并按工具原生格式渲染与写入 subagent artifacts。

- **显式注册三个 internal subagents**

  - 读取 internal subagent 模板常量
  - 只包含 `xirang-reviewer`、`xirang-optimizer` 与 `xirang-experimenter` 三个显式条目

- **写入路径遵循工具原生规范**

  - 为支持的工具生成 internal subagent artifact
  - 写入 `<projectRoot>/<agentsDir>/agents/<name>.<ext>`，不指向任何全局 agent 目录
