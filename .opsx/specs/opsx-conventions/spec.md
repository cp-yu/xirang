---
capabilities:
  - cap.ai.workflow-templates
---
# OPSX Conventions Specification

## Purpose

OPSX conventions SHALL define how system capabilities are documented, how changes are proposed and tracked, and how specifications evolve over time. This meta-specification serves as the source of truth for OPSX's own conventions.
## Requirements
### Requirement: Structured conventions for specs and changes

OPSX conventions SHALL mandate a structured spec format with clear requirement and scenario sections so tooling can parse consistently.

#### Scenario: Following the structured spec format

- **WHEN** writing or updating OPSX specifications
- **THEN** authors SHALL use `### Requirement: ...` followed by at least one `#### Scenario: ...` section

### Requirement: Behavior-First Specification Boundary

OPSX Specs SHALL 作为其 owner element 的 typed Element Contract modules，表达该 element 在对应 abstraction level 的可验证 intent、guarantees、constraints、requirements 与 scenarios。Spec SHALL 避免实现、refactor 与 process detail；parent Spec MUST NOT 复制 child contracts，跨 element collaboration SHALL 由 Semantic Relationships 表达。

#### Scenario: Capability-like contract 表达行为
- **WHEN** element kind 的 contract schema 定义 observable behavior
- **THEN** requirements SHALL 聚焦 externally observable behavior、interfaces、error handling 与 constraints
- **AND** scenarios SHALL 可测试或显式可验证

#### Scenario: Parent contract 表达本层 guarantees
- **WHEN** Spec 属于包含 child elements 的 parent
- **THEN** SHALL 表达 parent 本层 aggregate intent、guarantees、cross-child invariants 或 decomposition rationale
- **AND** MUST NOT 逐条复制 child Specs

#### Scenario: 非 contract 内容路由
- **WHEN**内容涉及具体 library、class/function structure、执行机制、call path、refactor rationale、rejected approach 或 exploration notes
- **THEN** SHALL 路由到 `design.md` 或 `tasks.md`
- **AND** MUST NOT 作为 Element Contract 写入 Spec

#### Scenario: Requirement 使用稳态名称
- **WHEN** 为 Spec 撰写 requirement
- **THEN** 标题 SHALL 使用持久、可验证的 contract 名称
- **AND** SHALL NOT 使用缺口、恢复、迁移等一次性 change action 命名

#### Scenario: Writing behavior requirements
- **WHEN** element kind 的 contract schema 管理 observable behavior
- **THEN** requirements SHALL 聚焦 behavior、interfaces、errors 与 constraints
- **AND** scenarios SHALL 可测试或显式可验证

#### Scenario: Avoiding implementation leakage
- **WHEN** details 涉及 library、class/function structure、execution mechanics 或 call paths
- **THEN** SHALL 写入 `design.md` 或 `tasks.md`
- **AND** MUST NOT 写入 Element Contract

#### Scenario: Routing non-behavior content
- **WHEN** statement 解释 implementation choice、rejected path 或 code organization
- **THEN** SHALL 路由到 `design.md`

#### Scenario: 以能力命名 Requirement
- **WHEN** contract schema 表达持久 capability
- **THEN** Requirement title SHALL 使用该 capability 的稳态名称
- **AND** SHALL NOT 使用一次性 change action 命名

#### Scenario: 单一 Requirement 不打包多个能力
- **WHEN** candidate Requirement 覆盖多个互不相关 guarantees 或 behaviors
- **THEN** SHALL 拆分为独立 Requirements

#### Scenario: 行为定义不引用变更上下文
- **WHEN** Requirement 依赖“原有”“本次”等 change narration 才能理解
- **THEN** SHALL 改写为 target steady state

### Requirement: Progressive Rigor
OPSX conventions SHALL keep specs lightweight by default and scale rigor only when risk or coordination complexity demands it.

#### Scenario: Routine change specification
- **WHEN** a change is local and low-risk
- **THEN** authors use concise, behavior-first requirements with minimal ceremony

