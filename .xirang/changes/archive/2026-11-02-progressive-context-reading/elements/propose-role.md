---
entity: element-declaration
identity: propose-role
kind: element
parent: agent
title: Propose
definition: Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它以已确认设计为依据形成 Change，并复用 Explore 已形成的 Design Summary。存在已确认设计记录时，Propose 按写作规则把记录编译为 Semantic Delta，经 CLI 记录原子细节覆盖结果后将该记录交接给目标 Change；不存在记录时，Propose 直接依据 Semantic Model 与已确认设计形成 Semantic Delta。Propose 写出完整 Semantic Delta 与 Change Plan，并在 Change Formation 内完成必要审查与确认，使 Change 可进入实现。它不实现项目，也不以 Semantic Delta 更新 Semantic Model。
---

## ADDED Sections

### Section: 复用有效上下文并按需补读

Propose 工作身份 SHALL 在阶段入口与收尾执行完整 Design Record 门禁，在上下文有效期间复用最近成功读取的 record-level `sourceVersion`、摘要与已知 identity；局部问题通过 `record show --entry` 选择读取，局部更新使用最近有效版本并检查 diff 与 summary。Semantic Model 读取 SHALL 从候选定位逐步展开到显式 identity 的完整 Declaration 与 Contract，不自动查询 impact 返回的全部 identities。

上下文压缩、会话切换、版本冲突、相关模型 drift 或无法确定当前状态时，Propose SHALL 重新建立完整依据。Agent MUST NOT 从旧摘要、路径、残余会话内容或实现证据猜测缺失的 Definition、Contract 或记录状态。完整 Contract 与 Acceptance Cases 不得被摘要、截断或改写。
