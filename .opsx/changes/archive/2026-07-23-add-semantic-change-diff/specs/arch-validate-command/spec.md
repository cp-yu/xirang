---
element: project.root/domain.cli/cap.cli.architecture-navigation
---

## MODIFIED Requirements

### Requirement: arch validate SHALL 支持 --delta 选项

`opsx arch validate --delta <path>` SHALL 解析 change-local OPSX Architecture delta dialect，在 immutable Formal snapshot 上 materialize Target Architecture，并验证 declared operations 与完整 target integrity。

#### Scenario: 验证合法 delta 文件
- **GIVEN** change 包含 identity-level `architecture-delta.c4`
- **WHEN** 运行 `opsx arch validate --delta .opsx/changes/<name>/architecture-delta.c4`
- **THEN** SHALL 验证 ADDED、MODIFIED、REMOVED sections 与 replacement hints
- **AND** SHALL 验证 identity preconditions、complete target payloads、containment、Metamodel、relationships 与 strict removals
- **AND** validation 成功时 exit code SHALL 为 0

#### Scenario: Empty delta 被拒绝
- **WHEN** delta 不含任何真实 identity operation，或只含 replacement hint
- **THEN** SHALL 返回 structured ERROR
- **AND** SHALL 指引在 graph no-op 时删除 `architecture-delta.c4`

#### Scenario: Raw extend delta 被拒绝
- **WHEN** delta 使用 raw LikeC4 `extend` 作为 reconciliation operation
- **THEN** SHALL 返回 unsupported delta syntax ERROR
- **AND** SHALL NOT 将 additive merge 当作 target replacement

#### Scenario: Partial target 失败
- **WHEN** `MODIFIED element` 缺少必填完整 target fields
- **THEN** SHALL 返回包含 identity、field 与 source location 的 ERROR

#### Scenario: Formal snapshot 不被修改
- **WHEN** 执行任意 `arch validate --delta`
- **THEN** command SHALL NOT 写入 Formal Architecture、Specs 或 change artifacts
