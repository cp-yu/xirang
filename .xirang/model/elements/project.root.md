---
entity: element-declaration
identity: project.root
kind: project
parent: null
title: 息壤（Xirang）
definition: 面向 Agent、以结构化用户意图驱动项目构建与持续演进的开发框架。它包含表达项目应该是什么的 Semantic Model、承载新的演进意图的 Change，以及负责落实这些意图的 Realization；三者共同使 Agent 能够基于统一的项目认知完成需求探索、方案形成、代码实现、独立审查和变更收束。
---

## Requirements

### Requirement: 以用户意图驱动项目演进
息壤 SHALL 以 Semantic Model 表达用户意图，以 Change 承载新的演进意图，并通过 Realization 落实项目构建与变更。

#### Scenario: 推进项目演进
- **WHEN** 用户表达项目目标或新的变更意图
- **THEN** Agent 依据相应 Semantic Model 或 Change 推进 Realization

### Requirement: 保留用户授权
息壤 SHALL 由用户保留意图确认和无法由语义与项目证据确定之决策的授权权力。

#### Scenario: 遇到未决语义
- **WHEN** 目标层级、契约或关系无法从权威依据确定
- **THEN** Agent 请求用户裁决而不自行猜测

### Requirement: 表达项目意图与范围
息壤 SHALL 让用户表达项目行为、架构意图、所有权、边界与语义协作，构成 Agent 可在不发明重大决策的前提下编译的模型。

#### Scenario: Agent 编译一个 Change
- **WHEN** Agent 探索、提议、实现、验证、同步或归档一个 Change
- **THEN** 它 SHALL 将模型分区与 Element Contracts 视为同一个 Xirang Semantic Model 的组成来源
- **AND** SHALL 只把实现代码用作当前证据

### Requirement: 保持稳定成功标准
息壤 SHALL 提供稳定的 CLI 与生成的 Agent 工作流表面，保留 Explore → Propose → Apply → Verify → Sync → Archive 生命周期，校验 Semantic Delta，并仅在证据支撑的审查后提升 source。

#### Scenario: Change 达到稳态
- **WHEN** 一个 Change 完成
- **THEN** 其外部可观察行为 SHALL 由 Element-owned Contracts 表达
- **AND** 其架构意图 SHALL 由稳定 Elements、refinement containment 与类型化语义关系表达
- **AND** validation SHALL 在提升前检测不完整或矛盾的 source

### Requirement: 维护全局语义不变量
Project Root SHALL 唯一；每个非根 Element SHALL 恰有一个 parent；稳定 Element identity SHALL 独立于 containment path；每个 Element Contract SHALL 有一个显式 owner Element；contract required 的 Elements SHALL 具有真实契约。

#### Scenario: source 不完整
- **WHEN** 绑定、层级决策、契约、关系端点或必需策略无法从授权 source 确定
- **THEN** 息壤 SHALL 报告审查缺口
- **AND** SHALL NOT 从文件名、imports、calls、source 布局、文本相似性或 catch-all owner 推断该决策

### Requirement: 独立产品与持久工作区
息壤 SHALL 通过唯一 `xirang` CLI 与 `.xirang` workspace 独立运行。Setup、Project Build、Candidate、formal source 与 history SHALL 具有明确边界，且不得存在 migration 或 history fallback semantic stores。

#### Scenario: 项目 setup 或 build
- **WHEN** 息壤创建 setup skeleton 或 Agent 构建 Candidate
- **THEN** generated workflows SHALL 使用当前 Xirang identity 和统一 Semantic Model
- **AND** retired bootstrap/migration workspaces SHALL 仅归档为 history evidence
- **AND** runtime SHALL NOT 消费这些 retired inputs

### Requirement: 证据门禁的源提升
Candidate 模型与本次用户要求 SHALL 在 `.xirang/candidate/` 中保持隔离，直到记法、identities、policies、relationships、平台行为与 rollback path 通过 validation，且用户明确授权当前 `reviewDigest`。

#### Scenario: Candidate 有未解决缺口
- **WHEN** required validation 或 human decision 缺失
- **THEN** formal `.xirang/model/` SHALL 保持不变

#### Scenario: 用户确认后 Candidate 改变
- **WHEN** `build.md` 或 Candidate source 在用户确认后发生变化
- **THEN** prior authorization SHALL 失效
- **AND** promotion SHALL 要求新的 valid `reviewDigest`

#### Scenario: Promotion 成功
- **WHEN** confirmed digest 仍新鲜且原子转换完成
- **THEN** formal `.xirang/model/` SHALL 被完整替换
- **AND** previous formal source SHALL 保存在 `.xirang/history/`
