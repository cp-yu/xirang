---
entity: element-declaration
identity: reviewer-protocol
kind: element
parent: review
title: Reviewer Protocol
definition: Reviewer Protocol 定义 Reviewer 角色与只读约束、commit-bound 输入合约、6 步验证协议、严重性阈值与证据标准、验证维度、结构化 Review opinion 输出合约及跨工具 skill 路径兼容。
---

## ADDED Sections

### Section: 依据目标级任务与实际变更审查

Reviewer SHALL 依据目标 Semantic Delta、目标级 `tasks.md`、实际 commit 差异和可复现行为证据判断 Change 的实现范围与完成度，不依赖旧式 `Files`、`Verifies:`、`Preserves:` 或 nested `Checks`。Reviewer SHALL 自主定位相关实现与测试；不得仅因某个实际变更文件未在任务中预列而判定越界或未完成。目标 checkbox 不替代行为证据，目标未达到时 SHALL 给出基于 Contract 和项目证据的 Required Correction。

- **实现文件未预列**
  - 某个实现文件未在目标级 tasks 中列出，但 commit 变更涉及该文件
  - Reviewer SHALL 对照 Change 目标、Contract 与证据判断是否相关，不因缺少旧式 Files 声明单独报错

- **目标尚未实现**
  - 任务 checkbox 已完成，但目标语义缺少可信实现或验证证据
  - Reviewer SHALL 判定未通过并指出目标与证据缺口
