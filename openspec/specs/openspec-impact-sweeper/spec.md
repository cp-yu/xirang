# openspec-impact-sweeper Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: Impact sweeper SHALL 使用 LikeC4 导航架构

sweeper SHALL 使用 `openspec arch query` 导航 LikeC4 模型。

#### Scenario: 查询相关 capabilities

- **WHEN** sweeper 分析 impact
- **THEN** SHALL 使用 `openspec arch query` 查询受影响的 elements
- **AND** SHALL 使用 `--relations --depth 2` 发现相关 capabilities
- **AND** MUST NOT 直接读取 YAML 文件

#### Scenario: 报告中包含 LikeC4 element IDs

- **WHEN** sweeper 生成报告
- **THEN** 报告 SHALL 使用 LikeC4 element IDs（如 `ai_integration.skill_generation`）
- **AND** MUST NOT 使用旧的 OPSX node ID 格式
