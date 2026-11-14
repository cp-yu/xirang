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

Change 的语义来源 SHALL 由 semantic-delta 制品承载，它是 elements、metamodel、relationships、views 四分区的完整 Semantic Delta；elements 单元携带 Declaration 与 Section Entries，其余分区携带相应 Kind、Relationship 和 Authored View Entries。proposal、design、tasks 为辅助制品，不独立定义目标语义。

semantic-delta SHALL 按实体身份表达目标内容，不包含派生 diff。effective diff 由当前 Formal Model 与 Change 确定性派生，通过只读 validate --change 或 Browser 呈现，不作为持久语义输入。

- 仅 Relationship 或 Authored View 变化：对应分区完整表达变化，不伪造 Element Contract 差量或 .delta-noop。
- 所有语义对象均无变化：使用 .delta-noop 完成标记，不生成空差量单元。
- 某分区无变化：该分区可为空；其余真实差量仍共同推导目标模型。
- 查看差异：从当前正式模型及差量派生，不以历史 review 文档作为规范来源。

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

工作面 SHALL 以制品 Definition、Guidance、Template 的顺序交付静态写作依据。semantic-delta 的指导完整说明四分区对象、修改语与完整目标内容；项目 proseLanguage、context 和匹配的 rules 由 config project 独立查询，不改变制品 purpose、compilationRole、content boundary 或 writePolicy。

制品依赖与完成状态通过 status 查询。依赖尚未完成时，静态定义仍可读取，但不得把指导可读当作依赖已完成。通用静态制品指导不编排 sync 或 archive 等状态转换。

- Agent 编写 semantic-delta：先读取对应静态 reference，再查询 --artifact semantic-delta 的项目规则；规则作为附加要求，不覆盖定义。
- Change 尚缺 proposal：可读取差量定义，status 仍按制品图报告 blocked。