#### Scenario: High-risk or cross-boundary change specification
- **WHEN** a change is cross-team, cross-repo, API-contract breaking, migration-heavy, or security/privacy sensitive
- **THEN** authors increase detail and explicit validation expectations proportionally

### Requirement: Project Structure

OPSX 项目 SHALL 使用一致目录保存同一个 OPSX Semantic Model 的 graph modules、contract modules 与 change-local Semantic Delta。

#### Scenario: 初始化项目结构
- **WHEN** 初始化 OPSX 项目
- **THEN** SHALL 创建：
```text
.opsx/
├── architecture/          # LikeC4 graph modules: metamodel, elements, relations, views
├── specs/                 # Element-owned contract modules
│   └── <spec-id>/spec.md
├── changes/
│   ├── <change-name>/
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   ├── architecture-delta.c4
│   │   └── specs/<spec-id>/spec.md
│   └── archive/
├── references/
└── config.yaml
```
- **AND** graph 与 contract directories SHALL 被解释为一个 OPSX Semantic Model

### Requirement: Structured Format for Behavioral Specs

Element Contract Specs SHALL 使用一致、可解析的 section headers 与 normative keywords；每份 Spec SHALL 通过 frontmatter singular `element` 绑定唯一 owner element。

#### Scenario: Writing requirement sections
- **WHEN** documenting a requirement in an Element Contract
- **THEN** use a level-3 heading with format `### Requirement: [Name]`
- **AND** immediately follow with a SHALL or MUST statement describing target behavior or guarantee

#### Scenario: Documenting scenarios
- **WHEN** documenting a verifiable case
- **THEN** use `#### Scenario: [Description]`
- **AND** use bold `GIVEN`、`WHEN`、`THEN` 与 `AND` keywords

#### Scenario: Binding a Spec
- **WHEN** authoring a formal or change-local Spec for the new language version
- **THEN** frontmatter SHALL contain exactly one `element: <elementId>` field
- **AND** MUST NOT contain a `capabilities` ownership array

#### Scenario: Adding implementation details
- **WHEN** a scenario step needs additional observable detail
- **THEN** MAY use concise nested bullets
- **AND** MUST NOT use them承载 implementation design

### Requirement: Header-Based Requirement Identification

Requirement headers SHALL serve as unique identifiers for programmatic matching between current specs and proposed changes.

#### Scenario: Matching requirements programmatically

- **WHEN** processing delta changes
- **THEN** use the `### Requirement: [Name]` header as the unique identifier
- **AND** match using normalized headers: `normalize(header) = trim(header)`
- **AND** compare headers with case-sensitive equality after normalization

#### Scenario: Handling requirement renames

- **WHEN** renaming a requirement
- **THEN** use a special `## RENAMED Requirements` section
- **AND** specify both old and new names explicitly:
  ```markdown
  ## RENAMED Requirements
  - FROM: `### Requirement: Old Name`
  - TO: `### Requirement: New Name`
  ```
- **AND** if content also changes, include under MODIFIED using the NEW header

#### Scenario: Validating header uniqueness

- **WHEN** creating or modifying requirements
- **THEN** ensure no duplicate headers exist within a spec
- **AND** validation tools SHALL flag duplicate headers as errors

### Requirement: Change Storage Convention

Change proposals SHALL store only target-state graph and contract deltas，不保存完整未来模型。`architecture-delta.c4` 与 `specs/**/*.md` SHALL 共同构成一个 Semantic Delta，并在 validation 与 sync 中联合处理。

#### Scenario: Graph 与 contract modules 同属一个 delta
- **WHEN** change 同时修改 element graph 与 Element Contracts
- **THEN** graph operations SHALL 写入 `architecture-delta.c4`
- **AND** requirement operations SHALL 写入对应 change-local Specs
- **AND** 系统 SHALL 将两者作为一个 Target Semantic Model 验证

#### Scenario: Delta operation 保持现有格式
- **WHEN** change-local Spec 增加、修改、删除或重命名 requirement
- **THEN** SHALL 继续使用 `ADDED`、`MODIFIED`、`REMOVED` 与 `RENAMED` sections
- **AND**正文 SHALL 描述 target steady state

#### Scenario: Creating change proposals with additions
- **WHEN** change 增加 Requirement
- **THEN** SHALL 在 `## ADDED Requirements` 包含完整 target Requirement

