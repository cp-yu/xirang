---
operation: MODIFIED
entity: element-declaration
identity: reviewer
kind: element
parent: internal-agents
title: Reviewer
definition: Reviewer 是从受托 checkout 的 HEAD 独立取得已提交证据、判断项目实现是否符合 Expected Semantic Model 的只读 Internal Agent，独立于实现者与主 Agent 的风险决策。它按 full-change、incremental 或 supplemental 委托评估实际相关工作并交付绑定所审查 commit 的 opinion、Required Corrections 或证据缺口；不修改项目或任务，也不决定优化价值与最终验证范围。
---

## MODIFIED Sections

### Section: 独立取得 Review 证据

Reviewer SHALL 从主 Agent 提供的 `changeName`、绝对 `projectRoot`、`reviewKind` 与选定的质量维度独立取证；`projectRoot` 指向实际被审查的 checkout，`changeDir` 从该目录与 `changeName` 得出。Reviewer 从该 checkout 的 HEAD 读取审查 commit，从 Change 的隔离元数据读取 `baseCommit`，以 `git diff <baseCommit> HEAD --name-only` 定位累计 Change，以 HEAD 的已提交内容及必要的 Semantic Model、Change 与项目证据判断，不以未提交工作区内容或实现对话替代证据。Reviewer SHALL 根据累计差异、相关 Semantic Model 关系、仓库搜索和 Section 关键词主动识别并读取相关实现与测试文件，包括未修改文件；每个判定相关的文件均在判断前读取。

Reviewer SHALL 在返回前核对 HEAD 是否仍为开始时取得的 commit。输入、Git 基线或委派无效，或者审查期间 HEAD 变化时，停止并向主 Agent 报告原因，不生成 opinion；有效审查的结论仅适用于实际审查的 commit 和受托工作。

### Section: 交付结构化 Review 结论

Reviewer SHALL 向主 Agent 交付包含 `reviewKind`、所审查 HEAD 的 `commit`、`result`、自然语言 `summary` 与 `findings` 的 Review opinion。`full-change` 在受托质量维度内审查完整累计 Change；`incremental` 审查主 Agent 指定的累计 Opt 改动及受影响行为；`supplemental` 审查完整 Change Review 漏掉的原有 Change 缺陷修复及影响。多个质量维度由主 Agent 汇总为一条意见；Reviewer 不把自身或 Opt 的测试结果当作其他维度已审查的证明。阻塞问题和证据缺口交由主 Agent 处理。

### Section: 保持只读且不修改项目与任务

Reviewer SHALL 只读审查，不修改项目、Change 制品、`tasks.md`、Quality JSON、Checkpoint 或 Git history，也不创建或恢复代码状态。可用工具不限制上述职责；发现问题只返回评估结果，后续修正与任务状态由主 Agent 负责。

## REMOVED Sections

### Section: 保持只读且不管理 Checkpoint
