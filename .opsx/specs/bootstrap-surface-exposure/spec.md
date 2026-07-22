---
element: project.root/domain.ai_integration/cap.ai.workflow-generation
---

# bootstrap-surface-exposure Specification

## Purpose
Expose the active bootstrap-arch skill through install planning without creating a second command surface.

## Requirements
### Requirement: 动态暴露条件
When `.opsx/bootstrap` exists, init or update SHALL include the `bootstrap-arch` workflow and install `opsx-bootstrap-arch`; when it does not exist, the dynamic workflow SHALL be absent.

#### Scenario: Bootstrap workspace exists
- **WHEN** install planning runs
- **THEN** the active skill projection SHALL include `bootstrap-arch`
- **AND** SHALL NOT generate a separate command artifact

### Requirement: 通过 install planning 链路实现
Dynamic exposure SHALL be decided by canonical workflow installation and sync planning, not by direct writes from bootstrap commands.

#### Scenario: Bootstrap initializes
- **WHEN** `opsx bootstrap init` creates workspace state
- **THEN** a later init or update SHALL converge through the normal sync engine

### Requirement: 收敛性
Repeated update with unchanged workspace and profile state SHALL produce no further bootstrap skill changes; retained completed workspaces SHALL continue to expose explicit restart guidance.

#### Scenario: Update repeats
- **WHEN** update runs twice without state changes
- **THEN** the second run SHALL be a no-op for the bootstrap surface
