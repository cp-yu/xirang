---
entity: element-declaration
identity: arch-outline
kind: element
parent: deterministic-operations
title: Arch Outline
definition: Arch Outline 定义 `xirang arch outline` 的确定性模型结构总览能力：它为 Agent 的整体语义认知与遗忘恢复投影全部 Element identities 和 hierarchy、全部 persisted Relationships 及完整 Metamodel Kinds，并只在配置深度内携带完整 Element Definition；它不返回 Authored Views、Element Contracts、实现证据或 Agent 判断，也不维护跨调用状态。
---

## MODIFIED Sections

### Section: arch outline SHALL 投影完整模型结构

`xirang arch outline` SHALL 默认投影全部 Element identities 与 hierarchy，包含 identity、kind、title、parent、children 与 depth；默认不返回 Relationships、Metamodel 或 Element Definitions。通过明确的命令选项，调用方 MAY 展开完整 Relationships、Metamodel Kinds 与配置深度内的完整 Definitions。无论 projection 如何选择，Element hierarchy SHALL 完整，不得因 Definition 未加载而省略 Element；任何被展开的规范内容 SHALL 原样完整，不得摘要或截断。

- **默认层级导航**

  - 用户运行 `xirang arch outline --format json`
  - 输出 SHALL 包含全部 Element identities、kind、title、parent、children 与 depth
  - 默认不包含 Relationships、Metamodel 或 Definitions

- **显式展开 Relationships 与 Metamodel**

  - 调用方显式选择相应 outline projection
  - 返回全部 persisted Relationships 与完整 Element Kind、Relationship Kind declarations
  - relationships 保持 canonical `source`、`kind`、`target`

- **显式展开 Definitions**

  - 用户通过现有 `--definition-depth <n>` 选择 Definition 深度
  - 深度范围内返回完整 Definition 并标记 loaded，其他 Element 保持可发现且不带 Definition
  - 不生成摘要或截断 Definition

- **排除 Contracts 与 Views**

  - Formal Semantic Model 同时包含 Authored Views 与 Element Contracts
  - outline SHALL NOT 返回 Authored Views、Sections 或 Acceptance Cases
  - SHALL NOT 将 Contract 存在状态误作 Contract 内容返回

### Section: arch outline SHALL 支持确定性多格式输出

命令 SHALL 通过 `--format` 支持 `text`、`markdown` 与 `json`，默认 SHALL 为 `text`。三种格式从同一个 canonical result object 生成，Element hierarchy、显式选择的 semantic expansions 与 statistics 在模型及参数不变时保持集合与顺序确定。

- **JSON 返回导航和所选投影**

  - 用户运行 `xirang arch outline --format json`
  - 输出 SHALL 包含完整 Element hierarchy 与规模统计
  - Relationships、Metamodel 与 Definition 字段仅在对应 projection 被显式选择时出现
  - 未加载 Definition SHALL 与层级节点保持可区分

- **文本格式遵循 projection 选择**

  - 用户选择 `text` 或 `markdown`
  - formatter SHALL 呈现完整 Element hierarchy 与显式选择的 semantic expansions
  - 未加载 Definition SHALL 明确区分，且不得以截断文本代替

- **重复执行保持确定性**

  - Formal Semantic Model、配置与命令参数未变化
  - repeated execution 的 semantic content 与 collection order SHALL 相同

### Section: arch outline SHALL 按深度加载 Element Definition

Outline SHALL 使用有效 `architecture.outline.elementDefinitionDepth` 决定显式请求的 Element Definition projection，默认配置值 SHALL 为 `2`。Project Root depth SHALL 为 `0`；显式选择 Definition projection 时，配置深度内的 Element SHALL 返回完整 `definition` 与 `definitionState: loaded`，更深 Element SHALL 返回 `definitionState: unloaded` 并省略 `definition`。未选择 Definition projection 时所有 Element 仅用于层级导航。命令 SHALL NOT 生成摘要或截断 Definition。

- **默认不加载 Definition**

  - 用户未传入 Definition projection 选项
  - outline 返回完整 hierarchy，但省略所有 Definition 正文

- **显式加载配置深度**

  - 用户显式选择 Definition projection 且未传入 `--definition-depth`
  - depth `0`、`1`、`2` 的 Elements 携带完整 Definition
  - depth 大于 `2` 的 Elements 保持可发现且不携带 Definition

- **显式覆盖本次调用**

  - 用户运行 `xirang arch outline --definition-depth 1` 并选择 Definition projection
  - 本次 projection 只为 depth `0` 与 `1` 的 Elements 加载 Definition
  - SHALL NOT 修改项目配置或后续调用默认值

- **零深度只加载 Project Root**

  - 有效 Definition depth 为 `0` 且已选择 Definition projection
  - 只有唯一 Project Root 携带完整 Definition
  - 所有 descendants、Relationships 与 Metamodel Kinds SHALL 继续按各自显式选项返回

- **非法命令深度失败**

  - `--definition-depth` 不是非负整数
  - 命令 SHALL 非零退出并报告合法值约束
  - SHALL NOT 静默替换为默认值
