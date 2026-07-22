## MODIFIED Requirements

### Requirement: Snack 执行一次自检与程序化 labels

Snack SHALL 运行 full change validation，并审阅统一 effective semantic diff。出现 ERROR/WARNING 时 SHALL 修复一轮并复检一次；validation 无 ERROR 后 SHALL 运行 `opsx diff --change "<name>" --write`，且 MUST NOT 生成或写入 Scenario labels。

#### Scenario: 输出 reconciliation result
- **WHEN** self-check 与 diff review 完成
- **THEN** summary SHALL 披露 validation pass 或 remaining issues
- **AND** SHALL 汇总 effective Specs 与 Architecture operations
- **AND** SHALL 提供 quick sync、quick archive、sync-and-archive 与 continue-development paths

#### Scenario: Unexpected effective operation
- **WHEN** Diff IR 包含 evidence 与 authorized intent 无法支持的 operation
- **THEN** Snack SHALL 修正 proposal、Specs、design 或 Architecture delta source
- **AND** SHALL NOT 手工编辑 `effective-change.md`
