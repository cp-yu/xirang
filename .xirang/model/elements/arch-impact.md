---
entity: element-declaration
identity: arch-impact
kind: element
parent: deterministic-operations
title: Arch Impact
definition: Arch Impact 定义 `xirang arch impact` 的影响 identity 发现行为：它接受一个或多个稳定 focus Element identities，返回 depth-bounded Relationship subgraph、canonical shortest paths 及独立 refinement context，并且只以稳定 identities 和结构记录表达相关范围；它不返回 Element Definition、Element Contract、Section、Acceptance Case 或实现证据，也不维护增量调用状态。
---

## Specification

### Section: arch impact SHALL 接受 focus Elements

`xirang arch impact <elementIds...>` SHALL 接受一个或多个稳定 identity 作为 focus Elements，去重后分析 Formal Semantic Model。Canonical user-facing term SHALL 为 `focus Elements`，JSON field `focusElements` SHALL 为稳定 identity array；命令 MUST NOT 使用 `seed` 或 `seeds` 表达该输入。

- **多个 focus Elements 合并分析**

  - 用户传入多个存在的稳定 identity
  - 命令 SHALL 在一个结果中分析全部 focus Elements
  - `focusElements` SHALL 对重复 identity 去重并稳定排序

- **unknown focus Element 失败**

  - 任一输入 identity 不存在于 Formal Semantic Model
  - 命令 SHALL 非零退出
  - SHALL 明确报告不存在的稳定 identity

- **不接受 FQN 或 free-form concept**

  - 输入不是已存在的稳定 identity
  - 命令 SHALL NOT 将其作为 FQN 或自然语言 query 猜测解析
  - SHALL 指示调用方先使用 `xirang arch search`

### Section: arch impact SHALL 返回 bounded Relationship subgraph

命令 SHALL 从全部 focus Elements 对 incoming 与 outgoing Relationships 双向展开，默认 depth SHALL 为 `2`，并 SHALL 使用 Metamodel 当前声明的全部 Relationship kinds。分析 SHALL 遍历 depth 范围内所有相关 Relationship；默认投影 SHALL 返回 focus identities、related Element identities、独立 refinement context 与必要关系摘要，不返回 directed Relationship records。仅当调用方显式使用 `--paths` 时，输出 SHALL 包含完整 depth-bounded canonical Relationship subgraph 与 shortest paths。任何投影 SHALL NOT 将 adjacency 自动分类为必须修改或必须验证。

- **默认不返回 directed Relationship records**

  - 用户未指定 `--paths`
  - 输出 SHALL 提供稳定排序的 related identities 与关系摘要
  - 输出 SHALL NOT 包含 `relations` 或 `relationPaths`

- **显式展开完整子图**

  - 用户指定 `--paths`
  - 返回 depth-bounded Relationship records 与 canonical shortest paths
  - 每条 Relationship SHALL 保持 Formal Model 中的 source-to-target 方向

- **depth traversal 保留完整分析**

  - 用户省略 `--depth`
  - 内部分析 SHALL 使用两跳 Relationship traversal
  - `--depth 0` SHALL 不展开 related Elements
  - 新 Relationship kind SHALL 无需硬编码更新即可参与分析

- **related Elements 只返回 identity**

  - Relationship traversal 发现相关 Element
  - `elements` SHALL 包含其稳定 identity
  - SHALL NOT 包含其 title、kind、parent、children、definition、contract policy 或 Contract

### Section: arch impact SHALL 投影 canonical shortest paths

命令 SHALL 为每个 focus Element 到每个 related Element 返回一条 canonical shortest path。Path SHALL 使用 `focusElementId` 与 `relatedElementId`，每个 step SHALL 包含 canonical `source`、`kind`、`target` 与相对 `traversal` direction。多个等长 shortest paths SHALL 按各 step 的 `source`、`kind`、`target` 字典序选择一条；完整 depth-bounded `relations` 子图与 `relationPaths` SHALL 只在调用方显式选择 path projection 时返回。

- **默认省略 canonical paths**

  - 用户运行默认 `xirang arch impact` projection
  - 输出保留必要关系摘要，但省略完整 `relationPaths`

- **显式请求 canonical paths**

  - 用户选择 canonical path projection
  - 返回每个 focus Element 到 related Element 的稳定最短路径
  - 非 canonical path edges 仍保留在显式请求的完整 `relations` 子图中

