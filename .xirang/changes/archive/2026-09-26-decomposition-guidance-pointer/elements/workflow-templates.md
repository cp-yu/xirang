---
entity: "element-declaration"
identity: "workflow-templates"
kind: "element"
parent: "agent-workbench-projection"
title: "Workflow Templates"
definition: "Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、quality 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: 交付并路由通用语义精化指导
框架 SHALL 交付可直接消费的 semantic-refinement 共享 reference 作为默认 `decomposition` 值的解析目标，并让需要结构形成的 Build、Explore、Propose 及使用共享片段的入口按 normalized decomposition 解析路径读取指导。不得仅更改默认值而缺少内容，也不得新增工作流。

#### Scenario: 默认指导可达
- **WHEN** 使用默认 `decomposition` 值的项目开始结构形成
- **THEN** 对应入口能按解析路径读取随框架投影的完整默认指导，形成任意深度语义结构。

#### Scenario: 项目指导优先
- **WHEN** 项目显式配置其他指导文件路径或裸名称
- **THEN** 入口读取该解析结果，不用默认 reference 覆盖项目指导，不改变固定六工作流集合。
