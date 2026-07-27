import type { SkillTemplate } from '../types.js';
import {
  ELEMENT_CONTRACT_SEMANTICS,
  SEMANTIC_MODEL_UNIT_NOTATION,
  XIRANG_PHILOSOPHY,
} from '../fragments/xirang-fragments.js';

export function getBuildSkillTemplate(): SkillTemplate {
  return {
    name: 'xirang-build',
    description: 'Build or rebuild the project Xirang Semantic Model as one reviewed Candidate.',
    instructions: `Build the project Xirang Semantic Model from user-authorized intent and evidence.

${XIRANG_PHILOSOPHY}

${ELEMENT_CONTRACT_SEMANTICS}

${SEMANTIC_MODEL_UNIT_NOTATION}

## Workflow

1. Confirm that the project has been prepared with \`xirang setup\`, then run \`xirang candidate status --json\`.
2. If a Candidate is active, present its baseline, inventory, and status. Ask the user to choose either to continue the active Candidate or explicitly authorize discarding it and initialize a replacement. If the user chooses to continue, preserve the active Candidate and skip Candidate initialization. Build MUST NOT silently continue, discard, or replace an active Candidate.
3. Ask the user to choose the exploration scope: whole project, code and tests, documentation and current Xirang, or custom paths and rules.
4. Only initialize when no Candidate is active or the user explicitly authorizes replacement. Resolve the Candidate baseline before authoring any Build file, summarize the Formal Model when it exists, ask the user to choose the starting point, then run exactly one applicable command:
   - \`xirang candidate init --from current\`
   - \`xirang candidate init --from clean\`
   - \`xirang candidate init --from-path <path>\`
5. After initialization succeeds or active-Candidate continuation is confirmed, write \`.xirang/candidate/build.md\` with the authorized scope, authority order, current requirements, and explicit exclusions. Current user requirements have highest priority.
6. Explore the authorized scope in any useful order. Code, tests, documents, configuration, Git history, and current Xirang are evidence only unless the user explicitly designates them as source of truth. Subagents MAY accelerate read-only exploration.
7. Run the conditional Modeling Decision Gate after exploration and before the first Candidate model write.
   - Ask only when multiple reasonable choices would change identity, hierarchy, Contract, Kind, Relationship, or Authored View semantics. Do not block on implementation details or wording preferences that cannot change the target Semantic Model.
   - Resolve decisions in dependency order: authority conflicts → Element identity and boundaries → hierarchy → Metamodel → Contracts → Relationships → Authored Views.
   - Present bounded options with trade-offs and ask one decision at a time. If no semantic choice remains, continue without asking.
   - Append only exception provenance to \`build.md\`: user rulings, authority-conflict resolutions, non-obvious evidence choices, and explicit exclusions. Record each decision, evidence, and affected scope; do not create a Requirement provenance matrix.
8. Author the Candidate breadth-first across the whole model: Metamodel → Element Declarations and hierarchy → Element Contracts → Relationships → Authored Views.
   - Write \`.xirang/candidate/{metamodel,elements,relationships,views}/\` in the unit notation above. An Element Contract is the body of its Element unit, so one Element has at most one Contract; whether a Contract is required comes from the \`contract\` field of its Element Kind.
   - Check each completed layer with focused Agent inspection. Do not require full \`candidate validate\` for an intentionally incomplete intermediate layer.
   - If a later layer exposes an earlier defect, correct the affected layer and recheck every dependent later layer without rewriting unrelated layers.
9. Run \`xirang candidate validate --json\` after all five layers exist. Fix every ERROR in Candidate source and repeat deterministic validation until it succeeds. The CLI is read-only and must not author or normalize semantics.
10. After deterministic validation succeeds, delegate one complete semantic review to a generic read-only subagent with a clean context.
    - Provide the absolute project root, Candidate root, \`build.md\`, current \`reviewDigest\`, authorized scope, authority order, recorded user rulings, validation result, review checklist, and output contract.
    - Require the subagent to independently read build.md, all four Candidate partitions, authority sources, and necessary project evidence. Main-Agent completion claims are not evidence.
    - Review authorization coverage, unauthorized durable semantics, hierarchy, Kinds, Contracts, Requirement boundaries, Scenario confinement, Relationships, Authored Views, cross-level overlap, and exception provenance.
    - Require one structured result with this exact contract:

\`\`\`json
{
  "result": "PASS | FAIL",
  "findings": [
    {
      "severity": "BLOCKER | HIGH",
      "identity": "element-or-entry-identity",
      "issue": "problem",
      "authorityEvidence": ["path:line"],
      "correction": "required correction"
    }
  ],
  "coverage": {
    "metamodel": true,
    "elements": true,
    "relationships": true,
    "views": true,
    "build": true,
    "authority": true
  }
}
\`\`\`

    - Only \`BLOCKER\` and \`HIGH\` findings fail the gate. Correct a finding or return to the Modeling Decision Gate as appropriate.
    - Any Candidate modification invalidates the review. Rerun \`xirang candidate validate --json\` and delegate another new clean-context subagent; never resume or reuse the previous review context.
    - If a clean-context subagent is unavailable, fail closed. Do not substitute author self-review or use \`xirang-reviewer\`.
11. Present the Project Root, Metamodel, hierarchy, Element Contracts, Relationships, Authored Views, important confirmed decisions, Formal comparison, semantic-review result, and returned \`reviewDigest\` directly to the user.
12. Only after the user confirms that exact version, run \`xirang candidate promote --digest <reviewDigest>\`. Promotion replaces \`.xirang/model/\` with the Candidate as a whole; a unit absent from the Candidate is not retained.
13. After promotion succeeds, verify these postconditions in order:
    - Run \`xirang candidate status --json\` and require \`active === false\`.
    - Verify \`.xirang/model/metamodel\`, \`.xirang/model/elements\`, \`.xirang/model/relationships\`, and \`.xirang/model/views\` are real directories, even when a partition is empty.
    - Run \`xirang arch validate --json\` and require success. Report warnings without failing the postcondition.
    - Report Build complete only after all checks pass. On failure, report whether promotion succeeded, the failed condition, and current Formal/Candidate state; MUST NOT retry promotion automatically.

## Guardrails

- The Candidate is one complete Semantic Model, authored and reviewed as a whole.
- \`build.md\` is temporary compilation scaffolding, not durable semantic source.
- The breadth-first authoring order does not impose a fixed evidence scan order.
- Do not infer hierarchy, behavior, or relationships from paths, imports, calls, passing tests, or implementation existence alone.
- Do not modify formal \`.xirang/model/\` before digest-confirmed promotion.
- Build and promotion provide no guarantee that Git status or index remain unchanged.
- Preserve canonical identities, paths, commands, and schema keys.`,
    license: 'MIT',
    compatibility: 'Requires xirang CLI with candidate commands.',
    metadata: { author: 'xirang', version: '1.0' },
  };
}
