# snack-skill Specification

## Purpose
规约 snack skill 的行为：snack 是面向已写代码的 code-first artifact reconciliation 工作流，从会话上下文、workspace/staged diff、`git diff HEAD` 或用户指定的 commit/range 等代码变更证据，按 missing/stale/inconsistent/current 状态条件式创建或更新 proposal、design、delta specs 与 OPSX delta，不生成 tasks.md，并支持对同一 change 多次调用 reconcile。
## Requirements
### Requirement: snack skill 基本流程

snack skill SHALL provide a code-first artifact reconciliation workflow for already-written code. The skill MUST support both creating a new change when no matching change exists and reconciling an existing change when its artifacts are stale, missing, or inconsistent with available code-change evidence. The skill MUST treat `proposal.md`, `design.md`, `specs/*/spec.md`, and `opsx-delta.yaml` as conditional artifacts, not artifacts that are always regenerated.

#### Scenario: 首次调用 snack 创建 change

- **WHEN** 用户在完成代码修改后调用 `/opsx:snack <change-name>` and `openspec/changes/<change-name>/` does not exist
- **THEN** the skill runs `openspec new change "<name>" --schema spec-driven`
- **AND** the skill collects code-change evidence from conversation context, workspace/staged diffs, `git diff HEAD`, or a user-specified commit/range when provided
- **AND** the skill creates only the artifacts required by the evidence and marks uncertain inferred content with `[REVIEW NEEDED]`

#### Scenario: 更新已有 change

- **WHEN** 用户对已有 change 再次调用 `/opsx:snack <change-name>`
- **THEN** the skill reads existing `proposal.md`, `design.md`, `specs/`, and `opsx-delta.yaml` when present
- **AND** the skill classifies each artifact as missing, stale, inconsistent, or current against the collected code-change evidence
- **AND** the skill updates only missing, stale, or inconsistent sections and preserves unrelated human-authored content

#### Scenario: 无 change-name 参数时检测 active change

- **WHEN** 用户调用 `/opsx:snack` 不带参数
- **THEN** skill 运行 `openspec list --json` 检测当前 active change，如果存在则使用该 change，否则提示用户指定 change 名称

### Requirement: OPSX 上下文加载

snack skill SHALL 在生成制品前读取 `openspec/project.opsx.yaml`，复用 explore/propose/apply 的共享 OPSX 上下文加载逻辑。

#### Scenario: 读取 OPSX 项目架构

- **WHEN** skill 开始生成制品
- **THEN** 检查 `openspec/project.opsx.yaml` 是否存在，如果存在则读取 `project:` block（intent、scope）和 domains → capabilities 结构作为导航上下文

### Requirement: Git diff 分析

snack skill SHALL collect code-change evidence before artifact reconciliation. Evidence sources MUST include conversation context, working-tree diff, staged diff, workspace-vs-HEAD diff, and user-specified commit or range selectors when those sources are available. `git diff` remains one evidence source, but it MUST NOT be treated as the only valid source.

#### Scenario: 获取修改文件列表

- **WHEN** skill 分析代码变更
- **THEN** the skill collects changed files and symbol-level changes from applicable commands such as `git diff --name-only`, `git diff`, `git diff --cached --name-only`, `git diff --cached`, `git diff HEAD --name-only`, `git diff HEAD`, or `git diff <range> --name-only`
- **AND** the skill uses conversation context to guide scope and intent while treating code evidence as concrete file and behavior facts
- **AND** conflicts or uncertain mappings are marked with `[REVIEW NEEDED]`

#### Scenario: 用户指定 commit range

- **WHEN** the user asks snack to use a commit, commit range, or branch range in natural language
- **THEN** the skill treats that selector as an agent-parsed evidence source rather than a formal OpenSpec CLI flag
- **AND** the skill uses the specified range as part of the conversation-guided union of code-change evidence

### Requirement: Code-map 反查

snack skill SHALL 通过读取 `openspec/project.opsx.code-map.yaml`，将修改文件路径映射到受影响的 capabilities。

#### Scenario: 文件路径映射到 capabilities

