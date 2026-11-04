---
entity: "element-declaration"
identity: "project-config-management"
kind: "element"
parent: "project-tooling-configuration"
title: "项目配置管理"
definition: "项目配置管理是 CLI 中读取和管理息壤项目配置的能力。它加载并校验 `.xirang/config.yaml`（含 `.yml` 别名）、维护用户级全局配置，管理配置默认值物化，并将配置编译为各 workflow surface 消费的 prompt/runtime projection。"
---

## MODIFIED Sections

### Section: 排除退役配置表面

全局与项目配置 SHALL NOT 包含 profile、workflows、delivery 或 Propose routing 等已退役配置节点。

- **读取包含过时字段的配置**

  - 配置文件包含 `profile`、`workflows`、`delivery` 或 `propose` 字段
  - 系统忽略这些字段并输出可操作警告（Propose 节点静默忽略）

优化配置 SHALL 只保留 enabled 控制；directionLimit、directionRetries、minImpactLevel 不进入有效配置、默认值或投影，残留键给出明确诊断，不静默解释或自动迁移/删除用户配置。该规则不改变其他节点既有回退或静默忽略语义。
