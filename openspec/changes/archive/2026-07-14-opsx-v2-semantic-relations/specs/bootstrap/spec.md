## MODIFIED Requirements

### Requirement: Bootstrap contract surfaces SHALL stay consistent

Bootstrap schema、CLI、workflow templates、generated instructions 与 docs SHALL 描述同一 v2 五阶段流程及两文件输出。所有 relation authoring surface SHALL 消费 Registry 投影；formal-opsx refresh SHALL 描述为从当前 evidence 完整重建并以旧 model 生成 review diff。

#### Scenario: [ADDED] Contract surfaces agree on v2 output
- **WHEN** 检查 bootstrap surfaces
- **THEN** SHALL 仅声明 `project.opsx.yaml` 与 `project.opsx.relations.yaml` 为 formal output
- **AND** MUST NOT 声明 code-map、changed-path mapping 或 partial relation merge

#### Scenario: [ADDED] Contract surfaces agree on relation vocabulary
- **WHEN** 检查 domain-map template、map instructions、review 与 docs
- **THEN** SHALL 使用 Registry 六种 canonical relations
- **AND** MUST NOT 提供旧 relation token 作为选项

#### Scenario: [ADDED] Contract surfaces agree on refresh semantics
- **WHEN** baseline 为 formal-opsx
- **THEN** refresh SHALL 被描述为当前 evidence 的完整重建
- **AND** 旧 formal OPSX SHALL 仅用于 review diff

#### Scenario: [REMOVED] Contract surfaces agree on supported modes
- **WHEN** 检查 bootstrap schema、workflow template、CLI help 与 bootstrap docs
- **THEN** 它们 SHALL 暴露相同的 mode names
- **AND** SHALL 描述相同的 supported upgrade paths
- **AND** `formal-opsx` baseline SHALL 被描述为仅支持 `refresh`

#### Scenario: [REMOVED] Contract surfaces agree on raw baseline mode semantics
- **WHEN** 检查 `raw` 基线下的 bootstrap CLI help、instructions、workflow template 与 user docs
- **THEN** `full` SHALL 被描述为“生成正式 OPSX + 完整合法 specs”
- **AND** `opsx-first` SHALL 被描述为“生成正式 OPSX + README-only starter”
- **AND** 任何合同面 SHALL NOT 再把 `raw + full` 描述为仅生成 starter specs

#### Scenario: [REMOVED] Contract surfaces agree on refresh semantics for formal OPSX
- **WHEN** 检查 `formal-opsx` 基线下的 bootstrap CLI help、instructions、workflow template 与 user docs
- **THEN** `refresh` SHALL 被描述为“基于现有 formal OPSX 的增量刷新”
- **AND** SHALL 明确说明 git diff 仅用于缩小扫描范围，而非替代 formal OPSX 作为 source of truth
- **AND** SHALL 明确说明 promote 通过 merge/delta 更新正式文件

#### Scenario: [REMOVED] Contract surfaces agree on command surface
- **WHEN** 检查生成的 bootstrap command、bootstrap workflow template、CLI subcommand registration 与 bootstrap docs
- **THEN** 它们 SHALL 将 bootstrap 呈现为 CLI-backed agent workflow
- **AND** SHALL 暴露用户可见命令名 `/opsx:bootstrap`
- **AND** SHALL NOT 暗示任何不受支持的一次性或 extend 风格 bootstrap flags
- **AND** SHALL NOT 将 `refresh` 表述为 `/opsx:bootstrap --refresh` 这类伪命令

### Requirement: Bootstrap grouped spec source

Bootstrap domain-map SHALL 支持 coarse `spec_groups`，但 candidate OPSX 只生成 domains、capabilities 与 Registry-valid relations。`spec_groups` SHALL NOT 创建 graph nodes 或 relations，也不存在 code-map output。

#### Scenario: [ADDED] Coarse mode uses spec_groups
- **GIVEN** granularity 为 coarse 且 domain-map 有合法 spec_groups
- **WHEN** validate 编译 candidate specs
- **THEN** 每个 group SHALL 生成一份含完整 capability frontmatter 的 spec
- **AND** SHALL NOT 改变 OPSX node/relation graph

#### Scenario: [ADDED] Fine mode uses capability specs
- **GIVEN** granularity 为 fine
- **WHEN** validate 编译 candidate specs
- **THEN** SHALL 从 capability spec source 生成
- **AND** SHALL NOT 经 spec_groups 合并

#### Scenario: [REMOVED] Coarse mode uses spec_groups as spec source
- **GIVEN** `scope.yaml` contains `granularity: coarse`
- **AND** a valid `domain-map/*.yaml` contains `spec_groups`
- **WHEN** `openspec bootstrap validate` compiles candidate specs
- **THEN** each `spec_groups[]` entry SHALL produce one candidate spec file
- **AND** the generated spec SHALL include frontmatter capabilities from `spec_groups[].capabilities`
- **AND** `spec_groups` SHALL NOT create domains, capabilities, relations, or code-map nodes in OPSX output

#### Scenario: [REMOVED] Fine mode keeps capability spec source
- **GIVEN** `scope.yaml` contains `granularity: fine`
- **WHEN** `openspec bootstrap validate` compiles candidate specs
- **THEN** candidate specs SHALL be generated from `capabilities[].spec`
- **AND** the system SHALL NOT merge capability specs through `spec_groups`

## ADDED Requirements

### Requirement: Bootstrap relation authoring contract
Bootstrap map phase SHALL 使用 Registry-generated domain-map template，将代码图/import/call 仅作为候选证据，并要求 agent 按交互机制选择 relation。无法精确分类的候选 SHALL 进入 review gap，MUST NOT 生成通用关系。

#### Scenario: 代码依赖只形成候选
- **WHEN** CodeGraph 或 fallback 搜索发现 import/call
- **THEN** map phase SHALL 结合 capability intent 与 specs 判断 `invokes` 或 `consumes`
- **AND** MUST NOT 将每条代码 edge 自动写入 OPSX

#### Scenario: Review 检查 relation 质量
- **WHEN** bootstrap 生成 review
- **THEN** SHALL 展示 ownership 缺口、非法 endpoint、relation type/direction、无法证明的关系与 spec coverage
- **AND** promote SHALL 在 unresolved semantic errors 存在时阻塞
