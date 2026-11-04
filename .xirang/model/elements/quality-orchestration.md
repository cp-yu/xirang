---
entity: element-declaration
identity: quality-orchestration
kind: element
parent: quality
title: Quality Orchestration
definition: Quality Orchestration 是 Quality 的 Review、可选 Opt 与 Seal 提示协议，独立承载主 Agent 的范围、等待、后续投入、Git-based recovery 和最终声明编排。它区分实现、独立审查与确定性记录责任，供 Apply 和 Archive 共用；不替 Reviewer 作独立结论，不定义 CLI 自主优化决策。
---

## Specification

### Section: Coordinator 角色声明

Quality 提示词 SHALL 显式区分主 Agent、Optimizer、Reviewer 与 CLI。主 Agent 确定 Review/Opt 范围、处理越界、读取实际代码与证据、决定是否进行 Opt、是否追加 Review、如何处理 Required Corrections 及最终 Seal 声明；Opt 执行优化和局部测试；Reviewer 独立只读审查；CLI 保存 opinions、Seal 与 commit 关联并校验已声明流程门槛。主 Agent 不替代必需基线 Review，CLI 不修改 `tasks.md`、运行测试、排序优化或判断自然语言充分性。

### Section: 阶段模式标签

quality 工作流提示词 SHALL 使用 mode label 标记主要阶段切换，以提示认知上下文切换。Mode label SHALL NOT 应用于 checkpoint 子状态；这些只是单一 `[Mode: Checkpoint]` 认知模式内的实现分支。

- **主要阶段切换带有 mode label**

  - 工作流从证据准备切换到 reviewer 委派
  - step header SHALL 包含 `[Mode: Delegate Review]`
  - mode label SHALL 作为 step number 的前缀

- **Checkpoint 子状态不单独使用 mode label**

  - 工作流处于 checkpoint 管理阶段
  - 单个 checkpoint 状态 SHALL NOT 获得独立 mode label
  - SHALL 在 `[Mode: Checkpoint]` section 内描述

### Section: 显式 subagent delegation 指令

提示词 SHALL 用工具中立方式说明角色、定位信息、范围/约束及等待规则。Reviewer 任务 SHALL 包含被审查 Git commit 和范围；Reviewer 自主读取语义与该 commit 对应代码，保持只读，并交付 commit-bound opinion。Opt 任务 SHALL 包含基线 Review commit、委托范围与约束；Opt 可写入实现和测试，交付时以 `baseCommit`/`resultCommit` 关联 opinion。换执行者恢复时继续依据 Git 和原委托，不将进度存入 Quality JSON。

### Section: Subagent 超时和等待规则

quality 工作流提示词 SHALL 为所有 subagent delegation 包含显式 timeout 与 waiting rules：等待完整 subagent 结果、超时后继续等待、询问用户而不是终止 subagent，且顶层 agent MUST 在进入下一步前接收完整 payload。

- **Subagent 未及时返回**

  - subagent 在预期时间内没有返回
  - coordinator SHALL NOT 将其视为失败
  - SHALL 继续等待
  - SHALL NOT 在收到结果前进入 payload 校验

- **等待时间过长**

  - coordinator 等待某个 subagent 超过设定的等待预算
  - coordinator SHALL 询问用户是否继续等待或终止
  - SHALL NOT 在未经用户确认时终止 subagent

### Section: Checkpoint 协议使用有序执行步骤

共享 reference SHALL 说明优化前独立 Review 和可恢复基线、按需中间保存、所需验证全部通过后的最终成功状态。失败可局部修正或撤销并保留可靠工作，不要求每方向 commit 或失败整批 reset/clean。恢复 SHALL 保留代码、commits/checkpoints、当前记录及全部历史；不能确认局部恢复则恢复可确认基线，再不能确认则停止。优化中断后 SHALL 在主 Agent 确认旧写入者已停止后核对原委托、最近进度与磁盘差异，默认继续同一委托；意外中断可能没有最终保存。记录 A 已完成而磁盘有半成品 B 时，检查 B 和相互影响后继续、修正或撤销，不直接判 B 完成或自动丢弃 A/B。未记录、未验证或过期证据需补查；归属或恢复可靠性不明时停止并交回主 Agent。只有主 Agent 主动开始新探索才建新委托。

### Section: 语言一致性

quality 工作流中新增或修改的 prompt text SHALL 使用与现有模板一致的语言。Mode label SHALL 使用 `[Mode: ...]` 形式。

- **Mode label 使用固定形式**

  - quality prompt 被组装
  - 所有 mode label SHALL 以 `[Mode: <Label>]` 形式出现

### Section: Git recovery 与 Seal 顺序

Quality workflow SHALL 按“通过的基线 Review → 主 Agent 决定是否 Opt → 记录 Opt opinion 或不做 Opt 的理由 → 主 Agent Seal”引导。修正 Review failure 时形成不同 Git commit 并重新 Review。Seal 记录主 Agent 对绑定 commit 可运行且预期通过适用测试的声明；CLI 不要求工作区 clean、不比较 HEAD 或工作区内容，也不执行测试。Archive 只校验 Seal commit 仍存在。
