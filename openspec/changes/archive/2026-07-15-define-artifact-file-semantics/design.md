## Context

OpenSpec 已有 artifact graph、Schema instruction、template、config projection、OPSX authoring help 与 bootstrap phase instructions，但文件语义分散在长篇 prose 和多个手写 surface 中。Agent 目前直接收到“如何写”，缺少先判断“文件是什么、承载什么语义、在 human intent → code 编译管线中承担什么职责”的稳定模型。

项目根 `AGENTS.md` 已固定 North Star：Specs + OPSX 是 durable semantic source；proposal、design、tasks 是当前模型与上下文限制下的 compilation scaffolding；change 是增量源码与 reconciliation 单元。本设计把该边界投影到文件定义和 Agent authoring path，同时收敛当前未使用的自定义 Schema surface。

## Goals / Non-Goals

**Goals:**

- 为两个内置 Schema 的文件提供单一、结构化、可验证的 `FileDefinition`。
- 让 Agent 在编写 change artifact 前先消费 definition，再消费 current state、instruction 与 template。
- 明确 change-local specs 和 `opsx-delta.yaml` 的正文描述目标稳态，delta token 仅承担 reconciliation syntax。
- 让 bootstrap 按 phase 投影完整生命周期中相关文件的定义，同时保持 formal OPSX 的 durable source 地位。
- 保持 relation taxonomy 由 `RelationDefinitionRegistry` 单一负责。
- 删除 project-local/user override Schema 及其创建命令，仅保留固定内置 Schema。
- 对齐 active compilation philosophy 与 OPSX v2 两文件、无 code-map 合同。

**Non-Goals:**

- 不自动判断任意自然语言 source 是否语义完整。
- 不把 OPSX 扩展成 code map、symbol index 或文件路径注册表。
- 不新增 CLI 命令、外部依赖或第二套 artifact graph。
- 不修改 archive 与 CHANGELOG 中的历史记录。
- 不自动删除用户磁盘上的旧 Schema 文件。

## Decisions

### 1. FileDefinition 保持最小且结构化

`FileDefinition` 仅包含 `purpose`、`compilationRole`、`content.includes`、`content.excludes`、`writePolicy` 与 `validation`。路径、依赖、构建顺序、输出结构、操作步骤和项目规则继续分别由 `generates/paths`、`requires`、`template`、`instruction` 与 `configProjection` 所有。

**Alternatives considered:**

- 独立 TypeScript registry：会与 YAML Schema 形成双源，拒绝。
- 统一 reference 文档：不可机器校验且容易漂移，拒绝。
- 为 definition 增加 authority graph、consumer graph 和完整 lifecycle state machine：会复制 artifact graph，拒绝。

### 2. Change artifacts 在 artifact entry 上直接声明 definition

内置 `ArtifactSchema` 的 `definition` 为必填。`ArtifactInstructions` 原样投影该结构；文本输出在 `<task>` 后、`<instruction>` 与 `<template>` 前展示 `<definition>`，并声明不得复制到 artifact。

`description` 只作为 status/task 短标签，不承担正式内容边界。

### 3. Bootstrap 使用顶层 files registry 与 phase 引用

Bootstrap Schema 增加 `files[]`；每个 phase artifact 通过显式 file ID list 引用当前阶段相关文件。Parser 校验 file ID 唯一性与引用完整性。`bootstrap instructions <phase> --json` 返回当前 phase 的 `fileDefinitions`。

Bootstrap lifecycle 可在 file entry 上附加 phase、derived source、promotion target 与 retention 信息，但这些字段不进入 change artifact 的核心 `FileDefinition`。

Formal `project.opsx.yaml` 与 `project.opsx.relations.yaml` 的文件定义在 bootstrap Schema 中物化，只因 bootstrap 负责其创建与 promotion；OPSX disk schema 仍由 `opsx-utils.ts` 所有，relation 语义仍由 Registry 所有。

### 4. Specs 与 OPSX delta 使用目标稳态语义

