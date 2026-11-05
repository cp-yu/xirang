---
entity: element-declaration
identity: propose
kind: element
parent: intent-first-path
title: Propose
definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，按 Design Record 的写作规则将规范性确认内容（含用户确认的例子、数值、时序与例外）编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义的原子细节覆盖检查并经 CLI 门禁记录与交接、目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
---

## MODIFIED Sections

### Section: 编写完整 Change Plan

Propose SHALL 以 Change Plan 分别解释意图与范围、关键方案决策、待完成目标及验证方向，而不以任务重新定义目标语义。`proposal.md` SHALL 表达动机、范围和语义来源影响；`design.md` SHALL 表达关键决策、理由和取舍，可保留用户确认的技术落点；`tasks.md` SHALL 用于与用户对齐实施目标和应验证的行为、边界及可观察结果。Propose SHALL NOT 预先猜测具体待修改的代码或测试文件、执行命令与一般技术实施顺序；用户明确要求的次序 SHALL 保留在 Plan 中。

- **Change 需要审查与执行**
  - Agent 形成 Plan
  - Plan 提供职责清晰且不重复维护目标语义的三份文档

### Section: 完成 Formation 审查与确认

Propose SHALL 默认连续编写完整 Change 后集中交用户审阅，用户明确要求交互推进时才 SHALL 按一项机制及其目标、验证方向分段展示实际草稿，听取反馈并继续；不按制品、Element 数量或写作依赖机械设置审阅轮次。无论模式，遇到影响当前目标的重大缺口 SHALL 先说明选项与理由、等待用户裁决；批量模式不授予猜测决策的权力。

Formation 内 SHALL 对照确认来源检查完整机制、制品一致性和适用边界/竞争序列，不以制品互相一致或 CLI 通过代替语义判断。新确认的决策及允许自主处理的可观察细节 SHALL 贯穿 Delta 与 Plan；推导内容不得写回为用户确认。影响当前目标的未决问题阻塞完成。

- **默认批量**
  - 用户未要求分段交互
  - Propose SHALL 在决策齐备时形成完整 Change 再集中审阅

- **用户要求交互**
  - 用户明确希望边写边审
  - Propose SHALL 按机制展示包含对应目标与验证方向的实际草稿，反馈后再推进
