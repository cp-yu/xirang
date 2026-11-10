---
operation: MODIFIED
entity: element-declaration
identity: project-config-management
kind: element
parent: project-tooling-configuration
title: "项目配置管理"
definition: "项目配置管理是 CLI 中读取和管理息壤项目配置的能力。它加载并校验 .xirang/config.yaml 及 .yml 别名，维护用户级配置和默认值物化，向 CLI、运行时与工作流提供统一有效配置；工作流的静态遵循规则由共享指导承载，不由配置查询重复生成提示词。"
---

## MODIFIED Sections

### Section: 编译配置投影

系统 SHALL 通过统一加载与归一化提供有效项目配置，供 CLI 查询、运行时消费者和工作流共享。RuntimeProjection SHALL 保留运行时所需语义；Agent 通过 config project 获取数据，并按共享 skill/reference 的语言、canonical tokens、context、rules 及 surface 适用规则执行，不在每次查询中重复生成提示词。

相同配置下多个 surface 的适用语义 SHALL 一致，不通过 raw config 重新解释。下一次查询 SHALL 反映磁盘修改，不因旧投影缓存而继续返回旧规则。
