---
name: "xirang-propose"
description: "Propose a new change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation."
license: "MIT"
compatibility: "Requires xirang CLI."
metadata:
  author: "xirang"
  version: "1.0"
  generatedBy: "0.1.1"
---

Propose a new change or update an existing change, generating all artifacts needed for implementation.

**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model is persisted as a single whole in the four partitions `metamodel/`, `elements/`, `relationships/`, and `views/`; a Semantic Delta uses the same four partitions and adds `operation`.
3. A change reconciles a Semantic Delta toward the target steady state. `proposal.md`, `design.md`, and `tasks.md` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.

**Test Quality Guidance**

Persistent tests protect observable behavior and provide fast, trustworthy feedback.

1. Repeatable in isolation. A test creates and cleans up its own state, does not depend on execution order, shared mutable state, or external mutable sources, and is fast enough for its intended feedback loop.
2. Coupled to behavior, decoupled from structure. A plausible behavioral mutation, such as changing a boundary comparison or deleting a required state update, must make the test fail. Refactoring, implementation replacement, prose changes, formatting changes, or semantic model prose changes must not fail the test when behavior is preserved.
3. One clear failure reason. A failing test identifies one broken behavior. Do not split one behavior merely to mirror multiple specification sentences, and do not combine unrelated behaviors in one test.

Design for testability: when behavior is difficult to test because of hidden global state, mixed responsibilities, or inaccessible results, improve the interface before writing the test. Do not compensate with internal mocks or implementation-coupled assertions.

Before adding a persistent test: inspect existing tests and prefer extending or replacing an existing test that already owns the behavior; choose the cheapest test boundary that can detect the intended defect; one test may cover multiple Scenarios when they describe the same behavior and failure reason; add a boundary case only when it can expose a distinct plausible defect; keep slower integration or end-to-end tests only for cross-boundary behavior a cheaper test cannot prove; use one-time verification for build, typecheck, migration inspection, and other evidence that does not justify a maintained test; update or delete tests whose behavior changed, disappeared, became duplicated, or became coupled to obsolete structure.

**Xirang Semantic Model Context**
- Resolve the absolute Project Root, then load the Semantic Model from `.xirang/model/{metamodel,elements,relationships,views}/` and locate the unique Project Root Element, whose `parent` is null.
- Use `identity` as the only way to reference a semantic object. FQN, syntax position, and derived local names are generation artifacts and never appear in a persistent source.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- An Element Contract is the body of its Element unit: one Element has at most one Contract, expressed as `## Requirements`, and whether a Contract is required comes from the `contract` field of its Element Kind.
- Run `xirang arch outline --format json` for the complete Element hierarchy, all Relationships, and complete Metamodel Kinds. `architecture.outline.elementDefinitionDepth` controls only which Element Definitions are loaded; it never hides Elements or loads Contracts.
- Use `xirang arch impact <identity> --depth <n> --json` to discover identity-only refinement context, directed Relationships, and canonical paths. Impact does not return Element Definitions or Contracts.
- Use one batch `xirang arch query <identities...> --contract --json` to read the complete Declarations and owned Contracts for only the explicit identities needed for the current decision.
- If overall Semantic Model understanding is unclear after context compression, a long session, or a context switch, re-run `xirang arch outline --format json`.
- If a specific Element Definition or Contract is unclear or may have been forgotten, re-run `xirang arch query <identity> --json`, adding `--contract` when needed. Reload multiple known Elements with one batch `arch query`; do not automatically query every identity returned by impact.
- The Agent MUST NOT guess missing Definition or Contract semantics from identity, title, an old summary, residual conversation context, or implementation evidence.
- Default unit naming is `elements/<identity>.md`, `metamodel/<kind identity>.md`, `views/<view identity>.md`, and `relationships/<relationship kind identity>.yaml` grouped by Relationship Kind; a change reuses these names under `.xirang/changes/<name>/`. Directory and file names carry no model semantics: every entry declares its own `entity` and `identity`, and loading locates entries by those, never by path.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/`rg`/`read` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report `Semantic Model unavailable`. If it is incomplete or unsupported, identify the root, identity, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.

**Element Definition Semantics**

- Definition SHALL 完整说明 Element 是什么、为何作为独立 Element 建模、包含什么、不包含什么，以及必要时如何区别于 parent、children 与 siblings。
- Definition 不得只是 title 的改写或一句“用于……”摘要；它表达概念身份与范围边界，不表达实现文件、符号、调用关系或当前方案。
- 职责、保证、约束、行为、Requirement、Scenario 与验收条件属于 Element Contract；方案与理由属于 `design.md`；变更动机与迁移历史属于 `proposal.md`。

