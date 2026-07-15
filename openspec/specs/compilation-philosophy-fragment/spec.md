# compilation-philosophy-fragment Specification

## Purpose
This specification records behavior introduced by change add-compilation-philosophy-fragment. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: 编译哲学片段定义

系统 SHALL 在 `src/core/templates/fragments/opsx-fragments.ts` 中提供 `OPSX_COMPILATION_PHILOSOPHY` 共享片段常量。该片段 SHALL 包含以下内容：

1. **持久语义源码**：Specs + OPSX 是比通用编程语言更接近 human intent 的 durable semantic source；Specs 表达行为语义，OPSX 以低上下文表达 architecture symbol table/module graph。
2. **编译脚手架**：`proposal.md`、`design.md`、`tasks.md` 是当前模型、Agent、上下文与人类建模限制下的 compilation scaffolding，MUST NOT 覆盖 Specs 或 OPSX。
3. **Change reconciliation**：change-local specs 与 `opsx-delta.yaml` 是向目标稳态演化的 semantic source delta；change 是 reconciliation unit。
4. **编译管线映射**：Agent 是 compiler；`openspec validate` 是 static analysis；verify Phase 1 是 semantic-check pass；verify Phase 2 是 optimization pass；sync + archive 是 linking and release；snack 是有限 decompilation。
5. **行为规则**：source 必须精炼；关键 undefined decisions 必须显式化；compiler MUST NOT invent instructions；syntax is contract；不得输出 placeholders/empty sections/repeated narration；gates 通过前不得宣称 compiled。
6. **迭代性**：单次 compilation 忠实确定，OpenSpec source 可自由迭代并快速重新编译。

片段 SHALL 以英文书写，不受 `proseLanguage` projection 管辖。片段顶部注释 SHALL 写明使用方、排除名单和溢出裁决。

#### Scenario: 片段区分 source 与 scaffolding
- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 被读取
- **THEN** 文本 SHALL 声明 Specs + OPSX 为 durable semantic source
- **AND** SHALL 声明 proposal/design/tasks 为 compilation scaffolding
- **AND** SHALL 说明 scaffolding MUST NOT override Specs or OPSX

#### Scenario: 片段包含完整编译映射
- **WHEN** 共享片段被 workflow 或 internal reviewer/optimizer 消费
- **THEN** 文本 SHALL 包含 Agent compiler、static analysis、semantic-check pass、optimization pass、linking and release、symbol table/module graph 与 decompilation 概念

#### Scenario: 片段包含 source completeness 纪律
- **WHEN** source 缺少会改变 observable behavior 或 architecture 的关键 decision
- **THEN** 片段 SHALL 要求返回相关 Specs 或 OPSX 补全
- **AND** SHALL 明确禁止 Agent 静默猜测

#### Scenario: 片段包含迭代性澄清
- **WHEN** 共享片段被读取
- **THEN** SHALL 包含单次 compilation 忠实确定且 source 可自由迭代的表述

### Requirement: 编译哲学片段注入 workflow skill 模板

6 个用户可调用 workflow skill 模板 SHALL 在其 instructions 开头（首句职责描述之后、操作步骤之前）注入 `OPSX_COMPILATION_PHILOSOPHY` 片段。注入者 SHALL 为：

- `propose`
- `explore`
- `apply-change`
- `archive-change`
- `bootstrap-opsx`
- `snack`

注入方式 SHALL 为 TypeScript 模板字符串插值 `${OPSX_COMPILATION_PHILOSOPHY}`，后跟一个空行以与后续内容视觉分离。

#### Scenario: propose 模板包含编译哲学

- **WHEN** `getOpsxProposeSkillTemplate()` 生成的 instructions 被读取
- **THEN** instructions SHALL 包含完整的 `OPSX_COMPILATION_PHILOSOPHY` 文本
- **AND** 该文本 SHALL 位于 `Propose a new change` 描述段之后、`## Workflow Stage` 之前

