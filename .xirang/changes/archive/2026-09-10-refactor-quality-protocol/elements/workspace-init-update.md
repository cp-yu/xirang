---
entity: element-declaration
identity: workspace-init-update
kind: element
parent: project-tooling-configuration
title: 工作区初始化与更新
definition: 工作区初始化与更新是 CLI 中初始化和更新息壤工作区的能力。它通过 `xirang setup` 与 `xirang update` 创建或保留 `.xirang` durable workspace、安装固定 Agent workflow 集合、刷新受管 Agent surfaces，并维护配置默认值与退役 workspace 的迁移。
---
## MODIFIED Requirements

### Requirement: 迁移配置默认值

`xirang update` SHALL 以 missing-only 方式在 `.xirang/config.yaml` 或 `.xirang/config.yml` 中物化缺失的功能性默认值，且 SHALL NOT 覆盖用户已设置的值。

#### Scenario: 配置缺失时创建

- **WHEN** 项目没有 config 文件且用户运行 `xirang update`
- **THEN** 命令创建包含 `schema`、`optimization`、`apply` 与 `git` 默认节点的 config 文件
- **AND** 不写入退役的 git 字段（`git.autoCommit`、`commitMessage.convention` 等）

#### Scenario: 缺失嵌套默认值补齐

- **WHEN** config 包含部分用户值且缺少 `optimization.directionLimit` 或 `optimization.directionRetries` 等默认值
- **THEN** 命令保留用户值并补齐缺失默认值
