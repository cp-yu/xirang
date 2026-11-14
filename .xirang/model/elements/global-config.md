---
entity: element-declaration
identity: global-config
kind: capability-specification
parent: project-config-management
title: 全局工具配置
definition: 全局工具配置是用户环境中工具级设置的存储与访问契约。它独立承载平台配置目录、JSON 读取与保存、功能开关和 telemetry 状态、默认合并及输入过滤；它不承载项目开发偏好，不决定项目工作流成员或 Agent 的优化取舍。
---

## Specification

### Section: Scope and Non-goals

全局工具配置 SHALL 管理用户环境中的工具级 JSON 设置、功能开关及 telemetry 状态，提供平台路径、读取、保存和默认合并。项目开发偏好由项目配置表达，全局设置不决定项目工作流成员或 Agent 的优化取舍。

### Section: Business Logic

全局配置 SHALL 使用平台规范目录：Unix/macOS 设置 XDG_CONFIG_HOME 时使用其下配置目录，未设置时使用 ~/.config/xirang；Windows 使用 APPDATA 下配置目录。物理路径通过平台路径解析。

配置 SHALL 以用户可读写的有效 JSON 保存。读取保留合法值，缺失字段与默认值合并；已配置值优先，普通未知字段保留。默认配置为 featureFlags: {}。保存时创建所需目录并写入提供的配置；首次 telemetry event 需要记录状态时可创建全局文件，telemetry 包含 anonymousId（字符串 UUID）和 noticeSeen（布尔值），追加时保留其他设置。

加载 SHALL 忽略 profile、workflows、delivery、propose、optimization 及子项，不将其参与默认合并或未知字段保留；读取不改写磁盘。前三者给出可操作警告，propose 静默忽略。对 optimization 节点及子键的设置请求给出诊断且不写入，允许未知字段的选项不改变该结果。

### Section: Edge Cases and Exception Handling

全局读取 SHALL 在文件缺失时返回默认值且不创建文件；JSON 无法解析时向 stderr 报告原因并返回默认值。普通未知字段不构成读取错误，但明确忽略的输入不作为未知字段保留。创建全局文件的保存、editor 或 telemetry 操作不授予创建项目配置的权限。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 平台目录

Unix/macOS 未设 XDG_CONFIG_HOME 时读取 ~/.config/xirang/config.json；设置该变量时使用其指定目录，Windows 使用 APPDATA 的配置目录。

#### Acceptance Case: 缺失与损坏

全局配置不存在时读取返回 featureFlags: {}，文件仍不存在；非法 JSON 时返回默认值并在 stderr 交付警告。

#### Acceptance Case: 合并与未知字段

全局 JSON 中已有合法值和普通未知字段：加载保留它们并补缺失默认值；optimization 不出现在有效结果，原文件未改写。

#### Acceptance Case: Telemetry 保存

首次 event 需要记录 telemetry 时创建所需目录和有效 JSON；写入 UUID anonymousId 与布尔 noticeSeen，同时保留已有其他设置。
