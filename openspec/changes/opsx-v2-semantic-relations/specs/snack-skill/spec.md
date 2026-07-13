## MODIFIED Requirements

### Requirement: Code-map 反查

snack skill SHALL 使用 code-change evidence、capability id/intent、spec coverage 与当前代码检索将 changed files/symbols 映射到 capabilities。CodeGraph 可用时 MAY 用于 symbol/call/import/blast-radius evidence；否则 SHALL 使用 ACE、`rg` 与 `read`。Skill MUST NOT 读取 `project.opsx.code-map.yaml`，无法唯一映射时 SHALL 标记 `[REVIEW NEEDED]`。

#### Scenario: [ADDED] CodeGraph 映射 changed symbols
- **GIVEN** 项目有可用 CodeGraph index
- **WHEN** snack 分析 changed files/symbols
- **THEN** SHALL 使用结构化 symbol 与 dependency evidence 辅助 capability mapping
- **AND** SHALL 结合 OPSX intent/spec，而非将 file node 直接视为 capability

#### Scenario: [ADDED] 无 CodeGraph 时回退
- **WHEN** CodeGraph 不可用
- **THEN** snack SHALL 使用 ACE、`rg` 与 `read` 继续 mapping
- **AND** uncertain mapping SHALL 标记 `[REVIEW NEEDED]`

#### Scenario: [REMOVED] 文件路径映射到 capabilities

- **WHEN** skill 获得修改文件列表后
- **THEN** 读取 `openspec/project.opsx.code-map.yaml`，查找每个文件路径对应的 capability ID，构建受影响 capabilities 列表

### Requirement: Spec 覆盖扫描

snack skill SHALL 在实时代码证据映射后、proposal 生成前，通过 `openspec list --specs --json` 将受影响 capability 分类为 Modified Capability 或 New Capability。

#### Scenario: [MODIFIED] 已有 spec 覆盖的能力标记为 Modified
- **WHEN** mapped capability 出现在某个 spec 的 `capabilities` 数组中
- **THEN** SHALL 标记为 Modified Capability 并记录现有 spec ID

#### Scenario: [MODIFIED] 无 spec 覆盖的能力标记为 New
- **WHEN** mapped capability 未出现在任何 spec coverage 中
- **THEN** SHALL 标记为 New Capability

#### Scenario: [ADDED] 不确定 capability 不被静默创建
- **WHEN** code evidence 无法唯一映射 capability
- **THEN** proposal SHALL 标记 `[REVIEW NEEDED]`
- **AND** MUST NOT 仅根据文件名创建确定性 capability

#### Scenario: [REMOVED] 映射结果注入 proposal

- **WHEN** step 7 生成 proposal 的 `## Capabilities` section
- **THEN** SHALL 使用 step 5 的 Modified/New 分类填充 New Capabilities 和 Modified Capabilities 列表

### Requirement: Proposal 模板合规生成

snack skill SHALL 在 reconcile `proposal.md` 前读取 proposal instructions，并从实时代码证据、OPSX intent 与 spec registry 确定 `## Capabilities`。同一列表 SHALL 驱动后续 specs；不确定推断 SHALL 标记 `[REVIEW NEEDED]`。

#### Scenario: [MODIFIED] 先确定 capability 列表再生成 specs
- **WHEN** snack reconcile proposal capabilities
- **THEN** SHALL 使用代码证据、OPSX relation/context 与 spec registry
- **AND** SHALL 使用确认后的同一列表生成 specs
- **AND** MUST NOT 依赖 code-map reverse lookup

#### Scenario: [REMOVED] 生成前读取 proposal 模板

- **WHEN** skill 进入 proposal reconciliation step
- **THEN** 运行 `openspec instructions proposal --change "<name>" --json`
- **AND** 使用返回的 `template` 章节结构填充 or update `proposal.md`
- **AND** 不自造 `## 目标` / `## 范围` 等非模板章节

#### Scenario: [REMOVED] 现有 proposal 保持当前

- **WHEN** an existing `proposal.md` already matches the collected evidence and capability mapping
- **THEN** the skill does not recreate or overwrite the proposal
- **AND** it reports that no proposal reconciliation was needed