- **WHEN** skill 获得修改文件列表后
- **THEN** 读取 `openspec/project.opsx.code-map.yaml`，查找每个文件路径对应的 capability ID，构建受影响 capabilities 列表

### Requirement: Spec 覆盖扫描

snack skill SHALL 在 code-map 反查完成后、proposal 生成前，通过 `openspec list --specs --json` 扫描已有 specs 覆盖情况，将受影响 capability 分类为 **Modified Capability**（已有 spec 覆盖）或 **New Capability**（无 spec 覆盖）。

#### Scenario: 已有 spec 覆盖的能力标记为 Modified

- **WHEN** step 4 code-map 反查出的 capability ID 出现在某个 spec 的 `capabilities` 数组中
- **THEN** 将该 capability 标记为 **Modified Capability**
- **AND** 记录该 spec 的目录名，供 step 8 specs 生成时复用已有目录

#### Scenario: 无 spec 覆盖的能力标记为 New

- **WHEN** step 4 code-map 反查出的 capability ID 未出现在任何 spec 的 `capabilities` 数组中
- **THEN** 将该 capability 标记为 **New Capability**

#### Scenario: 映射结果注入 proposal

- **WHEN** step 7 生成 proposal 的 `## Capabilities` section
- **THEN** SHALL 使用 step 5 的 Modified/New 分类填充 New Capabilities 和 Modified Capabilities 列表

### Requirement: Specs 中层推断生成

snack skill SHALL run `openspec instructions specs --change "<name>" --json` before creating or reconciling change-local delta specs. The skill MUST use the returned `template`, `instruction`, `outputPath`, and `configProjection`; MUST follow instruction-projected ADDED/MODIFIED selection, spec directory naming, and exact MODIFIED title matching; and MUST preserve unrelated existing delta spec content in a stale change. Uncertain inferences SHALL be marked `[REVIEW NEEDED]`.

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
- **AND** unrelated existing delta requirements in the same change-local spec are preserved unless code-change evidence makes them stale or inconsistent

### Requirement: Design 简化生成

snack skill SHALL reconcile `design.md` from code-change evidence and existing artifact content. The skill MUST run `openspec instructions design --change "<name>" --json` before creating or updating `design.md`, preserve the returned template skeleton, mark inferred content with `[INFERRED FROM CODE]`, and update design only when missing, stale, or inconsistent with the collected evidence.

#### Scenario: 生成 design.md

- **WHEN** specs 生成完成后
- **THEN** 运行 `openspec instructions design --change "<name>" --json`
- **AND** 创建或更新 `design.md`，保留 `template` 的全部章节骨架
- **AND** Context、Goals / Non-Goals、Decisions 内容标记 `[INFERRED FROM CODE]`
- **AND** Risks / Trade-offs 标记 `[REVIEW NEEDED]` 提示用户补充
- **AND** 不自造 `## 目标` / `## 范围` 等非模板章节

#### Scenario: 现有 design 保持当前

- **WHEN** an existing `design.md` is current against code-change evidence
- **THEN** the skill leaves unrelated design content unchanged
- **AND** it reports that no design reconciliation was needed

### Requirement: OPSX delta 启发式生成

snack skill SHALL create or reconcile `opsx-delta.yaml` only when code-change evidence indicates architecture-level changes. The skill MUST distinguish delta spec Markdown headings such as `## ADDED Requirements` from OPSX delta YAML keys such as `ADDED`, `MODIFIED`, and `REMOVED`.

#### Scenario: 检测到新增 exports 时生成 ADDED capability

- **WHEN** code-change evidence shows a new exported function, class, file, or capability boundary
- **THEN** 生成或更新 `opsx-delta.yaml`，包含 `ADDED` YAML key entries for new capability nodes and relations

#### Scenario: 检测到删除 exports 时生成 REMOVED capability

- **WHEN** code-change evidence shows deleted exports or removed capability boundaries
- **THEN** 生成或更新 `opsx-delta.yaml`，包含 `REMOVED` YAML key entries for removed capabilities

#### Scenario: 仅修改函数实现时跳过 OPSX delta

