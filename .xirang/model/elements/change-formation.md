---
entity: element-declaration
identity: change-formation
kind: element
parent: change-realization
title: Change Formation
definition: Change Formation 是 Change Realization 中形成完整 Change 的阶段。它在阶段内完成必要的审查与确认，并产出完整的 Semantic Delta 与 Change Plan；它可以通过 Intent-first Path 或 Implementation-first Path 完成。
---

## Specification

### Section: 产出完整 Semantic Delta
Change Formation SHALL 产出完整 Semantic Delta。

- **目标语义已明确**
  - Formation 完成
  - Delta 完整表达该 Change 的目标语义

### Section: 产出适用的完整 Change Plan
Change Formation SHALL 产出对所选形成路径完整且适用的 Change Plan。

- **Intent-first Formation**
  - 实现尚未发生
  - Plan 包含意图、决策、执行与验证安排

- **Implementation-first Formation**
  - 实现已经发生
  - Plan 包含意图与决策说明且不虚构 tasks

### Section: 完成 Formation 审查与确认
Change Formation SHALL 在本阶段内完成必要审查与确认。

- **Change 存在未决目标语义**
  - 关键语义尚未确认
  - Formation 不得完成

### Section: 选择 Formation Path
Change Formation SHALL 通过 Intent-first Path 或 Implementation-first Path 完成。

- **选择形成路径**
  - Agent 判断实现是否已经发生
  - 使用与事实相符的 Formation Path

### Section: 形成可进入实现的 Change
Change Formation 完成后，完整 Change SHALL 可进入 Change Implementation。

- **Formation 出口**
  - Delta、Plan、审查和确认均已完成
  - Change 进入 Change Implementation
