# openspec-propose-skill Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: propose skill SHALL 生成 architecture-delta.c4

propose skill SHALL 指导 Agent 生成 `architecture-delta.c4` 而非 `opsx-delta.yaml`。

#### Scenario: 指导生成 LikeC4 delta

- **WHEN** Agent 执行 propose skill
- **AND** change 影响架构
- **THEN** skill SHALL 指导创建 `architecture-delta.c4`
- **AND** skill SHALL 提供 LikeC4 DSL 语法参考
- **AND** skill MUST NOT 指导创建 `opsx-delta.yaml`

#### Scenario: 提供 extend 语法示例

- **WHEN** skill 指导 delta 生成
- **THEN** SHALL 包含 `extend` 语法示例：
  ```likec4
  model {
    extend existing_domain {
      new_capability = capability 'Name' { ... }
    }
  }
  ```

#### Scenario: 指导引用 change-local specs

- **WHEN** skill 指导 capability metadata
- **THEN** SHALL 强调 specs 路径使用 change-local 路径
- **AND** SHALL 提供示例：`specs ['openspec/changes/<name>/specs/...']`

### Requirement: propose skill SHALL 指导 relationship 类型选择

skill SHALL 帮助 Agent 选择正确的 relationship kind。

#### Scenario: 提供 relationship kinds 参考

- **WHEN** skill 指导添加 relation
- **THEN** SHALL 列出 6 种 semantic relations：
  - `invokes`：主动调用
  - `consumes`：消费输出或合同
  - `precedes`：时序依赖
  - `constrains`：约束限制
  - `validates`：有效性判定
- **AND** SHALL 说明 belongs_to 通过嵌套表达

### Requirement: propose skill SHALL 指导验证 delta

skill SHALL 要求 Agent 在生成 delta 后验证。

#### Scenario: 验证 delta 语法

- **WHEN** Agent 完成 architecture-delta.c4
- **THEN** skill SHALL 指导运行 `openspec arch validate --delta`
- **AND** SHALL 要求修复验证错误后再继续