- **等长路径选择稳定**

  - focus Element 到 related Element 存在多个等长 shortest paths
  - `relationPaths` 只包含字典序最小的 canonical path
  - repeated execution 返回同一路径

- **cycles 不导致无限遍历**

  - Relationship graph 包含 cycle
  - 命令在 requested depth 内终止并返回去重、稳定排序的结果

### Section: arch impact SHALL 分离 refinement context

命令 SHALL 始终返回每个 focus Element 到唯一 Project Root 的完整 ancestor chain，并 SHALL 按 `--depth` 返回 focus descendants。每个 `refinementContext` record SHALL 使用 `focusElementId`、`elementId`、`direction` 与 `depth` 表达 containment context；MUST NOT 嵌套完整 Element。Containment SHALL NOT 消耗 Relationship hop，也 MUST NOT 出现在 `relationPaths`。

- **ancestor chain 完整返回**

  - focus Element 位于多层 refinement hierarchy
  - `refinementContext` SHALL 以 Element identities 包含从其 parent 到 Project Root 的完整 chain

- **nesting 不成为 Relationship impact**

  - 一个 Element 仅因 containment 与 focus Element 相邻
  - 它 MAY 出现在 `refinementContext`
  - SHALL NOT 仅因此出现在 `relationPaths`

- **descendants 按 depth 展开**

  - focus Element 具有多层 children 且用户指定 `--depth 1`
  - `refinementContext` SHALL 包含 direct child identities
  - SHALL NOT 包含更深 descendants

- **refinement 不携带完整语义**

  - ancestor 或 descendant 被加入 refinement context
  - record SHALL 只包含 focus identity、context Element identity、direction 与 depth
  - SHALL NOT 包含 Definition、Contract 或嵌套 Element object

### Section: arch impact SHALL 只处理 Formal Semantic Model

命令 SHALL 只读取 Formal Semantic Model，SHALL NOT 提供 `--change` 或 `--code`，SHALL NOT 读取 Change artifacts、Semantic Delta、实现代码或 Git evidence，也 SHALL NOT 输出 Agent judgments、Element Definitions 或 Element Contracts。

- **active Change 不改变结果**

  - 项目存在 active Change 且调用方未修改 Formal Semantic Model
  - `arch impact` 结果 SHALL 与没有该 Change 时相同
  - SHALL NOT 加载 Change 目录

- **命令保持只读且无状态**

  - `arch impact` 成功或失败
  - 命令 SHALL NOT 创建 report、cache、session state 或其他项目文件
  - repeated execution SHALL NOT 依赖此前返回过的 identities

- **命令不分析代码**

  - Formal Element 与实现 symbol 名称不同
  - 命令 SHALL NOT 搜索或猜测实现文件
  - 输出 SHALL 不包含 files、symbols、imports 或 calls

### Section: arch impact SHALL 共享统一输出投影

Human-readable 与 `--json` 输出 SHALL 从同一个 canonical result object 生成。默认 JSON SHALL 包含 identity-only `focusElements` 与相关 `elements`、必要关系摘要、结构化 `refinementContext`、范围统计与 `diagnostics`；canonical `relations` 子图与 `relationPaths` SHALL 只在显式完整关系/path projection 时返回。所有返回 collections SHALL 使用稳定 identities 确定性排序。任何 impact projection SHALL NOT 包含 `contracts`、`contractCount`、`contractBytes`、Element Definitions、Sections、Acceptance Cases 或嵌套完整 Element。

- **默认关系摘要**

  - 用户未请求完整关系/path projection
  - 返回 focus identity、refinement context、相关 identity 与解释影响范围所需的必要关系摘要
  - 不返回完整 canonical paths

- **显式完整关系/path projection**

  - 用户明确请求完整关系/path projection
  - 返回 depth-bounded canonical Relationship subgraph 与 canonical shortest paths
  - 仍只包含稳定 identity 与 canonical relationship records，不加载 Element 完整语义

- **无相关 Relationships 正常返回**

  - focus Element 在 requested depth 内没有 semantic Relationships
  - 命令 exit code 为 `0`，返回空关系摘要并继续返回 focus identity 与 refinement context identities

- **projection 不包含完整语义**

  - 用户检查任一 impact projection
  - 输出不含 Definition、Section、Acceptance Case 或 nested complete Element
  - 调用方使用 `arch query` 读取所需 identities 的完整语义
