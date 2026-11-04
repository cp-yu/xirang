---
entity: element-declaration
identity: global-config
kind: element
parent: project-config-management
title: Global Config
definition: Global Config 定义用户级全局配置的解析、读取与写入行为：遵循 XDG Base Directory 与平台回退、schema 演进合并、退役配置表面（profile、workflows、delivery、Propose routing）的静默过滤。
---

## Specification

### Section: Global configuration storage

系统 SHALL 按平台规范目录存储全局配置，包括 telemetry state 的 `anonymousId` 与 `noticeSeen` 字段。

- **Initial config creation**
  - 不存在全局配置文件且即将发送第一个 telemetry event
  - 系统创建全局配置文件并写入 telemetry 配置

- **Existing config preservation**
  - 向既有配置文件添加 telemetry 字段
  - 系统保留全部既有配置字段

- **Telemetry config structure**
  - reading or writing telemetry configuration
  - the config contains a `telemetry` object with `anonymousId` (string UUID) and `noticeSeen` (boolean) fields

- **Config file format**
  - storing configuration
  - the system writes valid JSON that can be read and modified by users

### Section: Global Config Directory Path

系统 SHALL 遵循 XDG Base Directory Specification 与平台回退解析全局配置目录。

- **Unix/macOS with XDG_CONFIG_HOME set**
  - `$XDG_CONFIG_HOME` 指向自定义路径
  - `getGlobalConfigDir()` 返回该路径下的配置目录

- **Windows platform**
  - 平台为 Windows 且设置了 `%APPDATA%`
  - `getGlobalConfigDir()` 返回 `%APPDATA%` 下的配置目录

- **Unix/macOS without XDG_CONFIG_HOME**
  - `$XDG_CONFIG_HOME` environment variable is not set
  - the platform is Unix or macOS
  - `getGlobalConfigDir()` returns `~/.config/xirang` (expanded to absolute path)

### Section: Global Config Loading

系统 SHALL 从配置目录加载全局配置，并在配置文件缺失或不可解析时提供合理默认值。

- **Config file does not exist**
  - 配置目录中不存在配置文件
  - `getGlobalConfig()` 返回默认配置且不创建文件

- **Config file is invalid JSON**
  - 配置文件存在但包含非法 JSON
  - `getGlobalConfig()` 返回默认配置并记录警告到 stderr

- **Config file exists and is valid**
  - `config.json` exists in the global config directory
  - the file contains valid JSON matching the config schema
  - `getGlobalConfig()` returns the parsed configuration

### Section: Global Config Saving

系统 SHALL 将全局配置保存到配置目录，并在目录不存在时创建它。

- **Save config to new directory**
  - 调用保存函数且全局配置目录不存在
  - 创建目录
  - 写入包含提供配置的配置文件

- **Save config to existing directory**
  - 调用保存函数且全局配置目录已存在
  - 写入配置文件（存在则覆盖）

### Section: Default Configuration

系统 SHALL 提供无配置文件时使用的默认配置。

- **Default config structure**
  - 不存在配置文件
  - 默认配置包含空的 `featureFlags` 对象

- **默认配置值**
  - 首次创建全局配置
  - 默认值 SHALL 包含 `featureFlags: {}`
  - 默认值 SHALL NOT 包含 `delivery`

全局 optimization 默认 SHALL 仅包含 enabled: true，不产生 directionLimit、directionRetries 或 minImpactLevel。

### Section: Config Schema Evolution

系统 SHALL 将加载的配置与默认值合并，确保加载旧配置文件时新字段可用。

- **Config file missing new fields**
  - 配置文件存在但缺少当前 schema 的新字段
  - `getGlobalConfig()` 返回合并默认值后的配置
  - 已存在字段的加载值优先于默认值

- **Config file has extra unknown fields**
  - 配置文件包含当前 schema 之外的字段
  - 未知字段被保留在返回配置中且不报错

已明确退役的 optimization.directionLimit、optimization.directionRetries、optimization.minImpactLevel SHALL 不按未知字段保留为有效配置；读取时输出字段级明确诊断，不静默作为新控制，不自动改写磁盘，其余字段保持既有合并规则。

### Section: 简化的全局配置结构

全局配置 SHALL 存储用户级别的设置，不包含 profile、workflows 或 delivery 字段。

- **配置文件结构**

  - 读取全局配置
  - 配置结构 SHALL 包含 `featureFlags` 功能开关对象
  - SHALL NOT 包含 `profile`、`workflows` 或 `delivery` 字段

- **读取包含过时字段的配置**

  - 配置文件包含 `profile`、`workflows` 或 `delivery` 字段
  - 系统 SHALL 忽略这些字段
  - 输出警告消息建议运行 `xirang update` 清理

- **无 profile 配置**
  - 系统初始化或更新工作流
  - 系统 SHALL 固定使用全部 WorkflowManifestRegistry entries
  - 系统 SHALL NOT 读取或解析 profile 配置
  - src/core/profiles.ts 文件 SHALL NOT 存在

- **Profile 相关函数不存在**
  - 代码尝试导入 profile 相关函数
  - getProfileWorkflows 函数 SHALL NOT 存在
  - CORE_WORKFLOWS 常量 SHALL NOT 存在
  - EXPANDED_WORKFLOWS 常量 SHALL NOT 存在

### Section: Global config 静默过滤退役的 Propose routing 配置

Global config loader SHALL 从返回配置和默认配置中移除 `propose.smartRouting`、`propose.requireExplore` 与顶层 `propose` routing 节点。已有磁盘配置中的该节点 SHALL 被静默忽略，不得产生 warning。

- **旧 global Propose 节点静默忽略**
  - 全局配置文件包含 Propose routing 节点
  - `getGlobalConfig()` SHALL NOT 返回 `propose`
  - SHALL NOT 输出 warning
  - SHALL 保留其他合法和未知字段

- **默认配置不再包含 Propose routing**
  - global config 不存在或执行 config reset
  - default global config SHALL NOT 包含 `propose`

### Section: 诊断退役优化配置

optimization.directionLimit、optimization.directionRetries 与 optimization.minImpactLevel SHALL 不进入有效配置、默认值或投影；读取残留值时给出字段级明确退役诊断，不静默解释为新控制、不改写磁盘配置或自动迁移，其余有效字段按既有规则处理。optimization.enabled 保留默认 true。 config 设置退役键 SHALL 返回明确诊断，不写入或自动迁移为其他控制。
