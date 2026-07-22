# archive-sync-workflow Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: sync SHALL 合并 architecture-delta.c4

Sync SHALL 将 `architecture-delta.c4` graph module 与 change-local Spec contract modules 作为一个 Semantic Delta 合并到 formal OPSX Semantic Model。Elements、containment、relationships、bindings 与 contracts SHALL 联合验证并原子写入。

#### Scenario: 合并任意 kind child element
- **WHEN** graph delta extend 一个 existing element 并新增 child
- **THEN** SHALL 将 child 写入对应 graph source module
- **AND** SHALL 保持 stable `elementId` 与合法 containment

#### Scenario: 合并 semantic relationships
- **WHEN** delta 添加 relation
- **THEN** SHALL 写入 canonical relationship module
- **AND** SHALL 使用 Metamodel relationship kind 与 endpoint constraints

#### Scenario: Spec binding 由 frontmatter formalize
- **WHEN** change-local Spec 声明 `element: <elementId>`
- **THEN** sync SHALL 保留 singular binding 到 formal Spec
- **AND** MUST NOT 向 element 写入 `metadata.specs`

#### Scenario: 合并失败回滚
- **WHEN** graph、contract、registry 或 full validation 任一失败
- **THEN** SHALL 回滚全部 formal modifications
- **AND** SHALL 报告失败原因

### Requirement: archive SHALL 删除 architecture-delta.c4

Archive SHALL 在确认 Semantic Delta 已 sync 后封存 change，并 SHALL 从 active change state 清理已消费的 `architecture-delta.c4` 与 scenario label metadata。Archive MUST NOT 再次改变 formal OPSX Semantic Model。

#### Scenario: 清理已消费 delta
- **WHEN** archive gate 确认 graph 与 contract modules 已 sync
- **THEN** SHALL 封存 change-local delta artifacts
- **AND** MUST NOT 删除或重写 formal model content

#### Scenario: 未同步 delta 阻塞 archive
- **WHEN** graph 或 contract module 仍有 pending semantic operations
- **THEN** archive SHALL 阻塞
- **AND** SHALL 指引先运行 sync

