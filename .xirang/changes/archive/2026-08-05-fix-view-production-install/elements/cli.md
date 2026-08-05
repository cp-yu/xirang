---
entity: element-declaration
identity: cli
kind: element
parent: interaction-surfaces
title: CLI
definition: CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
---

## ADDED Requirements

### Requirement: 从已安装运行时启动嵌入式 LikeC4

`xirang view` SHALL 在缺少 LikeC4 workspace 源码的部署安装中从随包发布的 LikeC4 dist 启动嵌入式浏览器服务，且 SHALL NOT 因缺少 workspace 源码或 tsx 而失败；在包含 LikeC4 workspace 源码的开发环境中，CLI SHALL 在任一 CLI runtime 包的源码新于其 dist 产物时以 tsx 从源码运行，否则 SHALL 使用 dist。

#### Scenario: 生产安装后启动浏览器服务

- **WHEN** 用户通过 `scripts/build_and_install.sh` 全局安装 xirang 后运行 `xirang view`
- **THEN** CLI 从随包部署的 LikeC4 dist 启动嵌入式浏览器服务
- **AND** 不因缺少 workspace 源码或 tsx 而失败

#### Scenario: 开发环境 dist 陈旧回退源码

- **WHEN** 开发环境中任一 CLI runtime 包的源码新于其 dist 产物
- **THEN** CLI 以 tsx 从源码运行
- **AND** 输出重建生产构建的提示

#### Scenario: 开发环境 dist 同步使用构建产物

- **WHEN** 开发环境中所有 CLI runtime 包的 dist 产物均不陈旧
- **THEN** CLI 使用 dist 运行
