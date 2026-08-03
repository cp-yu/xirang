---
entity: element-declaration
identity: apply-default-isolation
kind: element
parent: project-config-management
title: Apply Default Isolation
definition: "Apply Default Isolation 定义项目配置默认物化契约中 `apply.defaultIsolation: ask` 的功能性默认值：在磁盘输出与 missing-only 迁移中包含该默认值，并保留用户既有值。"
---

## Requirements

### Requirement: Apply default isolation SHALL be materialized in project config defaults

项目配置默认物化契约 SHALL 包含 `apply.defaultIsolation: ask` 作为 runtime-consumed functional default。

#### Scenario: Materialized defaults include apply default isolation

- **WHEN** project config defaults are materialized for disk output
- **THEN** materialized defaults SHALL 包含 `apply.defaultIsolation: ask`
- **AND** SHALL 保留既有 `optimization` 与 `git` defaults
- **AND** SHALL NOT 添加 `propose`

#### Scenario: Missing-only migration adds apply default isolation

- **WHEN** 既有 `.xirang/config.yaml` 或 `.xirang/config.yml` 缺少 `apply.defaultIsolation`
- **AND** 用户运行 `xirang update`
- **THEN** migration SHALL 添加 `apply.defaultIsolation: ask`
- **AND** SHALL 保留既有用户字段

#### Scenario: Missing-only migration preserves existing apply default isolation

- **WHEN** 既有项目配置包含 `apply.defaultIsolation: worktree`
- **AND** 用户运行 `xirang update`
- **THEN** migration SHALL 保留 `apply.defaultIsolation: worktree`
- **AND** SHALL NOT 将其替换为 `ask`

#### Scenario: Config path handling remains cross-platform

- **WHEN** default materialization 在 Windows、macOS 或 Linux 读写项目配置
- **THEN** SHALL 使用 Node.js path utilities 构建配置路径
- **AND** SHALL 保留 `.yaml` 优先与 `.yml` 回退行为
