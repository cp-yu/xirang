## MODIFIED Requirements

### Requirement: Impact sweeper report contract
`openspec-impact-sweeper` SHALL 保持既有 input/report path 合同，并将 impact report 分类改为 `mustChange`、`mustVerify`、`contextual`、`unknown`、`architectureDrift`、`questions`。每个非 question finding SHALL 包含 target、relation path、reason 与 evidence；canonical JSON field names MUST 保持稳定。

#### Scenario: [ADDED] Sweeper writes semantic impact report
- **WHEN** sweeper 完成 concept analysis
- **THEN** SHALL 写入既有 deterministic report path 并只返回该 path
- **AND** findings SHALL 解释 capability relation path

#### Scenario: [ADDED] 不确定性显式输出
- **WHEN** OPSX/spec/code evidence 不足或冲突
- **THEN** SHALL 使用 `unknown` 或 `architectureDrift`
- **AND** MUST NOT 将模糊相关性输出为 `mustChange`

#### Scenario: [REMOVED] Sweeper writes project report
- **WHEN** `openspec-impact-sweeper` completes an impact sweep for concept `explore impact sweep`
- **THEN** it SHALL write `openspec/sweeper/impact-sweep-explore-impact-sweep.json`
- **AND** SHALL return that path to the caller
- **AND** SHALL not emit a separate summary

#### Scenario: [REMOVED] Sweeper prepares ignored report directory
- **WHEN** `openspec/sweeper/` does not exist
- **THEN** the sweeper SHALL create it
- **AND** SHALL ensure `openspec/sweeper/.gitignore` exists with content that ignores reports while keeping `.gitignore`
- **AND** SHALL NOT modify an existing `.gitignore`

### Requirement: Impact sweeper evidence collection
`openspec-impact-sweeper` SHALL 以 OPSX v2 relation paths 和 cap→spec mapping 为主要语义证据，以 CodeGraph 为可选代码结构加速器，并以 ACE、`rg`、`read`、`git ls-files` 为 fallback。Sweeper MUST NOT 读取 code-map 或 `.codegraph/codegraph.db`。

#### Scenario: [ADDED] Relation-specific propagation
- **WHEN** seed capability 已确定
- **THEN** `belongs_to` SHALL 只提供 domain context
- **AND** 其他五种 relations SHALL 按 Registry propagation hint 选择需验证方向
- **AND** relation 本身 MUST NOT 单独证明 `mustChange`

#### Scenario: [ADDED] CodeGraph 缺失不阻塞
- **WHEN** CodeGraph 不可用
- **THEN** sweeper SHALL 使用 fallback tools 完成报告
- **AND** SHALL 披露降低的 evidence coverage

#### Scenario: [ADDED] OPSX 与代码冲突
- **WHEN** semantic relation 与当前 call/import evidence 冲突
- **THEN** report SHALL 记录 `architectureDrift`
- **AND** SHALL 保留两侧 evidence

#### Scenario: [REMOVED] OPSX first then reverse search
- **WHEN** the concept maps to an OPSX capability
- **THEN** the sweeper SHALL read matching OPSX node intent, code-map refs, and direct relations from the batch query output
- **AND** SHALL perform repo-wide reverse search for key mapped project terms and symbols
- **AND** SHALL classify relevant targets into `mustChange`, `mustCheck`, `coverageGaps`, or `questions`

#### Scenario: [REMOVED] depth 展开判据
- **WHEN** 批量查询返回的一跳邻居属于共享基础设施、跨域节点，或代码搜索显示存在外向运行时使用
- **THEN** the sweeper SHALL 改用 `--depth 2` 重新批量查询以覆盖二跳邻居
- **AND** MUST NOT 通过逐节点连环 `openspec opsx query` 调用模拟多跳展开

#### Scenario: [REMOVED] Multiple term mappings are explored
- **WHEN** a user term maps plausibly to multiple project terms
- **THEN** the sweeper SHALL search all plausible mappings
- **AND** SHALL record mappings and evidence in `termMappings`
- **AND** SHALL put scope-changing ambiguity into `questions`

#### Scenario: [REMOVED] Optional change artifacts are scoped
- **WHEN** `optionalChangeName` is provided
- **THEN** the sweeper SHALL read only that change's proposal, specs, design, tasks, and opsx-delta if they exist
- **AND** SHALL NOT inspect unrelated active changes
