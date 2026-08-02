---
entity: element-declaration
identity: change-artifacts
kind: capability
parent: change-plan
title: Change Artifacts
definition: Change Artifacts 定义 Change 制品集合的结构化语义：proposal/design/tasks 作为 compilation scaffolding，四分区 Semantic Delta 作为 behavior/architecture source；effective diff 仅由只读 `xirang validate --change` 以 ephemeral text/JSON 输出提供，不存在持久化 review artifact；Validation commands 保持只读，generated write behavior 由显式 workflow command 持有。
---

## Requirements

### Requirement: 结构化文件定义

内置 Schema SHALL 为受管 source 与 scaffolding 提供结构化 `FileDefinition`。Validation commands SHALL 保持只读；effective diff 仅由只读 `xirang validate --change` 输出，不持久化；generated write behavior SHALL 由显式 workflow command 持有。

#### Scenario: 内置 artifact definition 可解析
- **WHEN** 系统加载内置 Schema
- **THEN** 每个 FileDefinition SHALL 通过 schema validation
- **AND** Agent SHALL 可区分 semantic source、scaffolding 与只读 diff preview

#### Scenario: 不完整 definition 被拒绝
- **WHEN** definition 缺少必填 boundary 或 write policy
- **THEN** Schema parsing SHALL 失败并报告 artifact 与 field path

#### Scenario: Validation contract 保持只读
- **WHEN** definition 投影 validation commands
- **THEN** SHALL 只列出只读 checks
- **AND** 不存在 review artifact 生成命令；diff 呈现保持只读

#### Scenario: 无持久化 review artifact 定义
- **WHEN** Schema 描述 effective diff 呈现
- **THEN** SHALL 仅通过只读 `xirang validate --change` 提供 ephemeral text/JSON preview
- **AND** SHALL NOT 定义、生成或持久化 review artifact 文件

### Requirement: 制品语义边界

Change 的语义来源 SHALL 由四分区 Semantic Delta 承载：`elements/` 与 `metamodel/` 承载 Declaration 与 Kind 目标，`relationships/` 承载 Relationship 目标；proposal/design/tasks 定义为 scaffolding；effective diff 仅由只读 `xirang validate --change` 输出，不持久化。

#### Scenario: 语义来源与脚手架分离
- **WHEN** Agent 获取制品定义
- **THEN** semantic source SHALL 使用稳定 identities
- **AND** scaffolding 与只读 preview SHALL 不参与目标语义推导

#### Scenario: 无语义变化时不伪造制品
- **WHEN** 某类 source 无变化
- **THEN** workflow SHALL 使用现有完成标记契约且不生成空 delta 单元

#### Scenario: 无持久化 review artifact 输入
- **WHEN** 遗留 review 文件存在
- **THEN** compiler SHALL 只读取 formal 与 change semantic sources
#### Scenario: Contract 与结构 delta 不争夺语义所有权
- **WHEN** Agent 获取 Contracts 与结构 delta definitions
- **THEN** `elements/` 单元正文 SHALL 包含完整 target Requirements 与 Scenarios
- **AND** `metamodel/`、`relationships/`、`views/` 与 Declaration Entry SHALL 包含 identity-level operations
- **AND** 两者 SHALL 排除 derived Scenario/property operations
#### Scenario: Behavior Source 无变化
- **WHEN** Behavior Source 为 None
- **THEN** workflow SHALL 使用现有 completion marker contract
- **AND** MUST NOT 伪造 delta Contract 单元
#### Scenario: Diff 实时计算不依赖 review artifact
- **WHEN** 用户查看 change 的 effective diff
- **THEN** Web diff SHALL 从 Formal 与 change source 实时计算
- **AND** SHALL NOT 展示或依赖任何持久化 review artifact 内容作为 authoritative diff
### Requirement: Definition-first authoring

Artifact instructions SHALL 按 definition-first 顺序投影 inputs；通用 artifact instruction SHALL 不编排 validate、diff write、sync 或 archive workflow。

#### Scenario: Instructions JSON 返回 definition 与 current state
- **WHEN** Agent 请求 artifact instructions
- **THEN** JSON SHALL 分别返回 definition、instruction、template、dependencies、outputPath、currentState 与 configProjection

#### Scenario: Blocked artifact 仍可理解
- **WHEN** dependencies 未完成
- **THEN** instructions SHALL 仍返回 definition 与 current state

#### Scenario: 通用 guidance 不编排派生操作
- **WHEN** Agent 获取语义制品 instruction
- **THEN** SHALL 禁止 operation labels 并要求完整目标 Requirements
- **AND** MUST NOT 调用独立 metadata command
#### Scenario: 文本输出按 definition-first 顺序展示
- **WHEN** Agent 请求文本 instructions
- **THEN** definition SHALL 位于 artifact-specific instruction 与 template 前
#### Scenario: Instructions JSON 包含 definition
- **WHEN** 用户执行 `xirang instructions specs --change <id> --json`
- **THEN** 输出 SHALL 匹配扩展后的 `ArtifactInstructions` interface
- **AND** `definition` SHALL 与当前内置 Schema 的 specs artifact definition 一致
#### Scenario: Definition 不受 config rules 覆盖
- **WHEN** project config 为 artifact 提供 context、rules 或 prose projection
- **THEN** 这些字段 SHALL 与 definition 分开返回
- **AND** MUST NOT 改变 file purpose、compilation role、content boundary 或 write policy
### Requirement: Candidate file definitions 分离 authoring 与 workflow state
Candidate workspace SHALL 为 CLI-owned `candidate.yaml`、Agent-authored `build.md`、Agent-authored Candidate partitions、read-only validation output、formal bundle 和 history snapshots 提供彼此独立的 file semantics。

#### Scenario: Candidate source definitions
- **WHEN** Agent 初始化或编写 Candidate
- **THEN** definition SHALL 将 `build.md` 与四分区 Candidate 单元标识为 Agent-authored source
- **AND** SHALL 将 `candidate.yaml` 标识为 CLI-owned lifecycle metadata
- **AND** SHALL NOT 定义 evidence.yaml、domain-map 或 Spec backfill files

#### Scenario: Formal 与 history definitions
- **WHEN** 描述 Candidate promotion
- **THEN** formal `.xirang/model/` SHALL 保持为 durable semantic source
- **AND** `.xirang/history/` SHALL 仅作为 audit 和 recovery evidence
- **AND** history SHALL NOT 成为 runtime fallback semantic source
#### Scenario: Agent requests formal source definitions
- **WHEN** formal source definitions are rendered
- **THEN** `.xirang/model/` 四分区单元 SHALL 定义 Project Root、elements、containment、metamodel、views 与 persisted semantic relations
- **AND** Element Contract SHALL 承载于宿主 Element 的 `elements/` 单元正文（一个 Element 至多一个 Contract）
- **AND** legacy spec-store 或 LikeC4 模块 SHALL NOT 被描述为 active formal source
