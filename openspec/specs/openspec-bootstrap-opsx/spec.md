# openspec-bootstrap-opsx Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: Bootstrap skill 名称 SHALL 改为 bootstrap-arch

skill 文件名和引用 SHALL 从 `openspec-bootstrap-opsx` 改为 `openspec-bootstrap-arch`。

#### Scenario: 重命名 skill

- **WHEN** 更新 skill
- **THEN** skill 文件 SHALL 重命名为 `openspec-bootstrap-arch`
- **AND** skill 内部引用 SHALL 使用新名称
- **AND** 文档引用 SHALL 更新为 `openspec-bootstrap-arch`

### Requirement: Bootstrap SHALL 输出 LikeC4 候选模型

bootstrap 输出 SHALL 生成 LikeC4 .c4 文件，而非 OPSX YAML。

#### Scenario: 生成 LikeC4 候选文件

- **WHEN** Agent 执行 bootstrap
- **THEN** SHALL 生成 `openspec/architecture/candidates/` 目录
- **AND** SHALL 为每个发现的 domain 生成 `.c4` 文件
- **AND** SHALL 使用 LikeC4 DSL 语法
- **AND** MUST NOT 生成 YAML 文件

#### Scenario: 候选模型使用嵌套表达 ownership

- **WHEN** 生成候选 capability
- **THEN** SHALL 嵌套在对应 domain 内
- **AND** MUST NOT 生成显式 `belongs_to` relationship
