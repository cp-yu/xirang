---
entity: element-declaration
identity: "business-specification-standard"
kind: "element"
parent: "authoring-conventions"
title: "Business Specification Standard"
definition: "Business Specification Standard 定义业务规格类 Element Contract 的 4+N 内容结构，以四个必需 Section 承载范围、完整业务机制、异常防御与关键验收案例，并允许增加值得独立维护的规范大点。适用范围由 Element Kind 显式声明，CLI 校验必要结构，撰写者与审查者判断语义覆盖与正确性；框架概念及组织性 Element 不因具有 Contract 而自动适用。"
---

## MODIFIED Sections

### Section: 验收案例作为 TDD 依据

Key Acceptance Cases SHALL 存在，且包含至少一个具备非空正文的 `#### Acceptance Case:`。Acceptance Case SHALL 仅在该 Section 内使用，以已确认意图与规范承诺为依据声明条件、动作及可观察结果；它不得引入独立语义，也不得由实现反推预期结果。

案例 SHALL 覆盖标准正向流程及适用的边界、冲突结果，数量以足够指导验收为准，不要求每个细节对应一个案例。tasks.md 的目标及验证方向与 TDD 测试 SHALL 追溯这些规范结果；缺少预期结果属于需要先解决的规格缺口，而不是由测试编写者自行补出业务决策。
