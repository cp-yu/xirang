---
entity: element-declaration
identity: list-command
kind: capability
parent: deterministic-operations
title: List Command
definition: List Command 定义 `xirang list` 的行为：扫描活动 changes，统计任务完成度，并支持 `--json`（含 verifyStatus）、`--long` 与 `--sort` 输出；它只表达当前 active-change 表面，不提供 Contract 扫描或 Contract JSON listing。
---

## Requirements

### Requirement: Command Execution
命令 SHALL 扫描并分析活动 changes。

#### Scenario: Scanning for changes (default)
- **WHEN** `xirang list` 不带 flags 执行
- **THEN** 扫描 `.xirang/changes/` 目录并排除 `archive/` 子目录
- **AND** 解析每个 change 的 `tasks.md` 统计任务完成度

#### Scenario: 显式列出 changes
- **WHEN** 使用 `--changes` 执行
- **THEN** 与默认行为一致地列出活动 changes

### Requirement: Task Counting

命令 SHALL 使用标准 markdown checkbox patterns 准确统计任务完成状态。

#### Scenario: Counting tasks in tasks.md

- **WHEN** 解析 `tasks.md` 文件
- **THEN** 统计已完成（`- [x]`）与未完成（`- [ ]`）任务并计算总数

### Requirement: Output Format
命令 SHALL 以清晰的可读表格显示 changes 与任务进度。

#### Scenario: Displaying change list (default)
- **WHEN** 展示 changes 列表
- **THEN** 显示 change 名称与任务进度列

#### Scenario: Long 输出
- **WHEN** 使用 `--long` 执行
- **THEN** 每个 change 显示 title、Delta 数量与 task status

### Requirement: Empty State
命令 SHALL 在无活动 changes 时提供清晰反馈。

#### Scenario: Handling empty state (changes)
- **WHEN** 没有活动 changes（只有 archive/ 或空 changes/）
- **THEN** 显示 "No active changes found."

### Requirement: Error Handling

命令 SHALL 优雅处理缺失文件与目录。

#### Scenario: Missing tasks.md file

- **WHEN** change 目录没有 `tasks.md` 文件
- **THEN** 以 "No tasks" 状态显示该 change

#### Scenario: Missing changes directory

- **WHEN** `.xirang/changes/` 目录不存在
- **THEN** 显示错误并提示 setup
- **AND** 以 exit code 1 退出

### Requirement: list --json 输出包含 verify 状态

`xirang list --json` 命令的输出 SHALL 为每个 change 包含 `verifyStatus` 字段，指示其 verify 结果的新鲜度。

#### Scenario: verify 结果存在且新鲜

- **WHEN** change 目录中存在 `.verify-result.json` 且 freshness 为 FRESH
- **THEN** JSON 输出中该 change 的 `verifyStatus` SHALL 为 `'FRESH'`

#### Scenario: verify 结果存在但过时

- **WHEN** change 目录中存在 `.verify-result.json` 且 freshness 为 STALE
- **THEN** JSON 输出中该 change 的 `verifyStatus` SHALL 为 `'STALE'`

#### Scenario: verify 结果不存在

- **WHEN** change 目录中不存在 `.verify-result.json`
- **THEN** JSON 输出中该 change 的 `verifyStatus` SHALL 为 `'MISSING'`
#### Scenario: 原 status 字段不变
- **WHEN** `xirang list --json` 执行
- **THEN** 输出的 `status` 字段 SHALL 保持与原有逻辑一致（基于 task count）
### Requirement: 排序保持确定性

命令 SHALL 保持一致的 changes 排序以保证可预测输出。

#### Scenario: 排序 changes

- **WHEN** 展示多个 changes
- **THEN** 默认按最近修改排序，`--sort name` 按 change 名称排序
