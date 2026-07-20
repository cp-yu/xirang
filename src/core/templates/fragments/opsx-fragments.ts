/** Shared architecture instruction fragments for workflow templates. */

/**
 * Fragment: OpenSpec philosophy
 * Used in: propose, explore, apply-change, archive-change, bootstrap-arch, snack, reviewer, optimizer
 * Excluded by decision: impact-sweeper (read-only reporter), feedback (writes no artifacts)
 */
export const OPENSPEC_PHILOSOPHY = `
**OpenSpec Philosophy**

OpenSpec is a human-intent programming layer between human intent and general-purpose programming languages.

1. Specs and LikeC4 jointly form the durable semantic source. Specs define observable behavior; LikeC4 defines project intent, capabilities, ownership, boundaries, and semantic relations.
2. A change reconciles semantic source deltas toward a target steady state. \`proposal.md\`, \`design.md\`, and \`tasks.md\` are compilation scaffolding, not competing sources of truth.
3. Source is complete only when an Agent can compile it without guessing decisions that affect behavior or architecture.
4. The Agent acts as a compiler: translate declared intent faithfully. Existing code is compiled output and current implementation evidence; it MUST NOT silently override the declared semantic source.
`.trim();

/**
 * Fragment: Shared LikeC4 read context
 * Used in: explore, propose, apply-change
 */
export const ARCHITECTURE_SHARED_CONTEXT = `
Before reading implementation files, load the formal LikeC4 source under \`openspec/architecture/\`.
- Use \`openspec arch query <element-id> --relations --depth 2\` for architecture navigation
- Read linked Specs from capability metadata
- Treat code paths, imports, calls, and symbols as implementation evidence only
- Do not read legacy OPSX YAML as active architecture source
`.trim();

/**
 * Fragment: CLI-backed LikeC4 query context
 * Used in: propose, snack, apply-change
 */
export const ARCHITECTURE_CLI_QUERY_CONTEXT = `
Use OpenSpec LikeC4 query surfaces for architecture details.
- Run \`openspec list --specs --json\` for Spec coverage.
- Run \`openspec arch query <element-id> --relations --depth 2 --json\` for affected elements and directed semantic relations.
- LikeC4 element IDs are semantic locations, not source paths.
- Use CodeGraph or ACE/\`rg\`/\`read\` only for current implementation evidence.
`.trim();

/**
 * Fragment: Generate architecture-delta.c4
 * Used in: snack
 */
export const ARCHITECTURE_GENERATE_DELTA = `
**Generate architecture-delta.c4**:
- Before writing, follow the authoring order in the returned \`instruction\`; keep \`definition\`, dependencies, \`currentState\`, \`configProjection\`, and \`template\` as separate inputs
- Read proposal \`Source Impact\`: use \`Architecture Source\` as declared scope and \`Behavior Source\` to locate related change-local Specs; Spec IDs are not LikeC4 element IDs
- Read completed change-local Specs as target behavior context, \`design.md\` for architecture decisions, and the formal LikeC4 model as current architecture state
- Treat proposal entries as scope declarations, not authoritative LikeC4 records; derive exact target-state elements and typed relations
- Read \`openspec/references/likec4-authoring.md\`
- Extend existing domains with \`extend <domain> { ... }\`; define genuinely new domains directly
- Express ownership by nesting and relations with typed syntax such as \`source -[invokes]-> target\`
- Link new capabilities to change-local Specs paths
- If Architecture Source is \`None\`, omit \`architecture-delta.c4\`; do not invent architecture changes from behavior changes alone
- Run \`openspec arch validate --delta openspec/changes/<name>/architecture-delta.c4\`
- Use current code only as implementation evidence; it MUST NOT override declared semantic source
`.trim();


/**
 * Fragment: Post-propose warning validation
 * Used in: propose
 */
