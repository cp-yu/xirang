# validate-opsx-dry-run Specification

## Purpose
此规约记录变更 fix-opsx-delta-artifact-and-validation 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: Validator 支持 OPSX dry-run merge 校验

`Validator` SHALL 对 `opsx-delta.yaml` 执行 v2 dry-run：读取两文件 formal OPSX、解析 `OpsxDeltaSchema`、调用 `applyOpsxDelta()`、执行 referential integrity 与 Registry-driven relation semantic validation。Formal OPSX 或 delta 缺失时保持现有跳过行为。Validator MUST NOT 调用 code-map validation。

#### Scenario: 有效 v2 delta 通过校验
- **GIVEN** formal OPSX v2 与 delta 均合法
- **WHEN** `validateOpsxDelta(changeDir)` 执行
- **THEN** 返回 `valid: true` 且 `issues` 为空

#### Scenario: 非法 relation endpoint 被拒绝
- **GIVEN** delta relation 使用存在但类型不合法的 endpoints
- **WHEN** dry-run validation 执行
- **THEN** 返回 ERROR issue
- **AND** issue SHALL 包含 relation type、from/to 与允许的 endpoint kinds

#### Scenario: 旧 relation token 被拒绝
- **GIVEN** delta 使用 `contains`、`depends_on` 或其他 v1 relation
- **WHEN** schema parsing 执行
- **THEN** validation SHALL 失败并列出 canonical v2 tokens

#### Scenario: Code-map 缺失不影响校验
- **GIVEN** formal v2 两文件存在且没有 `project.opsx.code-map.yaml`
- **WHEN** dry-run validation 执行
- **THEN** validator SHALL 正常完成
- **AND** MUST NOT 产生 Code-map integrity issue

### Requirement: validate 命令变更路径并行执行 spec + OPSX 校验

`openspec validate --type change` 和 `openspec validate --changes` 在验证 change 时 SHALL 并行执行 `validateChangeDeltaSpecs()` 和 `validateOpsxDelta()`。

#### Scenario: 单 change 验证合并两个报告

- **WHEN** 执行 `openspec validate <change-name> --type change`
- **THEN** SHALL 同时运行 spec delta 结构校验和 OPSX dry-run merge 校验
- **AND** `valid` SHALL 为两个报告均 valid 时才为 true
- **AND** `issues` SHALL 合并两者的所有 issues

#### Scenario: 批量 change 验证包含 OPSX 校验

- **WHEN** 执行 `openspec validate --changes`
- **THEN** 每个 change SHALL 并行执行 spec + OPSX 校验
- **AND** 汇总报告 SHALL 反映所有校验结果

#### Scenario: JSON 输出兼容现有 schema

- **WHEN** 执行 `openspec validate --changes --json`
- **THEN** 输出 JSON 的 `items[].issues` 数组 SHALL 包含 OPSX 校验产生的 issues
- **AND** `items[].valid` SHALL 反映包含 OPSX 校验的合并结果
- **AND** JSON 顶层 shape（`items`, `summary`, `version`）SHALL 保持不变