#### Scenario: Creating change proposals with modifications
- **WHEN** change 修改 Requirement
- **THEN** SHALL 在 `## MODIFIED Requirements` 使用 exact existing title 和完整 target content

#### Scenario: Creating change proposals with removals
- **WHEN** change 删除 Requirement
- **THEN** SHALL 在 `## REMOVED Requirements` 声明 exact title、Reason 与 Migration

#### Scenario: Using standard output symbols
- **WHEN** CLI 显示 delta operations
- **THEN** SHALL 继续使用 `+`、`~`、`-` 与 `→` 表示 ADDED、MODIFIED、REMOVED 与 RENAMED

### Requirement: Archive Process Enhancement

The archive process SHALL programmatically apply delta changes to current specifications using header-based matching.

#### Scenario: Archiving changes with deltas

- **WHEN** archiving a completed change
- **THEN** the archive command SHALL:
  1. Parse RENAMED sections first and apply renames
  2. Parse REMOVED sections and remove by normalized header match
  3. Parse MODIFIED sections and replace by normalized header match (using new names if renamed)
  4. Parse ADDED sections and append new requirements
- **AND** validate that all MODIFIED/REMOVED headers exist in current spec
- **AND** validate that ADDED headers don't already exist
- **AND** generate the updated spec in the main specs/ directory

#### Scenario: Handling conflicts during archive

- **WHEN** delta changes conflict with current spec state
- **THEN** the archive command SHALL report specific conflicts
- **AND** require manual resolution before proceeding
- **AND** provide clear guidance on resolving conflicts

### Requirement: Proposal Format

Proposals SHALL explicitly document all changes with clear from/to comparisons.

#### Scenario: Documenting changes

- **WHEN** documenting what changes
- **THEN** the proposal SHALL explicitly describe each change:

```markdown
**[Section or Behavior Name]**
- From: [current state/requirement]
- To: [future state/requirement]
- Reason: [why this change is needed]
- Impact: [breaking/non-breaking, who's affected]
```

This explicit format compensates for not having inline diffs and ensures reviewers understand exactly what will change.

### Requirement: Change Review

The system SHALL support multiple methods for reviewing proposed changes.

#### Scenario: Reviewing changes

- **WHEN** reviewing proposed changes
- **THEN** reviewers can compare using:
- GitHub PR diff view when changes are committed
- Command line: `diff -u specs/[capability]/spec.md changes/[name]/specs/[capability]/spec.md`
- Any visual diff tool comparing current vs future state

### Requirement: Structured Format Adoption

Behavioral specifications SHALL adopt the structured format with `### Requirement:` and `#### Scenario:` headers as the default.

#### Scenario: Use structured headings for behavior

- **WHEN** documenting behavioral requirements
- **THEN** use `### Requirement:` for requirements
- **AND** use `#### Scenario:` for scenarios with bold WHEN/THEN/AND keywords

### Requirement: Verb–Noun CLI Command Structure

OPSX CLI 设计 SHALL 使用动词作为顶层命令，通过参数或标志提供名词进行范围界定。

#### Scenario: 动词优先命令发现

- **WHEN** 用户运行像 `opsx list` 这样的命令
- **THEN** 动词清晰传达动作
- **AND** 名词通过标志或参数细化范围（例如 `--changes`、`--specs`）

#### Scenario: 名词命令的向后兼容性

- **WHEN** 用户运行名词前缀命令如 `opsx spec ...` 或 `opsx change ...`
- **THEN** CLI SHALL 继续支持它们至少一个发布周期
- **AND** 显示指向动词优先替代方案的弃用警告

#### Scenario: 消歧义指导

- **WHEN** 项目名在 changes 和 specs 之间有歧义
- **THEN** `opsx show` 和 `opsx validate` SHALL 接受 `--type spec|change`
- **AND** 帮助文本 SHALL 清晰记录这一点

