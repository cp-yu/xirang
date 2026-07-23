---
element: project.root/domain.architecture/cap.architecture.bootstrap
---

## REMOVED Requirements

### Requirement: Refresh mode SHALL support formal OPSX repositories
**Reason**: 已有 formal project 使用同一个 Project Build lifecycle，不再使用独立 refresh mode。

**Migration**: 选择“基于当前 OPSX 构建”或“重新构建 OPSX”。

### Requirement: Refresh scan SHALL use a git anchor when available
**Reason**: Project Build 不强制 Git anchor 或固定 scan strategy。

**Migration**: 当 Git history 位于用户批准的 exploration range 内时，Agent MAY 读取它。

### Requirement: Refresh review and promote SHALL be delta-first
**Reason**: Complete Candidate validation 与 digest-confirmed promotion 取代 refresh-specific review。

**Migration**: Review validation 输出并由 Agent 呈现的 formal-to-Candidate summary。

### Requirement: Refresh restart SHALL preserve retained workspace audit history
**Reason**: `.opsx/bootstrap-history/` 被删除。

**Migration**: Successful promotion 将 previous formal source 保存到 `.opsx/history/builds/`；retired workspaces 移入 `.opsx/history/legacy-*`。
