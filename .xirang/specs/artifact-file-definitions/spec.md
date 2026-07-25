---
element: cap.artifact-graph.file-definitions
---

# artifact-file-definitions Specification

## Purpose
Define structured file semantics used to compile change scaffolding, bootstrap state, LikeC4 architecture modules, and Element Contract Specs.
## Requirements
### Requirement: 结构化文件定义

内置 Schema SHALL 为受管 source、scaffolding 与 generated review artifacts 提供结构化 `FileDefinition`。Validation commands SHALL 保持只读；generated write behavior SHALL 由显式 workflow command 持有。

#### Scenario: 内置 artifact definition 可解析
- **WHEN** 系统加载内置 Schema
- **THEN** 每个 FileDefinition SHALL 通过 Zod validation
- **AND** Agent SHALL 可区分 semantic source、scaffolding 与 generated review artifact

#### Scenario: 不完整 definition 被拒绝
- **WHEN** definition 缺少必填 boundary 或 write policy
- **THEN** Schema parsing SHALL 失败并报告 artifact 与 field path

#### Scenario: Validation contract 保持只读
- **WHEN** definition 投影 validation commands
- **THEN** SHALL 只列出只读 checks
- **AND** `xirang diff --write` SHALL NOT 作为 validation command

#### Scenario: Generated review artifact definition
- **WHEN** Schema 定义 `effective-change.md`
- **THEN** SHALL 标记其为 CLI-generated review artifact
- **AND** SHALL 明确排除其作为 validate、sync 或 target materialization input

### Requirement: Spec-driven 文件语义边界

`spec-driven` Schema SHALL 将 change-local Specs 定义为 behavior-source delta，将 `architecture-delta.c4` 定义为 Architecture-source delta，将 proposal/design/tasks 定义为 scaffolding，并将 `effective-change.md` 定义为 generated review projection。

#### Scenario: Proposal 分离 source impact
- **WHEN** Agent 获取 proposal definition
- **THEN** Behavior Source SHALL 使用 Spec IDs
- **AND** Architecture Source SHALL 使用 stable element identities

#### Scenario: Specs 与 Architecture delta 不争夺语义所有权
- **WHEN** Agent 获取 Specs 与 Architecture delta definitions
- **THEN** Specs SHALL 包含完整 target Requirements 与 Scenarios
- **AND** Architecture delta SHALL 包含 identity-level graph operations
- **AND** 两者 SHALL 排除 derived Scenario/property operations

#### Scenario: Behavior Source 无变化
- **WHEN** Behavior Source 为 None
- **THEN** workflow SHALL 使用现有 completion marker contract
- **AND** MUST NOT 伪造 delta Spec

#### Scenario: Architecture Source 无变化
- **WHEN** Architecture Source 为 None
- **THEN** SHALL 省略 `architecture-delta.c4`
- **AND** MUST NOT 生成空 graph file

#### Scenario: Review artifact 不参与 compilation
- **WHEN** `effective-change.md` 缺失、stale 或被编辑
- **THEN** compiler SHALL 只读取 Formal 与 change semantic sources

### Requirement: Agent definition-first authoring

Artifact instructions SHALL 按 definition-first 顺序投影 inputs；通用 artifact instruction SHALL 不编排 validate、diff write、sync 或 archive workflow。

#### Scenario: Instructions JSON 返回 definition 与 current state
- **WHEN** Agent 请求 artifact instructions
- **THEN** JSON SHALL 分别返回 definition、instruction、template、dependencies、outputPath、currentState 与 configProjection

#### Scenario: 文本输出按 definition-first 顺序展示
- **WHEN** Agent 请求文本 instructions
- **THEN** definition SHALL 位于 artifact-specific instruction 与 template 前

#### Scenario: Blocked artifact 仍可理解
- **WHEN** dependencies 未完成
- **THEN** instructions SHALL 仍返回 definition 与 current state

#### Scenario: Generic Specs guidance 不编排 derived operations
- **WHEN** Agent 获取 Specs instruction
- **THEN** SHALL 禁止 Scenario operation labels 与 RENAMED section
- **AND** SHALL 要求完整 target Requirements
- **AND** MUST NOT 调用独立 Scenario metadata command

### Requirement: Formal OPSX 文件定义
Durable architecture source SHALL be `.xirang/architecture/**/*.c4`; durable behavior source SHALL be singular element-bound `.xirang/specs/**/spec.md` contracts.

#### Scenario: Agent requests formal source definitions
- **WHEN** formal source definitions are rendered
- **THEN** LikeC4 modules SHALL define Project Root, elements, containment, metamodel, views, and persisted semantic relations
- **AND** Specs SHALL define observable behavior through singular `element` ownership
- **AND** legacy two-file YAML SHALL NOT be described as active formal source

### Requirement: Candidate file definitions SHALL 分离 authoring 与 workflow state
Candidate workspace SHALL 为 CLI-owned `candidate.yaml`、Agent-authored `build.md`、Agent-authored Candidate Architecture/Specs、read-only validation output、formal bundle 和 history snapshots 提供彼此独立的 file semantics。

#### Scenario: Candidate source definitions
- **WHEN** Agent 初始化或编写 Candidate
- **THEN** definition SHALL 将 `build.md`、`candidate/architecture/**/*.c4` 和 `candidate/specs/**/spec.md` 标识为 Agent-authored source
- **AND** SHALL 将 `candidate.yaml` 标识为 CLI-owned lifecycle metadata
- **AND** SHALL NOT 定义 evidence.yaml、domain-map、review.md 或 Spec backfill files

#### Scenario: Formal 与 history definitions
- **WHEN** 描述 Candidate promotion
- **THEN** formal `.xirang/architecture/**/*.c4` 和 `.xirang/specs/**/spec.md` SHALL 保持为 durable semantic source
- **AND** `.xirang/history/` SHALL 仅作为 audit 和 recovery evidence
- **AND** history SHALL NOT 成为 runtime fallback semantic source

