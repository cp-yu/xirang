---
element: project.root/domain.architecture/cap.architecture.bootstrap
---

## REMOVED Requirements

### Requirement: 三态 domain-map 建模
**Reason**: domain-map YAML 作为 shadow architecture source 被删除。

**Migration**: 直接编写并验证 Candidate LikeC4 modules。

### Requirement: Status 输出区分三态
**Reason**: Candidate status 不再报告 domain-map state，而是报告 file readiness 与 validation readiness。

**Migration**: 使用 `opsx candidate status`。

### Requirement: Gate 对 invalid 的处理
**Reason**: scan/map gates 被删除。

**Migration**: 使用 Candidate structured validation diagnostics。

### Requirement: Derived artifact stale 标记
**Reason**: Candidate 是 Agent-authored source，不是 CLI-derived projection。

**Migration**: 使用 `reviewDigest` freshness 检测 reviewed source 的任何变化。

### Requirement: Domain-map spec_groups validation
**Reason**: domain-map 与 spec_groups 被删除。

**Migration**: 直接验证 Candidate Specs 和 singular ownership。
