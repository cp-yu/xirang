---
operation: MODIFIED
entity: element-declaration
identity: list-command
kind: element
parent: deterministic-operations
title: List Command
definition: List Command 定义 `xirang list` 的行为：扫描活动 changes，统计任务完成度，并支持 `--json`（含 qualityStatus）、`--long` 与 `--sort` 输出；它只表达当前 active-change 表面，不提供 Contract 扫描或 Contract JSON listing。
---

## REMOVED Requirements

### Requirement: list --json 输出包含 verify 状态

## ADDED Requirements

### Requirement: list --json 输出包含 quality 状态

`xirang list --json` 命令的输出 SHALL 为每个 change 包含 `qualityStatus` 字段，指示其代码质量记录的状态。

#### Scenario: 记录存在且与当前代码一致

- **WHEN** change 目录中存在 quality 状态记录，且记录与当前代码一致
- **THEN** JSON 输出中该 change 的 `qualityStatus` SHALL 为 `'clean'`

#### Scenario: 记录存在但与当前代码不一致

- **WHEN** change 目录中存在 quality 状态记录，但当前代码与任何通过的记录不一致
- **THEN** JSON 输出中该 change 的 `qualityStatus` SHALL 为 `'dirty'`

#### Scenario: 记录不存在

- **WHEN** change 目录中不存在 quality 状态记录
- **THEN** JSON 输出中该 change 的 `qualityStatus` SHALL 为 `'MISSING'`

#### Scenario: 原 status 字段不变

- **WHEN** `xirang list --json` 执行
- **THEN** 输出的 `status` 字段 SHALL 保持与原有逻辑一致（基于 task count）
