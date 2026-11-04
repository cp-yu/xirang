---
operation: MODIFIED
entity: element-declaration
identity: reviewer-protocol
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与只读约束、commit-bound 输入合约、6 步验证协议、严重性阈值与证据标准、验证维度、结构化 Review opinion 输出合约及跨工具 skill 路径兼容。
---

## MODIFIED Sections

### Section: Reviewer 角色与硬约束
`xirang-reviewer` skill SHALL 将 subagent 定义为 clean-context、只读 Review Agent。它拥有实际受托范围内独立 completeness、correctness、coherence 判定权，MUST 自主读取证据、为判断引用具体文件路径和行范围、先完成完整验证再判严重性，且 MUST NOT 依赖实现对话历史或修改任何文件、任务状态、Quality JSON 与 Git history。Review opinion SHALL 绑定调用方指定的 Git commit；Required Corrections 交由主 Agent 处理。

### Section: Reviewer 输入合约
`xirang-reviewer` skill SHALL 要求顶层 Agent 传入 `changeName`、`changeDir`、`projectRoot`、审查范围与被审查 Git commit identity。Reviewer SHALL 只针对该 commit 和实际范围形成 opinion；不得将 `git diff` hunks 或未提交工作区内容作为该 commit 的实现证据。缺失或无法读取指定 commit 时 SHALL fail closed。Reviewer 可读取同一新 Quality JSON 中已有意见作为上下文，但历史 PASS 不能代替本次读取与判断；不得读取旧 snapshot/log/evidence 并将其当作新协议依据。

- **定位信息完整**：收到 changeName、changeDir、projectRoot、scope 与 commit 后，Reviewer 自行读取必要的 Change、Semantic Model 和 commit 内容。
- **缺少 commit identity**：Reviewer SHALL 返回证据缺口，不猜测 HEAD 或 branch ref。
- **意见与 commit 绑定**：输出 commit identity 必须与调用方指定值相同；后续提交不得重绑该 Review。

### Section: 结构化输出合约
`xirang-reviewer` skill SHALL 定义单个结构化 JSON opinion，至少包含 `commit`、`scope`、`result`（`PASS`、`PASS_WITH_WARNINGS` 或 `FAIL_NEEDS_CORRECTIONS`）、`issues`、`summary` 与 `evidenceFiles`。`issues` SHALL 具体描述证据、偏离或 Required Corrections；可选 `gitDiffSummary` 只作上下文，不替代最终内容证据。输出 SHALL NOT 包含 `writeBackPlan`、task checkbox 修改指令或要求 Reviewer 编辑 `tasks.md` 的字段。CLI 负责在保存时验证 commit identity 并追加到 Quality JSON；主 Agent 决定如何处理 opinion。

- **Opinion 结构完整**：Reviewer 完成验证后返回符合该 JSON schema 的单个对象，不添加对话前言。
- **没有阻塞问题**：result 为 PASS 或 PASS_WITH_WARNINGS，opinion 仍绑定实际 commit 与审查范围。
- **发现阻塞问题**：result 为 FAIL_NEEDS_CORRECTIONS，并返回足以让主 Agent 修正的 findings；Reviewer 不直接写入任务文件。