### Requirement: spec-driven instruction 区分结构 token 和填充 prose
Spec-driven artifact instructions SHALL 明确 parse-sensitive 结构 token 保持 canonical，agent 填充的新写或改写 prose 跟随 `proseLanguage`。

#### Scenario: specs instruction 标注 Requirement 和 Scenario title 语言
- **WHEN** agent 创建 delta spec
- **THEN** instructions SHALL 指出 `### Requirement:` 和 `#### Scenario:` 标记保持 canonical
- **AND** new Requirement titles 和 new Scenario titles SHALL 跟随 `proseLanguage`
- **AND** `MODIFIED Requirements` 中 exact matching 所需的 existing Requirement titles SHALL 保持原文

#### Scenario: tasks instruction 标注 task 和 check prose 语言
- **WHEN** agent 创建 `tasks.md`
- **THEN** instructions SHALL 指出 `### Task N:`、`Goal`、`Files`、`Requirements`、`Checks`、`Verifies:`、`Command:`、`Evidence:` 和 `Expect:` 等结构标签保持 canonical
- **AND** task titles、check names、requirements bullet prose、`Evidence:` descriptions 和 `Expect:` descriptions SHALL 跟随 `proseLanguage`

#### Scenario: examples 不改变 proseLanguage 约束
- **WHEN** schema instruction 包含英文示例
- **THEN** instructions SHALL 明确 examples 只展示结构格式
- **AND** agent SHALL NOT 将示例中的普通英文 prose 风格照搬到配置了非英文 `proseLanguage` 的 artifact 内容中

### Requirement: Change-local specs express target steady state

Change-local specs SHALL 使用 `ADDED`、`MODIFIED`、`REMOVED` 与 `RENAMED` sections 作为 reconciliation syntax，但 Requirement 与 Scenario 正文 SHALL 描述 change 完成后程序应持续呈现的目标稳态行为，MUST NOT 写成 change log、before/after narration 或实现历史。

#### Scenario: ADDED 正文直接描述行为
- **WHEN** change 引入新行为
- **THEN** ADDED Requirement SHALL 使用 durable capability name 与 normative target-state text
- **AND** SHALL NOT 使用“本次增加”“现在改为”等 change-context narration

#### Scenario: MODIFIED 包含完整目标状态
- **WHEN** existing Requirement 的行为或 Scenario 集发生变化
- **THEN** change-local MODIFIED block SHALL 包含完整 target-state Requirement
- **AND** SHALL 包含目标稳态中全部 surviving scenarios
- **AND** existing Requirement title SHALL 保持 exact matching

#### Scenario: Scenario 删除通过省略表达
- **WHEN** existing Scenario 在目标稳态中不再存在
- **THEN** Agent-authored MODIFIED Requirement SHALL 省略该 Scenario
- **AND** Agent MUST NOT 编写“Scenario 已删除”的日志 Scenario
- **AND** Agent MUST NOT 手工预写 `[REMOVED]` scenario operation label

#### Scenario: Programmatic labels 不改变正文语义
- **WHEN** `opsx scenario-labels <change> --write` 比较 formal 与 change-local target-state Requirement
- **THEN** 命令 MAY 生成 change-local review metadata
- **AND** 该 metadata SHALL NOT 被视为 Agent-authored behavior source

## Core Principles

The system SHALL follow these principles:
- Specs reflect what IS currently built and deployed
- Changes contain proposals for what SHOULD be changed
- AI drives the documentation process
- Specs are living documentation kept in sync with deployed code

## Directory Structure

### Project Structure

An OPSX project SHALL maintain a consistent directory structure for specifications and changes.

#### Scenario: Initializing project structure