**Element Contract Semantics**

- Element Contract SHALL 完整表达宿主 Element 在自身抽象层级承担的职责、保证、约束与行为；children 可以进一步精化或共同实现这些承诺，父子 Elements 可以在各自层级表达相互覆盖的完整语义。
- Requirement SHALL 以稳定 identity 表达一项可独立演进的规范承诺。以该承诺能否独立新增、修改或移除判断边界，不得按句子、分句、`SHALL` 数量或目标条数机械拆分。只复述 Declaration definition 或 sibling Requirements 语义并集且不增加规范承诺的内容不形成 Requirement；独立的不变量、顺序、原子性、一致性或完成条件应保留。
- Scenario SHALL 是具有规范约束力的 Requirement 组成，只具体化宿主 Requirement 在特定条件下的可观察行为，不得引入可独立演进的承诺。Scenarios 不默认穷尽 Requirement 的全部适用情况，Scenario 不作为独立 Semantic Delta Entry，其变化由宿主 Requirement 的完整目标内容表达。
- Scenario SHALL NOT 规定实现结构、文档排版、说明性措辞、标题顺序或测试拆分，除非该精确表示本身就是可观察契约。Scenario 数量不决定持久化测试数量。

**Structural Decomposition Guidance**

- Before forming or reorganizing an Element hierarchy, run `xirang config project --json` and read the normalized `decomposition` selection from its JSON output. Do not inspect or reinterpret the raw config.
- For `method`, treat its value as an opaque method name and use only method knowledge you clearly possess. If its meaning or application is ambiguous, stop hierarchy formation and ask the user once; never substitute another method.
- For `skill`, invoke its value as a logical skill name. If the skill is unavailable, fails, or returns insufficient guidance, stop hierarchy formation and ask the user once; never infer a tool-specific path or fall back to another method.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.

## Workflow Stage

| Aspect | Value |
|--------|-------|
| **Stage** | `PROPOSE` - Artifact generation (no implementation) |
| **Allowed** | Generate proposal, design, tasks, and the four-partition Semantic Delta units in .xirang/changes/<name>/ |
| **Forbidden** | Implement code, modify project files outside the selected change directory |

## Flow

1. Resolve a provisional kebab-case change ID. Ask one focused question when the requested change itself is unclear. Report status only at readiness, blocker, and final-summary points; do not emit per-artifact progress updates.
2. Gather read-only evidence before any write.
   - Run `xirang list --json` and inspect relevant existing change artifacts when present.
   - Run `xirang framing list --json`. Only when a Change Structural Definition exists for this handoff, select it by immutable `explorationId`, run `xirang framing show <explorationId> --json`, and use its complete current payload as the structural source. Do not reconstruct structural targets from the Design Summary. When no Change Structural Definition exists, preserve the ordinary Propose path from the Semantic Model, conversation, and project evidence.
   - Load the formal Xirang Semantic Model through the shared context above.
   - Run `xirang arch search <query> --json` to locate the Elements a request touches.
   - For known or affected Elements, run `xirang arch impact <identities...> --depth 2 --json` to discover structural and Relationship context, then run one batch `xirang arch query <selected-identities...> --contract --json` for the selected complete semantics.
   - Use implementation evidence only where needed to resolve current behavior or lowering constraints.
3. Assess semantic readiness.
   - Reuse a confirmed `Design Summary` when the conversation contains one, and state that it is being reused. Route architecture decisions to proposal Architecture Source, `design.md`, and the Declaration, Relationship, Metamodel, and View Delta units; route testing strategy to `design.md` and concrete test work to `tasks.md`; route risk and trade-off decisions to `design.md`.
   - Otherwise require a clear problem, impact scope, approach, verification method, and no unresolved Semantic Delta decisions across Definition, Contract, or structural scope. Multi-subsystem scope is evidence, not an automatic Explore requirement; report a gap only when it cannot form one coherent change scope.
   - If readiness is incomplete, list the concrete missing items, recommend `/skill:xirang-explore`, and stop: do not create a change directory or modify project files.
   - If the user explicitly overrides the readiness recommendation, continue, but the override does not authorize guessing source decisions. Ask one focused question at a time for every unresolved behavior or architecture decision.
   - For an existing change, assess readiness from existing artifacts, current input, the confirmed Design Summary, formal source, and implementation evidence together.
   - Keep readiness, missing-item, and override state in the conversation only; do not copy it into change artifacts.
