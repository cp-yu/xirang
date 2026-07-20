# archive-sync-workflow Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: sync SHALL 合并 architecture-delta.c4

sync workflow SHALL 合并 change-local `architecture-delta.c4` 到 formal LikeC4 模型。

#### Scenario: 合并新 capability 到 domain 文件

- **GIVEN** `architecture-delta.c4` 包含：
  ```likec4
  extend ai_integration {
    new_feature = capability 'New Feature' { ... }
  }
  ```
- **WHEN** 运行 `openspec sync <name>`
- **THEN** SHALL 将 `new_feature` 添加到 `openspec/architecture/domains/ai-integration.c4`
- **AND** SHALL 保持 domain 文件格式一致

#### Scenario: 合并新 relations

- **GIVEN** delta 包含新 relation: `a.cap1 -[invokes]-> b.cap2`
- **WHEN** sync
- **THEN** SHALL 将 relation 添加到 canonical `openspec/architecture/relations.c4`
- **AND** SHALL 保持 relations 按 source、kind、target 字母顺序排列

#### Scenario: 更新 change-local specs 路径为 formal 路径

- **GIVEN** delta capability metadata 包含 `specs ['openspec/changes/<name>/specs/new.md']`
- **WHEN** sync
- **THEN** SHALL 将 spec 文件移动到 `openspec/specs/<spec-id>/`
- **AND** SHALL 更新 metadata 中的路径为 formal 路径

#### Scenario: 合并失败回滚

- **GIVEN** sync 过程中遇到冲突或错误
- **WHEN** 合并失败
- **THEN** SHALL 回滚所有对 formal 模型的修改
- **AND** SHALL 报告失败原因

### Requirement: archive SHALL 删除 architecture-delta.c4

archive 后 SHALL 删除 change 目录中的 `architecture-delta.c4`。

#### Scenario: 清理 delta 文件

- **WHEN** 运行 `openspec archive <name>`
- **THEN** SHALL 删除 `openspec/changes/<name>/architecture-delta.c4`
- **AND** MUST NOT 删除已合并到 formal 模型的内容
