---
operation: ADDED
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: Quality CLI Gate
definition: Quality CLI Gate 定义 `xirang quality` 命令面的门禁与协议契约：`review`、`optimize`、`status`、`seal` 四个入口各自的输入形状、入口条件与收口条件，以及统一输出、结构化诊断、退出码语义和机器可读协议说明的投影。它不定义各入口背后的判断标准（属于 Review 与 Optimization），也不定义记录载体的持久化细节（属于 Quality Writeback）。
---

## ADDED Requirements

### Requirement: Review 记录入口
系统 SHALL 提供 `xirang quality review <change-name>` 命令，在校验入口条件后接受一次 Review 结论。入口条件为当前代码存在未经 Review 的变更；不满足时 MUST NOT 写入任何记录，并 SHALL 回报当前状态与合法后续操作。接受时 SHALL 校验 `result`、`issues`、`evidenceFiles` 结构，计算 `tasksFileHash` 与 `evidenceFingerprint`，持久化结论与指纹，并输出当前状态与 `allowedNextOperations`。

#### Scenario: 入口条件通过并记录结论
- **WHEN** agent 执行 `xirang quality review <change-name> --input '<json>'`
- **AND** 当前代码存在未经 Review 的变更
- **THEN** 系统 SHALL 校验输入结构并计算 `tasksFileHash` 与 `evidenceFingerprint`
- **AND** SHALL 持久化该结论与指纹
- **AND** SHALL 输出 `state` 与 `allowedNextOperations`
- **AND** 以 exit 0 退出

#### Scenario: 代码未变更时拒绝重复记录
- **WHEN** 当前代码与最近一条通过的 Review 记录一致
- **THEN** 系统 SHALL 以 exit 1 拒绝
- **AND** SHALL 说明现有结论仍然有效，并给出 `allowedNextOperations`
- **AND** MUST NOT 修改任何记录

#### Scenario: 输入结构非法
- **WHEN** 输入缺少 `result`、`issues`、`evidenceFiles` 或取值不合法
- **THEN** 系统 SHALL 以 exit 2 拒绝
- **AND** SHALL 以结构化诊断指出字段路径、期待值与当前值
- **AND** MUST NOT 修改任何记录

### Requirement: Optimization 记录入口
系统 SHALL 提供 `xirang quality optimize <change-name>` 命令，以一轮为单位接受一份优化判断台账。入口条件为当前代码已通过 Review、Optimization 尚未收口、终态不是 `ABORTED_UNSAFE`、且已选方向数未达 `optimization.directionLimit`。系统 SHALL 为台账中省略 `id` 的新方向分配稳定 ID 并在输出中回显，校验方向 ID 引用与状态迁移，按方向数与同方向失败次数更新两级计数，并持久化该轮台账。

#### Scenario: 满足入口条件并记录一轮
- **WHEN** agent 执行 `xirang quality optimize <change-name> --input '<json>'`
- **AND** 当前代码已通过 Review、尚未收口、方向数未达上限
- **THEN** 系统 SHALL 为新方向分配稳定 ID 并在输出中回显
- **AND** SHALL 记录该轮台账、更新两级计数
- **AND** SHALL 输出选中的方向与下一步

#### Scenario: optimization 被禁用
- **WHEN** `optimization.enabled` 为 false
- **THEN** 系统 SHALL 只接受 `stopReason` 为 `USER_DECLINED` 的收口输入
- **AND** SHALL 记录终态 `SKIPPED`

#### Scenario: 方向数用尽后只能收口
- **WHEN** 已选方向数达到 `optimization.directionLimit`
- **THEN** 系统 SHALL 拒绝选择新方向
- **AND** SHALL 仍接受收口输入

#### Scenario: 引用未知方向
- **WHEN** 台账引用了未知的方向 ID，或提交了非法的方向状态迁移
- **THEN** 系统 SHALL 以 exit 2 拒绝
- **AND** MUST NOT 修改任何记录

### Requirement: 收口终态由 stopReason 推导
Optimization 收口时 SHALL 要求 `stopReason`，并据此推导终态：`USER_DECLINED` 对应 `SKIPPED`；`NO_ACTIONABLE` 对应 `NOT_NEEDED`；`DIRECTION_REJECTED` 与 `DIRECTION_LIMIT_REACHED` 在有成功落地方向时对应 `IMPROVED`，否则对应 `DEGRADED`；`UNSAFE` 对应 `ABORTED_UNSAFE`。

#### Scenario: 被方向数上限截断但已有成功方向
- **WHEN** 收口输入的 `stopReason` 为 `DIRECTION_LIMIT_REACHED`
- **AND** 台账中存在已验证的方向
- **THEN** 终态 SHALL 为 `IMPROVED`
- **AND** `stopReason` SHALL 保留为 `DIRECTION_LIMIT_REACHED`

