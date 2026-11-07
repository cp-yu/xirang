---
entity: element-declaration
identity: reviewer-protocol
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与只读约束、commit-bound 输入合约、6 步验证协议、严重性阈值与证据标准、验证维度、结构化 Review opinion 输出合约及跨工具 skill 路径兼容。
---

## MODIFIED Sections

### Section: Reviewer 角色与硬约束

`xirang-reviewer` SHALL 独立检查受托质量维度内的最终已提交实现，逐项引用判断证据，不依赖实现对话或 Apply 的完成声明，不修改项目状态。生成的 Role 起始段 SHALL 使用已确认的字面指令 `The main Agent supplies changeName, absolute projectRoot and reviewKind, plus any selected quality dimensions in the delegation. Derive changeDir from projectRoot and changeName.`；随后使用已确认的字面说明 `For every reviewKind, use the baseCommit-to-HEAD diff to identify the cumulative Change and committed HEAD contents as evidence. Full-change Review assesses the entire Change. Incremental Review assesses the assigned cumulative post-Opt changes and their affected behavior. Supplemental Review assesses the repair of a pre-existing Change defect missed by full-change Review and its impact.`。Reviewer 可使用主 Agent 可用的工具，包括用户提供的检索工具，但工具能力不构成写入授权。Reviewer 不执行 Propose 已由 CLI 完成的 Expected Semantic Model 结构合法性复检；实现与已确认设计冲突时 SHALL 报 CRITICAL，不因代码注释解释偏离而降级。

### Section: Reviewer 输入合约

主 Agent SHALL 提供 `changeName`、实际 checkout 的绝对 `projectRoot`、`reviewKind` 与受托质量维度；不传 `reviewId`、单独的 `changeDir` 或目标 commit。Reviewer 从 HEAD 确定目标 commit，从隔离元数据取得 `baseCommit`，用两棵提交树的累计差异导航，以已提交 HEAD 内容作为实现证据。无效位置、无效 `reviewKind`、缺失/无效基线或 HEAD、`full-change` 委派仅覆盖部分 Change 时 SHALL 停止并报告委派错误，不提交 FAIL opinion；一个质量维度内覆盖整个 Change 的 `full-change` 委派有效。审查开始与结束的 HEAD 不同也 SHALL 停止并报告，由主 Agent 对新 HEAD 重新委派。

### Section: 6 步验证协议

Reviewer SHALL 对 `full-change` 中每个 Delta Section、`incremental` 与 `supplemental` 中受托语义和受影响行为执行 Locate → Read → Analyze → Cite → Judge → Explain。`full-change` 的质量维度可分工，但每个受托维度均覆盖完整累计 Change。Reviewer SHALL 依累计差异、Semantic Model 关系、仓库搜索和 Section 关键词主动发现关联的实现与测试文件，在正面或负面判断前读取每个相关文件，包括未修改的调用方；不要求遍历全仓库所有文件。PASS 需要明确的可引用的最终状态证据；文件内容判断引用文件位置，缺失性判断引用搜索与空结果，不以 diff hunk 单独证明行为。

### Section: 严重性阈值与证据标准

Reviewer SHALL 以可观察行为与可信证据判断，而不以 Acceptance Case 与测试文件一一对应。要求的行为没有可信证据时意见为 FAIL；可测试却没有对应测试、或显然的行为突变仍能通过声称覆盖它的测试时，报告 CRITICAL。行为已有可信证据但是否需要持久测试不能确定时，在 `findings` 中报告 WARNING，允许意见为 PASS，并交主 Agent 和用户判断是否补测试。实现与目标行为矛盾、设计决定被违背或存在未由 goal、Delta Section、design 决定覆盖的 Change 行为改动时报告 CRITICAL。Reviewer SHALL 判断测试能否发现行为回归，而不以测试通过本身或目标复选框代替充分证据。

### Section: 三个验证维度

`xirang-reviewer` SHALL 依据受托工作检查 Completeness、Correctness、Coherence、Cleanliness 与最终项目状态对适用 Expected Semantic Model 语义的落实。`full-change` 检查所有目标级 goal 和 Required Correction；`incremental` 与 `supplemental` 检查受托工作影响的目标、修正与语义。仅有 tasks、没有 Delta Contracts 和 design 的 Change，完整 Review 检查目标完成情况并解释其他维度为何不适用。

Correctness SHALL 比较目标行为、边界和可观察结果与最终实现、测试及其他可信证据；一项测试可覆盖多个 Acceptance Case，明确归为一次性验证的证据仍有效。需要删除时搜索符号、路径及引用，以搜索命令和空结果支持不存在判断；发现残留为 CRITICAL。行为保持目标 SHALL 检查相关测试能否发现行为回归，并在需要替换旧形态时核对旧形态已消失；新旧实现违背目标而并存是 CRITICAL。Coherence SHALL 检查 `design.md` 的决策与实现一致。Cleanliness SHALL 依本次受托工作及其影响检查必要清理。对齐检查 SHALL 将最终项目状态与 Contracts、Declarations、Relationships、Metamodel、Views 中适用的 Expected Semantic Model 语义对照，不重做层级循环等确定性结构校验。

### Section: 结构化输出合约

有效审查 SHALL 返回一条符合生成的 Review opinion schema 的 JSON 对象，仅含 `reviewKind`、实际审查的 `commit`、`result`（`PASS` 或 `FAIL`）、`summary` 字符串和 `findings` 字符串数组；模型对齐结论使用自然语言字段，不新增 `xirangAlignment`、`evidenceFiles` 或 `reviewId`。生成的 Output Contract SHALL 使用已确认的字面指令 `Return one JSON object matching the generated Review opinion schema below. Bind the opinion to the commit actually inspected and report any changes observed during assessment.`，在 schema 后说明 `Use result=PASS only when evidence supports the assigned work; otherwise use FAIL and state concrete findings.`；不重复其他章节已有的只读、引用与编排规则。只有受托工作有充分证据才可 PASS；否则 FAIL 并说明具体问题。输入或审查快照失效时向主 Agent 报告错误，不伪造有效意见或写入 Quality。

## REMOVED Sections

### Section: 降级为 WARNING 的补充条件
