---
entity: "element-declaration"
identity: "workflow-templates"
kind: "element"
parent: "agent-workbench-projection"
title: "Workflow Templates"
definition: "Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、quality 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。"
contract: "optional"
---

## ADDED Requirements

### Requirement: 交付并路由通用语义精化指导
框架 SHALL 交付可直接消费的 semantic-refinement 共享 reference，并让需要结构形成的 Build、Explore、Propose 及使用共享片段的入口按 normalized decomposition 路由。默认方法读取框架指导；显式 method 或 skill 保持项目选择，不得仅更改默认方法名而缺少内容，也不得新增工作流。

#### Scenario: 默认指导可达
- **WHEN** 无显式配置的新项目开始结构形成
- **THEN** 对应入口能读取随框架投影的完整默认指导，形成任意深度语义结构。

#### Scenario: 显式指导优先
- **WHEN** 项目显式指定方法或 skill
- **THEN** 使用该选择，不用默认 reference 覆盖项目指导，不改变固定六工作流集合。

### Requirement: 以行为门禁组织形成提示词
Build、Explore、Propose、任务生成及相关共享指导 SHALL 清楚区分当前输入与权威、阶段动作、停止/确认条件、输出与交接。共同协议由单一框架 reference 定义，入口必须明确何时读取或重读；减少重复或相互竞争的指令，不把模板排版、解释性措辞或完整例句当成行为承诺。相关源模板、受管生成面与行为验证 SHALL 一起维护。

#### Scenario: 冲突流程能按提示执行
- **WHEN** Agent 依据生成入口处理新设计与当前记录的冲突
- **THEN** 可定位完整协议，先重载与解释冲突，等待裁决和独立写入授权，复核后才交接；不会从重复段落推导相反授权。

#### Scenario: 任务生成保持语义分工
- **WHEN** Agent 依据任务生成提示编排实现
- **THEN** 能把 Contract 作为完整规范，把 Tasks 作为实施与检查安排，并执行两段覆盖复核而不复制第二份规范。

#### Scenario: 验证约束行为而非解释性措辞
- **WHEN** 只是调整说明措辞或信息编排而未改变协议
- **THEN** 不新增锁定措辞或标题顺序的持久测试；协议 tokens、必读路由、fail-closed 门禁与禁止操作仍被验证。
