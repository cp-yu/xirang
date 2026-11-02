---
entity: element-declaration
identity: propose-role
kind: element
parent: agent
title: Propose Role
definition: Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它复用已确认设计与有效 Design Summary，消费可用的已确认设计记录，按写作规则编写完整 Semantic Delta 与 Change Plan，并编排原子细节覆盖检查及其 CLI 记录、确定性校验与来源交接；它交付可进入实现的 Change，不修改项目实现、不更新正式模型，也不关闭 Change。
---

## MODIFIED Sections

### Section: 写入 Change 制品

Propose Role SHALL 组织并写入完整 Semantic Delta 与 Change Plan，按复杂度与用户审阅；可讨论并确认小范围调整、自主处理细枝末节，不自行大量扩写设计。需要重新实验判断方案时返回 Explore。

可通过 CLI 维护与 Explore 共用的设计记录：pending 内容可主动维护，accepted、excluded 与已确认内容实质修改遵循用户确认边界。除此之外不任意写入 Change 目录外项目文件，不实现项目或更新正式模型。