Change-local specs 的 Requirement/Scenario 正文描述 change 完成后的 durable behavior。`MODIFIED Requirement` 是完整目标状态；Agent 通过省略目标状态中不存在的 Scenario 表达删除。`scenario-labels` 后续生成的 `[REMOVED]` 等 token 是 review metadata，不改变 authoring 语义。

`opsx-delta.yaml` 的 node intent、status 与 relations 使用目标架构语言。`ADDED`、`MODIFIED`、`REMOVED` 仅表示将 formal bundle reconcile 为目标模型的最小操作。

### 5. Authoring help 消费同源定义

`openspec help authoring` 通过内置 Schema file definitions 构建 purpose、content boundary、write policy、compilation role 与 validation output，不再手写独立 purpose/structure。Relation files 再组合 `RelationDefinitionRegistry` projection。使用显式 canonical topic list，不使用路径模式猜测。

### 6. Schema resolution 收敛为固定内置集合

保留 `spec-driven` 与 `bootstrap` 两个 package Schema。删除 project-local/user directory lookup、shadowing、`schema init` 与 `schema fork`。保留：

- `schema which [name] [--all]`：报告内置 Schema package path。
- `schema validate [name]`：校验一个或全部内置 Schema。
- workflow `--schema`、config 与 change metadata binding：仅接受固定内置 ID。

未知 ID fail fast 并列出合法值，不静默回退。现有旧文件保持磁盘原状但不再参与解析。

### 7. Workflow 只保留 definition-first 消费纪律

Workflow templates 不复制每个文件的定义，只要求：authoring 前取得 resolved definition；先读 definition，再读 dependencies/current state、instruction、template；禁止将 definition、context、rules 或 projection 复制进产物。

共享 compilation philosophy 改为：Specs + OPSX 是 durable semantic source；proposal/design/tasks 是 compilation scaffolding；change 是 reconciliation unit。现有代码只是上一轮编译产物和实现证据。

### 8. 跨平台行为

所有 Schema path、template path 和 change output path 继续使用 Node.js `path` API 解析。Schema ID 使用显式内置常量查找，不根据路径分隔符、大小写或正则推断。Windows 测试覆盖 package path 与未知 Schema 诊断，不引入平台专属行为。

## Risks / Trade-offs

- [definition 与 instruction 重复] → 以字段职责和 contract tests 固定边界；不构建自然语言一致性引擎。
- [Schema 模型膨胀] → 核心 definition 只保留六类稳定信息，bootstrap lifecycle 使用可选扩展。
- [formal OPSX 被误解为 bootstrap 私有产物] → definition 明确 durable source；OPSX schema 和 relation Registry 所有权不变。
- [delta 被写成 change log] → definition、instruction、示例与 tests 同时固定 target-state 语言。
- [自定义 Schema 删除破坏旧项目] → 非内置 binding fail fast，绝不静默选择错误 workflow；不删除用户文件。
- [prompt 体积增加] → artifact/phase 按需投影，workflow 不内联具体 definition。
- [definition 被误当 completeness checker] → validation 只保证结构与可程序化合同；semantic completeness 仍由 reviewer 和人工审查承担。

## Migration Plan

1. 先扩展 Zod model 与两个内置 Schema，使 parser/tests 对 definition 和 file references 建立合同。
2. 投影 change artifact instructions，并更新 workflow consumption guidance。
3. 增加 bootstrap phase `fileDefinitions` 与 authoring help 同源 projection。
4. 删除自定义 Schema resolution 和 CLI creation surfaces，限制配置与 metadata binding。
5. 对齐 compilation philosophy、active specs/docs 与 code-map 残留。
6. 运行 staged OpenSpec validation、完整 tests 与 build。

若实施中需要回滚，先恢复 Schema parser 与 resolver，再恢复 CLI surfaces；内置 Schema 文件与用户旧 Schema 文件均不执行破坏性磁盘迁移。

## Open Questions

无。文件语义、Agent 消费顺序、自定义 Schema 删除边界、测试策略与实施顺序已在 Design Summary 中确认。
