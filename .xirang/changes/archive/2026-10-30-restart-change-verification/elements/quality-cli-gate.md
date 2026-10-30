---
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: Quality CLI Gate
definition: Quality CLI Gate 定义 `xirang quality` 命令面的门禁与协议契约：`review`、`optimize`、`status`、`seal` 四个入口各自的输入形状、入口条件与收口条件，以及统一输出、结构化诊断、退出码语义和机器可读协议说明的投影。它不定义各入口背后的判断标准（属于 Review 与 Optimization），也不定义记录载体的持久化细节（属于 Quality Writeback）。
---

## MODIFIED Sections

### Section: 收口终态由 stopReason 推导

Optimization 收口时 SHALL 要求 `stopReason`，并据此推导终态：`USER_DECLINED` 对应 `SKIPPED`；`NO_ACTIONABLE` 对应 `NOT_NEEDED`；`DIRECTION_REJECTED` 与 `DIRECTION_LIMIT_REACHED` 在有成功落地方向时对应 `IMPROVED`，否则对应 `DEGRADED`；`UNSAFE` 对应 `ABORTED_UNSAFE`。全部待选方向低于 `optimization.minImpactLevel` 时 SHALL 以 `NO_ACTIONABLE` 收口，并据此推导为 `NOT_NEEDED`。

- **被方向数上限截断但已有成功方向**

  - 收口输入的 `stopReason` 为 `DIRECTION_LIMIT_REACHED`
  - 台账中存在已验证的方向
  - 终态 SHALL 为 `IMPROVED`
  - `stopReason` SHALL 保留为 `DIRECTION_LIMIT_REACHED`

- **仅有被否决方向**

  - 收口输入的 `stopReason` 为 `DIRECTION_REJECTED`
  - 台账中不存在已验证的方向
  - 终态 SHALL 为 `DEGRADED`

- **全部方向低于门槛**

  - 台账中所有待选方向的 `impactLevel` 均低于 `minImpactLevel`
  - 收口输入 SHALL 使用 `stopReason: NO_ACTIONABLE`
  - 终态 SHALL 为 `NOT_NEEDED`

- **unsafe 中止**

  - 收口输入的 `stopReason` 为 `UNSAFE`
  - 终态 SHALL 为 `ABORTED_UNSAFE`
  - 当前活动台账仍为该终态时后续 optimize 入口 SHALL 被拒绝；恢复代码或重新记录 Review 不解除该终态。诊断 SHALL 指向共享恢复 reference，只有按用户授权完成受控轮换并重新通过 Review，才可在新活动台账开始优化

### Section: Status 输出语义

系统 SHALL 提供 `xirang quality status <change-name>` 命令，只读地报告当前代码状态、Review 结论、已用方向数与各方向失败次数、剩余方向额度，以及 `allowedNextOperations`。它 SHALL 区分阻塞条件与非阻塞 informational 诊断，并把 Git HEAD 差异作为 informational 输出。

- **存在未检测的代码变更**

  - 当前代码与最近一条通过的 Review 记录不一致
  - 输出 SHALL 将状态设为 `dirty`
  - `allowedNextOperations` SHALL 包含 `review`
  - SHALL 给出对应的命令模板

- **已通过 Review 但尚未收口**

  - 当前代码已通过 Review 且还没有收口记录
  - 输出 SHALL 将状态设为 `clean`
  - `allowedNextOperations` SHALL 包含 `optimize` 与 `seal` 的适用条件

- **JSON status 单独暴露 Git HEAD 信息**

  - agent 执行 `xirang quality status <change-name> --json`
  - 记录的 Git HEAD 与当前 HEAD 不一致
  - 其他硬条件均通过
  - 输出 SHALL 把该差异放在 informational 字段中
  - SHALL NOT 因此改变代码状态判定

- **status 为只读命令**

  - agent 执行 `xirang quality status <change-name>` 或任意 help
  - 系统 MUST NOT 创建、修改或删除任何记录文件

- **Review 证据与台账分离**：回滚匹配历史 PASS 时，status SHALL 显示匹配的 Review 结论与最新活动台账中的计数、方向状态和终态，不显示旧台账作为当前进度。
- **恢复路径可发现**：当前活动台账为 `ABORTED_UNSAFE` 时，status 的人类可读指引 SHALL 引用共享恢复 reference，说明需用户授权且原流程停止后才能轮换；不得宣称仅恢复代码即可解除终态，或展示可直接 optimize/seal/archive 的操作。完成轮换后，无当前记录的状态 SHALL 为 `dirty`，后续操作为 `review`，历史目录中的 PASS 不改变该结果。
- **优化已收口**：当前台账已为其他终态时，正常操作仍为 seal/archive；用户明确要求重新验证时，可按同一恢复 reference 开始新轮次，不增加 reset 命令。