- **WHEN** code-change evidence only shows internal implementation changes with no architecture-level node or relation changes
- **THEN** the skill does not create a new `opsx-delta.yaml`
- **AND** an existing valid `opsx-delta.yaml` is left unchanged unless the evidence makes it stale or inconsistent

### Requirement: 不生成 tasks.md

snack skill SHALL 明确不生成 `tasks.md`，因为代码已完成，无需任务分解。

#### Scenario: 跳过 tasks.md 生成

- **WHEN** 所有 specs 和 design 生成完成后
- **THEN** 不创建 `tasks.md` 文件，skill 流程直接进入输出提示阶段

### Requirement: 输出提示包含双路径

snack skill SHALL 在完成制品生成与自检后，输出提示信息，明确完成路径、修正路径与验证结果。

#### Scenario: 输出完成路径提示

- **WHEN** 制品生成与 validate 自检完成
- **THEN** 输出包含：
  - "快速路径（跳过 verify）："
  - "  • 继续开发: `openspec sync \"<change-name>\" --no-verify`"
  - "  • 快速归档: `openspec archive \"<change-name>\" --no-verify`"

#### Scenario: 输出修正路径提示

- **WHEN** 制品生成完成
- **THEN** 输出包含：
  - "⚠️  生成的 specs 基于代码推断，建议审查标记 [REVIEW NEEDED] 的内容"
  - 修正分支 1："审查 change → 手动编辑 specs → sync → archive"
  - 修正分支 2："审查 change → 修改代码 → 再次 `/opsx:snack` → 继续迭代"

#### Scenario: 输出 validate 自检结果

- **WHEN** `openspec validate` 运行完成
- **THEN** 输出 validate 最终结果：通过则提示已自检通过；仍有 ERROR/WARNING 则逐条列出并提示用户审查

### Requirement: Proposal 模板合规生成

snack skill SHALL run `openspec instructions proposal --change "<name>" --json` before creating or reconciling `proposal.md`, strictly use the returned `template`, `instruction`, `outputPath`, and `configProjection`, and avoid non-template sections. The `## Capabilities` list SHALL be reconciled from code-change evidence and spec coverage before specs generation; an existing proposal SHALL be preserved when current.

#### Scenario: 生成前读取 proposal 模板

- **WHEN** skill 进入 proposal reconciliation step
- **THEN** 运行 `openspec instructions proposal --change "<name>" --json`
- **AND** 使用返回的 `template` 章节结构填充 or update `proposal.md`
- **AND** 不自造 `## 目标` / `## 范围` 等非模板章节

#### Scenario: 先确定 capability 列表再生成 specs

- **WHEN** skill reconciles proposal 的 `## Capabilities` 部分
- **THEN** 先通过 code-map 反查、spec registry、main spec reads, and code-change evidence 推断确定 capability 短名列表
- **AND** 写入或确认 proposal `## Capabilities` 后，用同一列表作为 specs 的目录名与判定输入
- **AND** code-map 无映射的文件推断结果标记 `[REVIEW NEEDED]`

#### Scenario: 现有 proposal 保持当前

- **WHEN** an existing `proposal.md` already matches the collected evidence and capability mapping
- **THEN** the skill does not recreate or overwrite the proposal
- **AND** it reports that no proposal reconciliation was needed

### Requirement: 生成后 validate 自检

snack skill SHALL 在所有制品生成完成后运行 `openspec validate "<name>" --type change --json` 自检。当结果包含 ERROR 或 WARNING 时，skill SHALL 执行一轮修复并重新验证一次；仍残留的问题 SHALL 在输出中逐条披露。

#### Scenario: 自检通过

- **WHEN** `openspec validate` 返回无 ERROR/WARNING
- **THEN** skill 在输出中提示自检通过
- **AND** 不执行修复轮次

#### Scenario: 自检发现 ERROR 并修复

- **WHEN** `openspec validate` 返回 ERROR（如 MODIFIED 未命中主 spec、缺 SHALL/MUST、缺 scenario）
- **THEN** skill 执行一轮修复（依据 instruction 规则调整目录名/operation/标题/规范性关键字/scenario）
- **AND** 修复后重新运行 `openspec validate` 一次
- **AND** 残留问题在输出中逐条披露

