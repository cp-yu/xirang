## MODIFIED Requirements

### Requirement: Agent definition-first authoring

Artifact authoring instructions SHALL 在 `instruction` 与 `template` 之前投影 resolved file definition，并 SHALL 通过返回的 `instruction` 统一声明 authoring 顺序：definition → dependencies/current state → artifact-specific instruction → template。Definition、context、rules、config projection 与 Agent reasoning MUST NOT 被复制进 artifact。通用 artifact instruction SHALL 只定义 artifact authoring contract，MUST NOT 承担调用 workflow 的 validation、scenario label preview/write、sync 或 archive orchestration。

#### Scenario: [ADDED] Instructions JSON 返回 definition 与 current state
- **WHEN** Agent 执行 `openspec instructions <artifact> --change <name> --json`
- **THEN** JSON SHALL 包含该 artifact 的结构化 `definition`
- **AND** SHALL 同时包含 `instruction`、`template`、`dependencies`、`outputPath` 与 `configProjection`
- **AND** `currentState` SHALL 分别暴露 completion 状态、已存在 output paths 与可选 completion marker 的路径和存在状态
- **AND** `currentState` MUST NOT 嵌入 output 或 marker 的文件内容

#### Scenario: [ADDED] 文本输出按 definition-first 顺序展示
- **WHEN** Agent 请求 artifact instructions 的文本输出
- **THEN** `<definition>` SHALL 位于 dependencies/current state、`<instruction>` 与 `<template>` 之前
- **AND** dependencies/current state SHALL 位于 `<instruction>` 之前
- **AND** 输出 SHALL 明确禁止将 definition 与其他非 artifact inputs 复制进 artifact

#### Scenario: [MODIFIED] Blocked artifact 仍可理解
- **WHEN** artifact 存在未完成 dependencies
- **THEN** instructions SHALL 继续返回 definition、dependencies 与 current state
- **AND** SHALL 单独报告 blocked 状态，不得以 blocked 为由省略文件语义

#### Scenario: [ADDED] Generic Specs guidance 不编排 scenario labels
- **WHEN** Agent 获取 `specs` artifact instruction
- **THEN** instruction SHALL 声明 Agent MUST NOT 手写 scenario operation labels
- **AND** SHALL 将 scenario label preview/write 交由 invoking workflow
- **AND** MUST NOT 直接要求执行 `openspec scenario-labels "<change>" --preview` 或 `--write`

#### Scenario: [REMOVED] Instructions JSON 返回 definition
- **WHEN** Agent 执行 `openspec instructions <artifact> --change <name> --json`
- **THEN** JSON SHALL 包含该 artifact 的结构化 `definition`
- **AND** SHALL 同时包含 `instruction`、`template`、`dependencies`、`outputPath` 与 `configProjection`

#### Scenario: [REMOVED] 文本输出优先展示 definition
- **WHEN** Agent 请求 artifact instructions 的文本输出
- **THEN** `<definition>` SHALL 位于 `<instruction>` 与 `<template>` 之前
- **AND** 输出 SHALL 明确禁止将 definition 复制进 artifact

### Requirement: Bootstrap phase 文件定义投影

Bootstrap Schema SHALL 使用显式 file ID registry 区分 workflow state、retained bootstrap authoring inputs、derived review projections 与 durable current-state source，并 SHALL 由每个 phase artifact 引用相关 file IDs。Bootstrap phase instructions 的 JSON 与文本输出 SHALL 仅投影当前 phase 相关的 `fileDefinitions`，并 SHALL 在 phase guidance 前通过返回的 `instruction` 声明 fileDefinitions-first authoring 顺序。

`evidence.yaml` 与 `domain-map/*.yaml` SHALL 被定义为 retained bootstrap authoring inputs，而不是 durable architecture source。Repository locations MAY 作为 evidence 保存，但 mechanical import/call edges MUST NOT 被定义为 semantic relations。`candidate/**` SHALL 被定义为 CLI-generated derived projection。Formal OPSX bundle 与 formal Specs SHALL 分别被定义为 durable architecture source 与 durable behavior source。

#### Scenario: [MODIFIED] Phase 只返回相关文件
- **WHEN** Agent 请求 init、scan、map、review 或 promote phase instructions
- **THEN** JSON `fileDefinitions` 与文本 `<file_definitions>` SHALL 仅包含该 phase 读取、编写、审查或发布的文件
- **AND** SHALL NOT 注入全部 bootstrap lifecycle 定义
- **AND** 返回的 `instruction` SHALL 要求先消费 `fileDefinitions`，再读取 current workspace state 与 phase-specific guidance

#### Scenario: Bootstrap inputs 与 durable source 分层
- **WHEN** Agent 请求 scan、map 或 promote instructions
- **THEN** scan/map definitions SHALL 将 evidence 和 domain maps 标记为 retained bootstrap authoring inputs
- **AND** promote definitions SHALL 将 formal OPSX bundle 标记为 durable architecture source
- **AND** SHALL 将 `openspec/specs/**/*.md` 标记为 workflow-managed durable behavior source

#### Scenario: Bootstrap file 引用可验证
- **WHEN** bootstrap artifact 引用重复或不存在的 file ID
- **THEN** Schema validation SHALL 失败
- **AND** 错误 SHALL 指明 artifact 与非法引用
