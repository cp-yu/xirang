import { renderRelationWorkflowSummary } from '../../relations/renderers.js';

/**
 * Shared OPSX instruction fragments for workflow templates
 *
 * These fragments reduce duplication across workflow templates and ensure
 * consistent OPSX integration patterns.
 */

/**
 * Fragment: OPSX compilation philosophy
 * Used in: propose, explore, apply-change, archive-change, bootstrap-opsx, snack, reviewer, optimizer
 * Excluded by decision: impact-sweeper (read-only reporter), feedback (writes no artifacts)
 * Budget ruling: this fragment is never trimmed; on 200-line overflow, condense other template content
 */
export const OPSX_COMPILATION_PHILOSOPHY = `
**OPSX Compilation Philosophy**:
OpenSpec treats human intent → running code as a compilation pipeline: change artifacts (proposal/specs/design/tasks) are the source code; the agent is the compiler; \`openspec validate\` is static analysis; verify Phase 1 (reviewer) is the semantic-check pass; verify Phase 2 (optimizer) is the optimization pass; sync + archive is linking and release; OPSX YAML is the symbol table and module graph; snack is decompilation. Rules that follow:
1. Artifacts are source code and MUST be elegant: every sentence is consumed downstream; redundant restatement is a code smell — state each fact exactly once.
2. Complete = faithful + elicited: key decisions the user never stated are undefined behavior in the source, and implementations deviate exactly in those silent gaps. Make them explicit — ask, or record them as explicit assumptions. Never guess silently.
3. Faithful translation: a compiler MUST NOT invent instructions. Do not exceed or deviate from specs; behavior not covered by specs goes back into specs first.
4. Syntax is contract: keep canonical headings, IDs, schema keys, and normative keywords verbatim, or downstream parsers fail.
5. No dead-code output: no placeholders, no empty template sections, no repeated narration — content either carries intent or does not exist.
6. Not compiled until gates pass: validate/verify/seal are pipeline stages, not optional extras.
A single compilation is faithful and deterministic; the source itself iterates freely and recompiles fast.
`.trim();

/**
 * Fragment: Shared OPSX read context
 * Used in: explore, propose, apply-change
 */
export const OPSX_SHARED_CONTEXT = `
Before reading other context files, check whether \`openspec/project.opsx.yaml\` exists.
- If it exists, read it first for domains → capabilities structure
- Read the \`project:\` block for project intent and scope
- Treat it as navigation context, not as a replacement for change artifacts
`.trim();

/**
 * Fragment: CLI-backed OPSX query context
 * Used in: propose, snack, apply-change
 */
export const OPSX_CLI_QUERY_CONTEXT = `
After reading shared \`project.opsx.yaml\` context, use OpenSpec CLI query surfaces for node details.
- Run \`openspec list --specs --json\` to get specs and their \`capabilities\` string arrays; specs without frontmatter return \`capabilities: []\`.
- For known or affected OPSX node IDs, run \`openspec opsx query <node-id...> --json\` to get node details and directed semantic relations in one batch; add \`--depth 2\` when broader related context is needed.
- Use optional CodeGraph or ACE/\`rg\`/\`read\` for current code locations; OPSX does not store code paths.
- Treat CLI output as navigation context, not as a replacement for change artifacts.
`.trim();

/**
 * Fragment: Generate opsx-delta.yaml
 * Used in: propose, snack
 */
export const OPSX_GENERATE_DELTA = `
**Generate opsx-delta.yaml**:
- Read \`openspec instructions opsx-delta --change "<name>" --json\`
- Use the returned \`template\`, \`instruction\`, and \`outputPath\` to generate \`opsx-delta.yaml\`
- Read \`proposal.md\` to extract the capability list
- Read all delta specs in \`openspec/changes/<name>/specs/*/spec.md\`
- For existing capability or domain IDs, run \`openspec opsx query <node-id...> --json\` for current-system context in one batch; add \`--depth 2\` when related context is needed
- Treat \`ADDED\`, \`MODIFIED\`, and \`REMOVED\` as YAML object keys, not Markdown headings
- Follow a concrete YAML object structure such as:
  \`\`\`yaml
  schema_version: 2
  ADDED:
    capabilities:
      - id: cap.example.feature
        type: capability
        intent: Describe the new capability
    relations:
      - from: cap.example.feature
        type: belongs_to
        to: dom.example
  MODIFIED:
    capabilities:
      - id: cap.example.existing
        intent: Updated intent text
  REMOVED:
    capabilities:
      - id: cap.example.legacy
  \`\`\`
- Delta nodes contain only id, type, intent, status — no code_refs or spec_refs
- Choose relations only from this Registry projection:\n${renderRelationWorkflowSummary()}
- If no precise relation applies, omit it and record a review gap
- Keep this agent-driven: capture merge intent in the YAML, not in programmatic code
`.trim();


/**
 * Fragment: Post-propose warning validation
 * Used in: propose
 */
export const OPSX_POST_PROPOSE_VALIDATION = `
**Run post-propose warning validation**:
- This validation is warning-only. Do NOT turn \`/opsx:propose\` into a blocking gate.
- Validate generated change specs against the same contract used by downstream change delta validation:
  - Prefer \`openspec validate "<name>" --type change --json\` when available
  - Align with \`Validator.validateChangeDeltaSpecs()\` semantics for delta sections, SHALL/MUST requirement text, and required \`#### Scenario:\` blocks
- Validate \`opsx-delta.yaml\` through the same programmatic CLI path used by downstream change validation:
  - Prefer \`openspec validate "<name>" --type change --json\` when available
  - Align with \`Validator.validateOpsxDelta()\` semantics for Zod parsing, dry-run \`applyOpsxDelta()\`, referential integrity, and Registry-driven semantic validation
  - Do NOT run \`openspec sync\` for this check because it mutates project files
  - If \`openspec/project.opsx.yaml\` does not exist, \`Validator.validateOpsxDelta()\` skips this check and the final summary must report the skip
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
 * Fragment: OPSX-first navigation guidance
 * Used in: explore
 */
export const OPSX_NAVIGATION_GUIDANCE = `
**OPSX-first navigation**:
If \`openspec/project.opsx.yaml\` exists:
- Use \`project.opsx.yaml\` for domains → capabilities structure
- Use \`openspec opsx query <node-id...> --json\` for directed semantic relations
- Use optional CodeGraph or ACE/\`rg\`/\`read\` for current implementation evidence
- Use \`openspec/specs/\` for behavior documentation
- Cross-reference domains to understand system boundaries
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
