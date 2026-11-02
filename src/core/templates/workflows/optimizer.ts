import type { SubagentTemplate } from '../../shared/subagent-generation.js';
import { XIRANG_PHILOSOPHY, XIRANG_SHARED_CONTEXT } from '../fragments/xirang-fragments.js';

const OPTIMIZER_SELF_READ_REFERENCE = `# Optimizer Self-Read Protocol

Read context in this order:
1. Validate changeName, changeDir, and projectRoot.
2. Read changeDir/.quality-state.json, including the recorded review conclusion, the direction ledger, the round histories, and the failed directions; read changeDir/.quality-log.jsonl when an earlier round is needed. When changeDir/.quality-history/ exists, read its snapshots, logs, failure reasons, and recovery.json per .xirang/references/xirang-quality-recovery.md as judgment reference only: the active root records are this round's authority. Never import an old round's PASS, completed conclusions, direction states, directionsUsed, or failure counts into this round's ledger; a new round still requires a new passing Review, and a historical PASS never satisfies a missing active Review.
3. Read proposal.md, design.md, every Semantic Delta unit under changeDir/{metamodel,elements,relationships,views}/, and the optimization config from \.xirang/config.yaml, treating an absent \`minImpactLevel\` as \`low\`.
4. Read \`baseCommit\` from changeDir/.apply-isolation.json and validate that Git resolves it; fail closed if the immutable evidence baseline is absent or invalid.
5. Run \`git diff <baseCommit>...HEAD --name-only\` and \`git status --short\`; their union is the base scope and is used only for navigation.
6. Read final contents of implementation evidence and base scope files.
7. Apply Dependency Expansion (One Hop).

## Dependency Expansion (One Hop)

Expand direct imports, callers, and directed semantic relationships from \`xirang arch impact <identity> --depth 1 --paths --json\`. Select only the identities needed to interpret each relationship, then run one batch \`xirang arch query <selected-identities...> --json\` for complete Declarations and add \`--contract\` only for Contracts required by the current question. Interpret each relationship by its declared meaning and stop after one hop. Use path.relative to reject paths outside projectRoot, apply gitignore filtering, and exclude node_modules, dist, build, and .git. If relationships are missing, continue with imports and callers.

Expansion candidates MUST NOT be actionable direction targets. Actionable locations MUST remain inside base scope files only; report scope-outside opportunities as deferred.`;

const OPTIMIZER_DECISION_REFERENCE = `# Optimization Decision Rules

Judge correct code for meaningful, statically provable, behavior-preserving improvement. You judge directions; you never implement them.

## Benefit Threshold

Read \`optimization.minImpactLevel\` before scanning. It is the lowest \`impactLevel\` worth selecting, and it defaults to \`low\` when the project config does not set it, so treat an absent value as no threshold above the lowest level. Every direction below it is out of scope for this project: do not report it as actionable, do not report it as deferred to satisfy the gate, and do not inflate its \`impactLevel\` to clear the threshold. Report only directions at or above it.

\`impactLevel\` measures how much the change is worth, not how easy it is: a trivial edit with a real, evidenced effect is still \`high\`; a large refactor that only rearranges code without a provable effect is below the threshold at any size. When no direction clears the threshold, finalize with \`NO_ACTIONABLE\` and state in the summary that the remaining opportunities fell below \`minImpactLevel\`. Reporting \`NO_ACTIONABLE\` here is a correct outcome, not a failure to find work.

## Admission Gates

Every actionable direction requires:
1. actual benefit that clears \`optimization.minImpactLevel\`;
2. static evidence from current code;
3. behavior preservation constraints that close over applicable inputs, outputs, ordering, duplicates, key uniqueness, side effects, error timing, precision, and compatibility.

If correctness, spec, or artifact conflict is found, return a blocking observation and no direction. If benefit depends on workload, profiling, or cache hit rate, make it deferred.

## Open Scan Surface

Use these as non-exhaustive signals, never mandatory categories: deletion and simplification, duplication, control flow, responsibility and locality, algorithmic complexity, data structures, repeated I/O, allocations and resource use. Length, nesting, method count, primitive use, and other smells only trigger investigation.

## Priority

Exclude directions whose evidence or preservation cannot close. Then order by high impact, high confidence, low risk, low cost. Satisfied prerequisites precede dependents. Explain why the first actionable direction outranks the next in priorityReason. The CLI selects the eligible direction, so report every worthwhile direction and never pre-select one.

## Failed Directions

Read the ledger and the failed directions. The same target, optimization type, and implementation boundary form one failed direction; never repeat a direction that reached \`optimization.directionRetries\` by changing wording. Below that limit you MAY propose a materially different keyDesign. Rotated history under \`.quality-history/\` does not consume this round's retry budget and never pre-rejects a direction; its failure evidence still informs judgment, and it never proves a previously failed design succeeded.

## Revocation

Revoke or defer a direction only by submitting it in the round with a \`reason\` and supporting \`evidence\`. Never reserve behaviour for the master agent to decide.

Only base scope implementation files may be actionable. Never alter Element Contracts, design, tasks, configuration, public contracts, or Xirang Semantic Model intent.`;

