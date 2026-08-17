## Context

`unify-candidate-change-modes` 已 Archive：Candidate 作为 `change=candidate` 参与三维编排，并与 Change 共用 `complete` / `complete-with-diff` / `diff-only`。默认 `complete-with-diff` 使用 target-only sources，REMOVED 节点不进入布局。

Candidate 的两种真实用法是看完整目标（大重构）或看差异（小改）。中间态 `complete-with-diff` 没有独立场景。

## Goals / Non-Goals

**Goals:**
- Candidate 只提供 `complete` 与 `diff-only`，默认 `complete`。
- 非法 `change=candidate&mode=complete-with-diff` 收敛为 `complete`。
- 首页 Candidate 入口改为规范默认 URL `change=candidate`。
- 删除 Candidate `complete-with-diff` 可达状态与对应测试。

**Non-Goals:**
- 不改变活动 Change 的三态与 target-only `complete-with-diff`。
- 不在 `complete` 或 `complete-with-diff` 注入 REMOVED ghost。
- 不修改投影源选择算法、Contract 投递、Candidate promotion/CLI。
- 不修复 Edera 规模 `diff-only` 的 Graphviz union 容量问题。

## Decisions

1. **Candidate 与 Change 的 Mode 集合按 Project Build ≠ Change 区分，而不是恢复独立 View。**  
   Candidate 仍走 `change=candidate` reserved identifier。备选「两边都取消 complete-with-diff」会删掉 Change 增量审查的常用视图；备选「两边都注入 REMOVED ghost」实现重且 Candidate 上该 Mode 仍然别扭。

2. **默认 Mode 按 Change Selection 显式查找，不把 Candidate 当作普通 Change。**  
   `defaultMode(null) = complete`，`defaultMode('candidate') = complete`，其余活动 Change 为 `complete-with-diff`。URL 省略的 mode 解码为当前 Change Selection 的 `defaultMode`。备选「沿用任意 change → complete-with-diff」会让 `?change=candidate` 继续落到已取消的 Mode。

3. **非法组合在 Controller clamp，不改投影 handler。**  
   `change === 'candidate' && mode === 'complete-with-diff'` 收敛为 `complete`。投影服务若仍收到该组合，保持既有 target-only + overlay 实现，因 Controller 不再发出该请求。备选「服务端拒绝」会把编排语义泄漏到投影层。

4. **Candidate 的 Mode 选项不列出 `complete-with-diff`。**  
   用当前 Change Selection 显式选择可选项，而不是显示 disabled 项。Change 的三选项保持不变。

5. **Test Maintenance。**  
   删除或改写所有假定 Candidate 默认或可选 `complete-with-diff` 的单测与 e2e（含「REMOVED 不属于 target projection」那组 Candidate complete-with-diff 断言，以及 `?change=candidate` 解码为 complete-with-diff 的深链）。改写为默认 `complete`、非法 mode 收敛、`diff-only` 仍可见 REMOVED ghost。Change 的 complete-with-diff e2e 保留。

## Risks / Trade-offs

- [Change / Candidate 控件不再完全同一套] → 只限 Mode 集合；不恢复 `view=candidate` 分叉。
- [Edera `diff-only` 仍可能因 Graphviz union 失败而丢失 ghost] → 默认路径改为 `complete`，不再踩 union；本次不修 fallback。
- [旧书签 `?change=candidate&mode=complete-with-diff` 不再显示差异 overlay] → 按设计收敛到 `complete`；要看删除需显式切 `diff-only`。

## Migration Plan

无数据迁移。代码与测试删除即生效。回滚需代码回滚。

## Open Questions

无。
