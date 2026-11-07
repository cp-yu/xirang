---
entity: element-declaration
identity: internal-agents
kind: element
parent: agents
title: Internal Agents
definition: Internal Agents 是在与主 Agent 隔离的上下文中接受委托、独立取得依据并交付结果的执行主体，独立区分于端到端编排身份。它们包含只读 Reviewer、可写受托 Optimizer 与 Experimenter，各角色按职责执行审查、优化或实验；不承担用户设计确认、Change 关闭或 Semantic Model 提升。
---

## MODIFIED Sections

### Section: 按角色限定操作能力

Reviewer SHALL 只读判断，不修改项目、Change、Quality、Checkpoint 或 Git history；其工具可用范围与主 Agent 相同，不以工具白名单、编辑否决或硬只读沙箱代替行为约束。Optimizer SHALL 在委托范围内实际修改相关实现与测试、执行局部验证，缺失对应测试时先补后改；Experimenter MAY 编写并执行受托实验。三者均不承担用户确认、正式模型提升或 Change 关闭，最终验证范围由主 Agent 决定。
