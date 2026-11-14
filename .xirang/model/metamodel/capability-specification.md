---
entity: element-kind
identity: capability-specification
contract: required
contractFormat: business-specification
---

`capability-specification` SHALL 标识具有明确职责边界、处理机制、异常结果和可观察验收承诺的能力规格。每个实例 SHALL 具有完整的 4+N Contract，包含 Scope and Non-goals、Business Logic、Edge Cases and Exception Handling、Key Acceptance Cases 四个固定 Section，以及有独立维护价值时的附加 Section；关键验收 Section SHALL 包含非空 Acceptance Case。

父能力 SHALL 在自身抽象层级独立表达完整承诺，子能力进一步精化。层级由语义精化关系决定，不按实现文件或固定深度划分。概念定义、工作身份和规范指导不因具有 Contract 而适用此 Kind。
