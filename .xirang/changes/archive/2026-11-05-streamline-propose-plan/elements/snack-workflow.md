---
entity: element-declaration
identity: snack-workflow
kind: element
parent: snack
title: Snack Workflow
definition: Snack Workflow 定义 snack 从已写代码反向 reconcile proposal、delta Contracts、design 与 Semantic Delta 的 code-first workflow：条件式 artifact reconcile、多源代码证据、独立判断 Behavior/Architecture Source impact、制品定义先行写作、不生成 `tasks.md` 与自检流程。
---

## MODIFIED Sections

### Section: Snack 独立判断 Behavior Source impact

Snack SHALL 独立判断 Element Contract impact。Element 的 Contract 由该 Element 的稳定 identity 定位（Contract 正文承载于宿主 Element 的 `elements/` 单元，一个 Element 至多一个 Contract）；optional element 没有 Contract 不构成 coverage gap。

- **新 contract module**

  - target element 的 contract 需要独立新 Contract
  - SHALL 在 change `elements/` 分区为该 Element 创建或更新 delta 单元
  - SHALL 使用该 Element 的稳定 identity 定位宿主单元

- **Behavior-preserving refactor**

  - code 只重构 implementation 且 Element Contract 不变
  - SHALL NOT 创建 delta Contract
  - later verification SHALL 对照该 formal Contract Section 给出可观察验证方向

- **Required contract 缺失**

  - Metamodel 要求 contract 且宿主 Element 没有 Contract
  - SHALL 报 source completeness gap
  - MUST NOT 在 owner 未确认时自动创建 Contract 单元
