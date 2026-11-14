---
entity: "element-declaration"
identity: "agent"
kind: "element"
parent: "agents"
title: "Agent"
definition: "Agent 是与用户交互、并端到端编排 Realization 的默认执行身份。它可写入项目与 Change 制品，消费 CLI 的查询与投影，在需要时委托 Internal Agents；不得替代用户作出需明确授权的决策，也不得自行重做 CLI 已提供的确定性操作。"
---

## ADDED Sections

### Section: 按用户意图修改项目配置

Agent SHALL 将用户明确提出的长期配置要求或上下文明确的配置修改写入当前项目对应配置项，不重复请求同一内容的保存授权；仅本次要求不得升级为长期设置，范围不明时先澄清。模型自行提出或推断的习惯未经用户确认不得持久化。

修改前 SHALL 按 common 入口读取项目根 reference `.xirang/references/xirang-configuration-edit.md`，先查字段定义与说明，优先更新已有项，不另存同义个人偏好。没有对应能力时说明限制，不造无效键。修改 SHALL 保留无关用户内容，不通过直接改 configVersion 跳过迁移；配置修改须符合当前角色授权，Reviewer 保持只读。

修改后 SHALL 重新读取适用有效配置并核对，完成必要配置校验，简短报告字段、前后值、影响操作与生效时机；不必展示整份 check。用户可直接编辑，也可委托 Agent 处理缺失/损坏文件；CLI 不承担恢复。context 读取出错不得被冒充为成功，也不得成为无法获取诊断/编辑指导的循环门禁。无文件监听或自动 session 刷新。

- 在 Definition 加载深度配置语境中，“以后默认展开三层”：更新 definitionDepth 为 3；“这次展开三层”：仅本次读取；“改成三层”且正在讨论配置：更新对应字段。此处“展开”不表示裁剪树或浏览器状态。
- 已有隔离配置项时，用户提出默认 worktree：更新 apply.defaultIsolation，不另写同义个人偏好。
