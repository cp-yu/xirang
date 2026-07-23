---
element: cap.ai.explore-terminology-decision
---

# explore-terminology-decision Specification

## Purpose
定义 Explore 对 Impact Sweeper `terminologyObservations` 的确定性解释、提问顺序和对话内决策记录，使术语不确定性在影响范围讨论前解决，而不向用户暴露内部报告结构。

## Requirements
### Requirement: Explore 执行四态术语判断

Explore main agent SHALL 根据 `terminologyObservations` 执行四态判断。

#### Scenario: 字段缺失或未发现相关术语

- **WHEN** report 不包含 `terminologyObservations`
- **OR** `foundInSpecs` 为空
- **THEN** main agent SHALL 跳过术语问题
- **AND** SHALL 继续处理其他 canonical impact fields
- **AND** SHALL NOT 因术语提取不可用而报错或警告用户

#### Scenario: 唯一术语与用户输入一致

- **WHEN** `foundInSpecs` 仅包含一个术语
- **AND** 该术语等于 `userInput`
- **THEN** main agent SHALL 跳过术语问题
- **AND** SHALL 继续正常 Explore 流程

#### Scenario: 用户术语与 Specs 术语不匹配

- **WHEN** `foundInSpecs` 包含至少一个术语
- **AND** 没有任何术语等于 `userInput`
- **THEN** main agent SHALL 提出一个问题，询问用户输入与发现的术语是否表示同一概念
- **AND** SHALL 最多为每个术语显示前两个 Spec ID

#### Scenario: Specs 使用多个相关术语

- **WHEN** `foundInSpecs` 包含多个术语
- **AND** 其中一个术语等于 `userInput`
- **THEN** main agent SHALL 提出一个问题，询问这些术语是不同概念，还是应选择 canonical term
- **AND** SHALL NOT 自行合并或翻译术语

### Requirement: 术语问题服从 Explore 提问纪律

术语问题 SHALL 先于 report `questions` 和其他 impact questions，并 SHALL 服从一次一问纪律。

#### Scenario: 术语问题优先

- **WHEN** report 同时包含会触发提问的 `terminologyObservations` 与非空 `questions`
- **THEN** main agent SHALL 先单独提出术语问题
- **AND** SHALL 等待用户回答
- **AND** SHALL NOT 在同一轮混入 report `questions`

#### Scenario: Impact questions 逐个选择

- **WHEN** 术语问题已解决且 report 包含多个 `questions`
- **THEN** main agent SHALL 将其视为候选问题
- **AND** SHALL 根据当前 scope 优先级每轮最多提出一个问题

### Requirement: 术语提问保持用户可读

术语问题的自然语言 SHALL 跟随用户主要交流语言，并 SHALL 保持发现术语的原始形式。

#### Scenario: 提问语言与对话一致

- **WHEN** main agent 需要提出术语问题
- **THEN** prose SHALL 使用用户主要交流语言
- **AND** terms、Spec IDs、commands、paths、schema keys 与 OPSX tokens SHALL 保持原样

#### Scenario: 不暴露内部实现

- **WHEN** main agent 呈现术语问题
- **THEN** SHALL NOT 暴露 `terminologyObservations`、`foundInSpecs` 等 JSON field names
- **AND** SHALL NOT 暴露 Sweeper、四态判断或其他内部实现细节

#### Scenario: Spec ID 显示截断

- **WHEN** 某个术语出现在两个以上 Specs 中
- **THEN** main agent SHALL 最多显示前两个 Spec ID
- **AND** SHALL 使用符合用户语言的省略表达说明还有其他 Specs

### Requirement: 长术语列表正确截断

main agent SHALL 将待展示术语按 `count` 降序排列，同 count 时按 term 稳定排序，并最多显示前五项。

#### Scenario: 超过五个术语

- **WHEN** `foundInSpecs.length > 5`
- **THEN** main agent SHALL 仅显示前五个术语
- **AND** SHALL 说明剩余数量为 `foundInSpecs.length - 5`
- **AND** SHALL NOT 将术语总数误报为剩余数量

### Requirement: 用户术语决策仅记录于当前对话

main agent SHALL 接受 same-concept、canonical-term 与 different-concepts 决策，并在当前 Explore 对话中抑制相同术语组的重复提问。

#### Scenario: 用户确认同一概念

- **WHEN** 用户确认一组术语表示同一概念
- **THEN** main agent SHALL 记录 same-concept group
- **AND** SHALL 继续 Explore 流程
- **AND** SHALL NOT 再次询问相同术语组

#### Scenario: 用户选择 canonical term

- **WHEN** 用户为一组术语选择 canonical term
- **THEN** main agent SHALL 记录该 canonical term
- **AND** MAY 将其纳入 conversation-only Design Summary
- **AND** SHALL NOT 再次询问相同术语组

#### Scenario: 用户确认不同概念

- **WHEN** 用户确认一组术语表示不同概念
- **THEN** main agent SHALL 记录 rejected term group
- **AND** SHALL 继续 Explore 流程
- **AND** SHALL NOT 再次询问相同术语组

#### Scenario: Explore 不持久化术语决策

- **WHEN** main agent 记录任何术语决策
- **THEN** 决策 SHALL 仅存在于当前对话状态
- **AND** Explore SHALL NOT 为该决策创建或修改项目文件
