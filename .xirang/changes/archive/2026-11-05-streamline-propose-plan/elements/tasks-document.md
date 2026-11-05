---
entity: element-declaration
identity: tasks-document
kind: element
parent: change-plan
title: Tasks Document
definition: Tasks Document 是 Change Plan 中安排执行步骤与验证检查的文档。它帮助 Agent 生产与执行 Semantic Delta，不独立定义目标语义。
---

## MODIFIED Sections

### Section: Tasks 安排执行与验证

`tasks.md` SHALL 在形成 Change 时列出与用户达成一致的实施目标与各目标需要覆盖的验证方向：要验证的行为、相关边界及预期可观察结果。目标语义 SHALL 引用对应 Element Contract，而不是在任务中另写一套行为定义；行为缺失时先补 Contract。`tasks.md` SHALL NOT 要求 Propose 预列具体实现或测试文件、测试动作、测试层级、命令、用例拆分及细排的实施操作；这些由 Apply 结合当前项目状态确定。`proposal.md`、`design.md` 与 `tasks.md` SHALL 分别承载范围、关键决策与目标验证，不机械重复目标描述。

- **目标已确认**
  - Propose 形成 Change Plan
  - tasks 标识待实现目标及应验证的结果，不把具体测试手段提前固定

- **目标语义不完整**
  - tasks 的验证方向涉及尚未写入 Contract 的行为
  - Propose SHALL 先修正目标 Contract，不以 tasks 补足规范

### Section: Tasks 按 TDD 闭环组织

`tasks.md` 的每个目标 SHALL 有可理解的完成边界和验证方向；多个实现面共同交付同一目标时 SHALL 作为一个目标呈现，不按文件、组件、Section 或 Acceptance Case 数量机械拆分。任务仅在用户明确要求先后次序时 SHALL 按该顺序排列；该要求 SHALL 同时出现在 `proposal.md` 或 `design.md` 至少一处，若约束目标行为或数据状态也 SHALL 进入相应 Contract。通常的技术实施顺序和依赖 SHALL 由 Apply 决定，不因任务排列被误认为用户要求。

- **行为横跨多个实现面**
  - 同一目标需要 CLI、提示词、生成面及测试共同完成
  - tasks SHALL 将其作为一个目标；Apply 负责形成可验证的实施闭环

- **用户明确要求先后次序**
  - 目标 A 须先于目标 B
  - tasks SHALL 将 A 排在 B 前面，Apply SHALL 遵守该约束

- **无指定次序**
  - tasks 列出多个目标而用户未要求顺序
  - Apply MAY 根据代码和测试现状安排实施顺序

### Section: 任务粒度对齐规范容器

`tasks.md` SHALL 从目标 Contract 的 Sections、适用边界和关键验收案例核对实施目标及验证方向是否遗漏；多个规范细节同属一个可观察目标时 SHALL 合并说明，不为每个 Section、边界项或 Acceptance Case 机械创建任务或可执行 Check。引用 SHALL 帮助定位目标语义，不以引用数量代替语义覆盖检查。

- **目标包含边界与例外**
  - Contract 明确条件、边界或例外
  - 对应目标的验证方向 SHALL 覆盖这些结果，不遗漏关键分支

### Section: Checks 按可观察行为组织

`tasks.md` SHALL 使用目标级完成状态记录进度：只有目标的适用行为已实现、验证方向获得实际证据时 Apply 才 SHALL 标记完成；不得以勾选代替证据，也不向 tasks 回填实施文件、测试动作、命令或输出。Apply SHALL 按当前测试选择复用、修改、新增、删除或一次性验证，采用能检验目标行为的适当测试边界；不把规格句数或 Acceptance Case 数量机械转换为测试数量。无需新增持久化逐项测试日志；独立 Review SHALL 基于当前实现和可复现证据取证，Quality 的结论摘要 SHALL NOT 冒充原始测试输出。

- **完成目标**
  - 实施与适用验证实际通过
  - Apply 勾选该目标，不在 tasks 中补写测试命令或执行日志

- **证据不足**
  - 只有完成声明或 Quality 摘要，无可复现的行为验证依据
  - 目标 SHALL 保持未完成
