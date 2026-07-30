## Context

`xirang help authoring semantic-delta` 用于指导 Agent 编写 Semantic Delta 中的 Relationship entries。旧实现从 `ActiveRelationDefinitionRegistry`（硬编码六种 kind + 伪造示例）生成输出，与正式 Metamodel 脱节。

当前正式 Semantic Model 声明了八种 Relationship Kinds，其中 `responsible-for` 与 `supports-presentation` 带有规范语义 body。旧 registry 无法投影这些内容。

## Goals / Non-Goals

**Goals**

- Authoring help 的唯一 Relationship Kind 事实源是当前项目 Semantic Model 的 Metamodel。
- 同时指导新增 Relationship 与新增 Relationship Kind，不预设任何关系。
- 约束表格精炼、Token 高效，保留非空 Kind body 原文。

**Non-Goals**

- 不改变 Semantic Delta 的持久化语法或 validation 规则。
- 不改变 `xirang help` 的 Commander 路由行为。
- 不清理 `.xirang/architecture/model.c4` 中的 legacy `RelationDefinitionRegistry` 描述；该 LikeC4 graph source 的迁移超出本次范围。

## Decisions

**从 `.xirang/model/` 加载而非 `.xirang/architecture/`**

`modelRoot()` 解析到 `.xirang/model/`，这是 `parseSemanticModel` 的权威输入。`AuthoringHelpCommand` 直接复用 `parseSemanticModel` + `validateSemanticModel`，与 `arch` 系列命令使用同一读取路径。

**缺失模型与空模型都拒绝**

`parseSemanticModel` 静默跳过缺失分区并返回空模型。用 `elementKinds.length === 0 && elements.length === 0` 作为「无有效模型内容」判据，加上 `fs.access` 检查目录存在，两者共同覆盖「目录不存在」与「目录存在但为空」。

**复用 `validateSemanticModel` 而非仅检查 parser diagnostics**

Parser diagnostics 只覆盖语法层。`validateSemanticModel` 覆盖 `UNRESOLVED_KIND_REFERENCE`、`MISSING_PROJECT_ROOT` 等语义约束，确保 help 不会基于无效模型生成误导性输出。

**约束表格使用 `*` 与 `∅` 区分两种「空」**

- `sourceKinds`/`targetKinds` 字段缺失 → `*`（Metamodel 未声明约束，默认开放）
- 显式空数组 `[]` → `∅`（Metamodel 声明不允许任何 Element Kind）

两者语义不同，不能合并为同一显示。

**JSON 以 `relationshipKinds` 替代 `relations`**

旧 `relations` 返回虚构的 ADDED Relationship entries，容易被误用为合法示例。新 `relationshipKinds` 返回 Metamodel 声明的 `{identity, sourceKinds, targetKinds, body}` 数组，是真实的只读投影。

## Risks / Trade-offs

- **Kind body 为空时 help 不补写语义**：当前六个默认 Kind 的 Metamodel body 为空，help 只能显示 `—`。旧 registry 中的 `meaning`/`useWhen` 等丰富说明仅存在于已删除的死代码路径，从未进入生产 help。若未来需要为这些 Kind 补充共享语义，应通过 Change 更新 Metamodel body，而非回到代码内置。
- **`.xirang/architecture/model.c4` 仍引用旧 registry 名称**：该文件是 legacy LikeC4 graph source，其迁移到 `.xirang/model/` 四分区的工作超出本次变更范围，留给后续 Semantic Model 统一变更。
