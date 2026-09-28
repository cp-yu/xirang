---
entity: element-declaration
identity: acceptance-case
kind: element
parent: section
title: Acceptance Case
definition: Acceptance Case 是「关键验收案例」Section 内部的结构子单元，用于表达该 Section 在特定条件下的可观察验收结果，可直接交付测试团队转化为自动化测试契约。它是承载验收用例的专属形式，不构成通用结构要求——其它 Sections 内部不受其约束。
---

## Specification

### Section: 仅在关键验收案例大点内使用

Acceptance Case SHALL 仅在承载关键验收用例的 Section 内使用，SHALL NOT 被要求出现在其它 Section 中。

- 每个 Acceptance Case 处理一个该大点已定义的验收场景。
- 规范 SHALL NOT 因某个非验收 Section 没有 Acceptance Case 而判定 Contract 无效。

### Section: 覆盖正向、边界与冲突三类用例

关键验收案例大点 SHALL 至少给出一个标准正向成功流，并 SHALL 在业务具备相应特征时给出临界值边界流与严重冲突或异常拦截流。

- 案例数量以足够交付测试为准，SHALL NOT 要求逐一覆盖 Contract 中的每个细节。

### Section: 保持规范约束力

每个 Acceptance Case SHALL 是宿主 Section 中具有规范约束力的组成，SHALL 只表达该大点已定义的验收语义。

- 实现进入 Acceptance Case 声明的条件时，实现 SHALL 满足其规范结果。

### Section: 可直接转化为测试契约

Acceptance Case SHALL 以便于测试团队直接转化为自动化测试的表达书写，SHALL NOT 承载实现设计。

- `tasks.md` 的 Check 可通过引用该 Acceptance Case 建立验证关系。

### Section: 从属于 Section 差量

Acceptance Case SHALL NOT 作为独立 Semantic Delta Entry；其变化 SHALL 作为宿主 Section 的完整目标内容变化表达。

- 目标状态为现有验收大点增加案例时，Delta 使用 MODIFIED Section 携带该 Section 的全部目标内容。
