# Change: requirement-unified-diff

## Context

Change-derived View 的 Element Details Diff tab 此前将 Requirement 与其 Scenario 分开渲染：Requirement 正文一个 diff，每个 Scenario 一个子 diff。整体 ADDED 的 Requirement 因 diff IR 只为 MODIFIED Requirement 生成 Scenario 子条目而完全丢失 Scenario 内容。

## Goals / Non-Goals

**Goals:**
- 每个 Requirement 在 Diff tab 中呈现为单个合并 diff，before/after 包含正文与全部 Scenario 文本
- 整体 ADDED 的 Requirement 的 Scenario（含伪代码正文）在 diff 中可见

**Non-Goals:**
- 不改变 diff IR（`semantic-diff.ts`）的条目结构
- 不改变 CLI diff 输出与 validation 行为

## Decisions

- **在呈现层合并序列化**：`getStructuredContractDiff` 将 Requirement 的正文与全部 Scenario 序列化为单一 before/after 文本，Diff tab 每个 Requirement 渲染一个 `XirangDiffViewer`。
  - 备选：在 `semantic-diff.ts` 为 ADDED/REMOVED Requirement 生成 Scenario 子条目。被否决：将内容拆成多个碎片化 diff 块，且需改动规范 IR 与 validation 输出。
- **保留 IR 的 MODIFIED Scenario 子条目**：CLI 渲染与既有消费者仍可读取；UI 不再消费 children 中的 Scenario。
  - 备选：一并移除 IR 子条目。被否决：超出本 Change 范围，属既有行为。

## Risks / Trade-offs

- [Low] MODIFIED Requirement 的 Scenario 变化不再以独立块呈现，改由 requirement 级词级 diff 标出 → 合并文本使 before/after 完整可比，diff 引擎能精确定位变化。