- **WHEN** an OPSX project is initialized
- **THEN** it SHALL have this structure:
```
opsx/
├── project.md              # Project-specific context
├── AGENTS.md               # AI assistant instructions
├── specs/                  # Current deployed capabilities
│   └── [capability]/       # Single, focused capability
│       ├── spec.md         # WHAT: behavior contract
│       └── design.md       # HOW (optional, for established patterns)
└── changes/                # Proposed changes
    ├── [change-name]/      # Descriptive change identifier
    │   ├── proposal.md     # Why, what, and impact
    │   ├── tasks.md        # Implementation checklist
    │   ├── design.md       # Technical decisions (optional)
    │   └── specs/          # Delta requirements
    │       └── [capability]/
    │           └── spec.md # ADDED/MODIFIED/REMOVED/RENAMED requirements
    └── archive/            # Completed changes
        └── YYYY-MM-DD-[name]/
```

## Specification Format

### Behavioral Spec Format

Behavioral specifications SHALL use a structured format with consistent section headers and keywords to ensure visual consistency and parseability.

#### Scenario: Writing requirement sections

- **WHEN** documenting a requirement in a behavioral specification
- **THEN** use a level-3 heading with format `### Requirement: [Name]`
- **AND** immediately follow with a SHALL statement describing core behavior
- **AND** keep requirement names descriptive and under 50 characters

#### Scenario: Documenting scenarios

- **WHEN** documenting specific behaviors or use cases
- **THEN** use level-4 headings with format `#### Scenario: [Description]`
- **AND** use bullet points with bold keywords for steps:
  - **GIVEN** for initial state (optional)
  - **WHEN** for conditions or triggers
  - **THEN** for expected outcomes
  - **AND** for additional outcomes or conditions

#### Scenario: Adding implementation details

- **WHEN** a step requires additional detail
- **THEN** use sub-bullets under the main step
- **AND** maintain consistent indentation
  - Sub-bullets provide examples or specifics
  - Keep sub-bullets concise

## Change Storage Convention

### Header-Based Requirement Identification

Requirement headers SHALL serve as unique identifiers for programmatic matching between current specs and proposed changes.

#### Scenario: Matching requirements programmatically

- **WHEN** processing delta changes
- **THEN** use the `### Requirement: [Name]` header as the unique identifier
- **AND** match using normalized headers: `normalize(header) = trim(header)`
- **AND** compare headers with case-sensitive equality after normalization

#### Scenario: Handling requirement renames

- **WHEN** renaming a requirement
- **THEN** use a special `## RENAMED Requirements` section
- **AND** specify both old and new names explicitly:
  ```markdown
  ## RENAMED Requirements
  - FROM: `### Requirement: Old Name`
  - TO: `### Requirement: New Name`
  ```
- **AND** if content also changes, include under MODIFIED using the NEW header

#### Scenario: Validating header uniqueness

- **WHEN** creating or modifying requirements
- **THEN** ensure no duplicate headers exist within a spec
- **AND** validation tools SHALL flag duplicate headers as errors

### Change Storage Convention

Change proposals SHALL store only the additions, modifications, and removals to specifications, not complete future states.

#### Scenario: Creating change proposals with additions

- **WHEN** creating a change proposal that adds new requirements
- **THEN** include only the new requirements under `## ADDED Requirements`
- **AND** each requirement SHALL include its complete content
- **AND** use the standard structured format for requirements and scenarios

#### Scenario: Creating change proposals with modifications  

- **WHEN** creating a change proposal that modifies existing requirements
- **THEN** include the modified requirements under `## MODIFIED Requirements`
- **AND** use the same header text as in the current spec (normalized)
- **AND** include the complete modified requirement (not a diff)
- **AND** optionally annotate what changed with inline comments like `← (was X)`

#### Scenario: Creating change proposals with removals

- **WHEN** creating a change proposal that removes requirements
- **THEN** list them under `## REMOVED Requirements`
- **AND** use the normalized header text for identification
- **AND** include reason for removal
- **AND** document any migration path if applicable

The `changes/[name]/specs/` directory SHALL contain:
- Delta files showing only what changes
- Sections for ADDED, MODIFIED, REMOVED, and RENAMED requirements
- Normalized header matching for requirement identification
- Complete requirements using the structured format
- Clear indication of change type for each requirement

