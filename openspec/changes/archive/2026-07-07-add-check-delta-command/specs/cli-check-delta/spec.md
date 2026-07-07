## ADDED Requirements

### Requirement: Delta requirement reference preflight

`openspec check-delta` SHALL provide a pre-write CLI check for planned change-local delta spec requirement references. The command SHALL resolve each value from `--caps` as a spec id mapped to `openspec/specs/<spec-id>/spec.md`, list the main spec's available `### Requirement:` headers, and validate operation-specific requirement names before any delta spec file is required to exist.

#### Scenario: 可用 requirement headers 输出
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver`
- **THEN** the CLI SHALL read `openspec/specs/database-handler-resolver/spec.md`
- **AND** SHALL print `Main spec: openspec/specs/database-handler-resolver/spec.md`
- **AND** SHALL print an `Available requirements:` section containing the requirement header names from that main spec
- **AND** SHALL exit with code 0

#### Scenario: 不存在的 spec id 失败
- **WHEN** executing `openspec check-delta --change my-change --caps missing-spec`
- **THEN** the CLI SHALL report that `openspec/specs/missing-spec/spec.md` was not found
- **AND** SHALL state that `--caps` expects spec ids or spec directory names
- **AND** SHALL exit with code 1

#### Scenario: 缺失 caps 参数失败
- **WHEN** executing `openspec check-delta --change my-change`
- **THEN** the CLI SHALL report that `--caps` is required
- **AND** SHALL exit with code 1

#### Scenario: Cross-platform main spec path output
- **WHEN** `openspec check-delta` reports a resolved main spec path on Windows, macOS, or Linux
- **THEN** human and JSON output SHALL use the project-relative artifact path `openspec/specs/<spec-id>/spec.md`
- **AND** SHALL NOT expose platform-specific absolute paths in normal output

### Requirement: Operation-specific requirement checks

`openspec check-delta` SHALL support repeatable `--added`, `--modified`, `--removed`, and `--renamed-from` flags. `--added` names SHALL be valid only when absent from the main spec. `--modified`, `--removed`, and `--renamed-from` names SHALL be valid only when present in the main spec. Header comparison SHALL use the same whitespace-normalized requirement name semantics as delta spec validation.

#### Scenario: MODIFIED header 存在时通过
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver --modified "计算 handler 文件路径"`
- **AND** the main spec contains `### Requirement: 计算 handler 文件路径`
- **THEN** the CLI SHALL classify `MODIFIED 计算 handler 文件路径` as OK
- **AND** SHALL exit with code 0

#### Scenario: MODIFIED header 不存在时报 Missing
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver --modified "不存在的 Requirement"`
- **AND** the main spec does not contain that requirement header
- **THEN** the CLI SHALL classify `MODIFIED 不存在的 Requirement` as Missing
- **AND** SHALL exit with code 1

#### Scenario: REMOVED header 不存在时报 Missing
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver --removed "旧路径推导逻辑"`
- **AND** the main spec does not contain that requirement header
- **THEN** the CLI SHALL classify `REMOVED 旧路径推导逻辑` as Missing
- **AND** SHALL exit with code 1

#### Scenario: RENAMED FROM header 不存在时报 Missing
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver --renamed-from "旧名称"`
- **AND** the main spec does not contain that requirement header
- **THEN** the CLI SHALL classify `RENAMED_FROM 旧名称` as Missing
- **AND** SHALL exit with code 1

#### Scenario: ADDED header 不存在时通过
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver --added "新的 handler 缓存策略"`
- **AND** the main spec does not contain that requirement header
- **THEN** the CLI SHALL classify `ADDED 新的 handler 缓存策略` as OK
- **AND** SHALL exit with code 0

#### Scenario: ADDED header 已存在时报 Conflict
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver --added "计算 handler 文件路径"`
- **AND** the main spec contains `### Requirement: 计算 handler 文件路径`
- **THEN** the CLI SHALL classify `ADDED 计算 handler 文件路径` as Conflict
- **AND** SHALL suggest using `MODIFIED` instead
- **AND** SHALL exit with code 1

### Requirement: Aggregated check result output

`openspec check-delta` SHALL evaluate all requested operations for all requested spec ids before deciding validity. A Missing or Conflict result SHALL NOT short-circuit remaining requirement checks or remaining spec ids. The aggregate result SHALL be invalid when any Missing or Conflict exists.

#### Scenario: 混合结果不中断同一 spec 的其他校验
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver --modified "不存在的 Requirement" --modified "计算 handler 文件路径" --added "新的 Requirement"`
- **AND** the main spec contains `### Requirement: 计算 handler 文件路径`
- **AND** the main spec does not contain `### Requirement: 不存在的 Requirement`
- **AND** the main spec does not contain `### Requirement: 新的 Requirement`
- **THEN** the CLI SHALL report OK results for `MODIFIED 计算 handler 文件路径` and `ADDED 新的 Requirement`
- **AND** SHALL report a Missing result for `MODIFIED 不存在的 Requirement`
- **AND** SHALL exit with code 1

#### Scenario: 多个 caps 分组输出
- **WHEN** executing `openspec check-delta --change my-change --caps cli-validate,propose-workflow --modified "Artifact-scoped change validation" --added "新的 guidance"`
- **THEN** the CLI SHALL produce one grouped result per spec id
- **AND** a failure in one group SHALL NOT prevent the other group from listing its Available requirements and check results
- **AND** the final exit code SHALL be 1 when any group has Missing or Conflict results

#### Scenario: Repeatable operation flags are all evaluated
- **WHEN** executing `openspec check-delta --change my-change --caps cli-validate --modified "A" --modified "B" --added "C" --added "D"`
- **THEN** the CLI SHALL evaluate all four operation entries
- **AND** SHALL include each entry exactly once in OK, Missing, or Conflict output

### Requirement: JSON output for delta preflight

`openspec check-delta --json` SHALL output a stable machine-readable report with aggregate validity, per-spec available requirements, and categorized OK, Missing, and Conflict entries.

#### Scenario: JSON schema includes aggregate and grouped results
- **WHEN** executing `openspec check-delta --change my-change --caps database-handler-resolver --modified "Ghost" --json`
- **THEN** stdout SHALL be valid JSON
- **AND** the JSON object SHALL include `change`, `valid`, and `items`
- **AND** each `items[]` entry SHALL include `cap`, `mainSpec`, `available`, `ok`, `missing`, and `conflicts`
- **AND** each categorized operation entry SHALL include `operation` and `requirement`

#### Scenario: JSON invalid result sets exit code 1
- **WHEN** `openspec check-delta --json` produces at least one Missing or Conflict entry
- **THEN** the JSON `valid` field SHALL be `false`
- **AND** the process SHALL exit with code 1

#### Scenario: JSON valid result sets exit code 0
- **WHEN** `openspec check-delta --json` has no Missing or Conflict entries
- **THEN** the JSON `valid` field SHALL be `true`
- **AND** the process SHALL exit with code 0
