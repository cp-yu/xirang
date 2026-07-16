## REMOVED Requirements

### Requirement: Delta requirement reference preflight

**Reason**: Propose 已读取 formal Specs，且最终 change validation 保留相同的 Requirement header 交叉检查；独立 pre-write CLI 不再提供必要证据。

**Migration**: 写入 change-local Specs 后运行 combined semantic-source delta validation。

### Requirement: Operation-specific requirement checks

**Reason**: ADDED/MODIFIED/REMOVED/RENAMED header compatibility 已由 `validateChangeDeltaSpecs()` 的 post-write gate 覆盖。

**Migration**: 使用 `openspec validate --change "<name>" --json`。

### Requirement: Aggregated check result output

**Reason**: 旧聚合将全部 operations 应用于每个 Spec，可能产生笛卡尔积误报；该独立报告 surface 被删除。

**Migration**: 由每个 change-local Spec 的路径表达 ownership，再由 combined validation 检查。

### Requirement: JSON output for delta preflight

**Reason**: `openspec check-delta` CLI 整体删除，不再保留专属 JSON schema。

**Migration**: 消费 combined validation 的 canonical JSON report。
