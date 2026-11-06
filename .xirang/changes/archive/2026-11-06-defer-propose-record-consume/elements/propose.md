---
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: Propose
definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
---

## MODIFIED Sections

### Section: 交接已确认设计来源

存在记录时，完整 Change 通过确定性 validation 后，Propose SHALL 按共享规则区分性质、决策状态与适用性，对需落实的已采纳规范条目执行原子细节覆盖，并检查 pending 问题对就绪的影响，并通过 `xirang record coverage` 记录结果；CLI 拒绝时 SHALL 先把缺失细节补进目标 Contract 或 Delta，再重新检查并记录，不得以笼统描述代替逐项结果。Propose SHALL 在请求用户接受最终 Change 前完成 coverage，审阅期间保持记录活动；用户提出修改时 SHALL 调和适用的记录内容、Delta 与 Plan，重新校验并对最新目标记录 coverage。只有用户接受与当前 coverage 对应的最终 Change 后，Propose SHALL 通过 `xirang record consume` 向该 Change 交接。consume 复核来源版本、目标指纹与结构，不重复执行覆盖检查；覆盖过期、结构不一致或其他前置失败时保留来源且不声明 Formation 完成。豁免或无记录时 SHALL 跳过覆盖记录与消费，但仍须在用户接受最终 Change 后完成 Formation，同时保留已声明的记录决策，不建立空记录。来源快照与覆盖结果不参与 Expected Semantic Model。

- **交接成功才完成 Formation**

  - validation 通过、覆盖结果有效且结构比对一致，用户接受最终 Change
  - consume 保存精确来源快照与覆盖结果并完成 Formation

- **审阅期间再次修改**

  - 已运行 coverage，用户审阅时确认补充或修订，Record 或 Delta 改变
  - 保持活动 Record，重新校验并对最新来源与目标运行 coverage；接受后才 consume

- **覆盖检查被拒绝**

  - `xirang record coverage` 报告某条目的例子没有落位，或记录结构与目标不一致
  - 补齐目标并重新检查、记录 coverage 后提交用户审阅，不提前 consume

- **Consume 失败**

  - `xirang record consume` 返回失败
  - 保留来源且不声明 Formation 完成，按共享恢复协议处理

- **豁免时跳过消费但保留决策**

  - 来源已声明豁免
  - 跳过覆盖记录与消费，用户接受最终 Change 后完成 Formation
  - 保留该记录决策于 Formation 证据中，不建立空记录
