---
entity: element-declaration
identity: change-artifacts
kind: element
parent: change-plan
title: Change Artifacts
definition: Change Artifacts 定义 Change 制品集合的结构化语义：proposal/design/tasks 作为 compilation scaffolding，四分区 Semantic Delta 作为 behavior/architecture source；effective diff 仅由只读 `xirang validate --change` 以 ephemeral text/JSON 输出提供，不存在持久化 review artifact；Validation commands 保持只读，generated write behavior 由显式 workflow command 持有。
---

## Specification

### Section: 结构化文件定义

内置 Schema SHALL 为受管 source 与 scaffolding 提供结构化 `FileDefinition`。Validation commands SHALL 保持只读；effective diff 仅由只读 `xirang validate --change` 输出，不持久化；generated write behavior SHALL 由显式 workflow command 持有。

- **内置 artifact definition 可解析**

  - 系统加载内置 Schema
  - 每个 FileDefinition SHALL 通过 schema validation
  - Agent SHALL 可区分 semantic source、scaffolding 与只读 diff preview

- **不完整 definition 被拒绝**

  - definition 缺少必填 boundary 或 write policy
  - Schema parsing SHALL 失败并报告 artifact 与 field path

- **Validation contract 保持只读**

  - definition 投影 validation commands
  - SHALL 只列出只读 checks
  - 不存在 review artifact 生成命令；diff 呈现保持只读

- **无持久化 review artifact 定义**

  - Schema 描述 effective diff 呈现
  - SHALL 仅通过只读 `xirang validate --change` 提供 ephemeral text/JSON preview
  - SHALL NOT 定义、生成或持久化 review artifact 文件

### Section: 制品语义边界

Change 的语义来源 SHALL 由四分区 Semantic Delta 承载：`elements/` 与 `metamodel/` 承载 Declaration 与 Kind 目标，`relationships/` 承载 Relationship 目标；proposal/design/tasks 定义为 scaffolding；effective diff 仅由只读 `xirang validate --change` 输出，不持久化。

- **语义来源与脚手架分离**

  - Agent 获取制品定义
  - semantic source SHALL 使用稳定 identities
  - scaffolding 与只读 preview SHALL 不参与目标语义推导

- **无语义变化时不伪造制品**

  - 某类 source 无变化
  - workflow SHALL 使用现有完成标记契约且不生成空 delta 单元

- **无持久化 review artifact 输入**

  - 遗留 review 文件存在
  - compiler SHALL 只读取 formal 与 change semantic sources

- **Contract 与结构 delta 不争夺语义所有权**

  - Agent 获取 Contracts 与结构 delta definitions
  - `elements/` 单元正文 SHALL 包含完整 target Sections 与 Acceptance Cases
  - `metamodel/`、`relationships/`、`views/` 与 Declaration Entry SHALL 包含 identity-level operations
  - 两者 SHALL 排除 derived diff projections

- **Behavior Source 无变化**

  - Behavior Source 为 None
  - workflow SHALL 使用现有 completion marker contract
  - MUST NOT 伪造 delta Contract 单元

- **Diff 实时计算不依赖 review artifact**

  - 用户查看 change 的 effective diff
  - Web diff SHALL 从 Formal 与 change source 实时计算
  - SHALL NOT 展示或依赖任何持久化 review artifact 内容作为 authoritative diff

### Section: Candidate file definitions 分离 authoring 与 workflow state

Candidate workspace SHALL 为 CLI-owned `candidate.yaml`、Agent-authored `build.md`、Agent-authored Candidate partitions、read-only validation output、formal bundle 和 history snapshots 提供彼此独立的 file semantics。

- **Candidate source definitions**

  - Agent 初始化或编写 Candidate
  - definition SHALL 将 `build.md` 与四分区 Candidate 单元标识为 Agent-authored source
  - SHALL 将 `candidate.yaml` 标识为 CLI-owned lifecycle metadata
  - SHALL NOT 定义 evidence.yaml、domain-map 或 Spec backfill files

- **Formal 与 history definitions**

  - 描述 Candidate promotion
  - formal `.xirang/model/` SHALL 保持为 durable semantic source
  - `.xirang/history/` SHALL 仅作为 audit 和 recovery evidence
  - history SHALL NOT 成为 runtime fallback semantic source

- **Agent requests formal source definitions**

  - formal source definitions are rendered
  - `.xirang/model/` 四分区单元 SHALL 定义 Project Root、elements、containment、metamodel、views 与 persisted semantic relations
  - Element Contract SHALL 承载于宿主 Element 的 `elements/` 单元正文（一个 Element 至多一个 Contract）
  - legacy spec-store 或 LikeC4 模块 SHALL NOT 被描述为 active formal source

### Section: 制品定义先行写作

Artifact instructions SHALL 按制品定义先行顺序投影 inputs；通用 artifact instruction SHALL 不编排 validate、diff write、sync 或 archive workflow。

- **Instructions JSON 返回 definition 与 current state**

  - Agent 请求 artifact instructions
  - JSON SHALL 分别返回 definition、instruction、template、dependencies、outputPath、currentState 与 configProjection

- **Blocked artifact 仍可理解**

  - dependencies 未完成
  - instructions SHALL 仍返回 definition 与 current state

- **通用 guidance 不编排派生操作**

  - Agent 获取语义制品 instruction
  - SHALL 要求完整目标 Sections
  - MUST NOT 调用独立 metadata command

- **文本输出按制品定义先行顺序展示**

  - Agent 请求文本 instructions
  - definition SHALL 位于 artifact-specific instruction 与 template 前

- **Instructions JSON 包含 definition**

  - 用户执行 `xirang instructions specs --change <id> --json`
  - 输出 SHALL 匹配扩展后的 `ArtifactInstructions` interface
  - `definition` SHALL 与当前内置 Schema 的 specs artifact definition 一致

- **Definition 不受 config rules 覆盖**

  - project config 为 artifact 提供 context、rules 或 prose projection
  - 这些字段 SHALL 与 definition 分开返回
  - MUST NOT 改变 file purpose、compilation role、content boundary 或 write policy
