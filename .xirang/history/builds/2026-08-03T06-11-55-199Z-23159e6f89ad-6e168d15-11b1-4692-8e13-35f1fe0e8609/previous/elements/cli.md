---
entity: element-declaration
identity: cli
kind: domain
parent: interaction-surfaces
title: CLI
definition: 息壤的项目配置与确定性操作界面。
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

### Requirement: 提供 model-driven authoring help

`xirang help authoring semantic-delta` SHALL 从当前项目 Semantic Model 的 Metamodel 只读投影 Relationship Kinds，SHALL NOT 维护代码内置默认 relationship kinds 或预设 relationship entries。

#### Scenario: Relationship Kinds 来自当前 Metamodel

- **WHEN** 用户运行 `xirang help authoring semantic-delta`
- **THEN** output SHALL 列出当前 `.xirang/model/metamodel/` 声明的全部 Relationship Kinds
- **AND** SHALL NOT 包含当前 Metamodel 未声明的 Kind

#### Scenario: 同时指导 Relationship 与 Relationship Kind 新增

- **WHEN** help 渲染 authoring 指导
- **THEN** output SHALL 包含新增 Relationship 的占位语法
- **AND** SHALL 包含新增 Relationship Kind 的占位语法
- **AND** SHALL NOT 输出预设的 Relationship entries 或伪 Element identities

#### Scenario: 端点约束区分缺失与显式空

- **WHEN** Relationship Kind 的 `sourceKinds` 或 `targetKinds` 缺失
- **THEN** help SHALL 显示为 unrestricted
- **WHEN** Relationship Kind 的 `sourceKinds` 或 `targetKinds` 为显式空数组
- **THEN** help SHALL 显示为不允许任何 Element Kind
- **AND** 两种语义 SHALL NOT 合并为同一显示

#### Scenario: Kind body 原样输出

- **WHEN** Relationship Kind 声明了非空 body
- **THEN** help SHALL 原样输出该 body
- **AND** SHALL NOT 由 CLI 补写、摘要或改写其语义

#### Scenario: 缺失或空 Semantic Model 被拒绝

- **WHEN** 当前项目缺少 `.xirang/model/` 或该目录存在但无任何 Element Kind 与 Element
- **THEN** help SHALL 报告 Semantic Model unavailable 而非显示空 Kind 列表

#### Scenario: 语义无效 Semantic Model 被拒绝

- **WHEN** 当前 Semantic Model 存在 ERROR 级别 semantic diagnostic
- **THEN** help SHALL 报告该 diagnostic 而非基于无效模型生成输出

#### Scenario: Authoring help JSON 返回 Metamodel 声明

- **WHEN** 用户运行 `xirang help authoring semantic-delta --json`
- **THEN** stdout SHALL be valid JSON with `file`, `definition`, `relationshipDelta` 和 `relationshipKinds`
- **AND** `relationshipKinds` SHALL 包含当前 Metamodel 声明的 Kind identity、可选 endpoint constraints 与 body
- **AND** SHALL NOT 包含名为 `relations` 的虚构 Relationship entries 属性
