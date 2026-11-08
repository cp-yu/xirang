---
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: "Propose"
definition: "Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。"
---

## MODIFIED Sections

### Section: 补足最低语义就绪条件

缺少有效 Design Summary 时，Propose SHALL 通过项目证据与针对性提问主动建立对问题、期望结果、约束、影响范围、方案及验证方式的理解，不把用户提供的路线当成完整意图。SHALL 解决影响目标的重大缺口，包括 Definition、Contract 与结构范围上的未决 Semantic Delta 决策；已明确内容直接复用，不使用固定问卷。

- **用户直接进入 Propose**：对话中没有完整 Summary，用户只说“加一个缓存。”时，先理解要解决的问题及路线是否为明确约束，再判断语义就绪，不直接猜定目标。

### Section: 完成 Formation 审查与确认

Propose SHALL 默认连续编写完整 Change 后集中交用户审阅，用户明确要求交互推进时才 SHALL 按一项机制及其目标、验证方向分段展示实际草稿，听取反馈并继续；不按制品、Element 数量或写作依赖机械设置审阅轮次。无论模式，遇到影响当前目标的重大缺口 SHALL 先说明选项与理由、等待用户裁决；批量模式不授予猜测决策的权力。

Formation 内 SHALL 对照确认来源检查完整机制、制品一致性和适用边界/竞争序列，不以制品互相一致或 CLI 通过代替语义判断。新确认的决策及允许自主处理的可观察细节 SHALL 贯穿 Delta 与 Plan；推导内容不得写回为用户确认。影响当前目标的未决问题阻塞完成。

- **默认批量**
  - 用户未要求分段交互
  - Propose SHALL 在决策齐备时形成完整 Change 再集中审阅

- **用户要求交互**
  - 用户明确希望边写边审
  - Propose SHALL 按机制展示包含对应目标与验证方向的实际草稿，反馈后再推进

Propose SHALL 检查支持实现预期结果的证据及关键假设；用户确认本身不证明可行性，方案失败本身不证明意图理解错误或目标不可实现。SHALL 区分事实判断、方案缺陷与意图理解缺口，按已确认依据修正可确定的错误，重大方案调整或目标与约束冲突按决策确认规则处理。
