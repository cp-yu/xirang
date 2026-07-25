---
element: cap.cli.config.project
---

# config-project-query Specification

## Purpose
Define the reviewed Project Setup and Update contract for 查询项目配置; 命令集成于 config 子命令体系; 输出格式与 instructions 配置投影一致.

## Requirements
### Requirement: 查询项目配置

系统 SHALL 提供 `xirang config project` CLI 命令，读取并返回归一化后的项目配置。输出 MUST NOT 包含已退役的 Propose routing 配置。

#### Scenario: JSON 输出包含完整配置

- **WHEN** 用户执行 `xirang config project --json`
- **THEN** 系统输出归一化后的 `NormalizedProjectConfig` JSON
- **AND** 输出包含适用的 `proseLanguage`、`context`、`optimization`、`apply`、`git` 和 `rules` 字段
- **AND** 输出 SHALL NOT 包含 `propose`
- **AND** 以 exit code 0 退出

#### Scenario: 缺少 config.yaml 时返回空配置

- **WHEN** 项目目录中不存在 `.xirang/config.yaml`
- **THEN** 系统输出 `{ "rules": {} }` 作为最小有效配置
- **AND** 以 exit code 0 退出

#### Scenario: 人类可读文本输出

- **WHEN** 用户执行 `xirang config project`（不带 `--json`）
- **THEN** 系统以 YAML-like 格式打印各配置项
- **AND** 输出 SHALL NOT 包含 `propose`
- **AND** 以 exit code 0 退出

#### Scenario: 旧 Propose routing 配置不进入查询结果
- **WHEN** `.xirang/config.yaml` 包含旧 `propose.smartRouting` 或 `propose.requireExplore`
- **THEN** JSON 与人类可读输出 SHALL NOT 包含 `propose`
- **AND** 其他有效配置字段 SHALL 正常输出

### Requirement: 命令集成于 config 子命令体系

`config project` 命令 SHALL 作为 `xirang config` 的子命令注册。

#### Scenario: 帮助信息

- **WHEN** 用户执行 `xirang config --help`
- **THEN** 显示 `project` 作为可用子命令
- **AND** 描述该命令为查询项目级配置

### Requirement: 输出格式与 instructions 配置投影一致

`xirang config project --json` 的输出 SHALL 与 `xirang instructions <artifact> --json` 中的 `configProjection.normalized` 使用相同的 `NormalizedProjectConfig` 数据结构。

#### Scenario: 字段一致性

- **WHEN** 同一个项目中同时执行 `xirang config project --json` 和 `xirang instructions proposal --change "<name>" --json`
- **THEN** `xirang config project --json` 的顶层字段集合与 `instructions` 命令中 `configProjection.normalized` 的字段集合相同

#### Scenario: git 字段输出新结构

- **WHEN** 用户执行 `xirang config project --json`
- **THEN** 输出的 `git` 字段 SHALL 包含 `commitMessage`（含已配置的 `boundary`、`archive`、`merge` 路径，未配置的键不输出值或输出空）
- **AND** SHALL 包含 `merge.strategy`
- **AND** SHALL 包含 `branch.deleteAfterArchive`
- **AND** SHALL NOT 包含 `autoCommit`
- **AND** SHALL NOT 包含 `archive.commitMessage.convention`
- **AND** SHALL NOT 包含 `merge.commitMessage.convention`
- **AND** SHALL NOT 包含 `merge.messageFrom`
