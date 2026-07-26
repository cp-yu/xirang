/** Shared architecture instruction fragments for workflow templates. */

/**
 * Fragment: Xirang philosophy
 * Used in: propose, explore, apply-change, archive-change, build, snack, reviewer, optimizer
 * Excluded by decision: feedback (writes no artifacts)
 */
export const XIRANG_PHILOSOPHY = `
**Xirang Philosophy**

1. Xirang is a structured representation of human intent that an Agent can compile.
2. One Xirang Semantic Model consists of LikeC4 graph modules and element-owned Markdown contract modules; they are source modules of the same model, not two parallel sources.
3. A change reconciles a Semantic Delta toward the target steady state. \`proposal.md\`, \`design.md\`, and \`tasks.md\` are compilation scaffolding, not competing sources of truth.
4. The Xirang Semantic Model is complete only when an Agent need not guess decisions that affect element hierarchy, contracts, or relationships.
5. The Agent acts like a compiler and faithfully translates authorized human intent. Existing code is current implementation evidence and MUST NOT silently override the Xirang Semantic Model.
`.trim();

/**
 * Fragment: Shared Xirang Semantic Model context
 * Used in: explore, propose, apply-change, snack, reviewer, optimizer
 */
export const XIRANG_SHARED_CONTEXT = `
**Xirang Semantic Model Context**
- Resolve the absolute Project Root, then load the LikeC4 graph modules under \`.xirang/architecture/\` and locate the unique Project Root element.
- Use stable \`elementId\` as canonical identity. FQN is the current source navigation path and may change when an element moves.
- Read relevant parent and children as abstraction/refinement context. Do not assume a fixed element-kind hierarchy or treat nesting as ownership.
- Use \`xirang list --specs --json\` as the Element Contract registry; each Spec has one singular element owner binding.
- Use \`xirang arch query <elementId> --relations --depth <n> --json\` for parent, children, owned Specs, and incoming/outgoing semantic relationships.
- Treat code paths, symbols, imports, and calls from CodeGraph or ACE/\`rg\`/\`read\` as current implementation evidence only; do not promote them to elements or relationships without declared model intent.
- If the model is missing, report \`Semantic Model unavailable\`. If it is incomplete or unsupported, identify the root, identity, binding, contract, or relationship gap.
- A read-only exploration MAY degrade to available model and code evidence with the limitation disclosed. Workflows that compile or write semantics MUST stop when required model context is missing or incomplete; never treat a missing collection as complete and empty.
`.trim();

/**
 * Fragment: Generate architecture-delta.c4
 * Used in: snack
 */
export const ARCHITECTURE_GENERATE_DELTA = `
**Generate architecture-delta.c4**:
- Before writing, follow the authoring order in the returned \`instruction\`; keep \`definition\`, dependencies, \`currentState\`, \`configProjection\`, and \`template\` as separate inputs
- Read proposal \`Source Impact\` as compatible scaffolding for one Semantic Delta; use it to locate affected elements, refinement, Element Contracts, and relationships
- Read completed change-local Element Contracts as target contract context, \`design.md\` for architecture decisions, and the formal Xirang Semantic Model as current semantic state
- Treat proposal entries as scope declarations, not authoritative LikeC4 records; derive exact target-state elements, refinement, contract bindings, and typed relationships
- Read \`.xirang/references/likec4-authoring.md\`
- Extend existing elements by current FQN and preserve stable \`elementId\` metadata
- Express abstraction/refinement by nesting and collaboration with typed syntax such as \`source -[invokes]-> target\`
- Bind each change-local Spec to exactly one stable \`elementId\` through singular frontmatter
- If the graph module scope is \`None\`, omit \`architecture-delta.c4\`; do not invent graph changes from contract changes alone
- Run \`xirang arch validate --delta .xirang/changes/<name>/architecture-delta.c4\`
- Use current code only as implementation evidence; it MUST NOT override the Xirang Semantic Model
`.trim();


/**
 * Fragment: Post-propose warning validation
 * Used in: propose
 */
