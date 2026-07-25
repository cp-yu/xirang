## MODIFIED Requirements

### Requirement: Specs 中层推断生成

snack skill SHALL 在创建或 reconciling change-local delta specs 前运行 `openspec instructions specs --change "<name>" --json`。Skill MUST 使用返回的 `template`、`instruction`、`outputPath` 和 `configProjection`；MUST 遵循 instruction-projected ADDED/MODIFIED 选择、spec directory 命名、exact MODIFIED title matching 以及 scenario operation label guidance；MUST 保留 stale change 中无关已存在的 delta spec 内容。不确定推断 SHALL 标记 `[REVIEW NEEDED]`。Scenario operation labels are automatically handled by the OpenSpec CLI after validation and remain change-local review metadata for sync/archive review.

#### Scenario: 生成前读取 specs 模板

- **WHEN** skill 进入 specs 生成步骤
- **THEN** 运行 `openspec instructions specs --change "<name>" --json`
- **AND** 使用返回的 `template`（含 `## ADDED Requirements`/`## MODIFIED Requirements`、`### Requirement:`、`#### Scenario:`、WHEN/THEN）作为输出结构
- **AND** 使用返回的 `instruction` 中的 ADDED/MODIFIED 判定与目录名规则
- **AND** 不在 skill 正文重复实现这些判定规则

#### Scenario: 生成新增 capability 的 spec

- **WHEN** 受影响 capability 在 `openspec/specs/<capability>/` 不存在，或主 spec 中无匹配的 requirement 标题
- **THEN** 创建 `specs/<capability>/spec.md`，包含 `## ADDED Requirements` section，使用 proposal 中的 kebab-case capability 名作为目录名
- **AND** requirement 文本 SHALL 包含 SHALL/MUST 规范性关键字
- **AND** 每个 requirement 至少包含一个 `#### Scenario:` block
- **AND** 不确定部分标记 `[REVIEW NEEDED]`

#### Scenario: 生成修改 capability 的 delta spec

- **WHEN** 受影响 capability 的 requirement 标题在 `openspec/specs/<capability>/spec.md` 中存在
- **THEN** 创建或更新 `specs/<capability>/spec.md`（复用主 spec 已有目录名），包含 `## MODIFIED Requirements` section
- **AND** MODIFIED requirement 标题与主 spec 中已有标题逐字一致（whitespace-insensitive）
- **AND** requirement 文本 SHALL 包含 SHALL/MUST，至少一个 `#### Scenario:` block
- **AND** unrelated existing delta requirements 在 stale change 中保留，除非 code-change evidence 使其过时或不一致

#### Scenario: Scenario labels 由 CLI 自动处理

- **WHEN** snack guidance describes scenario operation labels
- **THEN** the guidance SHALL include `Scenario operation labels are automatically handled by the OpenSpec CLI after validation and remain change-local review metadata for sync/archive review.`
