---
element: project.root/domain.ai_integration/cap.ai.workflow-generation
---

## REMOVED Requirements

### Requirement: 动态暴露条件
**Reason**: `opsx-build` 是由 setup/update 固定安装的 workflow，不依赖 bootstrap workspace 是否存在。

**Migration**: 使用 fixed WorkflowManifestRegistry entry `build` 和 skill directory `opsx-build`。

### Requirement: 通过 install planning 链路实现
**Reason**: Candidate commands 不触发 dynamic skill exposure。

**Migration**: Setup/update 通过 shared artifact sync engine 收敛 managed skills。

### Requirement: 收敛性
**Reason**: 依赖 bootstrap workspace 的 convergence contract 被删除。

**Migration**: Fixed workflow generation 继续遵循 shared artifact sync contract 的 idempotency。
