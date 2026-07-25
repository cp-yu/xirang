---
element: ai_integration.workflow_templates
---
## MODIFIED Requirements

### Requirement: OPSX Philosophy 片段定义

系统 SHALL 在 `src/core/templates/fragments/opsx-fragments.ts` 中提供 `OPSX_PHILOSOPHY` 共享片段常量。该片段 SHALL 以英文书写，不受 `proseLanguage` projection 管辖，并 SHALL 只表达以下项目定义：

1. OPSX 是可被 Agent 编译的 human intent 的结构化表述。
2. OPSX Semantic Model 是唯一权威语义，由 LikeC4 graph modules 与 element-owned Markdown contract modules 共同构成；它们是同一模型的 source modules，而非两套并列 source。
3. Change 将 Semantic Delta reconciliation 到 target steady state；`proposal.md`、`design.md` 与 `tasks.md` 是 compilation scaffolding，不是竞争性的 source of truth。
4. OPSX Semantic Model 只有在 Agent 无需猜测影响 element hierarchy、contracts 或 relationships 的决策时才完整。
5. Agent 执行类似 compiler 的操作，忠实翻译已授权 human intent；existing code 是 current implementation evidence，不得静默覆盖 OPSX Semantic Model。

片段 MUST NOT 声明独立 compiler process、持久化 IR、definition-first、canonical syntax、validation gate 或具体 lifecycle command；这些实现与操作规则由对应 surface 所有。

#### Scenario: [ADDED] 片段定义统一 OPSX Semantic Model
- **WHEN** `OPSX_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 OPSX 是可被 Agent 编译的 human intent 的结构化表述
- **AND** SHALL 声明 LikeC4 graph modules 与 element-owned Specs 共同组成一个 OPSX Semantic Model
- **AND** MUST NOT 使用 `durable semantic source` 或 Behavior/Architecture 双源作为核心定义

#### Scenario: [MODIFIED] 片段定义 scaffolding 与 reconciliation
- **WHEN** `OPSX_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 change 朝 target steady state reconciliation Semantic Delta
- **AND** SHALL 声明 proposal、design、tasks 是 compilation scaffolding，而非竞争性的 source of truth

#### Scenario: [ADDED] 片段定义 completeness 与 Agent compiler 类比
- **WHEN** model 缺少会改变 hierarchy、contracts 或 relationships 的决策
- **THEN** 文本 SHALL 说明 OPSX Semantic Model 尚不完整
- **AND** SHALL 禁止 Agent 通过猜测补足该决策
- **AND** SHALL 将 compiler 表述为 Agent 操作类比，而非真实 compiler 或持久化 IR

#### Scenario: [MODIFIED] 片段排除操作规则
- **WHEN** `OPSX_PHILOSOPHY` 被读取
- **THEN** 文本 MUST NOT 包含 definition-first、canonical syntax 或 validation gate 指令
- **AND** MUST NOT 包含独立 AST/IR pipeline、static analysis pass、linking 或 decompilation 类比

#### Scenario: [REMOVED] 片段定义 durable source 与职责边界
- **WHEN** `OPSX_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 Specs 与 OPSX 共同构成 durable semantic source
- **AND** SHALL 区分 observable behavior 与 project intent、capabilities、ownership、boundaries、semantic relations

#### Scenario: [REMOVED] 片段定义 source completeness 与 Agent compiler
- **WHEN** source 缺少会改变 behavior 或 architecture 的决策
- **THEN** 文本 SHALL 说明 source 尚不完整
- **AND** SHALL 禁止 Agent 通过猜测补足该决策
- **AND** SHALL 声明 existing code 不得静默覆盖 declared semantic source
