---
entity: element-declaration
identity: cli
kind: element
parent: interaction-surfaces
title: CLI
definition: CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
---

## ADDED Requirements

### Requirement: 配置 Web 监听地址

`xirang view` SHALL 接受可选 `--listen <address>` 并将该地址传递给嵌入式 LikeC4 服务；未提供该参数时 SHALL 保持 LikeC4 的默认本地监听策略。

#### Scenario: 从 Windows 访问 WSL 浏览服务

- **WHEN** 用户在 WSL 中运行 `xirang view --listen 0.0.0.0 --port 61000`
- **THEN** CLI 在启动前重新生成 LikeC4 缓存，并使服务监听 `0.0.0.0:61000` 以供 Windows 通过转发地址访问

#### Scenario: 未显式开放网络接口

- **WHEN** 用户运行 `xirang view` 且未提供 `--listen`
- **THEN** CLI 不注入监听地址并保留 LikeC4 默认绑定行为

#### Scenario: 自定义端口

- **WHEN** 用户运行 `xirang view --port 8080`
- **THEN** CLI 在端口 8080 启动浏览器服务
- **AND** 输出服务器地址 `http://localhost:8080`

## REMOVED Requirements

### Requirement: 配置 Semantic Browser 监听地址
