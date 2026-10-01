---
operation: ADDED
entity: element-declaration
identity: confirmed-design-record
kind: element
parent: design-record
title: 已确认设计记录
definition: 已确认设计记录是 Design Record 形成的精简中间制品，独立承载下游生成需要遵循的用户确认内容。它由两部分组成：以自由文本记录细节的条目，以及与 Semantic Model 同形、按语义 identity 定位的结构部分；它表达一次形成上下文中的当前确认状态，而非变更历史。它不等同于完整目标模型、Semantic Delta、Contract、Design Summary 或执行计划；它为 Build 与 Propose 提供形成依据，不独立确定 Expected Semantic Model，也不成为形成完成后的规范语义来源。
---

## ADDED Sections

### Section: 以条目与结构两部分表达确认内容

记录 SHALL 由条目与结构两部分组成。条目每条具有稳定 identity、性质（normative 或 informative）与自由文本内容，允许多行，SHALL NOT 设 examples、counterexamples、timing 等固定子字段。结构部分按 Semantic Model 的形状记录已确认的 Element Declarations、Relationships、Element Kinds 与 Relationship Kinds，以其语义 identity 定位（Relationship 以 source、kind、target 定位），SHALL NOT 引入第二套 identity。两部分都只含已确认内容，SHALL NOT 要求完整目标模型或与所有未来 Contract 一一对应。Build 与 Change 形成 SHALL 共享一种记录格式但使用独立实例。

- **细节与结构分开记录**

  - 用户确认一条带例子的行为规则，并确认新增一个 Element 及其 parent
  - 行为规则与例子作为条目保存；该 Element 的 Declaration 作为结构对象保存，其 identity 即模型 identity。

- **局部确认即可记录**

  - 用户只确认一个行为条件
  - 保存该条目，不要求先补全 hierarchy、Kinds 或 Relationships。

- **分别记录 Build 与 Change 设计**

  - Build 与 Explore 分别形成关键确认
  - 使用相同格式的不同记录身份，不互相覆盖。

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

记录 SHALL 使用不可变 explorationId、可变 slug 与稳定的条目及结构对象身份，表达当前已确认状态；修订 SHALL 更新相关条目或对象并保留无关内容，不保存相互冲突的累积对话，不要求 revision history 或 readiness 状态。

- **重命名保留记录身份**

  - 用户重命名记录 slug
  - explorationId 和未变更条目、对象的 identity 不变。

- **修订保持当前态**

  - 一个已确认条目被修订
  - 保存最新内容而非并列保留相互冲突版本。

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
