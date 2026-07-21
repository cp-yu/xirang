## REMOVED Requirements

### Requirement: Post-propose warning validation

**Reason**: Propose validation 编排统一由 `propose-workflow` 定义，且 validation ERROR 不再降级为 warning。

**Migration**: 使用 `propose-workflow` 的 post-propose 分级 gate。

### Requirement: Specs validation aligns with downstream sync/archive semantics

**Reason**: Specs validator 语义由 CLI/validation Specs 所有，Propose 不重复定义底层规则。

**Migration**: Propose 调用 canonical combined change validation。

### Requirement: OPSX validation aligns with downstream sync/archive semantics

**Reason**: OPSX parsing、dry-run merge 与 relation validation 由 validation-owned Specs 定义。

**Migration**: Propose 调用 canonical combined change validation。

### Requirement: Auxiliary artifact checks stay lightweight

**Reason**: Scaffolding 结构检查统一并入 `propose-workflow` 编排合同。

**Migration**: 使用 resolved definitions/templates 与 deterministic task structure validation。

### Requirement: Single repair pass

**Reason**: 单轮修复由 `propose-workflow` 的分级 validation gate 统一定义。

**Migration**: 对 validation ERROR 执行最多一轮修复并复检。

### Requirement: Final summary reports fixed and remaining warnings

**Reason**: 最终 summary 与 ready-for-apply gate 统一归 `propose-workflow` 所有。

**Migration**: summary 区分 errors、warnings、labels 与 readiness。

### Requirement: OPSX delta validation 先解析后执行 formal merge

**Reason**: 该底层 validator 行为已由 OPSX validation Specs 所有，不应由 Propose workflow Spec 重复定义。

**Migration**: 保留现有 validator 合同，Propose 只调用 canonical CLI。
