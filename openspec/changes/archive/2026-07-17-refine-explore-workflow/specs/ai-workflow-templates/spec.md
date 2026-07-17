## MODIFIED Requirements

### Requirement: Workflow Skills 声明 Internal Subagents 约束

Workflow skill 模板的 instructions SHALL 以共享 OpenSpec Philosophy 开头。具体 authoring、canonical syntax 与 gate 规则 SHALL 由对应 workflow surface 在需要处声明，不得重新扩写项目哲学。Subagent 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中，而非在主 skill 模板中以独立协议节列出。

#### Scenario: Explore skill 的 instructions 结构

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill instructions
- **THEN** instructions SHALL 包含 OpenSpec Philosophy、只读 workflow stage、Required References、Hard Rules、Required Context、Impact Sweeps 与唯一的 Brainstorming Checklist
- **AND** SHALL NOT 重复完整的 brainstorming flow

#### Scenario: Apply skill 的 instructions 结构

- **WHEN** `getApplyChangeSkillTemplate()` 生成 apply skill instructions
- **THEN** instructions SHALL 以 OpenSpec Philosophy 开头，后接 definition-first authoring 规则、Flow Outline 和 Implementation Discipline
- **AND** 每个流程步骤 SHALL 指向独立的 `openspec/references/openspec-apply-step-<N>-<name>.md` 文件
