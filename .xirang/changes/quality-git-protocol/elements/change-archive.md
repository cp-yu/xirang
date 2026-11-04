---
operation: MODIFIED
entity: element-declaration
identity: change-archive
kind: element
parent: change-closure
title: Change Archive
definition: Change Archive 定义归档已完成 Change 的行为：Quality Seal、sync、task 与 final validation gates 通过后，将 active change directory 原样移动到 date-prefixed archive path、输出 Git handoff 提醒，并由 Agent 在 CLI 完成后继续 Git 流程；Archive 不创建、重算或覆盖任何 presentation artifact，也不执行 Git 写操作。
---

## MODIFIED Sections

### Section: Display Output
Archive SHALL 提供清晰的 gate 状态反馈，并在摘要中区分 Quality Seal、Semantic Model Sync、task 与 validation 结果。Quality 摘要 SHALL 报告 Review/Opt opinion 的 commit 关联和 Seal commit identity；MUST NOT 声称 CLI 执行过测试、Seal commit 匹配当前 HEAD/工作区，或存在最终 successful checkpoint。Archive 不重新判断 Opinion 的自然语言充分性。Archive CLI 不创建 Git commit；Archive 完成后由 Agent 按既有 Git handoff 提交 Change 与 Quality JSON，Seal 或 Archive 前不要求单独提交质量记录。

## REMOVED Sections

- Archive quality freshness routing

## ADDED Sections

### Section: Archive Quality Seal routing
Archive SHALL 在 Quality gate 失败时报告缺少或不可解析的 Seal commit，并指引主 Agent 返回 Apply 补齐正确的 Review、Opt disposition 或 Seal。Archive Quality gate SHALL 只检查新 JSON 中存在 Seal 且其 commit 对象仍存在；不比较 HEAD、工作区 clean 状态或当前实现与 Seal commit 内容，不因工作区变化重跑 Quality。Sync、Semantic Delta validation 与 task gates 仍独立执行。
