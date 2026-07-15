# artifact-file-definitions Specification

## Purpose
This specification records behavior introduced by change define-artifact-file-semantics. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: 结构化文件定义

内置 Schema SHALL 为其管理的每种文件提供结构化 `FileDefinition`，包含非空 `purpose`、`compilationRole`、`content.includes`、`content.excludes`、`writePolicy` 与 `validation`。文件路径、artifact 依赖、模板、编写步骤和项目配置投影 SHALL 分别由既有字段负责，MUST NOT 在 definition 中重复建模。

#### Scenario: 内置 artifact definition 可解析
- **WHEN** 系统加载 `spec-driven` 或 `bootstrap` Schema
- **THEN** 每个受管文件的 `FileDefinition` SHALL 通过 Zod validation
- **AND** Agent 可分别识别文件用途、编译职责、内容边界、写入策略和验证命令

#### Scenario: 不完整 definition 被拒绝
- **WHEN** 内置 Schema 的 file definition 缺少必填字段、包含空 `includes`、空 `excludes`、空 `validation` 或未知 `writePolicy`
- **THEN** Schema parsing SHALL 失败
- **AND** 错误 SHALL 指明对应 file/artifact ID 与字段路径

#### Scenario: Validation contract 保持只读
- **WHEN** definition 投影文件的 validation contract
- **THEN** `validation` SHALL 只列出检查该文件有效性的只读命令
- **AND** validation 后的程序化 metadata 写入 SHALL 由 artifact instruction 或 workflow 持有
- **AND** `specs` definition SHALL NOT 将 `openspec scenario-labels <name> --write` 声明为 validation command

### Requirement: Spec-driven 文件语义边界

`spec-driven` Schema SHALL 通过 definitions 区分 behavior source、architecture source 与 compilation scaffolding。Proposal SHALL 声明动机、范围边界与 capability impact；Specs SHALL 定义 observable behavior；`opsx-delta.yaml` SHALL 定义目标系统所需的 architecture source reconciliation；design SHALL 承载当前 change 的具体 solution architecture、lowering、重构与技术决策；tasks SHALL 将实现分解为受证据门禁约束的工作单元。

Design MAY 讨论并决定当前 change 的具体架构。会改变持久 project intent、capability、ownership、boundary 或 semantic relation 的 architecture decision SHALL 同时通过 `opsx-delta.yaml` reconciliation 到目标 OPSX source，MUST NOT 只存在于 design。

#### Scenario: Specs 与 OPSX delta 不争夺语义所有权
- **WHEN** Agent 获取 `specs` 与 `opsx-delta` definitions
- **THEN** `specs` SHALL 包含 target-state requirements 与 scenarios，并排除 architecture semantics
- **AND** `opsx-delta` SHALL 包含最小 target-state node/relation reconciliation operations，并排除 observable behavior requirements 与 implementation evidence

#### Scenario: Design 承载具体架构与重构决策
- **WHEN** 当前 change 需要 solution architecture、implementation boundaries 或 refactoring strategy
- **THEN** design definition SHALL 允许记录这些具体 lowering decisions
- **AND** SHALL 排除未通过 `opsx-delta.yaml` reconciliation 的 durable architecture changes

#### Scenario: Tasks 不声明文件 ownership 或新行为
- **WHEN** Agent 获取 tasks definition
- **THEN** definition SHALL 将 `Files` 解释为 affected files 而非 owned files
- **AND** SHALL 将 `Requirements` 内容约束为 implementation constraints
- **AND** SHALL 排除 new observable behavior 与 architecture semantics

### Requirement: Agent definition-first authoring

Artifact authoring instructions SHALL 在 `instruction` 与 `template` 之前投影 resolved file definition，并 SHALL 指示 Agent 先理解 definition，再读取 dependencies/current state、执行 instruction 和填充 template。Definition、context、rules、config projection 与 Agent reasoning MUST NOT 被复制进 artifact。

