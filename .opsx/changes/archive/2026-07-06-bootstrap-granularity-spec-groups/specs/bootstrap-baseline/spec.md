## MODIFIED Requirements

### Requirement: Raw + full SHALL generate formal OPSX and complete valid specs
在 `raw + full` 下，bootstrap SHALL 将 candidate specs 纳入 review / stale / promote 合同，并且当 candidate spec 失效时在任何正式写入之前阻断 promote。Spec 完整性 SHALL 按 capability coverage 判定：每个 candidate capability MUST 被至少一个 candidate/formal spec frontmatter 覆盖。

#### Scenario: [MODIFIED] Full mode output is reviewed before promote
- **GIVEN** bootstrap 以 `full` 模式初始化
- **AND** baseline 类型为 `raw`
- **WHEN** 执行 `openspec bootstrap validate`
- **THEN** 同时生成 candidate OPSX 与 candidate specs
- **AND** review SHALL 审核 candidate specs 的完整性与合法性
- **AND** promote SHALL NOT 在写入时临时生成未审核 specs
- **AND** review SHALL show whether candidate specs are generated from `spec_groups` or `capabilities[].spec`

#### Scenario: [MODIFIED] Candidate spec source edits make review stale
- **GIVEN** bootstrap 以 `full` 模式初始化
- **AND** baseline 类型为 `raw`
- **AND** candidate 输出与 review 已生成且处于 `current`
- **WHEN** 任一会影响 candidate spec 内容、路径、frontmatter capabilities 或 `spec_groups` membership 的 spec-generation source data 被修改
- **THEN** reviewState SHALL 变为 `stale`
- **AND** promote SHALL 被阻止，直到重新运行 `openspec bootstrap validate` 并重新审核

#### Scenario: [MODIFIED] Invalid candidate spec blocks promote before formal writes
- **GIVEN** bootstrap 以 `full` 模式初始化
- **AND** baseline 类型为 `raw`
- **AND** review 已完成并允许 promote
- **AND** 某个 candidate spec 在磁盘上变为非法或缺失
- **WHEN** 执行 `openspec bootstrap promote`
- **THEN** 命令 SHALL 失败
- **AND** SHALL NOT 写入任何正式 OPSX 文件
- **AND** SHALL NOT 写入任何正式 spec 文件

#### Scenario: [ADDED] Coarse full output covers capabilities through grouped specs
- **GIVEN** bootstrap 以 `full` 模式初始化
- **AND** baseline 类型为 `raw`
- **AND** `scope.yaml` contains `granularity: coarse`
- **AND** domain-map source contains valid `spec_groups`
- **WHEN** promote 成功
- **THEN** formal specs SHALL be written from those `spec_groups`
- **AND** every mapped capability SHALL appear in at least one formal spec frontmatter capabilities list
- **AND** formal spec count MAY be lower than mapped capability count

#### Scenario: [ADDED] Fine full output remains per capability
- **GIVEN** bootstrap 以 `full` 模式初始化
- **AND** baseline 类型为 `raw`
- **AND** `scope.yaml` contains `granularity: fine`
- **WHEN** promote 成功
- **THEN** candidate capability specs SHALL be written from `capabilities[].spec`
- **AND** each generated spec SHALL cover the capability declared by its source capability spec
