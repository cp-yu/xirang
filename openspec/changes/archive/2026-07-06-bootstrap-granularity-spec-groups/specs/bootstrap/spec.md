## MODIFIED Requirements

### Requirement: Bootstrap docs and workflow templates SHALL describe only the CLI-backed five-phase flow
Bootstrap 文档、workflow templates 与生成的命令指引 SHALL 仅将 bootstrap 描述为由现有 `openspec bootstrap` CLI 子命令驱动的结构化流程，并 SHALL 明确 agent 在 init 前负责询问 `granularity`。

#### Scenario: [MODIFIED] Bootstrap command guidance references real CLI subcommands
- **WHEN** a user reads generated bootstrap command content or bootstrap workflow guidance
- **THEN** the documented flow SHALL reference only these CLI subcommands:
  - `openspec bootstrap status`
  - `openspec bootstrap init`
  - `openspec bootstrap instructions`
  - `openspec bootstrap validate`
  - `openspec bootstrap promote`
  - `openspec bootstrap backfill-specs`
- **AND** the guidance SHALL describe the lifecycle `init → scan → map → review → promote`
- **AND** the guidance SHALL describe `backfill-specs` as an independent subcommand also invoked by promote
- **AND** the guidance SHALL describe `--granularity coarse|fine` as explicit agent-provided init state, not as a CLI-owned semantic decision

#### Scenario: [MODIFIED] Promote 末尾自动调用 backfill
- **WHEN** `openspec bootstrap promote` 成功写入 OPSX 和 specs
- **THEN** promote SHALL 自动调用 Backfill Engine
- **AND** SHALL 在 promote 输出中包含 backfill 统计（已写入数、未匹配数）

#### Scenario: [MODIFIED] Bootstrap skill 指令包含 subagent 语义匹配
- **WHEN** bootstrap skill 模板被加载
- **THEN** 指令 SHALL 描述 promote 后对 backfill 返回的 unmatched specs 启动 subagent
- **AND** subagent SHALL 读取 spec 内容和 OPSX cap intent 进行语义匹配
- **AND** 主 agent SHALL 按 subagent 结果写入 frontmatter
- **AND** 最终报告 SHALL 列出仍无匹配的 specs

#### Scenario: [MODIFIED] Deprecated pseudo-command flags are removed from bootstrap docs
- **WHEN** bootstrap docs are updated for the structured CLI-backed workflow
- **THEN** they SHALL NOT describe unsupported command forms such as `/opsx:bootstrap --focus`, `/opsx:bootstrap --extend --capabilities`, `/opsx:bootstrap --extend --relations`, or `/opsx:bootstrap --refresh`
- **AND** the docs SHALL direct scoped initialization to supported CLI parameters such as `openspec bootstrap init --scope ...`

## ADDED Requirements

### Requirement: Bootstrap granularity selection
Bootstrap skill agent SHALL obtain an explicit `coarse` or `fine` granularity choice before initialization when no explicit choice exists, and CLI SHALL only persist that confirmed choice into bootstrap scope.

#### Scenario: [ADDED] Agent asks granularity before init
- **WHEN** the bootstrap skill reaches init and no granularity has been explicitly provided
- **THEN** the agent SHALL ask the user to choose `coarse` or `fine`
- **AND** the agent SHALL explain that `coarse` produces fewer grouped specs while `fine` preserves per-capability specs
- **AND** the agent SHALL NOT choose a default on behalf of the user

#### Scenario: [ADDED] CLI persists explicit granularity
- **WHEN** the agent runs `openspec bootstrap init --mode full --granularity coarse`
- **THEN** CLI SHALL write `granularity: coarse` into `openspec/bootstrap/scope.yaml`
- **AND** CLI SHALL treat the value as persisted agent execution state
- **AND** CLI SHALL NOT infer spec grouping semantics from repository evidence during init

### Requirement: Bootstrap grouped spec source
Bootstrap domain-map source SHALL support `spec_groups` for coarse-grained spec generation without changing OPSX graph nodes.

#### Scenario: [ADDED] Coarse mode uses spec_groups as spec source
- **GIVEN** `scope.yaml` contains `granularity: coarse`
- **AND** a valid `domain-map/*.yaml` contains `spec_groups`
- **WHEN** `openspec bootstrap validate` compiles candidate specs
- **THEN** each `spec_groups[]` entry SHALL produce one candidate spec file
- **AND** the generated spec SHALL include frontmatter capabilities from `spec_groups[].capabilities`
- **AND** `spec_groups` SHALL NOT create domains, capabilities, relations, or code-map nodes in OPSX output

#### Scenario: [ADDED] Fine mode keeps capability spec source
- **GIVEN** `scope.yaml` contains `granularity: fine`
- **WHEN** `openspec bootstrap validate` compiles candidate specs
- **THEN** candidate specs SHALL be generated from `capabilities[].spec`
- **AND** the system SHALL NOT merge capability specs through `spec_groups`

### Requirement: Bootstrap completion validation
Bootstrap skill agent SHALL run formal OpenSpec validation after a completed promote/backfill sequence.

#### Scenario: [ADDED] Agent validates after promote
- **WHEN** `openspec bootstrap promote -y` completes successfully
- **THEN** bootstrap skill guidance SHALL require the agent to run `openspec validate --all`
- **AND** the bootstrap workflow SHALL NOT treat completion as ready for handoff until the validation result is reported

#### Scenario: [ADDED] Validation failure returns to artifact repair
- **WHEN** `openspec validate --all` fails after promote
- **THEN** the agent SHALL report the failing item and return to the relevant bootstrap source artifact for repair
- **AND** the workflow SHALL NOT claim bootstrap completion while validation failures remain unresolved
