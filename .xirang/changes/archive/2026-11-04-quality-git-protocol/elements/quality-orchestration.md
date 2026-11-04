---
operation: MODIFIED
entity: element-declaration
identity: quality-orchestration
kind: element
parent: quality
title: Quality Orchestration
definition: Quality Orchestration 是 Quality 的 Review、可选 Opt 与 Seal 提示协议，独立承载主 Agent 的范围、等待、后续投入、Git-based recovery 和最终声明编排。它区分实现、独立审查与确定性记录责任，供 Apply 和 Archive 共用；不替 Reviewer 作独立结论，不定义 CLI 自主优化决策。
---

## MODIFIED Sections

### Section: Coordinator 角色声明
Quality 提示词 SHALL 显式区分主 Agent、Optimizer、Reviewer 与 CLI。主 Agent 确定 Review/Opt 范围、处理越界、读取实际代码与证据、决定是否进行 Opt、是否追加 Review、如何处理 Required Corrections 及最终 Seal 声明；Opt 执行优化和局部测试；Reviewer 独立只读审查；CLI 保存 opinions、Seal 与 commit 关联并校验已声明流程门槛。主 Agent 不替代必需基线 Review，CLI 不修改 `tasks.md`、运行测试、排序优化或判断自然语言充分性。

### Section: 显式 subagent delegation 指令
提示词 SHALL 用工具中立方式说明角色、定位信息、范围/约束及等待规则。Reviewer 任务 SHALL 包含被审查 Git commit 和范围；Reviewer 自主读取语义与该 commit 对应代码，保持只读，并交付 commit-bound opinion。Opt 任务 SHALL 包含基线 Review commit、委托范围与约束；Opt 可写入实现和测试，交付时以 `baseCommit`/`resultCommit` 关联 opinion。换执行者恢复时继续依据 Git 和原委托，不将进度存入 Quality JSON。

## REMOVED Sections

- Checkpoint 协议使用有序执行步骤

## ADDED Sections

### Section: Git recovery 与 Seal 顺序
Quality workflow SHALL 按“通过的基线 Review → 主 Agent 决定是否 Opt → 记录 Opt opinion 或不做 Opt 的理由 → 主 Agent Seal”引导。修正 Review failure 时形成不同 Git commit 并重新 Review。Seal 记录主 Agent 对绑定 commit 可运行且预期通过适用测试的声明；CLI 不要求工作区 clean、不比较 HEAD 或工作区内容，也不执行测试。Archive 只校验 Seal commit 仍存在。
