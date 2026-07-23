---
element: project.root/domain.change_workflow/cap.change.semantic-delta
---

## ADDED Requirements

### Requirement: Target compiler SHALL 删除显式清空的 Spec module
当一个 formal Spec 的全部 Requirements 均通过 change-local `REMOVED Requirements` 被显式删除，且 target 中没有 surviving、ADDED 或 MODIFIED Requirement 时，Target Semantic Model compiler SHALL 将该 Spec module 从 target 中删除，而不是写入空 contract file。

#### Scenario: 全部 Requirements 被删除
- **GIVEN** formal Spec 包含一个或多个 Requirements
- **WHEN** change 对每个 Requirement 声明精确 REMOVED operation
- **AND** target 没有新增或修改 Requirement
- **THEN** compiler SHALL 将该 Spec directory 标记为 removed target module
- **AND** atomic writer SHALL 删除对应 `.opsx/specs/<spec-id>/spec.md`

#### Scenario: 删除不完整
- **WHEN** formal Spec 仍有 surviving Requirement
- **THEN** compiler SHALL 保留该 Spec module
- **AND** SHALL NOT 因 Requirement 数量减少而推断 whole-Spec removal

#### Scenario: Removed Spec 仍被引用
- **WHEN** target architecture 或 registry 仍要求该 Spec module 才能满足 required contract closure
- **THEN** target validation SHALL 失败
- **AND** formal source SHALL 保持不变
