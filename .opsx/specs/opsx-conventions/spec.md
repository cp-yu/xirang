---
element: project.root/domain.ai_integration/cap.ai.workflow-generation
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
OPSX 项目 SHALL 使用一致目录保存 formal Semantic Model、change-local Semantic Deltas、一个可选 active Candidate 与 durable build history。

#### Scenario: 初始化项目结构
- **WHEN** `opsx setup` 初始化项目
- **THEN** SHALL 创建 formal `architecture/`、`specs/`、`changes/`、`references/` 与 `config.yaml`
- **AND** Project Build SHALL 只在 `.opsx/candidate/` 编写待提升的 `build.md`、Architecture 和 Specs
- **AND** successful promotion SHALL 在 `.opsx/history/builds/` 保存 previous formal source
- **AND** graph 与 contract directories SHALL 始终被解释为一个 OPSX Semantic Model

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

Requirement headers SHALL 作为 Formal 与 change-local Specs 之间的 unique identity。Requirement operation vocabulary SHALL 只有 `ADDED`、`MODIFIED`、`REMOVED`。

#### Scenario: Matching requirements programmatically
- **WHEN** processing delta changes
- **THEN** SHALL 使用 normalized exact `### Requirement: <name>` header 匹配
- **AND** normalization SHALL 为 trim 后 case-sensitive equality

#### Scenario: Handling requirement renames
- **WHEN** Requirement title 变化
- **THEN** change SHALL 在 `## REMOVED Requirements` 声明 old title
- **AND** SHALL 在 `## ADDED Requirements` 包含 new title 的完整 target Requirement
- **AND** MUST NOT 使用 `## RENAMED Requirements`

#### Scenario: Validating header uniqueness
- **WHEN** creating or modifying requirements
- **THEN** target Spec 内 SHALL 不存在 duplicate normalized headers
- **AND** validation SHALL 将 duplicates 报为 ERROR

### Requirement: Change Storage Convention

Change proposals SHALL 保存 target-state semantic operations，而不是完整未来 project snapshot。`architecture-delta.c4` 与 change-local Specs SHALL 共同构成一个 Semantic Delta；durable operations SHALL 只位于稳定 identity，Scenario/property operations SHALL 由 diff 派生。

#### Scenario: Graph 与 contract modules 同属一个 delta
- **WHEN** change 同时修改 graph 与 Element Contracts
- **THEN** Architecture identity operations SHALL 写入 `architecture-delta.c4`
- **AND** Requirement operations SHALL 写入对应 change-local Specs
- **AND** 系统 SHALL 共同 materialize 一个 Target Semantic Model

#### Scenario: Delta operation 使用三种 sections
- **WHEN** change-local Spec 增加、修改或删除 Requirement
- **THEN** SHALL 只使用 `ADDED`、`MODIFIED`、`REMOVED` sections
- **AND** body SHALL 描述 target steady state

#### Scenario: Creating change proposals with additions
- **WHEN** change 增加 Requirement
- **THEN** `## ADDED Requirements` SHALL 包含完整 target Requirement 与 Scenarios

#### Scenario: Creating change proposals with modifications
- **WHEN** change 修改 existing Requirement
- **THEN** `## MODIFIED Requirements` SHALL 使用 exact existing title
- **AND** SHALL 包含完整 target statement 与全部 surviving Scenarios

#### Scenario: Creating change proposals with removals
- **WHEN** change 删除 Requirement
- **THEN** `## REMOVED Requirements` SHALL 声明 exact title、Reason 与 Migration

#### Scenario: Using standard output symbols
- **WHEN** CLI 显示 semantic operations
- **THEN** SHALL 使用 `+`、`~`、`-` 表示 ADDED、MODIFIED、REMOVED
- **AND** SHALL NOT 定义独立 RENAMED symbol

### Requirement: Archive Process Enhancement

Sync SHALL 按 identity-level operations materialize Target Specs 与 Architecture；archive SHALL 在确认 sync 完成后生成最终 review artifact 并封存 change。

#### Scenario: Applying Requirement operations
- **WHEN** sync reconciles contract operations
- **THEN** SHALL 按 REMOVED、MODIFIED、ADDED 的 target result 验证 normalized identities
- **AND** SHALL 将完整 MODIFIED block 写为 formal target Requirement
- **AND** MUST NOT 解析 RENAMED section 或 Scenario operation labels

