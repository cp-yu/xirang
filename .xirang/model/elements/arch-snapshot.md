---
entity: element-declaration
identity: arch-snapshot
kind: element
parent: deterministic-operations
title: Arch Snapshot
definition: Arch Snapshot 定义 `xirang arch snapshot` 的模型骨架投影行为：一次性输出全部 Element Declarations、全部 Relationships 与 Metamodel Kinds（含定义），不含 Element Contract；以 text / markdown / json 三格式序列化，供 Agent 在 workflow 启动时作为项目模型总览注入上下文；只处理 Formal Semantic Model。
---

## Requirements

### Requirement: snapshot SHALL 输出完整模型骨架

`xirang arch snapshot` SHALL 一次性输出 Formal Semantic Model 的全部 Element Declarations、全部 Relationships 与 Metamodel 声明的 Element Kinds 与 Relationship Kinds，且 SHALL NOT 包含任何 Element Contract 内容。输出 SHALL 提供确定性排序，repeated execution 在模型不变时产生相同结果。

#### Scenario: 输出全部 Element Declarations

- **WHEN** 运行 `xirang arch snapshot`
- **THEN** 输出 SHALL 包含模型中的每个 Element Declaration
- **AND** 每个元素 SHALL 携带 identity、kind 与完整 definition
- **AND** SHALL NOT 包含任何 Requirements

#### Scenario: 输出全部 Relationships

- **WHEN** 运行 `xirang arch snapshot`
- **THEN** 输出 SHALL 包含模型中的全部持久化 Relationships（不按 focus 裁剪）
- **AND** 每条 SHALL 保留 canonical `source`、`kind`、`target`

#### Scenario: 输出 Metamodel Kinds

- **WHEN** 运行 `xirang arch snapshot`
- **THEN** 输出 SHALL 包含全部 Element Kinds（含 contract 策略）与 Relationship Kinds
- **AND** 每个 Kind SHALL 携带其定义正文（存在时）

#### Scenario: 输出确定性可重复

- **WHEN** Formal Semantic Model 未变化且 repeated execution 使用相同参数
- **THEN** 输出集合与顺序 SHALL 相同

### Requirement: snapshot SHALL 以嵌套树表达层级

Element Declarations SHALL 以嵌套树呈现：缩进表达 parent/children 层级，parent 字段不重复出现。每个节点 SHALL 显示 identity、kind 与 definition；title 与 parent 字段 SHALL NOT 出现在节点行中。

#### Scenario: 嵌套隐含 parent

- **WHEN** 一个 Element 具有 children
- **THEN** children SHALL 作为其树节点下的缩进后代出现
- **AND** 节点行 SHALL NOT 重复父 identity

#### Scenario: 根元素作为树根

- **WHEN** 模型包含唯一 Project Root
- **THEN** 树 SHALL 以该 Root 为根
- **AND** 无 parent 的非根 Element SHALL 不出现（模型不完整时按错误处理）

### Requirement: snapshot SHALL 支持 text / markdown / json 三格式

命令 SHALL 通过 `--format` 选择输出格式：`text`（默认，box-drawing 树）、`markdown`（嵌套列表）与 `json`（结构化对象）。三格式 SHALL 从同一模型投影生成，语义一致。

#### Scenario: 默认 text 格式

- **WHEN** 省略 `--format`
- **THEN** 输出 SHALL 为 box-drawing 文本树（`└──` / `├──` 分支）
- **AND** 关系与 Metamodel 部分 SHALL 以文本段落呈现

#### Scenario: markdown 格式

- **WHEN** `--format markdown`
- **THEN** 元素树 SHALL 为缩进嵌套列表（`- ` 前缀）
- **AND** 关系与 Metamodel 部分 SHALL 以 Markdown 呈现

#### Scenario: json 格式

- **WHEN** `--format json`
- **THEN** 输出 SHALL 为有效 JSON，包含元素树、关系、Metamodel 与规模统计
- **AND** 所有 identity SHALL 使用稳定 identity

### Requirement: snapshot SHALL 只处理 Formal Semantic Model

命令 SHALL 只读取 Formal Semantic Model，SHALL NOT 提供 `--change` 或 `--code`，SHALL NOT 读取 Change artifacts、Semantic Delta 或实现代码，也 SHALL NOT 输出 Agent judgments。模型缺失或校验失败 SHALL 以非零状态退出并报告。

#### Scenario: 命令保持只读

- **WHEN** `xirang arch snapshot` 成功或失败
- **THEN** 命令 SHALL NOT 创建 report、cache 或其他项目文件

#### Scenario: 模型缺失失败

- **WHEN** Formal Semantic Model 不存在或校验失败
- **THEN** 命令 SHALL 非零退出
- **AND** SHALL 报告模型不可用或具体校验错误

### Requirement: snapshot SHALL 供 Agent 作为模型总览注入

Workflow skill 的共享 Semantic Model context fragment SHALL 指引 Agent 在需要项目模型总览时先运行 `xirang arch snapshot`，再用 `xirang arch query` 按需点查具体 Element 的 detail 与 Contract。

#### Scenario: shared context 指引 snapshot

- **WHEN** 检查 workflow skill 的 shared context fragment
- **THEN** fragment SHALL 包含先运行 `xirang arch snapshot` 获取模型骨架总览的指引
- **AND** SHALL 说明 Contract 需用 `xirang arch query --contract` 点查
