## Context

snack skill 的 Output Hints 当前分为 "Fast path (skip verify)" 和 "Correction path" 两个章节，将 sync/archive 命令行操作与修正路径（修改代码 / 手动编辑 specs）放在不同层级。使用者需要跨章节阅读才能了解全部后续选项。

## Goals / Non-Goals

**Goals:**
- 将 Output Hints 合并为四个编号一等选项，消除两段式层级结构
- 四个选项覆盖：仅同步、仅归档、同步并归档、继续开发（修改代码迭代）
- 保持 `--no-verify` fast path 语义不变

**Non-Goals:**
- 不改变 snack 的核心 reconcilation 流程
- 不改变 sync/archive CLI 命令本身
- 不引入新的 artifacts 或 workflow steps

## Decisions

- **四个一等选项而非两段式**：将 Fast path 的 3 个操作 + Correction path 的"修改代码"合并，因为使用者视角下的下一步操作是互斥的四个选择，不应人为区分 fast/correction 层级。
- **编号列表替代 bullet + 章节**：`1./2./3./4.` 列表结构比 `• bullet` + `**Path:**` 章节头更清晰直观。
- **保留 [REVIEW NEEDED] 警告**：在选项列表前保留 `⚠️ Generated specs are based on code inference.` 提示，不影响选项可读性。

## Risks / Trade-offs

- [Risk] 原有 Correction branch 1（手动编辑 specs → sync → archive）被移除：该路径实质上等价于先选选项 1（快速同步），然后手动归档，因此未曾丢失功能。[INFERRED FROM CODE]