#### Scenario: explore 模板包含编译哲学

- **WHEN** `getExploreSkillTemplate()` 生成的 instructions 被读取
- **THEN** instructions SHALL 包含完整的 `OPSX_COMPILATION_PHILOSOPHY` 文本

#### Scenario: apply-change 模板包含编译哲学

- **WHEN** `getApplyChangeSkillTemplate()` 生成的 instructions 被读取
- **THEN** instructions SHALL 包含完整的 `OPSX_COMPILATION_PHILOSOPHY` 文本

#### Scenario: archive-change 模板包含编译哲学

- **WHEN** `getArchiveChangeSkillTemplate()` 生成的 instructions 被读取
- **THEN** instructions SHALL 包含完整的 `OPSX_COMPILATION_PHILOSOPHY` 文本

#### Scenario: bootstrap-opsx 模板包含编译哲学

- **WHEN** `getBootstrapOpsxSkillTemplate()` 生成的 instructions 被读取
- **THEN** instructions SHALL 包含完整的 `OPSX_COMPILATION_PHILOSOPHY` 文本

#### Scenario: snack 模板包含编译哲学

- **WHEN** `getSnackSkillTemplate()` 生成的 instructions 被读取
- **THEN** instructions SHALL 包含完整的 `OPSX_COMPILATION_PHILOSOPHY` 文本

### Requirement: 编译哲学片段注入 internal subagent 模板

2 个 internal subagent 模板 SHALL 在其 prompt 中注入 `OPSX_COMPILATION_PHILOSOPHY` 片段。注入者 SHALL 为：

- `reviewer`：Phase 1 审查 subagent，在 Role 段之后注入
- `optimizer`：Phase 2 优化 subagent，在 Role 段之后注入

注入方式 SHALL 为 TypeScript 模板字符串插值，后跟一个空行。

#### Scenario: reviewer subagent 包含编译哲学

- **WHEN** `getReviewerSubagentTemplate().prompt` 被读取
- **THEN** prompt SHALL 包含完整的 `OPSX_COMPILATION_PHILOSOPHY` 文本
- **AND** 该文本 SHALL 位于 `You are the clean-context Phase 1 reviewer` 段落之后、`## Hard Constraints` 之前

#### Scenario: optimizer subagent 包含编译哲学

- **WHEN** `getOptimizerSubagentTemplate().prompt` 被读取
- **THEN** prompt SHALL 包含完整的 `OPSX_COMPILATION_PHILOSOPHY` 文本
- **AND** 该文本 SHALL 位于 `You are an optimization subagent` 段落之后、`## Hard Constraints` 之前

### Requirement: 编译哲学片段排除名单

以下模板 SHALL NOT 注入 `OPSX_COMPILATION_PHILOSOPHY` 片段：

- `impact-sweeper`：只读报告角色，不写制品不判质量
- `feedback`：不写制品
- `verify-execution-model`：12 行 helper 模板，非 workflow surface

#### Scenario: impact-sweeper 不包含编译哲学

- **WHEN** `getImpactSweeperSubagentTemplate().prompt` 被读取
- **THEN** prompt SHALL NOT 包含 `OPSX Compilation Philosophy` 文本

#### Scenario: 排除决策编码在片段注释中

- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 常量在 `opsx-fragments.ts` 中被定义
- **THEN** 其上方 JSDoc 注释 SHALL 列出使用方和排除名单及排除原因

### Requirement: 溢出裁决

当模板 instructions 接近 200 行上限时，`OPSX_COMPILATION_PHILOSOPHY` 片段 SHALL NOT 被删减或缩短。替代方案 SHALL 为压缩模板中其他操作性内容。

#### Scenario: 片段注释编码溢出裁决

- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 常量在 `opsx-fragments.ts` 中被定义
- **THEN** 其上方注释 SHALL 包含 "Budget ruling: this fragment is never trimmed; on 200-line overflow, condense other template content"