#### Scenario: 仅有被否决方向
- **WHEN** 收口输入的 `stopReason` 为 `DIRECTION_REJECTED`
- **AND** 台账中不存在已验证的方向
- **THEN** 终态 SHALL 为 `DEGRADED`

#### Scenario: unsafe 中止
- **WHEN** 收口输入的 `stopReason` 为 `UNSAFE`
- **THEN** 终态 SHALL 为 `ABORTED_UNSAFE`
- **AND** 后续 optimize 入口 SHALL 被拒绝，直到工作区被恢复

### Requirement: Seal 校验
系统 SHALL 提供 `xirang quality seal <change-name>` 命令，校验当前记录的结构完整性、当前代码已通过 Review、以及 Optimization 已收口且终态不是 `ABORTED_UNSAFE`。通过时 SHALL 输出 seal hash。

#### Scenario: Seal 校验通过
- **WHEN** agent 执行 `xirang quality seal <change-name>`
- **AND** 当前代码已通过 Review 且 Optimization 已收口
- **THEN** 系统 SHALL 输出 seal hash
- **AND** 以 exit 0 退出

#### Scenario: Seal 校验失败
- **WHEN** 记录缺失必需字段、当前代码未通过 Review，或 Optimization 尚未收口
- **THEN** 系统 SHALL 列出未满足的条件
- **AND** 以 exit 1 退出

### Requirement: Status 输出语义
系统 SHALL 提供 `xirang quality status <change-name>` 命令，只读地报告当前代码状态、Review 结论、已用方向数与各方向失败次数、剩余方向额度，以及 `allowedNextOperations`。它 SHALL 区分阻塞条件与非阻塞 informational 诊断，并把 Git HEAD 差异作为 informational 输出。

#### Scenario: 存在未检测的代码变更
- **WHEN** 当前代码与最近一条通过的 Review 记录不一致
- **THEN** 输出 SHALL 将状态设为 `dirty`
- **AND** `allowedNextOperations` SHALL 包含 `review`
- **AND** SHALL 给出对应的命令模板

#### Scenario: 已通过 Review 但尚未收口
- **WHEN** 当前代码已通过 Review 且还没有收口记录
- **THEN** 输出 SHALL 将状态设为 `clean`
- **AND** `allowedNextOperations` SHALL 包含 `optimize` 与 `seal` 的适用条件

#### Scenario: JSON status 单独暴露 Git HEAD 信息
- **WHEN** agent 执行 `xirang quality status <change-name> --json`
- **AND** 记录的 Git HEAD 与当前 HEAD 不一致
- **AND** 其他硬条件均通过
- **THEN** 输出 SHALL 把该差异放在 informational 字段中
- **AND** SHALL NOT 因此改变代码状态判定

#### Scenario: status 为只读命令
- **WHEN** agent 执行 `xirang quality status <change-name>` 或任意 help
- **THEN** 系统 MUST NOT 创建、修改或删除任何记录文件

### Requirement: 统一输出与诊断结构
所有 `xirang quality` 子命令 SHALL 使用统一输出形状。成功返回 `ok: true` 与 `allowedNextOperations`；入口或状态条件不满足返回 `ok: false`、稳定 `code`、`diagnostics` 与 `allowedNextOperations`，并以 exit 1 退出；输入形状非法返回 `ok: false`、`code: INVALID_INPUT` 与 `diagnostics`，并以 exit 2 退出。`diagnostics` 条目 SHALL 包含字段路径 `path`、期待值 `expected`、当前值或状态 `actual` 以及修正方式 `fix`。

#### Scenario: 字段非法时给出可操作诊断
- **WHEN** 输入中某个字段缺失或取值非法
- **THEN** `diagnostics` SHALL 包含该字段的 `path`、`expected` 与 `fix`
- **AND** 以 exit 2 退出

#### Scenario: 入口条件不满足时给出后续操作
- **WHEN** 入口条件不满足
- **THEN** 输出 SHALL 包含稳定 `code` 与 `allowedNextOperations`
- **AND** 以 exit 1 退出

### Requirement: 协议说明的单一来源与投影
系统 SHALL 从同一批实现常量派生 quality 协议说明，并投影到 `xirang quality` 命令的 help 与 apply/archive skill 的 reference 文档。投影 SHALL 覆盖各入口的输入字段、枚举取值、最小合法示例、退出码，以及静态结构无法表达的状态约束。系统 MUST NOT 在 help 与 reference 中各自维护一套与实现并行的协议描述。

#### Scenario: help 与 reference 具有同一来源
- **WHEN** 协议说明被渲染到 help 或 reference
- **THEN** 两者 SHALL 由同一批导出常量生成
- **AND** 枚举取值 SHALL 与校验实现使用同一常量

#### Scenario: 静态结构无法表达的约束单独说明
- **WHEN** 渲染协议说明
- **THEN** SHALL 说明入口条件、收口推导、两级计数与记录匹配规则
- **AND** SHALL NOT 重复描述可机械展开的字段定义
