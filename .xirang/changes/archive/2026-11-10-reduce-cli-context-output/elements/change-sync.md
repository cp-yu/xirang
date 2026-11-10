---
entity: element-declaration
identity: change-sync
kind: element
parent: change-closure
title: "Change Sync"
definition: "Change Sync 定义将 Change 的四分区 Semantic Delta 同步到正式 Semantic Model 的行为：从 immutable Formal snapshot 物化完整 Target Semantic Model、联合验证、原子写入与回滚、幂等判定及 `xirang sync` 命令面的选择与门禁行为。Sync 的 Quality 前置条件是已记录且 commit 对象仍存在的 Seal；Sync 不写 Quality record、不执行或关联测试，也不比较 Seal commit 与当前工作区。"
---

## MODIFIED Sections

### Section: 按实际 Semantic Delta operations 判断同步需求

Sync SHALL 根据四分区 Semantic Delta 的 operations 判断是否需要同步，而不是仅根据文件存在。省略某分区 delta SHALL 表示该 scope 无变化；空 operation block SHALL 被拒绝。

- **无任何 delta**

  - change 没有待同步 operations
  - SHALL 静默成功，以退出码 0 表示无需同步

- **只有 contract delta**

  - change 只有待同步 Sections
  - SHALL 只更新对应 Element Contract
  - SHALL 在完整 Target Semantic Model 上检查 contract policy

- **Real delta 要求 formal model**

  - delta 包含实际 operations 且 formal model 不存在
  - SHALL 失败并报告无法构造 Target Semantic Model

- **Archive 阻塞未同步 delta**

  - agent executes `xirang archive`
  - 仍有未同步 delta contracts
  - archive SHALL 阻止归档并指引先完成 `xirang sync`
  - SHALL NOT 在 archive 内执行 sync

- **Sync 在 archive 前完成 reconciliation**

  - delta contracts exist
  - `xirang sync` SHALL 在 archive 之前将其 reconcile 到 Formal Semantic Model
  - SHALL preserve idempotency

- **无 graph delta 且无 contract delta**

  - change 没有待同步 graph 或 contract operations
  - SHALL 静默成功，以退出码 0 表示无需同步

- **Archive 要求 Sync 已完成**

  - agent executes `xirang archive`
  - delta Contracts or 四分区 delta 单元 are present
  - archive SHALL 要求 Sync 已完成（pending delta 阻塞 archive），不在 archive 内执行 sync

- **Real graph delta 要求 formal model**

  - graph delta 包含实际 operations 且 formal graph 不存在
  - SHALL 失败并报告无法构造 Target Semantic Model

- **Real graph delta 要求 Formal Model**

  - graph delta 包含 operation 且 Formal graph 不存在
  - SHALL 失败并报告无法构造 Target Semantic Model

- **只有 contract delta（Sync 按实际 Sem）**

  - change 只有待同步 Contracts
  - SHALL 只更新对应 elements/ 单元
  - SHALL 在完整 Target Semantic Model 上检查 contractPolicy

- **只有 contract delta（Sync 按实际 OPS）**

  - change 只有待同步 Contracts
  - SHALL 只更新对应 elements/ 单元
  - SHALL 在完整 Target Semantic Model 上检查 contract policy

## ADDED Sections

### Section: 同步成功仅交付必要结果

Sync SHALL 保留完整验证、原子写入及失败回滚；同步成功或无待同步变化且无警告时，两条输出流 SHALL 为空，不输出文件写入统计或完成回执。失败及真实警告 SHALL 进入 stderr，--json 时使用结构化诊断；不得以输出精简掩盖事务后关联失败。
