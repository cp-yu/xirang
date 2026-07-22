# compilation-philosophy-fragment Specification

## Purpose
定义注入 workflow skills 与审查 subagents 的最小 OPSX 项目哲学，使所有消费者共享一致的 semantic source、scaffolding、source completeness 与 Agent compiler 定义，而不混入具体工作流操作规则。
## Requirements
### Requirement: OPSX Philosophy 片段定义

系统 SHALL 在 `src/core/templates/fragments/opsx-fragments.ts` 中提供 `OPSX_PHILOSOPHY` 共享片段常量。该片段 SHALL 以英文书写，不受 `proseLanguage` projection 管辖，并 SHALL 只表达以下项目定义：

1. OPSX 是可被 Agent 编译的 human intent 的结构化表述。
2. OPSX Semantic Model 是唯一权威语义，由 LikeC4 graph modules 与 element-owned Markdown contract modules 共同构成；它们是同一模型的 source modules，而非两套并列 source。
3. Change 将 Semantic Delta reconciliation 到 target steady state；`proposal.md`、`design.md` 与 `tasks.md` 是 compilation scaffolding，不是竞争性的 source of truth。
4. OPSX Semantic Model 只有在 Agent 无需猜测影响 element hierarchy、contracts 或 relationships 的决策时才完整。
5. Agent 执行类似 compiler 的操作，忠实翻译已授权 human intent；existing code 是 current implementation evidence，不得静默覆盖 OPSX Semantic Model。

片段 MUST NOT 声明独立 compiler process、持久化 IR、definition-first、canonical syntax、validation gate 或具体 lifecycle command；这些实现与操作规则由对应 surface 所有。

#### Scenario: 片段定义统一 OPSX Semantic Model
- **WHEN** `OPSX_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 OPSX 是可被 Agent 编译的 human intent 的结构化表述
- **AND** SHALL 声明 LikeC4 graph modules 与 element-owned Specs 共同组成一个 OPSX Semantic Model
- **AND** MUST NOT 使用 `durable semantic source` 或 Behavior/Architecture 双源作为核心定义

#### Scenario: 片段定义 scaffolding 与 reconciliation
- **WHEN** `OPSX_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 change 朝 target steady state reconciliation Semantic Delta
- **AND** SHALL 声明 proposal、design、tasks 是 compilation scaffolding，而非竞争性的 source of truth

#### Scenario: 片段定义 completeness 与 Agent compiler 类比
- **WHEN** model 缺少会改变 hierarchy、contracts 或 relationships 的决策
- **THEN** 文本 SHALL 说明 OPSX Semantic Model 尚不完整
- **AND** SHALL 禁止 Agent 通过猜测补足该决策
- **AND** SHALL 将 compiler 表述为 Agent 操作类比，而非真实 compiler 或持久化 IR

#### Scenario: 片段排除操作规则
- **WHEN** `OPSX_PHILOSOPHY` 被读取
- **THEN** 文本 MUST NOT 包含 definition-first、canonical syntax 或 validation gate 指令
- **AND** MUST NOT 包含独立 AST/IR pipeline、static analysis pass、linking 或 decompilation 类比

### Requirement: OPSX Philosophy 注入 workflow skill 模板

6 个用户可调用 workflow skill 模板 SHALL 在首句职责描述之后、操作步骤之前注入 `OPSX_PHILOSOPHY`：

- `propose`
- `explore`
- `apply-change`
- `archive-change`
- `bootstrap-opsx`
- `snack`

注入 SHALL 使用 TypeScript 模板字符串插值 `${OPSX_PHILOSOPHY}`，并与后续内容保留一个空行。

#### Scenario: 6 个 workflow skills 共享同一片段
- **WHEN** 生成任一受管 workflow skill
- **THEN** instructions SHALL 包含完整的 `OPSX_PHILOSOPHY`
- **AND** 各 workflow MUST NOT 内联另一份改写后的项目哲学

### Requirement: OPSX Philosophy 注入 internal subagent 模板

`reviewer` 与 `optimizer` internal subagent SHALL 在 Role 段之后注入 `OPSX_PHILOSOPHY`。`impact-sweeper`、`feedback` 与 `verify-execution-model` SHALL NOT 注入该片段。

#### Scenario: reviewer 与 optimizer 包含共享哲学
- **WHEN** reviewer 或 optimizer prompt 被生成
- **THEN** prompt SHALL 在 Role 与 Hard Constraints 之间包含完整的 `OPSX_PHILOSOPHY`

#### Scenario: 排除 surface 不包含共享哲学
- **WHEN** impact-sweeper prompt、feedback template 或 verify-execution-model helper 被生成
- **THEN** 输出 SHALL NOT 包含 `OPSX Philosophy` 标题

#### Scenario: 排除决策编码在片段注释中
- **WHEN** `OPSX_PHILOSOPHY` 常量在 `opsx-fragments.ts` 中被定义
- **THEN** 其上方 JSDoc 注释 SHALL 列出使用方和排除名单及排除原因