export const ARCHITECTURE_POST_PROPOSE_VALIDATION = `
**Run post-propose validation**:
- Validate generated change specs with \`openspec validate --change "<name>" --json\`.
- Validate \`architecture-delta.c4\` with \`openspec arch validate --delta openspec/changes/<name>/architecture-delta.c4\`.
- Do NOT run \`openspec sync\` because validation must not mutate formal source
- Run lightweight structure checks for \`proposal.md\`, \`design.md\`, and \`tasks.md\` against the current schema templates, not scattered examples:
  - Read \`openspec instructions proposal --change "<name>" --json\`, \`openspec instructions design --change "<name>" --json\`, and \`openspec instructions tasks --change "<name>" --json\`
  - Check only key required headings and checkbox structure
  - For \`tasks.md\`, run a deterministic task structure check equivalent to \`validateTaskStructure\` in \`src/core/parsers/task-structure.ts\`
  - Programmatically verify either legacy \`Actions\`/\`Checks\` sections or coarse \`### Task N:\` sections with \`Goal\`, \`Files\`, \`Requirements\`, and nested \`Checks\`
  - For legacy tasks, verify \`A\`-prefixed action checkboxes, \`C\`-prefixed check checkboxes, required \`Covers:\` fields, valid \`Covers:\` references, and every action covered by at least one check
  - For coarse tasks, verify each task has no more than 5 requirements and at least one nested \`C\`-prefixed check
  - For every check, verify required non-empty \`Verifies:\` or \`Preserves:\` field
  - When \`Verifies:\` anchors an ordinary requirement, verify change-local \`Verifies:\` spec paths plus Requirement/Scenario references when local change specs exist
  - When \`Verifies:\` anchors a REMOVED requirement, verify it uses \`REMOVED Requirement "<name>"\` syntax (no Scenario required) and the REMOVED requirement exists in the delta spec
  - When \`Preserves:\` is present, verify it uses main spec path (\`openspec/specs/<cap>/spec.md\`) with Requirement and ≥1 Scenario names, and the path whitelist does not relax \`Verifies:\` constraints
  - Verify at least one \`Command:\`, \`Evidence:\`, or \`Expect:\` field per check
  - Do NOT invent semantic lint rules beyond the current templates
  - Do NOT judge whether a check is semantically sufficient; defer semantic suitability to verify/reviewer
- If warnings are found, do exactly one repair pass on the generated artifacts, then re-check once
- Final summary MUST separate:
  - fixed warnings
  - remaining warnings
  - skipped checks
- Even with remaining warnings, you MAY still declare the change ready for \`/opsx:apply\`, but disclose the residual issues explicitly
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
 * Fragment: LikeC4-first navigation guidance
 * Used in: explore
 */
export const ARCHITECTURE_NAVIGATION_GUIDANCE = `
**LikeC4-first navigation**:
- Use \`openspec arch query <element-id> --relations --depth 2 --json\` for domains, capabilities, and directed semantic relations
- Read linked files under \`openspec/specs/\` for behavior contracts
- Use optional CodeGraph or ACE/\`rg\`/\`read\` only for current implementation evidence
- Cross-reference nested domains to understand ownership and boundaries
`.trim();

/**
 * Fragment: Apply proseLanguage only to natural-language prose
 * Used in: propose, snack, apply-change
 */
export const ARTIFACT_DOC_LANGUAGE_CONTRACT = `
**Document Language Contract**:
- Treat \`openspec/config.yaml\` as the compact source of truth, but consume its compiled prompt projection rather than reinterpreting raw keys ad hoc
- If the compiled projection includes \`proseLanguage\`, apply it to natural-language prose you write or revise in the artifact body
- Natural-language prose includes task titles, check names, Requirement titles, Scenario titles, bullet descriptions, Expect/Evidence descriptions, rationale, goals, risks, and summaries
- Follow the existing template structure exactly; do not invent a different layout because the prose language changes
- Keep template headings, normative keywords, BDD keywords, IDs, schema keys, relation types, file paths, commands, and code identifiers in their canonical form
- Preserve exact existing Requirement titles required for MODIFIED matching
- English project terminology may remain embedded in prose, but ordinary English sentences and titles still follow \`proseLanguage\`
- If no \`proseLanguage\` projection is present, keep the default writing behavior for prose
`.trim();
