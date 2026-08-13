---
entity: element-declaration
identity: skill-generation
kind: element
parent: agent-workbench-projection
title: Skill Generation
definition: Skill Generation 定义共享 skill 片段与 frontmatter 的生成契约：`XIRANG_PHILOSOPHY` 共享片段注入 workflow skills 与 internal subagents，以及生成的 skill frontmatter 必须是合法 YAML。
---

## MODIFIED Requirements

### Requirement: Xirang Philosophy 片段定义

系统 SHALL 在共享片段常量中提供 `XIRANG_PHILOSOPHY` 共享片段。该片段 SHALL 以英文书写，不受 prose language projection 管辖，并 SHALL 只表达项目定义：Xirang 是可被 Agent 编译的 human intent 的结构化表述；Semantic Model 是唯一权威语义，由模型分区与 Element-owned Contract modules 共同构成；Change 将 Semantic Delta reconcile 到 target steady state，proposal/design/tasks 是 compilation scaffolding；模型只有在 Agent 无需猜测影响 hierarchy、contracts 或 relationships 的决策时才完整；Agent 执行类似 compiler 的操作，现有代码是 current implementation evidence。

#### Scenario: 片段定义统一 Semantic Model

- **WHEN** `XIRANG_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 Xirang 是可被 Agent 编译的 human intent 的结构化表述
- **AND** SHALL 声明模型分区与 Element-owned Contracts 共同组成一个 Semantic Model
- **AND** MUST NOT 使用双源作为核心定义

#### Scenario: 片段定义 completeness 与 Agent compiler 类比

- **WHEN** model 缺少会改变 hierarchy、contracts 或 relationships 的决策
- **THEN** 文本 SHALL 说明 Semantic Model 尚不完整
- **AND** SHALL 禁止 Agent 通过猜测补足该决策
- **AND** SHALL 将 compiler 表述为 Agent 操作类比，而非真实 compiler 或持久化 IR

#### Scenario: 片段排除操作规则

- **WHEN** `XIRANG_PHILOSOPHY` 被读取
- **THEN** 文本 MUST NOT 包含制品定义先行写作、canonical syntax 或 validation gate 指令
- **AND** MUST NOT 包含独立 AST/IR pipeline、static analysis pass 或 decompilation 类比

#### Scenario: 片段定义统一 Xirang Semantic Model

- **WHEN** `XIRANG_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 Xirang 是可被 Agent 编译的 human intent 的结构化表述
- **AND** SHALL 声明 模型分区 与 element-owned Contracts 共同组成一个 Semantic Model
- **AND** MUST NOT 使用 `durable semantic source` 或 Behavior/Architecture 双源作为核心定义

#### Scenario: 片段定义 scaffolding 与 reconciliation

- **WHEN** `XIRANG_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 change 朝 target steady state reconciliation Semantic Delta
- **AND** SHALL 声明 proposal、design、tasks 是 compilation scaffolding，而非竞争性的 source of truth