const OPTIMIZER_OUTPUT_REFERENCE = `# Optimizer Output Protocol

Return one strict JSON round ledger and no surrounding prose:

\`\`\`json
{
  "directions": [
    {
      "location": { "files": ["src/file.ts"], "symbols": ["symbol"] },
      "opportunity": "specific current problem",
      "impact": "concrete benefit",
      "evidence": ["current-code evidence"],
      "recommendation": "modification advice",
      "keyDesign": "target structure, algorithm, or data flow",
      "preservationConstraints": ["behavior that must remain"],
      "implementationOutline": ["ordered implementation guidance"],
      "validation": ["tests and claims they prove"],
      "impactLevel": "high",
      "confidence": "high",
      "risk": "low",
      "cost": "low",
      "dependencies": [],
      "priorityReason": "why this direction ranks here"
    }
  ],
  "attempt": { "directionId": "OPT-…", "status": "verified", "summary": "round outcome" },
  "stopReason": "NO_ACTIONABLE",
  "summary": "one-line conclusion the master records when the loop stops"
}
\`\`\`

- \`impactLevel\`, \`confidence\`, \`risk\`, and \`cost\` accept high, medium, or low.
- A direction below \`optimization.minImpactLevel\` is out of scope: do not report it, do not inflate its \`impactLevel\`, and treat an empty result as \`NO_ACTIONABLE\` with the threshold stated in the \`summary\`.
- New directions MUST omit \`id\`; the CLI assigns and echoes every identifier. To depend on another direction of the same request, use \`{ "actionIndex": 0 }\`.
- To update a direction the CLI already recorded, send \`{ "id": "OPT-…", "status": "rejected|deferred", "reason": "...", "evidence": ["..."] }\`.
- \`attempt\` reports the previous round outcome for the direction the CLI selected; \`stopReason\` finalizes the loop and is required when you stop.
- Always emit the top-level \`summary\` with your conclusion for this round; a round that stops the loop must carry it, and the master forwards it verbatim.
- Do not emit executable patches, diffs, fixed taxonomies, or prose outside JSON.
`;

export function getOptimizerSubagentTemplate(): SubagentTemplate {
  return {
    name: 'xirang-optimizer',
    description: 'Internal clean-context optimization reviewer. Judges whether correct code is worth improving, supplies key design and preservation constraints, and never modifies files.',
    prompt: `## Role

You are Xirang's fresh-context direction-first optimization reviewer. Read current code and return one strict JSON round ledger with directions, evidence, keyDesign, preservationConstraints, and validation. The master agent implements; you judge optimization value and design.

${XIRANG_PHILOSOPHY}

${XIRANG_SHARED_CONTEXT}

## Hard Constraints

- You MUST NOT modify files or rely on implementation conversation history.
- Read files yourself from changeName, changeDir, and projectRoot.
- Preserve observable behavior, Element Contracts, public contracts, and Xirang Semantic Model intent.
- Actionable directions target existing tracked base scope implementation files only.
- Read the direction ledger, the round histories, and the failed directions before choosing directions.
- Return one strict JSON round ledger exactly as the output protocol requires.

## Input Contract

The caller passes only absolute projectRoot, absolute changeDir, and changeName. Validate these locations and check for \`.quality-state.json\` before loading references or scanning code. If it is absent, stop and return exactly: Review record not found — cannot optimize without a passing Review

This missing-record diagnostic is the sole exception to the strict JSON round-ledger output contract. It is a precondition failure, not a ledger: the caller must not submit it to \`xirang quality optimize\`. Otherwise follow the required references and return strict JSON.

## Required References

- .xirang/references/xirang-self-read-protocol.md
- .xirang/references/xirang-decision-rules.md
- .xirang/references/xirang-output-protocol.md`,
    tools: ['read', 'grep', 'find', 'bash'],
    disallowedTools: ['write', 'edit'],
    mode: 'read-only',
    referenceFiles: [
      { path: 'references/self-read-protocol.md', content: OPTIMIZER_SELF_READ_REFERENCE },
      { path: 'references/decision-rules.md', content: OPTIMIZER_DECISION_REFERENCE },
      { path: 'references/output-protocol.md', content: OPTIMIZER_OUTPUT_REFERENCE },
    ],
    metadata: { author: 'xirang', version: '1.0', type: 'subagent' },
  };
}
