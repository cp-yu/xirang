---
element: project.root/domain.architecture/cap.architecture.semantic-model
---

## MODIFIED Requirements

### Requirement: sync SHALL 合并 architecture-delta.c4

Sync SHALL 将 identity-level `architecture-delta.c4` operations 与 change-local Requirement operations 编译为一个完整 Target Semantic Model，联合验证并原子写入干净 Formal LikeC4 与 Specs modules。

#### Scenario: 合并任意 kind element target
- **WHEN** graph delta 新增或修改任意 kind element
- **THEN** SHALL 将完整 target state 写入对应 Formal graph source module
- **AND** SHALL 保持 stable identity 与合法 containment

#### Scenario: 合并 semantic relationships
- **WHEN** delta 新增、修改或删除 relationship
- **THEN** SHALL 按 canonical tuple reconcile Formal relationship set
- **AND** SHALL 检查 Metamodel endpoint constraints

#### Scenario: Spec binding 由 frontmatter formalize
- **WHEN** change-local Spec 声明 `element: <elementId>`
- **THEN** sync SHALL 保留 singular binding 到 Formal Spec
- **AND** MUST NOT 复制 change-local review metadata

#### Scenario: 严格 removal
- **WHEN** removed element 仍有 surviving descendants、relationships 或 bindings
- **THEN** SHALL 阻止 sync
- **AND** MUST NOT cascade delete

#### Scenario: 合并失败回滚
- **WHEN** graph、contract、registry、fingerprint 或 full validation 任一失败
- **THEN** SHALL 回滚全部 Formal modifications

### Requirement: archive SHALL 删除 architecture-delta.c4

Archive SHALL 在确认 Semantic Delta 已 sync 后封存完整 change directory，包括最终 `effective-change.md` 与已消费的 source delta artifacts。Archive MUST NOT 删除 archived `architecture-delta.c4`，也 MUST NOT 再次改变 Formal Semantic Model。

#### Scenario: 封存已消费 delta 与 review report
- **WHEN** archive gates 确认 graph 与 contract operations 已 sync
- **THEN** SHALL 先重新生成 final `effective-change.md`
- **AND** SHALL 将 source delta 与 report 一同移动到 archive
- **AND** MUST NOT 重写 Formal content

#### Scenario: 未同步 delta 阻塞 archive
- **WHEN** graph 或 contract operation 仍 pending
- **THEN** SHALL 阻塞 archive
- **AND** SHALL 指引先运行 sync
