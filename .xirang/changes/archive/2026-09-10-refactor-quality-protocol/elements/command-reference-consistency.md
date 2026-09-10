---
entity: element-declaration
identity: command-reference-consistency
kind: element
parent: cli
title: Command Reference Consistency
definition: Command Reference Consistency 定义活动命令引用与当前 CLI surface 的一致性契约：active user-facing 文档、模板、skills、prompts 与 active Specs 的命令示例必须与 `xirang --help` 一致；stale 引用清理须在生成源头进行，并按类别报告残留。
---
## MODIFIED Requirements

### Requirement: Active command references match the current CLI surface

息壤 SHALL 保持 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active Element Contracts 中的命令示例与当前 `xirang --help` 一致。

#### Scenario: Project setup 与 Build references
- **WHEN** active surface 描述项目 setup、Project Build、Candidate validation 或 promotion
- **THEN** SHALL 使用 `xirang setup`、`xirang-build` 和 `xirang candidate init|status|validate|promote`
- **AND** SHALL NOT 引用退役命令名或 bootstrap 工作流名称

#### Scenario: Formal validation references
- **WHEN** active surface 描述 Candidate promotion 后的 formal validation
- **THEN** SHALL 使用 `xirang validate --all --strict`
- **AND** SHALL NOT 将 change quality gate 描述为 Project Build promotion gate

#### Scenario: Quality command references
- **WHEN** active surface 描述代码质量验证与优化
- **THEN** SHALL 使用 `xirang quality review|optimize|status|seal`
- **AND** SHALL NOT 引用 `xirang verify`、`--type` 或相位编号

#### Scenario: Historical references
- **WHEN** retired references 仅位于 `.xirang/changes/archive/**` 或 `.xirang/history/**`
- **THEN** SHALL 将其与 active stale references 分开报告
- **AND** SHALL NOT 修改历史证据
