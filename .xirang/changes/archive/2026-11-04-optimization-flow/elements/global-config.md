---
entity: "element-declaration"
identity: "global-config"
kind: "element"
parent: "project-config-management"
title: "Global Config"
definition: "Global Config 定义用户级全局配置的解析、读取与写入行为：遵循 XDG Base Directory 与平台回退、schema 演进合并、退役配置表面（profile、workflows、delivery、Propose routing）的静默过滤。"
---

## MODIFIED Sections

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

## ADDED Sections

### Section: 诊断退役优化配置

optimization.directionLimit、optimization.directionRetries 与 optimization.minImpactLevel SHALL 不进入有效配置、默认值或投影；读取残留值时给出字段级明确退役诊断，不静默解释为新控制、不改写磁盘配置或自动迁移，其余有效字段按既有规则处理。optimization.enabled 保留默认 true。 config 设置退役键 SHALL 返回明确诊断，不写入或自动迁移为其他控制。