#### Scenario: Instructions JSON 返回 definition
- **WHEN** Agent 执行 `openspec instructions <artifact> --change <name> --json`
- **THEN** JSON SHALL 包含该 artifact 的结构化 `definition`
- **AND** SHALL 同时包含 `instruction`、`template`、`dependencies`、`outputPath` 与 `configProjection`

#### Scenario: 文本输出优先展示 definition
- **WHEN** Agent 请求 artifact instructions 的文本输出
- **THEN** `<definition>` SHALL 位于 `<instruction>` 与 `<template>` 之前
- **AND** 输出 SHALL 明确禁止将 definition 复制进 artifact

#### Scenario: Blocked artifact 仍可理解
- **WHEN** artifact 存在未完成 dependencies
- **THEN** instructions SHALL 继续返回 definition
- **AND** SHALL 单独报告 blocked 状态，不得以 blocked 为由省略文件语义

### Requirement: Bootstrap phase 文件定义投影

Bootstrap Schema SHALL 使用显式 file ID registry 区分 workflow state、retained bootstrap authoring inputs、derived review projections 与 durable current-state source，并 SHALL 由每个 phase artifact 引用相关 file IDs。`openspec bootstrap instructions <phase> --json` SHALL 仅返回当前 phase 相关的 `fileDefinitions`。

`evidence.yaml` 与 `domain-map/*.yaml` SHALL 被定义为 retained bootstrap authoring inputs，而不是 durable architecture source。Repository locations MAY 作为 evidence 保存，但 mechanical import/call edges MUST NOT 被定义为 semantic relations。`candidate/**` SHALL 被定义为 CLI-generated derived projection。Formal OPSX bundle 与 formal Specs SHALL 分别被定义为 durable architecture source 与 durable behavior source。

#### Scenario: Phase 只返回相关文件
- **WHEN** Agent 请求 scan、map、review 或 promote phase instructions
- **THEN** `fileDefinitions` SHALL 仅包含该 phase 读取、编写、审查或发布的文件
- **AND** SHALL NOT 注入全部 bootstrap lifecycle 定义

#### Scenario: Bootstrap inputs 与 durable source 分层
- **WHEN** Agent 请求 scan、map 或 promote instructions
- **THEN** scan/map definitions SHALL 将 evidence 和 domain maps 标记为 retained bootstrap authoring inputs
- **AND** promote definitions SHALL 将 formal OPSX bundle 标记为 durable architecture source
- **AND** SHALL 将 `openspec/specs/**/*.md` 标记为 workflow-managed durable behavior source

#### Scenario: Bootstrap file 引用可验证
- **WHEN** bootstrap artifact 引用重复或不存在的 file ID
- **THEN** Schema validation SHALL 失败
- **AND** 错误 SHALL 指明 artifact 与非法引用

### Requirement: Formal OPSX 文件定义

`openspec/project.opsx.yaml` 与 `openspec/project.opsx.relations.yaml` SHALL 被定义为共同组成 durable architecture source 的 workflow-managed formal bundle。前者 SHALL 定义 project metadata 与非 relation nodes，后者 SHALL 定义完整 canonical semantic relation 集；两者 MUST NOT 被定义为 change log、code map 或 bootstrap 私有状态。

#### Scenario: Formal project file 定义为 architecture symbol table
- **WHEN** Agent 获取 `project.opsx.yaml` definition
- **THEN** definition SHALL 包含 project intent/scope、domains、capabilities 与其他合法非 relation nodes
- **AND** SHALL 排除 relations、delta operations、源码路径与 bootstrap review state

#### Scenario: Formal relations file 定义为 architecture module graph
- **WHEN** Agent 获取 `project.opsx.relations.yaml` definition
- **THEN** definition SHALL 包含完整 Registry-defined semantic relation 集
- **AND** SHALL 排除 node definitions、delta operations、机械 import/call graph 与推测关系

#### Scenario: Formal OPSX bundle 共同验证
- **WHEN** formal OPSX 任一文件将被 workflow 写入
- **THEN** workflow SHALL 将两份文件作为一个逻辑 bundle 进行 referential-integrity 与 Registry semantic validation
