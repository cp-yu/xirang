---
operation: MODIFIED
entity: element-declaration
identity: confirmed-design-record
kind: "element"
parent: "design-record"
title: "中间设计记录"
definition: "中间设计记录是 Design Record 维护的当前设计制品，独立承载形成过程所需的设计状态与依据。它包含具有内容性质和决策状态的自由文本条目、已确认结构目标及相关模型基准；不等同于完整模型、Semantic Delta 或执行计划，也不独立确定 Expected Semantic Model。"
---

## MODIFIED Sections

### Section: 以条目与结构两部分表达确认内容

记录 SHALL 包含条目与结构两部分。每条条目具有稳定 identity、nature（normative 或 informative）、decision（pending、accepted 或 excluded）及自由文本 content，可用多行文本保留条件、例外、具体例子和必要依据，不设 examples、counterexamples、timing 等固定细节子字段。nature 表达内容性质，decision 表达用户决策，二者相互独立；有条目不等于已确认，更不等于实现义务。

结构部分按 Semantic Model 的形状，以语义 identity 表达 Element Declarations、Relationships、Element Kinds、Relationship Kinds；Relationship 使用 source、kind、target。纳入结构部分即表示用户已确认该对象及出现的字段，只保存已确认结构目标。未确认方案留在 pending 自由文本中，不要求先结构化，不引入第二套 identity，也不要求完整目标模型。Build 与 Change 形成共享格式，使用独立实例。

- 只确认一个行为条件即可保存 accepted 条目，不要求先补全 hierarchy。
- 待确认 Element parent 记入 pending 自由文本；用户确认后才纳入结构部分。
- informative 实验依据不因实验成功成为 accepted normative 设计。

### Section: 保持稳定身份与最新状态

记录 SHALL 使用不可变 explorationId、可变 slug 和稳定条目及结构对象身份，表达最新实际设计及其决策状态。修订局部更新并保留无关内容，不累积相互冲突的对话版本，不要求 revision history 或整体 readiness 字段。记录级 sourceVersion 覆盖完整内容，不增加条目级版本。

- 重命名 slug 后 explorationId 及未变条目身份不变。
- 获用户允许修订已采纳条目时保存最新内容，不并列保留冲突版本，也不通过降为 pending 绕过确认。