#### Scenario: Using standard output symbols

- **WHEN** displaying delta operations in CLI output
- **THEN** use these standard symbols:
  - `+` for ADDED (green)
  - `~` for MODIFIED (yellow)
  - `-` for REMOVED (red)
  - `→` for RENAMED (cyan)

### Archive Process Enhancement

The archive process SHALL programmatically apply delta changes to current specifications using header-based matching.

#### Scenario: Archiving changes with deltas

- **WHEN** archiving a completed change
- **THEN** the archive command SHALL:
  1. Parse RENAMED sections first and apply renames
  2. Parse REMOVED sections and remove by normalized header match
  3. Parse MODIFIED sections and replace by normalized header match (using new names if renamed)
  4. Parse ADDED sections and append new requirements
- **AND** validate that all MODIFIED/REMOVED headers exist in current spec
- **AND** validate that ADDED headers don't already exist
- **AND** generate the updated spec in the main specs/ directory

#### Scenario: Handling conflicts during archive

- **WHEN** delta changes conflict with current spec state
- **THEN** the archive command SHALL report specific conflicts
- **AND** require manual resolution before proceeding
- **AND** provide clear guidance on resolving conflicts

### Proposal Format

Proposals SHALL explicitly document all changes with clear from/to comparisons.

#### Scenario: Documenting changes

- **WHEN** documenting what changes
- **THEN** the proposal SHALL explicitly describe each change:

```markdown
**[Section or Behavior Name]**
- From: [current state/requirement]
- To: [future state/requirement]
- Reason: [why this change is needed]
- Impact: [breaking/non-breaking, who's affected]
```

This explicit format compensates for not having inline diffs and ensures reviewers understand exactly what will change.

## Change Lifecycle

The change process SHALL follow these states:

1. **Propose**: AI creates change with delta specs (ADDED/MODIFIED/REMOVED) and explicit proposal
2. **Review**: Humans review proposal and delta specs
3. **Approve**: Change is approved for implementation
4. **Implement**: Follow tasks.md checklist (can span multiple PRs)
5. **Deploy**: Changes are deployed to production
6. **Update**: Delta specs are merged into main `specs/`; opsx-delta is merged into `project.opsx.yaml`
7. **Archive**: Change is moved to `archive/YYYY-MM-DD-[name]/`

## Viewing Changes

### Change Review

The system SHALL support multiple methods for reviewing proposed changes.

#### Scenario: Reviewing changes

- **WHEN** reviewing proposed changes
- **THEN** reviewers can compare using:
- GitHub PR diff view when changes are committed
- Command line: `diff -u specs/[capability]/spec.md changes/[name]/specs/[capability]/spec.md`
- Any visual diff tool comparing current vs future state

The system relies on tools to generate diffs rather than storing them.

## Capability Naming

Capabilities SHALL use:
- Verb-noun patterns (e.g., `user-auth`, `payment-capture`)
- Hyphenated lowercase names
- Singular focus (one responsibility per capability)
- No nesting (flat structure under `specs/`)

## When Changes Require Proposals

A proposal SHALL be created for:
- New features or capabilities
- Breaking changes to existing behavior
- Architecture or pattern changes
- Performance optimizations that change behavior
- Security updates affecting access patterns

A proposal is NOT required for:
- Bug fixes restoring intended behavior
- Typos or formatting fixes
- Non-breaking dependency updates
- Adding tests for existing behavior
- Documentation clarifications

## Why This Approach

Delta-based change storage provides:
- **Readability**: Clear indication of what changes (ADDED/MODIFIED/REMOVED)
- **AI-compatibility**: Standard markdown that AI tools understand
- **Simplicity**: No special parsing or processing needed
- **Tool-agnostic**: Any diff tool can show changes
- **Clear intent**: Explicit proposals document reasoning

The structured format adds:
- **Visual Consistency**: Requirement and Scenario prefixes make sections instantly recognizable
- **Parseability**: Consistent structure enables tooling and automation
- **Gradual Adoption**: Existing specs can migrate incrementally
