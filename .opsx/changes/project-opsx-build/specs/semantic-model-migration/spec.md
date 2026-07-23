## REMOVED Requirements

### Requirement: Semantic Model migration SHALL 显式生成候选模型
**Reason**: Project Build 为新建、重建、legacy inputs 和 external starting points 提供唯一 Candidate workspace。

**Migration**: 使用 `opsx-build` 并选择“使用指定内容作为起点”。

### Requirement: Migration SHALL 只接受确定的 identity 与 binding
**Reason**: identity 和 binding certainty 现在是通用 Candidate validation invariant，不再属于 migration lifecycle。

**Migration**: 在 `opsx candidate validate` 成功前解决 Candidate gaps。

### Requirement: Migration promotion SHALL 由完整验证和 human authorization 门禁
**Reason**: 所有 Semantic Model promotion 统一使用 digest-confirmed Candidate CLI transaction。

**Migration**: 用户确认后运行 `opsx candidate promote --digest <reviewDigest>`。

### Requirement: Migration paths SHALL 跨平台且可审计
**Reason**: Migration-specific paths 被删除。

**Migration**: Candidate 与 history paths 遵循跨平台 `cli-candidate` contract。
