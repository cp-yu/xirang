---
entity: element-declaration
identity: propose-role
kind: element
parent: agent
title: Propose Role
definition: Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它复用已确认设计与有效 Design Summary，消费可用的已确认设计记录，按写作规则编写完整 Semantic Delta 与 Change Plan，并编排原子细节覆盖检查及其 CLI 记录、确定性校验与来源交接；它交付可进入实现的 Change，不修改项目实现、不更新正式模型，也不关闭 Change。
---

## Specification

### Section: 写入 Change 制品

Propose Role SHALL 组织并写入完整 Semantic Delta 与 Change Plan，按复杂度与用户审阅；可讨论并确认小范围调整、自主处理细枝末节，不自行大量扩写设计。需要重新实验判断方案时返回 Explore。

可通过 CLI 维护与 Explore 共用的设计记录：pending 内容可主动维护，accepted、excluded 与已确认内容实质修改遵循用户确认边界。除此之外不任意写入 Change 目录外项目文件，不实现项目或更新正式模型。

### Section: 交付可进入实现的 Change

Propose Role SHALL 将 Propose 完成的完整 Change 交付给 Change Implementation。

- **Propose 活动完成**

  - Delta、Plan、审查与确认均完整
  - Agent 报告该 Change 可进入 Change Implementation

### Section: 不修改项目或正式模型

Propose Role SHALL NOT 修改项目实现，也 SHALL NOT 将 Delta 应用于 Semantic Model。

- **Change 已形成**

  - Propose 到达出口
  - 项目实现与正式模型保持未落实该 Change 的状态

### Section: 编排确认记录消费

Propose Role SHALL 在完整 Change 通过 validation 后，先经 `xirang record coverage` 记录原子细节覆盖检查结果，再调用 `xirang record consume`，核对版本、覆盖结果、结构比对、目标快照和来源生命周期成功才交付 Formation 结果；目标语义到任务的覆盖复核同样通过后才交付。没有记录时直接按普通 Propose 路径交付，不执行空覆盖记录或空消费。

- **带记录交付 Change**

  - 覆盖结果已记录且有效、最终校验通过且来源版本未改变
  - 向明确的目标 Change 消费记录，核对成功结果后交付。

- **覆盖记录前不得消费**

  - 目标 Change 中尚无有效覆盖结果
  - 不调用 consume，先完成覆盖检查并记录。

- **无记录交付 Change**

  - 完整 Change 仅由已确认设计与模型形成
  - 不调用 `xirang record coverage` 或 consume，不为流程创建空记录。
