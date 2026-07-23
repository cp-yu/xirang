## REMOVED Requirements

### Requirement: Schema workspace state resolution
**Reason**: 内置 bootstrap schema 与 `.opsx/bootstrap/` phase workspace 被删除，Candidate lifecycle 不通过 artifact instruction loader 解析状态。

**Migration**: change artifacts 继续使用 spec-driven workspace state；Project Build 使用 `opsx candidate status` 和 Candidate file contract。
