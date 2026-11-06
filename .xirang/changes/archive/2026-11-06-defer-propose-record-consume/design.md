## Context

现有 CLI 在 coverage 时检查条目、位置与摘录，consume 时才检查结构；现有 Propose 指令在最终报告前连续执行 coverage 与 consume。用户审阅报告时 Record 已被删除。

## Goals / Non-Goals

**Goals:**
- 在用户接受最终 Change 前完成覆盖与结构门禁，并允许审阅轮次继续维护同一活动 Record。
- 交接后继续沿用已有来源版本、目标指纹及结构复核。

**Non-Goals:**
- 不新增已 consume Record 的修订命令或旧来源版本历史。
- 不改变 Candidate/Build 的交接时序，也不新增并发控制。

## Decisions

- 复用 `recordCoverage` 和 `assertCoverageGate` 的结构比对逻辑，仅对 Change 在写 coverage 文件前增加调用；这样结构不一致会保留已有 coverage 文件，而 Candidate 的 coverage 行为不变。未通过门禁的旧文件仍绑定旧 sourceVersion 或目标指纹，不可用于 consume。
- 修改 Propose 工作流的交接顺序：先完成最终校验和正式 coverage，再展示 Change 等待用户接受；审阅修改时更新适用的 Record、Delta 与 Plan 并重新校验/覆盖；接受后才 consume。共享参考同步说明 Change 的时序，Build 保持原流程。
- 保留 consume 的既有版本、目标指纹与结构复核，不在 consume 内重复执行条目覆盖检查。CLI 仍只校验位置与摘录存在，不替代 Agent 的语义判断。

## Risks / Trade-offs

- [用户审阅期间修改来源或目标使 coverage 过期] → Propose 重新校验并提交覆盖结果，consume 的新鲜度检查阻止旧结果交接。
- [结构比对过早影响 Candidate] → 仅对 Change coverage 前移检查；Candidate 仍由 consume 执行结构门禁。
