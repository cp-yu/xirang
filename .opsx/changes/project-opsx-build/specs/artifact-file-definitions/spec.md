## REMOVED Requirements

### Requirement: Bootstrap phase 文件定义投影
**Reason**: Project Build 不存在 phase-based bootstrap schema 或 phase instruction projection。

**Migration**: 使用 Candidate CLI contract 和 generated `opsx-build` skill。

## ADDED Requirements

### Requirement: Candidate file definitions SHALL 分离 authoring 与 workflow state
Candidate workspace SHALL 为 CLI-owned `candidate.yaml`、Agent-authored `build.md`、Agent-authored Candidate Architecture/Specs、read-only validation output、formal bundle 和 history snapshots 提供彼此独立的 file semantics。

#### Scenario: Candidate source definitions
- **WHEN** Agent 初始化或编写 Candidate
- **THEN** definition SHALL 将 `build.md`、`candidate/architecture/**/*.c4` 和 `candidate/specs/**/spec.md` 标识为 Agent-authored source
- **AND** SHALL 将 `candidate.yaml` 标识为 CLI-owned lifecycle metadata
- **AND** SHALL NOT 定义 evidence.yaml、domain-map、review.md 或 Spec backfill files

#### Scenario: Formal 与 history definitions
- **WHEN** 描述 Candidate promotion
- **THEN** formal `.opsx/architecture/**/*.c4` 和 `.opsx/specs/**/spec.md` SHALL 保持为 durable semantic source
- **AND** `.opsx/history/` SHALL 仅作为 audit 和 recovery evidence
- **AND** history SHALL NOT 成为 runtime fallback semantic source
