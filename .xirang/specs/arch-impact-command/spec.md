---
element: cap.cli.arch-impact
---
# arch-impact-command Specification

## Purpose
This specification records behavior introduced by change replace-impact-sweeper-with-arch-cli. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: arch impact SHALL 接受 focus Elements

`xirang arch impact <elementIds...>` SHALL 接受一个或多个 stable `elementId` 作为 focus Elements，去重后分析 Formal Semantic Model。Canonical user-facing term SHALL 为 `focus Elements`，JSON field SHALL 为 `focusElements`；命令 MUST NOT 使用 `seed` 或 `seeds` 表达该输入。

#### Scenario: 多个 focus Elements 合并分析
- **WHEN** 用户传入多个存在的 stable `elementId`
- **THEN** 命令 SHALL 在一个结果中分析全部 focus Elements
- **AND** SHALL 对重复 identity 去重并稳定排序

#### Scenario: unknown focus Element 失败
- **WHEN** 任一输入 `elementId` 不存在于 Formal Semantic Model
- **THEN** 命令 SHALL 非零退出
- **AND** SHALL 明确报告不存在的 stable identity

#### Scenario: 不接受 FQN 或 free-form concept
- **WHEN** 输入不是已存在的 stable `elementId`
- **THEN** 命令 SHALL NOT 将其作为 FQN 或自然语言 query 猜测解析
- **AND** SHALL 指示调用方先使用 `xirang arch search`

### Requirement: arch impact SHALL 返回 bounded Relationship subgraph

命令 SHALL 从全部 focus Elements 对 incoming 与 outgoing Relationships 双向展开，默认 depth SHALL 为 `2`，并 SHALL 使用 Metamodel 当前声明的全部 Relationship kinds。输出 SHALL 保留每条 Relationship 的 canonical `source`、`kind`、`target`，且 MUST NOT 将 adjacency 自动分类为必须修改或必须验证。

#### Scenario: 双向展开并保留方向
- **WHEN** focus Element 同时具有 incoming 与 outgoing Relationships
- **THEN** depth 范围内两侧相关 Elements 与 Relationships SHALL 全部返回
- **AND** 每条 Relationship SHALL 保持 Formal Model 中的 source-to-target 方向

#### Scenario: depth 控制 Relationship hops
- **WHEN** 用户省略 `--depth`
- **THEN** 命令 SHALL 使用两跳 Relationship traversal
- **AND** `--depth 0` SHALL 不展开 related Elements

#### Scenario: 新 Relationship kind 自动参与
- **WHEN** Metamodel 声明新的 Relationship kind 且 Formal Model 使用该 kind
- **THEN** `arch impact` SHALL 无需硬编码列表更新即可遍历并输出该 Relationship

### Requirement: arch impact SHALL 投影 canonical shortest paths

命令 SHALL 为每个 focus Element 到每个 related Element 返回一条 canonical shortest path。Path step SHALL 包含 canonical `source`、`kind`、`target` 与相对 `traversal` direction。多个等长 shortest paths SHALL 按各 step 的 `source`、`kind`、`target` 字典序选择一条；完整 depth-bounded `relations` 子图 SHALL 继续包含其他 edges。

#### Scenario: 等长路径选择稳定
- **WHEN** focus Element 到 related Element 存在多个等长 shortest paths
- **THEN** `relationPaths` SHALL 只包含字典序最小的 canonical path
- **AND** repeated execution SHALL 返回同一路径

#### Scenario: cycles 不导致无限遍历
- **WHEN** Relationship graph 包含 cycle
- **THEN** 命令 SHALL 在 requested depth 内终止
- **AND** SHALL 返回去重、稳定排序的 Elements、Relationships 与 canonical paths

#### Scenario: 非 canonical path edges 仍可见
- **WHEN** 某个 edge 未进入选定的 canonical shortest path 但位于 depth-bounded subgraph
- **THEN** 该 edge SHALL 仍出现在 `relations`

### Requirement: arch impact SHALL 分离 refinement context

命令 SHALL 始终返回每个 focus Element 到唯一 Project Root 的完整 ancestor chain，并 SHALL 按 `--depth` 返回 focus descendants。Containment SHALL 作为 `refinementContext` 独立投影，MUST NOT 消耗 Relationship hop，也 MUST NOT 出现在 `relationPaths`。

