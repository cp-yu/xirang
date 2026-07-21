## MODIFIED Requirements

### Requirement: 编译哲学片段定义

系统 SHALL 在 `src/core/templates/fragments/opsx-fragments.ts` 中提供 `OPSX_COMPILATION_PHILOSOPHY` 共享片段常量。该片段 SHALL 包含以下内容：

1. **持久语义源码**：Specs + OPSX 是比通用编程语言更接近 human intent 的 durable semantic source；Specs 表达行为语义，OPSX 以低上下文表达 architecture symbol table/module graph。
2. **编译脚手架**：`proposal.md`、`design.md`、`tasks.md` 是当前模型、Agent、上下文与人类建模限制下的 compilation scaffolding，MUST NOT 覆盖 Specs 或 OPSX。
3. **Change reconciliation**：change-local specs 与 `opsx-delta.yaml` 是向目标稳态演化的 semantic source delta；change 是 reconciliation unit。
4. **编译管线映射**：Agent 是 compiler；`openspec validate` 是 static analysis；verify Phase 1 是 semantic-check pass；verify Phase 2 是 optimization pass；sync + archive 是 linking and release；snack 是有限 decompilation。
5. **行为规则**：source 必须精炼；关键 undefined decisions 必须显式化；compiler MUST NOT invent instructions；syntax is contract；不得输出 placeholders/empty sections/repeated narration；gates 通过前不得宣称 compiled。
6. **迭代性**：单次 compilation 忠实确定，OpenSpec source 可自由迭代并快速重新编译。

片段 SHALL 以英文书写，不受 `proseLanguage` projection 管辖。片段顶部注释 SHALL 写明使用方、排除名单和溢出裁决。

#### Scenario: [ADDED] 片段区分 source 与 scaffolding
- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 Specs + OPSX 为 durable semantic source
- **AND** SHALL 声明 proposal/design/tasks 为 compilation scaffolding
- **AND** SHALL 说明 scaffolding MUST NOT override Specs or OPSX

#### Scenario: [ADDED] 片段包含完整编译映射
- **WHEN** 共享片段被 workflow 或 internal reviewer/optimizer 消费
- **THEN** 文本 SHALL 包含 Agent compiler、static analysis、semantic-check pass、optimization pass、linking and release、symbol table/module graph 与 decompilation 概念

#### Scenario: [ADDED] 片段包含 source completeness 纪律
- **WHEN** source 缺少会改变 observable behavior 或 architecture 的关键 decision
- **THEN** 片段 SHALL 要求返回相关 Specs 或 OPSX 补全
- **AND** SHALL 明确禁止 Agent 静默猜测

#### Scenario: [MODIFIED] 片段包含迭代性澄清
- **WHEN** 共享片段被读取
- **THEN** SHALL 包含单次 compilation 忠实确定且 source 可自由迭代的表述

#### Scenario: [REMOVED] 片段包含完整隐喻映射

- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 常量被读取
- **THEN** 文本 SHALL 包含以下概念对：source code / the agent is the compiler / static analysis / semantic-check pass / optimization pass / linking and release / symbol table / decompilation

#### Scenario: [REMOVED] 片段包含全部六条规则关键词

- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 常量被读取
- **THEN** 文本 SHALL 包含以下关键表述：MUST be elegant / state each fact exactly once / faithful + elicited / Never guess silently / MUST NOT invent instructions / goes back into specs first / Syntax is contract / No dead-code output / Not compiled until gates pass
