## ADDED Requirements

### Requirement: 编译哲学片段定义

系统 SHALL 在 `src/core/templates/fragments/opsx-fragments.ts` 中提供 `OPSX_COMPILATION_PHILOSOPHY` 共享片段常量。该片段 SHALL 包含以下内容：

1. **编译隐喻映射**：将 OpenSpec 工作流映射到编译管线概念——制品是源码、agent 是编译器、`openspec validate` 是静态分析、verify Phase 1 是语义检查 pass、verify Phase 2 是优化 pass、sync + archive 是链接发布、OPSX YAML 是符号表/模块图、snack 是反编译
2. **六条行为规则**：
   - 制品即源码且须优雅（每条事实只陈述一次）
   - 完善 = 忠实 + 发掘（用户未说的关键决策点必须显式化）
   - 忠实翻译（不超出或偏离规约）
   - 语法即契约（canonical token 逐字保留）
   - 无死代码输出（无占位符、空模板节、重复叙述）
   - 未过门禁不算编译完成（validate/verify/seal 是管线组成部分）
3. **迭代性澄清**：单次编译忠实确定，源码本身可自由迭代重编

片段 SHALL 以英文书写，不受 `proseLanguage` 投影管辖。片段顶部注释 SHALL 写明使用方列表、排除名单和溢出裁决（片段不可删减，溢出时压缩其他模板内容）。

#### Scenario: 片段包含完整隐喻映射

- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 常量被读取
- **THEN** 文本 SHALL 包含以下概念对：source code / the agent is the compiler / static analysis / semantic-check pass / optimization pass / linking and release / symbol table / decompilation

#### Scenario: 片段包含全部六条规则关键词

- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 常量被读取
- **THEN** 文本 SHALL 包含以下关键表述：MUST be elegant / state each fact exactly once / faithful + elicited / Never guess silently / MUST NOT invent instructions / goes back into specs first / Syntax is contract / No dead-code output / Not compiled until gates pass

#### Scenario: 片段包含迭代性澄清

- **WHEN** `OPSX_COMPILATION_PHILOSOPHY` 常量被读取
- **THEN** 文本 SHALL 包含 "iterates freely" 表述

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

#### Scenario: 当前行长在预算内

- **WHEN** 最长模板 `apply-change` 编译后 instructions 被计算
- **THEN** 其行数 SHALL 不超过 200 行
- **AND** 当前值约为 159 行，有安全余量
