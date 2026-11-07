---
entity: element-declaration
identity: agent-prompt-guidance
kind: element
parent: agent-workbench-projection
title: Agent Prompt Guidance
definition: Agent Prompt Guidance 是 Apply、Quality 与 Archive 共用的质量协议呈现，独立承载委托、证据、完成条件及恢复诊断的共享指引，并提供可选失败定位方法。它从实现协议投影机械信息，不维护重复 schema，不将模型的优化取舍固化为逐方向状态机。
---

## Specification

### Section: 简单变更快速路径识别

Optimization 启用且用户未明确拒绝时，提示词 SHALL 委托 Opt 进行初次优化，即使是纯删除或重命名也不由主 Agent 虚构无优化结论。Opt 可以交付无保留改动及依据；交付后主 Agent 判断是否继续，不强制再启动 fresh Opt 或证明全部机会耗尽。配置禁用/用户拒绝时明确记录跳过。

### Section: 共享 quality gate 指引片段

系统 SHALL 从统一实现协议源向 Apply/Archive 投影 v4 Review opinion、按 `reviewKind` 的 Reviewer 委派与主 Agent 汇总、Opt 处置、Seal、status 和 Archive commit 检查指引，示例与实际 schema 一致；不维护平行的 `reviewId`/`scope` 说明、独立测试输出存储或 freshness ledger。阶段指引包含通过的 `full-change` Review、可选 Opt、必要的后续 Review 与 Seal。

### Section: Archive 模板未收口恢复路径

Archive SHALL 对缺失或不可解析的 Seal commit 提供具体诊断，并指引主 Agent 返回 Apply 补齐 Quality 意见/Seal。Opt 的进度与代码恢复从 Git 判断；Archive 不将中断推断为已完成 opinion 或明确 skip。Semantic Delta、Sync、validation 和 task gate 独立处理。

### Section: Quality 模板 CLI 错误恢复指南

提示词 SHALL 根据 CLI code 与诊断修正输入或补齐真实 Review/Opt opinion 与 Seal commit，不伪造意见或删除历史。Reviewer 从实际 checkout 的 HEAD 确定审查 commit；CLI 写入时 commit identity 无效不得猜测另一提交替代已评估状态，应交回重新委派。v3 `.quality.json` 与更旧质量格式不迁移或重写，文件原样保留并明确报不支持；Seal commit 存在不表示当前 HEAD/工作区与之相同。

### Section: 提供可选失败诊断 reference

系统 SHALL 提供共享的优化失败诊断 reference，供主 Agent 与 Opt 依据 Git history 和实际证据定位问题。局部原因明确时可修正或撤销并验证；合并问题无法定位时可拆分或采用更合适方法；恢复不可靠时停止并交回主 Agent。Reference 不要求 Quality checkpoint、整批 reset/clean 或持久化方向队列，并经显式生成清单管理。
