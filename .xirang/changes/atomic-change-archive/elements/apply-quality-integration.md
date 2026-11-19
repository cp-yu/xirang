---
entity: element-declaration
identity: apply-quality-integration
kind: element
parent: apply
title: Apply Quality Integration
definition: Apply Quality Integration 是 Apply 对独立基线 Review、Opt 检查与授权实施、累计独立 Review、Git 恢复和 Seal 的集成协议，独立承载角色分工、共享 references 及 Quality 诊断消费。协调者负责提交、委派、修正和任务状态；不定义自动 task writeback、Quality checkpoint 或逐方向台账。
---

## MODIFIED Sections

### Section: 共享恢复 reference 编排重验

Apply SHALL 使用共享 Git recovery reference 执行重验；Archive 的默认交付门禁若拒绝 Seal，Archive SHALL 报告诊断并交回 Apply，不自行运行恢复或重验协议。用户要求活动 Change 从头重新验证时，主 Agent 在旧流程停止后用当前 checkout 的 HEAD 重新委派 `full-change` Review，不传目标 commit 或新 `reviewId`，也不重置 v5 Quality 历史。输入无效、HEAD 在审查期间变化或错误的完整 Review 委派需要重新委派，不能以伪造的失败 opinion 占据门禁；不支持的旧 v4 和更早质量文件保留原样并报诊断，待用户决定受影响 Change 的处理。
