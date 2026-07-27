---
entity: element-declaration
identity: cli
kind: domain
parent: interaction-surfaces
title: "CLI"
summary: "息壤的项目配置与确定性操作界面。"
---

## Requirements

### Requirement: 提供一致可复现的操作
CLI SHALL 管理工作区、项目配置与 Agent 工具集成，并为 Realization 提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化和原子状态转换。

#### Scenario: Agent 执行确定性操作

- **WHEN** Agent 需要查询、校验、同步、提升或归档
- **THEN** CLI 对相同有效输入产生一致结果，并以明确失败语义拒绝无效操作

### Requirement: 保持 Agent 与 CLI 职责分离

CLI SHALL 负责可确定性复现的操作，SHALL NOT 替代用户授权或 Agent、Reviewer、Optimizer 的语义判断。

#### Scenario: 操作需要目标语义决策

- **WHEN** 输入不足以唯一决定目标层级或行为
- **THEN** CLI 报告问题而不创作或规范化语义

### Requirement: 配置 Semantic Browser 监听地址

`xirang view` SHALL 接受可选 `--listen <address>` 并将该地址传递给嵌入式 LikeC4 服务；未提供该参数时 SHALL 保持 LikeC4 的默认本地监听策略。

#### Scenario: 从 Windows 访问 WSL 浏览服务

- **WHEN** 用户在 WSL 中运行 `xirang view --listen 0.0.0.0 --port 61000`
- **THEN** CLI 在启动前重新生成 LikeC4 缓存，并使服务监听 `0.0.0.0:61000` 以供 Windows 通过转发地址访问

#### Scenario: 未显式开放网络接口

- **WHEN** 用户运行 `xirang view` 且未提供 `--listen`
- **THEN** CLI 不注入监听地址并保留 LikeC4 默认绑定行为