4. Resolve change identity after readiness passes or is explicitly overridden.
   - If the user explicitly requests a new change and the ID is unused, run `xirang new change "<name>"`.
   - If the user explicitly requests a new change and the ID already exists, stop and ask for a different ID. Do not overwrite, continue, or synthesize an alternative ID.
   - If the user explicitly requests an existing change, update that change in place without asking for another ID.
   - If intent is ambiguous and the ID exists, ask whether to update the existing change or create an independent new change; in non-interactive mode, fail and request an explicit choice.
   - Run `xirang status --change "<name>" --json` for `applyRequires`, artifact order, dependencies, and schema.
5. Determine source impact before writing `proposal.md`.
   - Compare requested observable behavior with formal Element Contracts. Reuse the Element whose Contract already governs the behavior; add a Contract to another Element only for genuinely new observable behavior. An optional-contract Element without a Contract does not by itself require a new one.
   - Compare structural impact with the formal Xirang Semantic Model. Identify affected Element Declarations, refinement, Relationships, Element Kinds, Relationship Kinds, and Authored Views. For every added or modified Declaration, write the complete target Definition, not a summary of what changed. Implementation movement or call/import evidence alone is not a structural change.
   - When a confirmed Change Structural Definition exists, compile that payload without invoking decomposition guidance again.
   - When no confirmed Change Structural Definition exists and source impact requires a new or reorganized hierarchy, apply the Structural Decomposition Guidance before deciding the target sibling sets. If the configured guidance is unavailable or insufficient, stop Formation and ask one focused question; do not fall back to another method or infer structure from implementation layout.
   - When Architecture Source is `None`, do not invoke decomposition guidance or invent hierarchy changes.
   - Determine the Contract and structural scopes of one Semantic Delta. Keep the compatible `Behavior Source` and `Architecture Source` proposal headings: `Behavior Source` lists `New Specs` or `Modified Specs` as the Element identities whose Element Contract is added or modified, and `Architecture Source` lists the identities whose Declaration, Relationship, Metamodel, or View semantics change. Both sections address the same identity space; they separate Contract impact from structural impact, not two kinds of identifier. Use `None` only when that scope truly does not change.
6. Generate ready artifacts in dependency order. For each artifact, run `xirang instructions <artifact-id> --change "<name>" --json`.
   - For each response, follow the authoring order in the returned `instruction`. Keep `definition`, dependencies, `currentState`, `configProjection`, and `template` as separate inputs; do not copy non-artifact inputs into artifacts.
   - For `proposal.md`, write `## Source Impact` with the compatible Behavior Source and Architecture Source sections, referencing Elements by `identity`.
   - When creating `specs`, write the Element Contract delta into `.xirang/changes/<name>/elements/<identity>.md` for exactly the identities declared under proposal `Behavior Source`; the frontmatter locates the host Element and the body carries the Requirement Entries. Read the exact Requirement titles from the formal Element Contract before authoring ADDED, MODIFIED, or REMOVED deltas. Express a rename as REMOVED old Requirement plus ADDED new complete Requirement. Author only canonical unlabeled `#### Scenario: <title>` headings. Rely on combined change validation for deterministic header compatibility. Follow the returned Specs authoring contract.
   - Route obsolete-test rationale from **Test Maintenance** to `design.md` and concrete test updates/removals to `tasks.md`. Route **One-time Verification** items to evidence-only `tasks.md` Checks with no persistent test file; absence assertions use `Verifies: <path> REMOVED Requirement`.
7. Continue until all `applyRequires` artifacts are done. If an Element's concept identity, independent modeling reason, scope, or hierarchy boundary remains unresolved, stop and ask one focused question instead of guessing the Definition. Ask one focused question when any other artifact decision remains unresolved.
8. After Specs and Design are complete, reconcile structural scope before writing the remaining Delta units.
   - Re-read proposal Architecture Source, `design.md`, the formal Xirang Semantic Model, and current implementation evidence.
   - If Design confirms a different structural impact across Declarations, refinement, Relationships, Kinds, or Views, update only proposal `Architecture Source` to declare final scope.
   - Write each affected Entry into its partition under `.xirang/changes/<name>/`: `elements/<identity>.md` frontmatter for a Declaration Entry, `relationships/<relationship kind identity>.yaml` for `{operation, source, kind, target}` entries, `metamodel/<kind identity>.md` for Kind Entries, and `views/<view identity>.md` for Authored View Entries. Every Entry carries `operation` and its complete target state; `REMOVED` carries identity only; `relationships/` has no `MODIFIED`.
   - If Architecture Source is `None`, leave those partitions empty; do not invent structural changes from Contract changes alone.
   - Validate the Expected Semantic Model with `xirang arch validate --change "<name>" --json` and fix all errors before continuing.
