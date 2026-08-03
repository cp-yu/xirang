---
entity: element-declaration
identity: global-config
kind: element
parent: project-config-management
title: Global Config
definition: Global Config 定义用户级全局配置的解析、读取与写入行为：遵循 XDG Base Directory 与平台回退、schema 演进合并、退役配置表面（profile、workflows、delivery、Propose routing）的静默过滤。
---

## Requirements

### Requirement: Global configuration storage
系统 SHALL 按平台规范目录存储全局配置，包括 telemetry state 的 `anonymousId` 与 `noticeSeen` 字段。

#### Scenario: Initial config creation
- **WHEN** 不存在全局配置文件且即将发送第一个 telemetry event
- **THEN** 系统创建全局配置文件并写入 telemetry 配置

#### Scenario: Existing config preservation
- **WHEN** 向既有配置文件添加 telemetry 字段
- **THEN** 系统保留全部既有配置字段
#### Scenario: Telemetry config structure
- **WHEN** reading or writing telemetry configuration
- **THEN** the config contains a `telemetry` object with `anonymousId` (string UUID) and `noticeSeen` (boolean) fields
#### Scenario: Config file format
- **WHEN** storing configuration
- **THEN** the system writes valid JSON that can be read and modified by users
### Requirement: Global Config Directory Path

系统 SHALL 遵循 XDG Base Directory Specification 与平台回退解析全局配置目录。

#### Scenario: Unix/macOS with XDG_CONFIG_HOME set
- **WHEN** `$XDG_CONFIG_HOME` 指向自定义路径
- **THEN** `getGlobalConfigDir()` 返回该路径下的配置目录

#### Scenario: Windows platform
- **WHEN** 平台为 Windows 且设置了 `%APPDATA%`
- **THEN** `getGlobalConfigDir()` 返回 `%APPDATA%` 下的配置目录
#### Scenario: Unix/macOS without XDG_CONFIG_HOME
- **WHEN** `$XDG_CONFIG_HOME` environment variable is not set
- **AND** the platform is Unix or macOS
- **THEN** `getGlobalConfigDir()` returns `~/.config/xirang` (expanded to absolute path)
### Requirement: Global Config Loading

系统 SHALL 从配置目录加载全局配置，并在配置文件缺失或不可解析时提供合理默认值。

#### Scenario: Config file does not exist
- **WHEN** 配置目录中不存在配置文件
- **THEN** `getGlobalConfig()` 返回默认配置且不创建文件

#### Scenario: Config file is invalid JSON
- **WHEN** 配置文件存在但包含非法 JSON
- **THEN** `getGlobalConfig()` 返回默认配置并记录警告到 stderr
#### Scenario: Config file exists and is valid
- **WHEN** `config.json` exists in the global config directory
- **AND** the file contains valid JSON matching the config schema
- **THEN** `getGlobalConfig()` returns the parsed configuration
### Requirement: Global Config Saving

系统 SHALL 将全局配置保存到配置目录，并在目录不存在时创建它。

#### Scenario: Save config to new directory
- **WHEN** 调用保存函数且全局配置目录不存在
- **THEN** 创建目录
- **AND** 写入包含提供配置的配置文件

#### Scenario: Save config to existing directory
- **WHEN** 调用保存函数且全局配置目录已存在
- **THEN** 写入配置文件（存在则覆盖）

### Requirement: Default Configuration

系统 SHALL 提供无配置文件时使用的默认配置。

#### Scenario: Default config structure
- **WHEN** 不存在配置文件
- **THEN** 默认配置包含空的 `featureFlags` 对象
#### Scenario: 默认配置值
- **WHEN** 首次创建全局配置
- **THEN** 默认值 SHALL 包含 `featureFlags: {}`
- **AND** 默认值 SHALL NOT 包含 `delivery`
### Requirement: Config Schema Evolution

系统 SHALL 将加载的配置与默认值合并，确保加载旧配置文件时新字段可用。

#### Scenario: Config file missing new fields
- **WHEN** 配置文件存在但缺少当前 schema 的新字段
- **THEN** `getGlobalConfig()` 返回合并默认值后的配置
- **AND** 已存在字段的加载值优先于默认值

#### Scenario: Config file has extra unknown fields
- **WHEN** 配置文件包含当前 schema 之外的字段
- **THEN** 未知字段被保留在返回配置中且不报错

### Requirement: 简化的全局配置结构

全局配置 SHALL 存储用户级别的设置，不包含 profile、workflows 或 delivery 字段。

#### Scenario: 配置文件结构

- **WHEN** 读取全局配置
- **THEN** 配置结构 SHALL 包含 `featureFlags` 功能开关对象
- **AND** SHALL NOT 包含 `profile`、`workflows` 或 `delivery` 字段

#### Scenario: 读取包含过时字段的配置

- **WHEN** 配置文件包含 `profile`、`workflows` 或 `delivery` 字段
- **THEN** 系统 SHALL 忽略这些字段
- **AND** 输出警告消息建议运行 `xirang update` 清理
#### Scenario: 无 profile 配置
- **WHEN** 系统初始化或更新工作流
- **THEN** 系统 SHALL 固定使用全部 WorkflowManifestRegistry entries
- **AND** 系统 SHALL NOT 读取或解析 profile 配置
- **AND** src/core/profiles.ts 文件 SHALL NOT 存在
#### Scenario: Profile 相关函数不存在
- **WHEN** 代码尝试导入 profile 相关函数
- **THEN** getProfileWorkflows 函数 SHALL NOT 存在
- **AND** CORE_WORKFLOWS 常量 SHALL NOT 存在
- **AND** EXPANDED_WORKFLOWS 常量 SHALL NOT 存在
### Requirement: Global config 静默过滤退役的 Propose routing 配置

Global config loader SHALL 从返回配置和默认配置中移除 `propose.smartRouting`、`propose.requireExplore` 与顶层 `propose` routing 节点。已有磁盘配置中的该节点 SHALL 被静默忽略，不得产生 warning。

#### Scenario: 旧 global Propose 节点静默忽略
- **WHEN** 全局配置文件包含 Propose routing 节点
- **THEN** `getGlobalConfig()` SHALL NOT 返回 `propose`
- **AND** SHALL NOT 输出 warning
- **AND** SHALL 保留其他合法和未知字段
#### Scenario: 默认配置不再包含 Propose routing
- **WHEN** global config 不存在或执行 config reset
- **THEN** default global config SHALL NOT 包含 `propose`
