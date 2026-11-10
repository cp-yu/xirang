---
entity: element-declaration
identity: confirmed-design-record
kind: element
parent: design-record
title: "中间设计记录"
definition: "中间设计记录是 Design Record 维护的当前设计制品，独立承载形成过程所需的设计状态与依据。它包含具有内容性质和决策状态的自由文本条目、已确认结构目标及相关模型基准；不等同于完整模型、Semantic Delta 或执行计划，也不独立确定 Expected Semantic Model。"
---

## MODIFIED Sections

### Section: 保持稳定身份与最新状态

Record SHALL 以文件名称作为唯一标识符，条目与结构对象保留各自稳定语义 identity。记录 SHALL 表达最新设计与决策状态，局部更新保留无关内容，不累积相互冲突的对话版本，不要求 revision history 或整体 readiness，不引入记录或条目修订号。

重命名后使用新文件名，未变条目身份不变。获用户允许修订已采纳条目时保存最新内容，不并列保留冲突版本，也不通过降为 pending 绕过确认。记录内容指纹 SHALL 由 coverage/consume 内部计算并校验，不要求用户或 Agent 抄传。

### Section: 保存相关 Semantic Model 基准快照

记录 SHALL 保存 相关 Semantic Model 上下文基准，以区分捕获时不存在的 formal model、存在且有效的模型及之后上下文变化。相关语义身份包括结构部分的对象及显式关联的 identity，SHALL NOT 以自然语言猜测完整依赖范围；CLI 比较能确定的上下文变化，其结果不是语义覆盖证明。

- **首次 Build 无正式模型**

  - 合法 Build 上下文中尚不存在 formal model
  - 基准明确记录缺失状态，允许保存已确认设计。

- **模型损坏不等于缺失**

  - formal source 存在但解析或校验失败
  - 返回错误，不以不存在的基准继续写入。

- **上下文变化可见**

  - 记录捕获后关联的模型上下文发生变化
  - 报告变化与可用差异，消费者重查相关结论，不宣称自动判断语义冲突。
