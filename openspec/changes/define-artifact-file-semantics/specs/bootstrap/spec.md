## ADDED Requirements

### Requirement: Bootstrap phase file definitions

Bootstrap SHALL 为完整生命周期文件提供结构化定义，并由 `openspec bootstrap instructions <phase> --json` 按 phase 投影。Definitions SHALL 区分 Agent-authored source、CLI-generated derived files、review-controlled files 与 workflow-managed formal outputs。

#### Scenario: Init 与 scan definitions
- **WHEN** Agent 请求 init instructions
- **THEN** `fileDefinitions` SHALL 描述 `.bootstrap.yaml` 为禁止 Agent 直接编辑的 workflow metadata
- **AND** SHALL 描述 `scope.yaml` 为 CLI 持久化、用户决策驱动的范围配置
- **WHEN** Agent 请求 scan instructions
- **THEN** SHALL 额外描述 `evidence.yaml` 为 Agent-authored repository evidence source

#### Scenario: Map definitions
- **WHEN** Agent 请求 map instructions
- **THEN** `fileDefinitions` SHALL 描述 `evidence.yaml` 为输入
- **AND** SHALL 描述 `domain-map/*.yaml` 为 Agent-authored domain/capability/relation source
- **AND** relation 选择规则 SHALL 继续由 `RelationDefinitionRegistry` projection 提供

#### Scenario: Review definitions
- **WHEN** Agent 请求 review instructions
- **THEN** `fileDefinitions` SHALL 区分 source files、CLI-generated `candidate/**` 与 regenerated `review.md`
- **AND** SHALL 标记 `review.md` 只允许审查者更新 approval checkboxes

#### Scenario: Promote definitions
- **WHEN** Agent 请求 promote instructions
- **THEN** `fileDefinitions` SHALL 描述 candidate OPSX bundle、formal `project.opsx.yaml` 与 formal `project.opsx.relations.yaml`
- **AND** SHALL 明确 formal files 只能由受控 promotion workflow 写入
- **AND** SHALL 说明成功后 bootstrap workspace 被保留
