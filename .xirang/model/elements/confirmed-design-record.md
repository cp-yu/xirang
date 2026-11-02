---
entity: element-declaration
identity: confirmed-design-record
kind: element
parent: design-record
title: 中间设计记录
definition: 中间设计记录是 Design Record 维护的当前设计制品，独立承载形成过程所需的设计状态与依据。它包含具有内容性质和决策状态的自由文本条目、已确认结构目标及相关模型基准；不等同于完整模型、Semantic Delta 或执行计划，也不独立确定 Expected Semantic Model。
---

## Specification

### Section: 以条目与结构两部分表达确认内容

记录 SHALL 包含条目与结构两部分。每条条目具有稳定 identity、nature（normative 或 informative）、decision（pending、accepted 或 excluded）及自由文本 content，可用多行文本保留条件、例外、具体例子和必要依据，不设 examples、counterexamples、timing 等固定细节子字段。nature 表达内容性质，decision 表达用户决策，二者相互独立；有条目不等于已确认，更不等于实现义务。

结构部分按 Semantic Model 的形状，以语义 identity 表达 Element Declarations、Relationships、Element Kinds、Relationship Kinds；Relationship 使用 source、kind、target。纳入结构部分即表示用户已确认该对象及出现的字段，只保存已确认结构目标。未确认方案留在 pending 自由文本中，不要求先结构化，不引入第二套 identity，也不要求完整目标模型。Build 与 Change 形成共享格式，使用独立实例。

- 只确认一个行为条件即可保存 accepted 条目，不要求先补全 hierarchy。
- 待确认 Element parent 记入 pending 自由文本；用户确认后才纳入结构部分。
- informative 实验依据不因实验成功成为 accepted normative 设计。

### Section: 结构部分表达目标状态

结构部分的每个对象 SHALL 表达用户确认后的目标状态；删除 SHALL 以 `removed: true` 显式标出。未出现在结构部分的对象只表示尚未确认，SHALL NOT 解释为删除。记录 SHALL NOT 保存 ADDED / MODIFIED / REMOVED 操作；新增或修改由 CLI 对照当前模型推导并报告，编译时再生成带 operation 的 Delta。Element Declaration MAY 只含已确认的字段；后续字段确定时若需修改已确认字段，SHALL 经用户裁决。

- **未提及不等于删除**

  - 记录结构部分只含 Element A，而当前模型还有 Element B
  - B 视为尚未确认，不生成删除。

- **显式删除**

  - 用户确认删除 Element C
  - 结构部分以 identity C 加 `removed: true` 表达，编译为 REMOVED Delta 条目。

- **部分确认的 Declaration**

  - 用户只确认 Element D 的 parent 与 kind，definition 未定
  - 记录只含这两个字段；之后 definition 确定时发现 parent 需调整，经用户裁决后修改，并标为修改已确认字段。

- **模型变化后重新推导**

  - 记录对象时当前模型不含该对象，之后另一 Change 已加入同一对象
  - CLI 按新模型重新推导为修改或一致，不保留过时的操作标签。

### Section: 保持稳定身份与最新状态

记录 SHALL 使用不可变 explorationId、可变 slug 和稳定条目及结构对象身份，表达最新实际设计及其决策状态。修订局部更新并保留无关内容，不累积相互冲突的对话版本，不要求 revision history 或整体 readiness 字段。记录级 sourceVersion 覆盖完整内容，不增加条目级版本。

- 重命名 slug 后 explorationId 及未变条目身份不变。
- 获用户允许修订已采纳条目时保存最新内容，不并列保留冲突版本，也不通过降为 pending 绕过确认。

### Section: 保存相关 Semantic Model 基准快照

记录 SHALL 保存 CLI 计算的来源版本标识及相关上下文基准，以区分捕获时不存在的 formal model、存在且有效的模型及之后上下文变化。相关语义身份包括结构部分的对象及显式关联的 identity，SHALL NOT 以自然语言猜测完整依赖范围；CLI 比较能确定的上下文变化，其结果不是语义覆盖证明。

- **首次 Build 无正式模型**

  - 合法 Build 上下文中尚不存在 formal model
  - 基准明确记录缺失状态，允许保存已确认设计。

- **模型损坏不等于缺失**

  - formal source 存在但解析或校验失败
  - 返回错误，不以不存在的基准继续写入。

- **上下文变化可见**

  - 记录捕获后关联的模型上下文发生变化
  - 报告变化与可用差异，消费者重查相关结论，不宣称自动判断语义冲突。

### Section: 仅作为形成来源与历史记录

记录 SHALL 为 Build 或 Propose 提供形成依据；目标完成覆盖检查与适用校验后，精确来源快照与覆盖检查结果仅作为形成历史保存，便于后续审计。Candidate 来源与覆盖结果可绑定 review digest 并进入 Build history，但 SHALL NOT 提升进 formal partitions；Change 来源与覆盖结果 SHALL NOT 参与 Expected Semantic Model、sync 或 Closure 的规范语义计算。

- **Change 来源完成交接**

  - 完整 Change 通过覆盖门禁与校验并完成来源消费
  - 来源快照与覆盖结果保留为形成历史，目标语义仍仅由 Semantic Model 与 Semantic Delta 决定。

- **Build 来源保留而不提升**

  - 带来源快照与覆盖结果的 Candidate 被确认并成功提升
  - 二者进入 Build history，不进入正式模型四分区。
