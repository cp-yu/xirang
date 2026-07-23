## REMOVED Requirements

### Requirement: Bootstrap skill 名称 SHALL 改为 bootstrap-arch
**Reason**: Architecture-only bootstrap identity 被 steady-state `opsx-build` Project Build workflow 取代。

**Migration**: 安装并调用 `opsx-build`。

### Requirement: Bootstrap SHALL 输出 LikeC4 候选模型
**Reason**: Project Build 输出统一 Architecture + Specs Candidate，不再输出 architecture-only bootstrap candidate。

**Migration**: 遵循 `opsx-build` 和 `cli-candidate` contracts。