#### Scenario: Handling conflicts during sync or archive
- **WHEN** Formal snapshot、identity precondition 或 target integrity 与 change 冲突
- **THEN** SHALL 报告具体 conflict
- **AND** SHALL 要求 resolution 后重新 validate 与 diff
- **AND** MUST NOT partial write 或 archive

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

系统 SHALL 通过同一 Diff IR 支持 Agent 与用户审阅 active change 的 effective semantic changes。

#### Scenario: Reviewing changes
- **WHEN** reviewing an active change
- **THEN** Agent 与用户 MAY 使用 `opsx validate --change <name>` 查看 concise preview
- **AND** MAY 使用 `opsx diff --change <name>` 查看完整 text diff
- **AND** MAY 使用 `opsx diff --change <name> --write` 生成 `effective-change.md`
- **AND** MAY 在 `opsx view` 选择该 active change 查看 Specs 与 Architecture diff

#### Scenario: Review projections 一致
- **WHEN**同一 Formal 与 change inputs 未变化
- **THEN** CLI、JSON、generated Markdown 与 Web SHALL 使用一致 identities、operations、counts 与 diagnostics

### Requirement: Structured Format Adoption

Behavioral specifications SHALL adopt the structured format with `### Requirement:` and `#### Scenario:` headers as the default.

#### Scenario: Use structured headings for behavior

- **WHEN** documenting behavioral requirements
- **THEN** use `### Requirement:` for requirements
- **AND** use `#### Scenario:` for scenarios with bold WHEN/THEN/AND keywords

### Requirement: Verb–Noun CLI Command Structure
OPSX CLI SHALL 优先使用动作明确的顶层 commands，但 MAY 为具有内聚 lifecycle 的 durable resource 提供稳定 noun namespace。

#### Scenario: Setup 使用动词 command
- **WHEN** 用户创建或刷新 project setup
- **THEN** SHALL 使用 `opsx setup`
- **AND** SHALL NOT 保留 `opsx init` alias

#### Scenario: Candidate 使用 resource namespace
- **WHEN** 用户管理 active Semantic Model Candidate
- **THEN** SHALL 使用 `opsx candidate init|status|validate|promote`
- **AND** noun namespace SHALL 只聚合该 resource 的内聚 lifecycle operations

#### Scenario: 退役 command family
- **WHEN** 用户请求 `opsx bootstrap` 或 `opsx migrate`
- **THEN** CLI SHALL 报告 command 不存在
- **AND** SHALL NOT 自动转发到 Project Build

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

Change-local Specs SHALL 仅使用 `ADDED`、`MODIFIED`、`REMOVED` Requirement sections；Requirement 与 Scenario body SHALL 描述目标稳态。Scenario operation metadata MUST NOT 写入 source。

#### Scenario: ADDED 正文直接描述行为
- **WHEN** change 引入新行为
- **THEN** ADDED Requirement SHALL 使用 durable capability name 与 normative target-state text
- **AND** SHALL NOT 使用 change-log narration

#### Scenario: MODIFIED 包含完整目标状态
- **WHEN** existing Requirement 的行为或 Scenario set 变化
- **THEN** MODIFIED block SHALL 包含完整 target Requirement
- **AND** SHALL 包含全部 surviving Scenarios
- **AND** existing Requirement title SHALL 保持 exact matching

#### Scenario: Scenario 删除通过省略表达
- **WHEN** existing Scenario 在目标稳态中不再存在
- **THEN** Agent-authored MODIFIED Requirement SHALL 省略该 Scenario
- **AND** MUST NOT 编写 removed Scenario block 或 operation label

#### Scenario: Scenario operations 由 Diff IR 派生
- **WHEN** validate、diff 或 view 比较 Formal 与 Target Requirement
- **THEN** SHALL 派生 Scenario ADDED、MODIFIED、REMOVED 或 UNCHANGED presentation
- **AND** derived operation SHALL NOT 写回 change-local Spec

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
6. **Update**: Delta specs are merged into main `specs/`; `architecture-delta.c4` is merged into `.opsx/architecture/`
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
