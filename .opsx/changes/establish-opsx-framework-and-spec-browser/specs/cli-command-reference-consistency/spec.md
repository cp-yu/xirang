## MODIFIED Requirements

### Requirement: Active command references match the current CLI surface

OPSX SHALL 保持 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active specs 中的命令示例与当前 `opsx --help` 命令表面一致。

#### Scenario: [ADDED] Active surfaces 不引用已移除命令

- **WHEN** 审计 active 命令引用
- **THEN** 当前 user-facing documentation 和生成的 Agent instruction surfaces SHALL NOT 引用已移除的命令如 `opsx` 或 `opsx arch preview`
- **AND** 架构浏览引用 SHALL 使用 `opsx view`
- **AND** 项目路径引用 SHALL 使用 `.opsx/`

#### Scenario: [ADDED] 验证命令使用正确形式

- **WHEN** active 命令引用描述验证操作
- **THEN** 它们 SHALL 使用支持的 `opsx validate ...` 命令
- **AND** 实现验证 gate 引用 SHALL 使用支持的 `opsx verify phase1`、`opsx verify phase2`、`opsx verify seal` 或 `opsx verify status` 命令

#### Scenario: [ADDED] 位置式 change 命令替换已移除 change 标志

- **WHEN** active 命令引用描述对 change 的 sync 或 archive 操作
- **THEN** 它们 SHALL 使用支持的位置式命令形式如 `opsx sync <change-name>` 和 `opsx archive <change-name>`
- **AND** 它们 SHALL NOT 描述已移除的 sync/archive `--change` 标志形式

#### Scenario: [ADDED] Bootstrap 验证使用 bootstrap 命令表面

- **WHEN** active 命令引用描述 bootstrap gate 验证或 bootstrap 生成的 OPSX 候选检查
- **THEN** 它们 SHALL 在引用 bootstrap gate 时使用 `opsx bootstrap validate`
- **AND** SHALL NOT 指示用户或 Agents 为此目的运行已移除的 verify `--opsx` 或 `--check-refs` 标志形式

#### Scenario: [REMOVED] Active surfaces do not reference removed verify flags
- **WHEN** active command references are audited
- **THEN** current user-facing documentation and generated Agent instruction surfaces SHALL NOT reference removed verify flags including `--all`, `--opsx`, `--change`, or `--check-refs`
- **AND** references to structure validation SHALL use `opsx validate ...`
- **AND** references to implementation verify gates SHALL use supported `opsx verify phase1`, `opsx verify phase2`, `opsx verify seal`, or `opsx verify status` commands

#### Scenario: [REMOVED] Positional change commands replace removed change flags
- **WHEN** active command references describe sync or archive operations for a change
- **THEN** they SHALL use supported positional command forms such as `opsx sync <change-name>` and `opsx archive <change-name>`
- **AND** they SHALL NOT describe removed sync/archive `--change` flag forms

#### Scenario: [REMOVED] Bootstrap validation uses bootstrap command surface
- **WHEN** active command references describe bootstrap gate validation or bootstrap-generated OPSX candidate checks
- **THEN** they SHALL use `opsx bootstrap validate` when referring to the bootstrap gate
- **AND** SHALL NOT instruct users or Agents to run removed verify `--opsx` or `--check-refs` flag forms for that purpose

### Requirement: Command-reference cleanup is source-backed

OPSX SHALL 在生成 stale 命令引用的源头清理它们，而不仅在生成的副本中清理，只要生成的 surface 可以重新创建 stale 文本。

#### Scenario: [ADDED] 生成文件有模板源

- **WHEN** stale 命令引用出现在生成的 skill、command、prompt 或 Agent instruction 文件中
- **THEN** 实现 SHALL 识别是否有源模板或 transform 发出该文本
- **AND** 如果源存在，更新源使重新生成不会重新引入 stale 命令
- **AND** 仅在需要时更新生成的副本以保持仓库一致

#### Scenario: [ADDED] 历史归档 artifacts 不是默认清理目标

- **WHEN** 在 `.opsx/changes/archive/**` 下发现 stale 命令引用
- **THEN** 它们 SHALL 默认视为历史证据
- **AND** SHALL NOT 修改，除非它们被用作当前 user-facing guidance 或作为生成当前指令的源

#### Scenario: [REMOVED] Generated files have a template source
- **WHEN** a stale command reference appears in a generated skill, command, prompt, or Agent instruction file
- **THEN** the implementation SHALL identify whether a source template or transform emits that text
- **AND** if a source exists, update the source so regeneration does not reintroduce the stale command
- **AND** update generated copies only as needed to keep the repository consistent

#### Scenario: [REMOVED] Historical archived artifacts are not default cleanup targets
- **WHEN** stale command references are found under `.opsx/changes/archive/**`
- **THEN** they SHALL be treated as historical evidence by default
- **AND** SHALL NOT be modified unless they are used as current user-facing guidance or as a source for generated current instructions

### Requirement: Cleanup verification reports remaining stale references by class

清理 SHALL 包含可重复的验证步骤，在 change 被视为完成之前按 active surface 类别报告 stale 命令引用。

#### Scenario: [ADDED] 清理后审计

- **WHEN** 清理实现完成
- **THEN** 仓库搜索 SHALL 确认没有 active surface 仍包含 `opsx` 命令或 `opsx/` 路径引用
- **AND** archive history 下的任何剩余出现 SHALL 与 active 失败分开报告
- **AND** 验证输出 SHALL 区分有效的 `opsx` 命令引用与 stale `opsx` 引用

#### Scenario: [REMOVED] Audit after cleanup
- **WHEN** the cleanup implementation is complete
- **THEN** a repository search SHALL confirm no active surface still contains removed verify flag forms or removed sync/archive `--change` flag forms
- **AND** any remaining occurrences under archive history SHALL be reported separately from active failures
- **AND** the verification output SHALL distinguish valid `opsx verify phase1|phase2|seal|status` references from stale verify flag references
