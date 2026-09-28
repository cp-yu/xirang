---
entity: element-declaration
identity: snack
kind: element
parent: implementation-first-path
title: Snack
definition: Snack 是 Implementation-first Path 的形成阶段。它从已发生的项目实现出发，对照 Semantic Model 形成完整 Change：通过 CLI 查询 Elements、Relationships 与 Element Contracts，并结合 conversation context、working-tree / staged / HEAD 与用户指定 diff 等实现证据识别影响面；再按证据与 Semantic Model 写出或更新 Semantic Delta 以及 `proposal.md` 与 `design.md`，不生成 `tasks.md`。
---

## Specification

### Section: 从已发生实现开始 Formation

Snack SHALL 以已经发生的项目实现作为 Change Formation 输入。

- **实现先于 Change**

  - 项目改动已经存在
  - Snack 对该状态进行语义调和

### Section: 对照模型与实现证据识别影响

Snack SHALL 结合 Semantic Model 查询以及 conversation context、working tree、staged、HEAD 与用户指定 diff 等适用证据识别影响面。

- **收集已有实现证据**

  - Snack 开始
  - 它读取可用证据并与模型对照

### Section: 形成或更新 Semantic Delta

Snack SHALL 按实现证据与 Semantic Model 写出或更新 Semantic Delta。

- **实现改变规范行为**

  - 当前模型未表达已实现目标状态
  - Snack 形成对应 Delta Entries

### Section: 形成或更新意图与决策说明

Snack SHALL 写出或更新 `proposal.md` 与 `design.md`。

- **解释已有实现**

  - Change 需要记录原因与关键决策
  - Snack 调和 proposal 与 design

### Section: 保持已一致内容不变

Snack SHALL 保持已经与实现证据和 Semantic Model 一致的 Change 内容不变。

- **现有 Entry 已匹配实现**

  - 某项语义无需调整
  - Snack 不改写该内容

### Section: 不生成 Tasks

Snack SHALL NOT 生成 `tasks.md`。

- **实现已经完成**

  - Snack 形成 Change Plan
  - Plan 不包含虚构的执行任务

### Section: 完成 Formation 审查与确认

Snack SHALL 在 Change Formation 内完成必要审查与确认。

- **实现意图存在歧义**

  - 证据不能唯一确定目标语义
  - Snack 等待用户确认

### Section: 移交验证与收束

Snack 完成后，已有实现 SHALL 对照完整 Change 进入后续验证与 Change Closure。

- **Snack Formation 完成**

  - Change 已完整且确认
  - 当前实现进入 Verify

### Section: 遵循共享 Contract 语义

Snack SHALL 按共享 Element Contract、Section 与 Acceptance Case 语义调和 Contract Delta，并以 Section 的独立演进边界确定 Entries。

- **已有实现影响多个规范承诺**

  - 实现证据分别改变可独立演进的语义
  - Snack 将变化调和为独立 Section Entries，并保持 Acceptance Cases 从属于各自宿主 Section

### Section: 仅从充分证据调和 Definition

Snack SHALL 只有在已确认用户意图与实现证据足以确定稳定概念身份和边界时才创建或修改 Element Definition；文件名、类名、符号、调用关系或实现移动 SHALL NOT 单独证明 Declaration 变化。

- **代码结构不足以确定概念边界**

  - 多个 Definition 均与当前实现证据相容
  - Snack 标记未决内容并等待用户确认，不从代码结构自动生成 Definition

- **实现重构不改变概念**

  - 已发生修改只移动代码或重命名实现符号且 Element 概念边界不变
  - Snack 不产生 Declaration Delta
