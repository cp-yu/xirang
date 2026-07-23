## MODIFIED Requirements

### Requirement: Active command references match the current CLI surface
OPSX SHALL 保持 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active Specs 中的命令示例与当前 `opsx --help` 一致。

#### Scenario: Project setup 与 Build references
- **WHEN** active surface 描述项目 setup、Project Build、Candidate validation 或 promotion
- **THEN** SHALL 使用 `opsx setup`、`opsx-build` 和 `opsx candidate init|status|validate|promote`
- **AND** SHALL NOT 引用 `opsx init`、`opsx bootstrap`、`opsx migrate` 或 `opsx-bootstrap-arch`

#### Scenario: Formal validation references
- **WHEN** active surface 描述 Candidate promotion 后的 formal validation
- **THEN** SHALL 使用 `opsx validate --all --strict`
- **AND** SHALL NOT 将 change verify gate 描述为 Project Build promotion gate

#### Scenario: Historical references
- **WHEN** retired references 仅位于 `.opsx/changes/archive/**` 或 `.opsx/history/**`
- **THEN** SHALL 将其与 active stale references 分开报告
- **AND** SHALL NOT 修改历史证据

### Requirement: Cleanup verification reports remaining stale references by class
Command cleanup SHALL 通过可重复审计按 active docs、source templates、generated skills、help/completion、active Specs 和 historical evidence 分类报告 stale references。

#### Scenario: 清理后审计
- **WHEN** Project Build surface 切换完成
- **THEN** active classes SHALL 不包含 retired `init`、`bootstrap`、`migrate` 或 `opsx-bootstrap-arch` references
- **AND** audit SHALL 单独报告 archive/history 中允许保留的 occurrences
