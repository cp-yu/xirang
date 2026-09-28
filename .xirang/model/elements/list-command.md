---
entity: element-declaration
identity: list-command
kind: element
parent: deterministic-operations
title: List Command
definition: List Command 定义 `xirang list` 的行为：扫描活动 changes，统计任务完成度，并支持 `--json`（含 qualityStatus）、`--long` 与 `--sort` 输出；它只表达当前 active-change 表面，不提供 Contract 扫描或 Contract JSON listing。
---

## Specification

### Section: Command Execution

命令 SHALL 扫描并分析活动 changes。

- **Scanning for changes (default)**

  - `xirang list` 不带 flags 执行
  - 扫描 `.xirang/changes/` 目录并排除 `archive/` 子目录
  - 解析每个 change 的 `tasks.md` 统计任务完成度

- **显式列出 changes**

  - 使用 `--changes` 执行
  - 与默认行为一致地列出活动 changes

### Section: Task Counting

命令 SHALL 使用标准 markdown checkbox patterns 准确统计任务完成状态。

- **Counting tasks in tasks.md**

  - 解析 `tasks.md` 文件
  - 统计已完成（`- [x]`）与未完成（`- [ ]`）任务并计算总数

### Section: Output Format

命令 SHALL 以清晰的可读表格显示 changes 与任务进度。

- **Displaying change list (default)**

  - 展示 changes 列表
  - 显示 change 名称与任务进度列

- **Long 输出**

  - 使用 `--long` 执行
  - 每个 change 显示 title、Delta 数量与 task status

### Section: Empty State

命令 SHALL 在无活动 changes 时提供清晰反馈。

- **Handling empty state (changes)**

  - 没有活动 changes（只有 archive/ 或空 changes/）
  - 显示 "No active changes found."

### Section: Error Handling

命令 SHALL 优雅处理缺失文件与目录。

- **Missing tasks.md file**

  - change 目录没有 `tasks.md` 文件
  - 以 "No tasks" 状态显示该 change

- **Missing changes directory**

  - `.xirang/changes/` 目录不存在
  - 显示错误并提示 setup
  - 以 exit code 1 退出

### Section: 排序保持确定性

命令 SHALL 保持一致的 changes 排序以保证可预测输出。

- **排序 changes**

  - 展示多个 changes
  - 默认按最近修改排序，`--sort name` 按 change 名称排序

### Section: list --json 输出包含 quality 状态

`xirang list --json` 命令的输出 SHALL 为每个 change 包含 `qualityStatus` 字段，指示其代码质量记录的状态。

- **记录存在且与当前代码一致**

  - change 目录中存在 quality 状态记录，且记录与当前代码一致
  - JSON 输出中该 change 的 `qualityStatus` SHALL 为 `'clean'`

- **记录存在但与当前代码不一致**

  - change 目录中存在 quality 状态记录，但当前代码与任何通过的记录不一致
  - JSON 输出中该 change 的 `qualityStatus` SHALL 为 `'dirty'`

- **记录不存在**

  - change 目录中不存在 quality 状态记录
  - JSON 输出中该 change 的 `qualityStatus` SHALL 为 `'MISSING'`

- **原 status 字段不变**

  - `xirang list --json` 执行
  - 输出的 `status` 字段 SHALL 保持与原有逻辑一致（基于 task count）