#### Scenario: ancestor chain 完整返回
- **WHEN** focus Element 位于多层 refinement hierarchy
- **THEN** `refinementContext` SHALL 包含从其 parent 到 Project Root 的完整 chain

#### Scenario: descendants 按 depth 展开
- **WHEN** focus Element 具有多层 children 且用户指定 `--depth 1`
- **THEN** `refinementContext` SHALL 包含 direct children
- **AND** SHALL NOT 包含更深 descendants

#### Scenario: nesting 不成为 Relationship impact
- **WHEN** 一个 Element 仅因 containment 与 focus Element 相邻
- **THEN** 它 MAY 出现在 `refinementContext`
- **AND** SHALL NOT 仅因此出现在 `relationPaths`

### Requirement: arch impact SHALL 返回完整 Element Contracts

命令 SHALL 通过 Formal Spec Registry 的 singular owner binding 定位所有 returned Elements 的 zero-or-more owned Specs，并 SHALL 返回每个 Contract 的 `specId`、owner `elementId`、project-relative path 与完整 Markdown `content`。输出 SHALL 同时返回 focus、Element、Relationship 与 Contract 规模统计，且 SHALL NOT 静默截断结果。

#### Scenario: 返回完整 Contract Markdown
- **WHEN** returned Element 拥有一个或多个 Formal Specs
- **THEN** `contracts` SHALL 包含每个 Spec 的完整当前 Markdown
- **AND** SHALL 按 `elementId` 与 `specId` 稳定排序

#### Scenario: optional Contract 缺失正常返回
- **WHEN** returned Element 的 contract policy 为 optional 且没有 owned Spec
- **THEN** 命令 SHALL 正常返回该 Element
- **AND** SHALL NOT 为其合成空 Contract

#### Scenario: required Contract 缺失时失败
- **WHEN** returned Element 的 contract policy 为 required 且没有有效 owner binding
- **THEN** 命令 SHALL 非零退出
- **AND** SHALL 报告缺失 Contract 的 stable `elementId`

#### Scenario: Windows 上读取完整 Contracts
- **WHEN** 在 Windows 上执行 `arch impact`
- **THEN** CLI SHALL 使用 Node.js path utilities 读取 Formal Specs
- **AND** 输出 SHALL 与 macOS、Linux 保持相同的 logical identities 和排序

### Requirement: arch impact SHALL 只处理 Formal Semantic Model

命令 SHALL 只读取 `.xirang/architecture/` 与 `.xirang/specs/`，SHALL NOT 提供 `--change` 或 `--code`，SHALL NOT 读取 Change artifacts、Semantic Delta、`src/`、CodeGraph 或 Git evidence，也 SHALL NOT 输出 `mustChange`、`mustVerify`、`architectureDrift` 等 Agent judgments。

#### Scenario: active Change 不改变结果
- **WHEN** 项目存在 active Change 且调用方未修改 Formal Semantic Model
- **THEN** `arch impact` 结果 SHALL 与没有该 Change 时相同
- **AND** SHALL NOT 加载 Change 目录

#### Scenario: 命令不分析代码
- **WHEN** Formal Element 与实现 symbol 名称不同
- **THEN** 命令 SHALL NOT 搜索或猜测实现文件
- **AND** 输出 SHALL 不包含 files、symbols、imports 或 calls

#### Scenario: 命令保持只读
- **WHEN** `arch impact` 成功或失败
- **THEN** 命令 SHALL NOT 创建 report、cache 或其他项目文件

### Requirement: arch impact SHALL 共享统一输出投影

Human-readable 与 `--json` 输出 SHALL 从同一个 canonical result object 生成。JSON SHALL 包含 `focusElements`、`elements`、`refinementContext`、`relations`、`relationPaths`、`contracts`、`statistics` 与 `diagnostics`，所有 collections SHALL 使用 stable identities 确定性排序。

#### Scenario: JSON 输出可重复
- **WHEN** Formal Semantic Model 未变化且 repeated execution 使用相同参数
- **THEN** JSON semantic content 与 collection order SHALL 相同

#### Scenario: 无相关 Relationships 正常返回
- **WHEN** focus Element 在 requested depth 内没有 semantic Relationships
- **THEN** 命令 SHALL exit code `0`
- **AND** SHALL 返回空 `relations` 与 `relationPaths`
- **AND** SHALL 继续返回 focus Element、refinement context 与 Contracts

