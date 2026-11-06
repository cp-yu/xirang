## Context

当前共享协议规定记录发现、完整/选择读取、sourceVersion 复用和更新差异检查，但只要求 Agent 内部读取，没有规范成功载入后向用户同步已确认设计的行为。写入反馈还要求输出机械记录概况，Design Summary 与 Explore Role 则要求交付核对版本，与用户确认的版本不进入播报相冲突。

## Goals / Non-Goals

**Goals:**
- 让全新对话在继续使用记录前向用户说明全部已确认设计与待决问题。
- 让同对话写入反馈只包含本次内容 delta 与决策状态变化。
- 让 invalid、relevant drift 和版本冲突得到诊断与调和反馈。
- 保留 CLI sourceVersion 与机械摘要供 Agent 门禁和并发控制使用。

**Non-Goals:**
- 不改变 `xirang record` 命令、JSON schema、sourceVersion 或 CLI 输出。
- 不要求普通同对话重载重复播报全量记录。
- 不改变记录内容、决策状态、覆盖或 consume 机制。

## Decisions

- 以 `DESIGN_RECORD_REFERENCE` 作为共享协议的单一生成源，并通过现有投影供 Build、Explore、Propose 使用；不在三个入口复制规则。
- 在 reference 中明确新对话/无有效对话基线时的完整摘要、同对话局部写入后的 delta，以及异常诊断三种用户反馈情形。成功载入不播报 slug、记录身份、sourceVersion、valid 状态或机械计数；Design Summary 的溯源身份可保留，sourceVersion 只由 CLI/Agent 内部使用。
- 修改 `design-record`、`explore`、`design-exploration` 和 `explore-role` 的相关 Contract，消除记录报告与 Design Summary 交接中的冲突。CLI 的 `sourceVersion` 输出保持不变。
- 扩展现有 `test/core/templates/design-record-reference.test.ts` 的协议防回归覆盖。仅锁定必要触发条件、禁止播报机制字段及异常必须呈现等门禁，不锁定解释性文案。同步后的投影通过一次性检查确认与生成源一致。

## Risks / Trade-offs

- “全新对话”需按当前对话是否已有仍有效且已向用户同步的记录基线判断；将无有效基线纳入完整呈现，避免上下文恢复后误用静默增量。
- 全量概要可能较长；按已确认内容与待决问题做忠实摘要，不逐字重贴记录，且不加入 Agent 推导为用户决策。
- 用户可见 Summary 不携带 sourceVersion；Propose 仍须通过 CLI 重新发现并核对当前记录，避免旧 Summary 绕过 drift 与版本门禁。
