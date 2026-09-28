---
entity: element-declaration
identity: section
kind: element
parent: element-contract
title: Section
definition: Section 是 Element Contract 中具有稳定 identity 的规范性语义单元，用于表达宿主 Element 在自身抽象层级上的一项可独立演进的职责、保证、约束或行为。它是业务规格的顶层大点：组内以自由形式完整表达该大点的内容，不限定表达载体，也不要求固定的子标题结构。
---

## Specification

### Section: 承载一项可独立演进的规范承诺

Section SHALL 在宿主 Element 自身抽象层级上表达一项可独立演进的职责、保证、约束或行为。

- 一项语义能够独立新增、修改或移除，而不要求同一 Contract 中其他 Sections 同时改变时，它 SHALL 以独立 Section 表达。

### Section: 作为 Contract 的差量单位

Section SHALL 具有稳定 identity，并作为 Semantic Delta 直接作用于 Element Contract 的最小单位；identity 由宿主 Element identity 与 Section 标题共同确定，跨模型全局寻址使用 `<element identity>#<title>`。

- 目标状态只改变一个 Section 时，Semantic Delta 直接寻址该 Section，而不替换整份 Contract。
- Section 标题发生变化表示旧 Section 与新 Section，而不是同一个 Section 改名。

### Section: 组内内容不受载体与结构限制

Section 正文 SHALL 以最能完整表达该大点语义的形式书写，SHALL NOT 被限定为固定载体，也 SHALL NOT 被要求提供固定子标题结构。

- 允许的载体包括散文、列表、表格、决策表、公式与输入输出依赖表、伪代码块、事件三元组、状态机、时序图或其它更能贴合语义的形式。
- 组内 MAY 使用自定子标题组织内容；子标题不构成稳定 identity，也不参与差量寻址。
- 规范 SHALL NOT 因缺少某类结构、某个子标题或某种载体而判定 Section 无效。

### Section: 业务规格覆盖的必备大点

Element Contract SHALL 以 Section 承载业务规格内容标准要求的常驻基底三项——业务目标、范围与边界排除、核心业务逻辑实现——并 SHALL 在业务具备相应工程特征时显式挂载对应的 +N 大点，而 SHALL NOT 将这类内容隐含在自然语言中。

- 业务目标以 Element Declaration 的 `definition` 表达，不重复为 Section。
- 是否存在并发竞争、触发源与时序、外部依赖与降级、实体状态生命周期、关键验收用例等特征，由撰写者判断并显式挂载对应大点。
- 关键验收用例以「关键验收案例」大点承载，其内部使用 `#### Acceptance Case:` 表达。

### Section: 引用稳定 identity

Section 正文中的标识符与示例 SHALL 引用 Semantic Model 中的稳定 Element identity。

- 引用模型元素时 SHALL 使用稳定 identity（如 `apply`、`quality`）。
- Agent 读取正文中的点分标识符时 SHALL 将其作为 identity 查询，SHALL NOT 从 dot segments 猜测固定层级。

### Section: 正文不承载实现设计

Section SHALL 表达规范语义与业务机制，SHALL NOT 直接搬运编程语言语句、遍历下标、指针或语言级数据结构 API。

- 记录实现选择、被否决方案或代码组织方式的说明 SHALL 路由到 `design.md` 或 `tasks.md`。
- 表达业务机制 MAY 使用中性动词与统一缩进，去除语言级语法噪音。
