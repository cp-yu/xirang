---
element: project.root/domain.cli/cap.cli.change-operations
---

## REMOVED Requirements

### Requirement: Scenario label fix command

Reason: Scenario operations 由统一 Formal → Target Diff IR 确定性派生，独立 preview/write command 会把 presentation metadata 写回 durable source。

Migration: 使用 `opsx validate --change <name>` 查看 concise preview，使用 `opsx diff --change <name>` 或 `opsx diff --change <name> --write` 查看完整 Scenario diff。

### Requirement: Scenario label derivation

Reason: Scenario operation labels 不再属于 change-local Specs；相同的 Scenario 比较由共享 Diff IR engine 提供给 CLI、Web 与 review artifact。

Migration: 删除 change-local Scenario headings 上的 `[ADDED]`、`[MODIFIED]`、`[REMOVED]`，并以完整 target Requirement 的 Scenario set 表达新增、修改与删除。
