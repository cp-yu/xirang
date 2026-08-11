---
entity: element-declaration
identity: arch-outline
kind: element
parent: deterministic-operations
title: Arch Outline
definition: Arch Outline 定义 `xirang arch outline` 的确定性模型结构总览能力：它为 Agent 的整体语义认知与遗忘恢复投影全部 Element identities 和 hierarchy、全部 persisted Relationships 及完整 Metamodel Kinds，并只在配置深度内携带完整 Element Definition；它不返回 Authored Views、Element Contracts、实现证据或 Agent 判断，也不维护跨调用状态。
---

## Requirements

### Requirement: arch outline SHALL 投影完整模型结构

`xirang arch outline` SHALL 从 Formal Semantic Model 投影全部 Element Declarations 的结构身份与 hierarchy、全部 persisted Relationships，以及全部 Element Kind 和 Relationship Kind declarations。Element collections SHALL 使用稳定 identity，Relationships SHALL 保留 canonical `source`、`kind`、`target`，Metamodel Kinds SHALL 包含其完整约束字段与定义正文。

#### Scenario: 输出全部 Element hierarchy

- **WHEN** Formal Semantic Model 包含任意深度的 Elements
- **THEN** outline SHALL 返回每个 Element 的 `identity`、`kind`、`title`、`parent`、`children` 与 hierarchy `depth`
- **AND** SHALL NOT 因 Element Definition 未加载而省略该 Element

#### Scenario: 输出全部 Relationships

- **WHEN** Formal Semantic Model 包含 persisted Relationships
- **THEN** outline SHALL 返回全部 Relationships，且不按 Definition depth 裁剪
- **AND** 每条 Relationship SHALL 保留 canonical `source`、`kind`、`target`

#### Scenario: 输出完整 Metamodel Kinds

- **WHEN** Metamodel 声明 Element Kinds 与 Relationship Kinds
- **THEN** outline SHALL 返回每个 Kind 的完整 declaration fields 与定义正文
- **AND** SHALL NOT 使用 Element Definition depth 裁剪 Kind 内容

#### Scenario: 排除 Views 与 Contracts

- **WHEN** Formal Semantic Model 同时包含 Authored Views 与 Element Contracts
- **THEN** outline SHALL NOT 返回 Authored Views、Requirements 或 Scenarios
- **AND** SHALL NOT 将 Contract 存在状态误作 Contract 内容返回

### Requirement: arch outline SHALL 按深度加载 Element Definition

Outline SHALL 使用有效 `architecture.outline.elementDefinitionDepth` 决定 Element Definition projection，默认值 SHALL 为 `2`。Project Root depth SHALL 为 `0`；配置深度内的 Element SHALL 返回完整 `definition` 与 `definitionState: loaded`，更深 Element SHALL 返回 `definitionState: unloaded` 并省略 `definition`。命令 SHALL NOT 生成摘要或截断 Definition。

#### Scenario: 默认加载 Root 到孙层

- **WHEN** 用户未传入 `--definition-depth` 且有效配置值为 `2`
- **THEN** depth `0`、`1`、`2` 的 Elements SHALL 携带完整 Definition
- **AND** depth 大于 `2` 的 Elements SHALL 保持可发现但不携带 Definition

#### Scenario: 显式覆盖本次调用

- **WHEN** 用户运行 `xirang arch outline --definition-depth 1`
- **THEN** 本次 projection SHALL 只为 depth `0` 与 `1` 的 Elements 加载 Definition
- **AND** SHALL NOT 修改项目配置或后续调用的默认值

#### Scenario: 零深度只加载 Project Root

- **WHEN** 有效 Definition depth 为 `0`
- **THEN** 只有唯一 Project Root SHALL 携带完整 Definition
- **AND** 所有 descendants、Relationships 与 Metamodel Kinds SHALL 继续返回

#### Scenario: 非法命令深度失败

- **WHEN** `--definition-depth` 不是非负整数
- **THEN** 命令 SHALL 非零退出并报告合法值约束
- **AND** SHALL NOT 静默替换为默认值

### Requirement: arch outline SHALL 支持确定性多格式输出

命令 SHALL 通过 `--format` 支持 `text`、`markdown` 与 `json`，默认 SHALL 为 `text`。三种格式 SHALL 从同一个 canonical result object 生成，并在模型与参数不变时保持集合与顺序确定。

#### Scenario: JSON 暴露有效 Definition depth

- **WHEN** 用户运行 `xirang arch outline --format json`
- **THEN** 输出 SHALL 为有效 JSON，并包含 effective `elementDefinitionDepth`、Elements、Relationships、Metamodel 与规模统计
- **AND** loaded 与 unloaded Definition 状态 SHALL 可由结构化字段区分

#### Scenario: text 与 markdown 保持 hierarchy

- **WHEN** 用户选择 `text` 或 `markdown`
- **THEN** formatter SHALL 呈现完整 Element hierarchy
- **AND** SHALL 明确区分未加载 Definition，且不得以截断文本代替

#### Scenario: repeated execution 保持确定性

- **WHEN** Formal Semantic Model、配置与命令参数未变化
- **THEN** repeated execution 的 semantic content 与 collection order SHALL 相同

### Requirement: arch outline SHALL 保持无状态只读

命令 SHALL 每次直接读取 Formal Semantic Model 与当前项目配置，SHALL NOT 创建 cache、fingerprint、session state、report 或其他项目文件。命令 SHALL NOT 读取 active Changes、Semantic Delta、实现代码或 Git evidence。

#### Scenario: 上下文遗忘后重新调用

- **WHEN** Agent 在上下文压缩或长会话后重新执行相同 outline command
- **THEN** CLI SHALL 从当前 Formal Semantic Model 重新计算完整 projection
- **AND** 结果 SHALL NOT 依赖此前调用历史

#### Scenario: 模型缺失失败

- **WHEN** Formal Semantic Model 不存在或校验失败
- **THEN** 命令 SHALL 非零退出并报告模型错误
- **AND** SHALL NOT 以空 outline 表示完整模型

#### Scenario: 跨平台读取项目配置与模型

- **WHEN** 在 Windows、macOS 或 Linux 上执行 outline
- **THEN** CLI SHALL 使用 Node.js path utilities 定位项目配置和 Formal Semantic Model
- **AND** SHALL 返回相同 logical identities 与确定性排序
