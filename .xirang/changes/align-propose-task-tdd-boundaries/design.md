## Context

Apply 原以"major component"为单位生成 task，`Requirements` 超过 5 项时被允许拆分 task。实现证据表明强关联内容（同一行为的模板源、生成面与测试断言）被人为拆开，Apply 按 task 做 TDD 时不得不在不完整边界上反复收束，且每个 task 完成后易触发阶段化处理，整体速度偏低。此问题根源在 Propose 的 task formation，不在 Apply 的运行时编排。

## Goals / Non-Goals

**Goals:**
- task 边界 = 可独立实现、可独立验证的完整 TDD 闭环
- Propose 在 ready-for-apply 前完成 task 边界自检
- Apply 连续执行 task-level TDD loops，全部完成后统一进入一次 Change-level Review

**Non-Goals:**
- 引入 execution batch 或让 Apply 自动合并 task
- 修改 tasks.md 文件结构、task parser 或进度统计
- 改变 Phase 2 Optimization、Phase 3 Seal、隔离与恢复协议

## Decisions

- **Task 按 TDD 闭环划分，而非按组件拓扑**：同一行为所需的生产代码、配置、生成面与测试必须归入同一 task；组件、模块、目录、文件类型均不构成拆分依据。拆分仅允许在"每个 task 可独立达成 GREEN"或"仅依赖已 GREEN 的前置 task"时发生，task 的 RED/GREEN 不得依赖后续 task。
- **`Requirements` 数量不再作为拆分理由**：超过 5 项时先合并细节或将验证细节下沉到 Checks；保持单一 Goal 与高层 Requirements。
- **Apply 保持 task-level TDD，但阶段切换以 Change 为单位**：普通 task 完成不得触发 Phase 1、Phase 2 或 workflow handoff；全部 pending tasks 与 Required Corrections 完成后进入一次 Change-level Phase 1 Review。Review 或 Seal 失败产生的修正属于 recovery，修改后的 Change 状态在 recovery 完成后必须重新 Review，不与此边界冲突。
- **Propose 增加 ready-for-apply 前置自检**：交叉检查 Goals、Files、Requirements、Checks，发现跨 task 依赖违反独立验证时重新划分边界，而不是交给 Apply 修复。

## Risks / Trade-offs

- [完整闭环 task 可能偏大] → 通过单一 Goal、最多 5 个高层 Requirements 与多个 Checks 约束，而不是恢复按组件拆分
- [指令语义收紧后 Agent 可能误读"Change-level Review"为生命周期只 Review 一次] → 明确 recovery 修正后必须重新 Review