9. Check compilation scaffolding before semantic-source validation.
   - Run `xirang instructions proposal --change "<name>" --json` and `xirang instructions design --change "<name>" --json`; compare each file with its current resolved definition and template.
   - Run `xirang instructions tasks --change "<name>" --json`. Support Actions and coarse `### Task N:`, Goal, Files, Requirements, Checks, Covers:, Verifies:, change-local `Verifies:` Element unit paths, Requirement/Scenario references, Command:, Evidence:, and Expect:. Do NOT invent semantic lint rules beyond the current templates. Apply Test Quality Guidance when compiling verification work. A Check is an evidence unit, not necessarily one test case. Group Scenarios that represent one observable behavior and failure reason into one Check. Do not create Checks solely to match Scenario count. Prefer modifying an existing test over adding a parallel test for the same behavior. Each Check SHALL declare Test action: reuse, modify, add, delete, or one-time. Route non-persistent evidence to one-time Checks without a test file. 任务结构校验由步骤 10 的 combined validation 以确定性操作承担。
   - Before ready-for-apply, cross-check Goals, Files, Requirements, and Checks as independently implementable and verifiable end-to-end loops. Production code, configuration, generated surfaces, and tests that jointly deliver one behavior MUST remain in one task. Split only when each task reaches its own GREEN independently, or when it depends only on an earlier task that is already GREEN; a task's RED/GREEN cycle MUST NOT depend on a later task. Do not split tasks by component, module, directory, file type, Requirement count, or Scenario count. When a later task is required for GREEN, Checks are split 1:1 with Scenarios, or persistent tests only lock wording or cannot catch a real behavior mutation, reconcile those Checks and task boundaries before declaring the Change ready for Apply.
10. 执行收尾一致性验证门禁：先执行计划一致性复核，再执行确定性校验作为收尾门禁。
    - 先执行计划一致性复核：对照 change-local Contracts、`design.md` 与 Semantic Delta 复核 `tasks.md` 的语义矛盾；发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时，一次性呈现全部发现并等待用户裁决。
    - 随后在用户裁决后的最终制品上执行确定性校验：`xirang validate --change "<name>" --json` 承担联合验证、生效差异审阅与任务结构校验。Do NOT run `xirang sync`。
    - 确定性校验或 scaffolding checks 的报错阻塞 ready-for-apply。最多修复一轮、复检一次，残留报错保持阻塞。
    - WARNING does not block ready-for-apply; retain it for the final summary.
11. Complete the structural handoff only when a Change Structural Definition exists.
    - Run `xirang framing status <explorationId> --json` and `xirang framing validate <explorationId> --json` after the Change artifacts are complete. Recompute relevant drift, downstream impacts, and structural coverage against the complete current payload; relevant drift or structural errors return to Explore, and unresolved impacts block Formation completion.
    - After combined Change validation succeeds, run `xirang framing consume <explorationId> --change "<name>" --json`. Consume atomically rechecks validation and structural coverage, freezes the exact source bytes at `.xirang/changes/<name>/change-structural-definition.md`, and removes the managed source only on success.
    - The frozen `change-structural-definition.md` records Formation history only. Do not parse it as a later semantic source or use it in validation, Sync, or Change Closure.
    - When no Change Structural Definition exists, preserve the ordinary Propose path and do not run framing validation or consume.
12. Finish with `xirang status --change "<name>"`. Summarize artifacts created or updated, validation errors and warnings, and readiness for `/skill:xirang-apply-change`. Do NOT generate a presentation artifact or run a separate Diff command.

## Artifact Contract

**Document Language Contract**:
- Treat `.xirang/config.yaml` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes `proseLanguage`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow `proseLanguage`
- If no `proseLanguage` projection is present, keep the default writing behavior for prose

Keep tasks coarse and aligned to TDD closure: each `### Task N:` is one independently implementable and verifiable end-to-end loop with one `Goal`, `Files`, no more than 5 high-level `Requirements`, and nested Checks. Preserve canonical headings, IDs, schema keys, paths, commands, BDD keywords, and code identifiers.
