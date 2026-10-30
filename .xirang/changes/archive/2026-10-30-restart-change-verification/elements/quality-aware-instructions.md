---
entity: element-declaration
identity: quality-aware-instructions
kind: element
parent: deterministic-operations
title: Quality-aware Instructions
definition: Quality-aware Instructions 定义 `xirang instructions apply` 集成 quality 状态检查的行为：判定 change 的 `state` 时同时考虑 task checkbox 完成度与 quality 记录状态，产生 `needs_review`、`needs_optimize`、`all_done` 与 `ready`。它只描述指令投影的状态判定，不定义 quality 命令本身的入口条件与诊断。
---

## MODIFIED Sections

### Section: Apply 指令依据 quality 状态判定 state

`xirang instructions apply` 命令在判定 change 的 `state` 时 SHALL 集成 quality 状态检查，而非仅依赖 task checkbox 完成度。

- **全部 tasks 完成但尚无 Review 记录**

  - `tasks.md` 中所有 checkbox 均为 `[x]`
  - change 目录中没有 quality 状态记录
  - `state` SHALL 为 `'needs_review'`
  - `instruction` SHALL 包含引导执行 `xirang quality review` 的文本

- **全部 tasks 完成但存在未检测的代码变更**

  - `tasks.md` 中所有 checkbox 均为 `[x]`
  - 当前代码与最近一条通过的 Review 记录不一致
  - `state` SHALL 为 `'needs_review'`

- **已通过 Review 但 Optimization 尚未收口**

  - 当前代码已通过 Review
  - 还没有收口记录
  - `state` SHALL 为 `'needs_optimize'`
  - `instruction` SHALL 包含引导继续 Optimization 与 seal 的文本

- **全部 tasks 完成且已收口**

  - `tasks.md` 中所有 checkbox 均为 `[x]`
  - 当前代码已通过 Review
  - Optimization 已收口且 archive compatibility 为 `{ compatible: true }`
  - `state` SHALL 为 `'all_done'`

- **非 semantic-model schema 无 tracksFile**

  - schema 未配置 `apply.tracks`（`tracksFile` 为 null）
  - required artifacts 全部存在
  - 保持现有行为，`state` 为 `'ready'`

- **unsafe 恢复指引优先**：当前活动台账为 `ABORTED_UNSAFE` 时，不得报告 `all_done`；instruction SHALL 指向共享恢复 reference，要求先停止自动推进、取得重启授权并确认串行条件，不因代码为 `dirty` 就绕过该恢复前提。
- **轮换后重新 Review**：受控轮换完成、全部 tasks 已完成且根目录没有活动质量记录时，state SHALL 为 `needs_review`；即使历史目录保存匹配当前代码的 PASS，也不得投影为 `all_done` 或复用旧结论。新 Review 通过后才按新活动台账进入 `needs_optimize`，沿用其他既有路由。
