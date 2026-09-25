---
operation: "MODIFIED"
entity: "element-declaration"
identity: "propose-role"
kind: "element"
parent: "agent"
title: "Propose Role"
definition: "Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它复用已确认设计与有效 Design Summary，消费可用的已确认设计记录，编写完整 Semantic Delta 与 Change Plan，并编排语义覆盖复核、确定性校验及来源交接；它交付可进入实现的 Change，不修改项目实现、不更新正式模型，也不关闭 Change。"
contract: "optional"
---

## ADDED Requirements

### Requirement: 编排确认记录消费
Propose Role SHALL 在完整 Change 通过来源到语义、语义到任务的覆盖复核与 validation 后调用 framing consume，核对版本、目标快照和来源生命周期成功才交付 Formation 结果。没有记录时直接按普通 Propose 路径交付，不执行空消费。

#### Scenario: 带记录交付 Change
- **WHEN** 覆盖复核和最终校验通过且来源版本未改变
- **THEN** 向明确的目标 Change 消费记录，核对成功结果后交付。

#### Scenario: 无记录交付 Change
- **WHEN** 完整 Change 仅由已确认设计与模型形成
- **THEN** 不调用 framing consume，不为流程创建空记录。

## REMOVED Requirements

### Requirement: 编排结构定义消费
