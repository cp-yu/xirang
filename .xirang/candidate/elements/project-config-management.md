---
entity: element-declaration
identity: project-config-management
kind: capability
parent: project-tooling-configuration
title: 项目配置管理
definition: 项目配置管理是 CLI 中读取和管理息壤项目配置的能力。它加载并校验 `.xirang/config.yaml`（含 `.yml` 别名）、维护用户级全局配置，管理配置默认值物化，并将配置编译为各 workflow surface 消费的 prompt/runtime projection。
---

## Requirements

### Requirement: 加载项目配置

系统 SHALL 读取并解析位于 `.xirang/config.yaml` 的项目配置文件，支持 `.yml` 扩展别名，并对缺失、非法 YAML 或 schema 校验失败提供安全回退。

#### Scenario: 有效配置存在

- **WHEN** `.xirang/config.yaml` 存在且包含有效 YAML 内容
- **THEN** 系统解析文件并返回 ProjectConfig 对象

#### Scenario: 配置缺失或无效

- **WHEN** `.xirang/config.yaml` 不存在，或包含格式错误 YAML、schema 校验失败
- **THEN** 系统记录警告并返回安全回退值，不拒绝工作流

### Requirement: 字段级弹性解析

系统 SHALL 逐字段解析配置，收集有效字段并对无效字段告警，而不整体拒绝配置。

#### Scenario: 单个字段无效

- **WHEN** 配置中某个字段类型或取值无效
- **THEN** 系统记录该字段警告，其他有效字段仍被返回

### Requirement: 管理全局配置

系统 SHALL 按照平台规范的全局配置目录存储用户级配置，并以 schema 演进规则保证前后兼容。

#### Scenario: 全局配置缺失

- **WHEN** 全局配置文件不存在
- **THEN** 加载器返回默认配置且不创建文件

#### Scenario: 旧字段合并

- **WHEN** 配置文件缺少当前 schema 新增字段
- **THEN** 返回配置合并默认值且未知字段被保留

### Requirement: 排除退役配置表面

全局与项目配置 SHALL NOT 包含 profile、workflows、delivery 或 Propose routing 等已退役配置节点。

#### Scenario: 读取包含过时字段的配置

- **WHEN** 配置文件包含 `profile`、`workflows`、`delivery` 或 `propose` 字段
- **THEN** 系统忽略这些字段并输出可操作警告（Propose 节点静默忽略）

### Requirement: 编译配置投影

系统 SHALL 将项目配置编译为 prompt/runtime projections，供所有会创建或改写制品的工作流 surface 共享同一份 normalized config、compiled fragments 与 canonical token policy。

#### Scenario: 多个 surface 消费同一投影

- **WHEN** 多个 workflow surface 在相同 config 下为同一 artifact 消费 projection
- **THEN** projection 内容对每个消费者的语义相同，且消费者不通过读取 raw config 重新解释
