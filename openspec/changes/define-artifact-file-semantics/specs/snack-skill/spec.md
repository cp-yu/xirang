## MODIFIED Requirements

### Requirement: Code-map 反查

Snack skill SHALL 使用 code-change evidence、capability id/intent、spec coverage 与当前代码检索将 changed files/symbols 映射到 capabilities。CodeGraph 可用时 MAY 用于 symbol/call/import/blast-radius evidence；否则 SHALL 使用 ACE、`rg` 与 `read`。Skill MUST NOT 读取 `project.opsx.code-map.yaml`，无法唯一映射时 SHALL 标记 `[REVIEW NEEDED]`。

#### Scenario: CodeGraph 映射 changed symbols
- **GIVEN** 项目有可用 CodeGraph index
- **WHEN** snack 分析 changed files/symbols
- **THEN** SHALL 使用结构化 symbol 与 dependency evidence 辅助 capability mapping
- **AND** SHALL 结合 OPSX intent/spec，而非将 file node 直接视为 capability

#### Scenario: 无 CodeGraph 时回退
- **WHEN** CodeGraph 不可用
- **THEN** snack SHALL 使用 ACE、`rg` 与 `read` 继续 mapping
- **AND** uncertain mapping SHALL 标记 `[REVIEW NEEDED]`
