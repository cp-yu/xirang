## ADDED Requirements

### Requirement: Change SHALL 使用 architecture-delta.c4 表达架构增量

Change 目录中的架构增量 SHALL 使用 `architecture-delta.c4` 文件，而非 `opsx-delta.yaml`。Active spec-driven artifact graph、authoring help 与 validation scope SHALL 仅暴露 `architecture-delta`；legacy OPSX delta readers MAY remain as explicitly deprecated migration compatibility APIs。

#### Scenario: 创建 architecture-delta.c4

- **GIVEN** change 影响架构
- **WHEN** propose 生成 change artifacts
- **THEN** SHALL 创建 `openspec/changes/<name>/architecture-delta.c4`
- **AND** MUST NOT 创建 `opsx-delta.yaml`

#### Scenario: Spec-driven artifact graph 使用 LikeC4 delta

- **WHEN** Agent 查询 spec-driven artifact status 或 instructions
- **THEN** SHALL 暴露 artifact ID `architecture-delta` 与 output `architecture-delta.c4`
- **AND** MUST NOT 暴露 active artifact ID `opsx-delta`
- **AND** `openspec validate --change <name> --artifacts opsx-delta` SHALL 返回 unsupported scope error

### Requirement: Delta 文件 SHALL 使用 LikeC4 extend 语法

Delta SHALL 使用 `extend` 关键字扩展已有 domains，或定义新 domains。

#### Scenario: 扩展已有 domain 添加 capability

- **GIVEN** formal 模型包含 `ai_integration` domain
- **AND** change 添加新 capability `new_feature`
- **WHEN** 生成 architecture-delta.c4
- **THEN** SHALL 包含：
  ```likec4
  model {
    extend ai_integration {
      new_feature = capability 'New Feature' {
        description '...'
        metadata {
          capabilityId 'cap.ai.new-feature'
          specs ['openspec/changes/<name>/specs/new-feature.md']
        }
      }
    }
  }
  ```

#### Scenario: 添加新 relation

- **GIVEN** change 添加 relation: `cap.a.feature1 -[invokes]-> cap.b.feature2`
- **WHEN** 生成 architecture-delta.c4
- **THEN** SHALL 包含：
  ```likec4
  model {
    domain_a.feature1 -[invokes]-> domain_b.feature2 {
      description '...'
    }
  }
  ```

### Requirement: Delta 文件 SHALL 引用 change-local specs

Delta 中新 capability 的 metadata.specs SHALL 指向 change-local 路径。

#### Scenario: 引用 change-local spec

- **GIVEN** change 名为 `add-new-feature`
- **AND** 包含 `specs/new-capability.md`
- **WHEN** 生成 architecture-delta.c4 的 capability
- **THEN** metadata.specs SHALL 为 `['openspec/changes/add-new-feature/specs/new-capability.md']`

### Requirement: Delta 验证 SHALL 检查 extend 目标存在

验证 delta 文件 SHALL 确保 `extend` 的 domain 在 formal 模型中存在。

#### Scenario: Extend 不存在的 domain

- **GIVEN** architecture-delta.c4 包含 `extend nonexistent_domain { ... }`
- **AND** formal 模型中不存在该 domain
- **WHEN** 运行 `openspec arch validate --delta`
- **THEN** SHALL 返回错误 "Cannot extend nonexistent domain: nonexistent_domain"

### Requirement: Delta 合并 SHALL 原子性更新 formal 模型

Sync 时合并 delta SHALL 确保要么完全成功，要么完全回滚。

#### Scenario: 合并成功更新所有文件

- **GIVEN** architecture-delta.c4 包含 2 个新 capabilities 和 3 个 relations
- **WHEN** 运行 `openspec sync <name>`
- **THEN** SHALL 将新 capabilities 添加到对应的 domain 文件
- **AND** SHALL 将新 relations 添加到对应文件
- **AND** 所有更新 SHALL 在同一事务中完成

#### Scenario: 合并失败回滚

- **GIVEN** delta 合并过程中遇到冲突
- **WHEN** 合并失败
- **THEN** SHALL 回滚所有修改
- **AND** formal 模型 SHALL 保持合并前状态
