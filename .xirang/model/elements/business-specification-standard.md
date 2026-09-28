---
entity: element-declaration
identity: business-specification-standard
kind: element
parent: authoring-conventions
title: Business Specification Standard
definition: Business Specification Standard 定义业务规格类 Element Contract 的 4+N 内容结构，以四个必需 Section 承载范围、完整业务机制、异常防御与关键验收案例，并允许增加值得独立维护的规范大点。适用范围由 Element Kind 显式声明，CLI 校验必要结构，撰写者与审查者判断语义覆盖与正确性；框架概念及组织性 Element 不因具有 Contract 而自动适用。
---

## Specification

### Section: 四个固定基础 Section

业务规格类 Contract SHALL 包含以下四个标题完全一致的英文 Section；标题 SHALL NOT 随正文语言翻译，每个 Section SHALL 具有非空正文：

- `Scope and Non-goals`：职责范围与明确非目标。
- `Business Logic`：完整的核心业务机制。
- `Edge Cases and Exception Handling`：适用的边界值、异常与处理结果。
- `Key Acceptance Cases`：关键验收案例及其可观察结果。

业务目标 SHALL 由 Declaration 的 `definition` 表达，不作为第五个基础 Section。Definition 保持完整概念定义，不退化为一句用途摘要。

### Section: 适用范围显式声明

业务规格类 Element SHALL 使用同时声明 `contract: required` 与 `contractFormat: business-specification` 的 Element Kind。此 Kind 的全部实例 SHALL 满足 4+N 结构；通用框架概念及组织性 Element 不自动适用。一个 Kind 混合两类语义时，撰写者 SHALL 区分相应 Kinds，不得通过省略业务规格标记绕过检查。

CLI SHALL 根据 Kind 声明确定适用范围，SHALL NOT 从 identity、标题、路径或正文推测业务语义。未声明 contractFormat 的 Kind 保持通用 Contract 结构；声明未知格式或对业务规格声明 optional Contract SHALL 报错。

### Section: 关联业务机制集中表达

Business Logic SHALL 在宿主 Element 的抽象层级完整表达相关联的业务过程及其约束。请求校验、扣减、并发一致性、时序、返还等属于同一机制时 SHALL 在该 Section 内组织，不因存在工程特征而自动拆成额外 Sections。

组内 SHALL 允许自由子标题与载体，包括文字、伪代码、表格、公式、状态图、流程图等；图与其解释的机制放在一起。实现选型与实现理由属于 design.md，不作为业务机制的替代。

### Section: 按独立维护边界增加大点

+N 的 Section 标题 SHALL 不受固定命名约束。内容只有具有值得独立维护的规范边界时才应提升为额外 Section，不应按步骤、规则或工程特征机械拆分。

撰写者与审查者 SHALL 检查适用的状态、并发、时序、外部依赖与降级内容是否得到完整表达，但不要求这些特征各占一个 Section。

### Section: 边界与异常显式表达

Edge Cases and Exception Handling SHALL 表达适用的极值、空值、资源缺失或耗尽、安全防御和故障处理结果，可使用表格或等价载体。异常处理 SHALL 与 Business Logic 保持一致；不适用的类别无需虚构义务，无额外适用异常时仍 SHALL 在正文说明。

### Section: 验收案例作为 TDD 依据

Key Acceptance Cases SHALL 存在，且包含至少一个具备非空正文的 `#### Acceptance Case:`。Acceptance Case SHALL 仅在该 Section 内使用，以已确认意图与规范承诺为依据声明条件、动作及可观察结果；它不得引入独立语义，也不得由实现反推预期结果。

案例 SHALL 覆盖标准正向流程及适用的边界、冲突结果，数量以足够指导验收为准，不要求每个细节对应一个案例。tasks.md 的 Checks 与 TDD 测试 SHALL 追溯这些规范结果；缺少预期结果属于需要先解决的规格缺口，而不是由测试编写者自行补出业务决策。

### Section: 结构门禁与语义审查

CLI SHALL 对完整 Semantic Model 执行结构校验；验证 Change 时 SHALL 检查 Expected Semantic Model，不要求每份 Delta 重复携带未变动的基础 Sections。缺失、重复或正文为空的必需 Section、缺少或正文为空的 Acceptance Case、Acceptance Case 放在非专属 Section 中，均 SHALL 报错。

语义覆盖、规范正确性及 +N 是否值得独立维护 SHALL 由撰写者与审查者判断，结构通过不代表语义正确。完整标准由 `.xirang/references/xirang-business-specification-standard.md` 承载，Build、Explore、Propose、Apply 与 Snack 工作面 SHALL 内嵌精简根指导。
