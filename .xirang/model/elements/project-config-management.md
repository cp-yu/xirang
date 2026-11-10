---
entity: element-declaration
identity: project-config-management
kind: element
parent: project-tooling-configuration
title: 项目配置管理
definition: 项目配置管理是 CLI 中读取和管理息壤项目配置的能力。它加载并校验 .xirang/config.yaml 及 .yml 别名，维护用户级配置和默认值物化，向 CLI、运行时与工作流提供统一有效配置；工作流的静态遵循规则由共享指导承载，不由配置查询重复生成提示词。
---

## Specification

### Section: 加载项目配置

系统 SHALL 读取并解析位于 `.xirang/config.yaml` 的项目配置文件，支持 `.yml` 扩展别名，并对缺失、非法 YAML 或 schema 校验失败提供安全回退。

- **有效配置存在**

  - `.xirang/config.yaml` 存在且包含有效 YAML 内容
  - 系统解析文件并返回 ProjectConfig 对象

- **配置缺失或无效**

  - `.xirang/config.yaml` 不存在，或包含格式错误 YAML、schema 校验失败
  - 系统记录警告并返回安全回退值，不拒绝工作流

### Section: 字段级弹性解析

系统 SHALL 逐字段解析配置，收集有效字段并对无效字段告警，而不整体拒绝配置。

- **单个字段无效**

  - 配置中某个字段类型或取值无效
  - 系统记录该字段警告，其他有效字段仍被返回

### Section: 管理全局配置

系统 SHALL 按照平台规范的全局配置目录存储用户级配置，并以 schema 演进规则保证前后兼容。

- **全局配置缺失**

  - 全局配置文件不存在
  - 加载器返回默认配置且不创建文件

- **旧字段合并**

  - 配置文件缺少当前 schema 新增字段
  - 返回配置合并默认值且未知字段被保留

### Section: 排除退役配置表面

全局与项目配置 SHALL NOT 包含 profile、workflows、delivery 或 Propose routing 等已退役配置节点。

- **读取包含过时字段的配置**

  - 配置文件包含 `profile`、`workflows`、`delivery` 或 `propose` 字段
  - 系统忽略这些字段并输出可操作警告（Propose 节点静默忽略）

优化配置 SHALL 只保留 enabled 控制；directionLimit、directionRetries、minImpactLevel 不进入有效配置、默认值或投影，残留键给出明确诊断，不静默解释或自动迁移/删除用户配置。该规则不改变其他节点既有回退或静默忽略语义。

### Section: 编译配置投影

系统 SHALL 通过统一加载与归一化提供有效项目配置，供 CLI 查询、运行时消费者和工作流共享。RuntimeProjection SHALL 保留运行时所需语义；Agent 通过 config project 获取数据，并按共享 skill/reference 的语言、canonical tokens、context、rules 及 surface 适用规则执行，不在每次查询中重复生成提示词。

相同配置下多个 surface 的适用语义 SHALL 一致，不通过 raw config 重新解释。下一次查询 SHALL 反映磁盘修改，不因旧投影缓存而继续返回旧规则。