export const ARCHITECTURE_POST_PROPOSE_VALIDATION = `
**Run post-propose validation**:
- Validate generated change specs with \`xirang validate --change "<name>" --json\`.
- Validate \`architecture-delta.c4\` with \`xirang arch validate --delta .xirang/changes/<name>/architecture-delta.c4\`.
- Do NOT run \`xirang sync\` because validation must not mutate formal source
- Run lightweight structure checks for \`proposal.md\`, \`design.md\`, and \`tasks.md\` against the current schema templates, not scattered examples:
  - Read \`xirang instructions proposal --change "<name>" --json\`, \`xirang instructions design --change "<name>" --json\`, and \`xirang instructions tasks --change "<name>" --json\`
  - Check only key required headings and checkbox structure
  - For \`tasks.md\`, run a deterministic task structure check equivalent to \`validateTaskStructure\` in \`src/core/parsers/task-structure.ts\`
  - Programmatically verify either legacy \`Actions\`/\`Checks\` sections or coarse \`### Task N:\` sections with \`Goal\`, \`Files\`, \`Requirements\`, and nested \`Checks\`
  - For legacy tasks, verify \`A\`-prefixed action checkboxes, \`C\`-prefixed check checkboxes, required \`Covers:\` fields, valid \`Covers:\` references, and every action covered by at least one check
  - For coarse tasks, verify each task has no more than 5 requirements and at least one nested \`C\`-prefixed check
  - For every check, verify required non-empty \`Verifies:\` or \`Preserves:\` field
  - When \`Verifies:\` anchors an ordinary requirement, verify change-local \`Verifies:\` spec paths plus Requirement/Scenario references when local change specs exist
  - When \`Verifies:\` anchors a REMOVED requirement, verify it uses \`REMOVED Requirement "<name>"\` syntax (no Scenario required) and the REMOVED requirement exists in the delta spec
  - When \`Preserves:\` is present, verify it uses main spec path (\`.xirang/specs/<cap>/spec.md\`) with Requirement and ≥1 Scenario names, and the path whitelist does not relax \`Verifies:\` constraints
  - Verify at least one \`Command:\`, \`Evidence:\`, or \`Expect:\` field per check
  - Do NOT invent semantic lint rules beyond the current templates
  - Do NOT judge whether a check is semantically sufficient; defer semantic suitability to verify/reviewer
- If warnings are found, do exactly one repair pass on the generated artifacts, then re-check once
- Final summary MUST separate:
  - fixed warnings
  - remaining warnings
  - skipped checks
- Even with remaining warnings, you MAY still declare the change ready for \`/xirang:apply\`, but disclose the residual issues explicitly
`.trim();

/**
 * Fragment: Verify state machine diagram
 * Used in: apply-change
 */
export const VERIFY_STATE_MACHINE_DIAGRAM = `
**Verify State Machine**:
\`\`\`
Phase 1 PASS / PASS_WITH_WARNINGS
  |
  v
fresh optimizer reconciliation
  |-- blockingObservations --> Phase 1 remediation
  |-- no actionable finding --> NOT_NEEDED or IMPROVED
  |-- selected finding ------> freshness gate -> implemented
                                      |
                                      v
                              fresh reviewer verification
                                |-- PASS --> verified -> checkpoint -> reconcile
                                |-- FAIL --> rollback -> failed/rejected -> reconcile
  |-- unchanged reconciliation twice --> STALLED -> terminal
  |-- skipped / disabled ------------> SKIPPED

Archive accepts: SKIPPED | NOT_NEEDED | IMPROVED | DEGRADED
Archive rejects: PENDING_VERIFICATION | ABORTED_UNSAFE
\`\`\`
`.trim();

/**
 * Fragment: Verify CLI JSON schema reference
 * Used in: apply-change
 */
export const VERIFY_CLI_JSON_SCHEMA_REFERENCE = `
**Verify CLI JSON Schema Reference**:

| CLI call | \`--input\` JSON |
| --- | --- |
| Phase 1 | \`{"result":"PASS","issues":[],"evidenceFiles":["..."]}\` |
| Phase 2 reconcile | \`{"status":"OPTIMIZATION_PROPOSED","envelope":{"blockingObservations":[],"actions":[],"findings":[]}}\` |
| Begin implementation | \`{"status":"OPTIMIZATION_PROPOSED","mode":"begin-implementation","findingId":"OPT-<timestamp>-01"}\` |
| Skip | \`{"status":"SKIPPED"}\` |
| Finding verification | \`{"result":"PASS","findingId":"OPT-<timestamp>-01","issues":[]}\` |
`.trim();

/**
 * Fragment: Verify error recovery guide
 * Used in: apply-change
 */
export const VERIFY_ERROR_RECOVERY_GUIDE = `
**Verify CLI Error Recovery Guide**:
- Invalid JSON or envelope errors: fix the strict JSON structure and retry without editing persisted history
- OPTIMIZER_REQUIRED: delegate to fresh optimizer and submit its reconciliation envelope
- STALE_FINDING: do not edit; re-run optimizer reconciliation against current code
- SELECTED_FINDING_REQUIRED: use the current selected finding ID
- PENDING_VERIFICATION: complete reviewer verification or rollback before reconciliation
`.trim();

/**
 * Fragment: Fast path for simple changes
 * Used in: apply-change
 */
export const VERIFY_SIMPLE_CHANGE_FAST_PATH = `
**Simple Change Fast Path**:
- Spawn fresh optimizer at least once unless optimization is skipped or disabled
- Only a valid reconciliation envelope with no actionable findings may produce NOT_NEEDED
- Master MUST NOT self-determine NOT_NEEDED, skip selected findings, or reject them without masterChallenge
`.trim();

/**
 * Fragment: Apply proseLanguage only to natural-language prose
 * Used in: propose, snack, apply-change
 */
export const ARTIFACT_DOC_LANGUAGE_CONTRACT = `
**Document Language Contract**:
- Treat \`.xirang/config.yaml\` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes \`proseLanguage\`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow \`proseLanguage\`
- If no \`proseLanguage\` projection is present, keep the default writing behavior for prose
`.trim();
