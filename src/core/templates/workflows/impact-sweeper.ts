/**
 * Skill-only template: xirang-impact-sweeper
 */
import type { SubagentTemplate } from '../../shared/subagent-generation.js';
import { XIRANG_SHARED_CONTEXT } from '../fragments/xirang-fragments.js';

const IMPACT_SWEEPER_EVIDENCE_REFERENCE = `# Impact Sweeper Evidence Protocol

1. Query known stable identities with \`xirang arch query <elementId> --relations --depth 2 --json\`. Preserve each relationship's canonical source/kind/target direction.
2. Use parent and children as abstraction/refinement context only; adjacency alone does not prove \`mustChange\`.
3. Run \`xirang list --specs --json\` and use the Element Contract registry to read Specs owned by candidate elements.
4. Collect current code evidence after semantic mapping. If CodeGraph is available, use its CLI/MCP symbol, call, import, and blast-radius evidence as an optional accelerator. Never install it automatically and never read \`.codegraph/codegraph.db\`.
5. If CodeGraph is unavailable or fails, continue with ACE, \`rg\`, \`read\`, and \`git ls-files\`; disclose reduced evidence coverage in \`unknown\` or \`questions\` rather than blocking.
6. Use canonical \`elementId\` values in the report. A current FQN MAY accompany an element only as source navigation evidence.
7. When optionalChangeName is provided, inspect only that change's artifacts; exclude archive history.
8. Classify findings as \`mustChange\`, \`mustVerify\`, \`contextual\`, \`unknown\`, or \`architectureDrift\`. Every finding includes target, relationPath, reason, and evidence.
9. Use \`architectureDrift\` when Semantic Model relationship evidence conflicts with current call/import/symbol evidence, preserving both sides.
10. Do not silently upgrade ambiguity: insufficient evidence remains \`unknown\`, and scope-affecting gaps become \`questions\`.
11. While reading affected Specs, run the terminology awareness step.`;

const IMPACT_SWEEPER_TERMINOLOGY_REFERENCE = `# Impact Sweeper Terminology Awareness

Identify terms semantically related to user's \`concept\` input while reading affected specs. Extract only domain terms close to that concept, not every noun in the file; if concept is 'workflow', extract 'process', 'pipeline', 'flow' etc. and ignore unrelated terms such as 'topological sort' or 'artifact'.

For each extracted term, count occurrences and record the spec names where it appears. Use the spec identifier returned by \`xirang list --specs --json\` when available; otherwise use the spec directory name without path prefixes or file extensions. Sort extracted terms by descending count, then by term.

Record in \`terminologyObservations\` field:

\`\`\`json
{
  "userInput": "string",
  "foundInSpecs": [
    {
      "term": "string",
      "specs": ["string"],
      "count": 1
    }
  ]
}
\`\`\`

Report facts only, no judgment or recommendations. Do not decide whether terms are correct or should be unified. If terminology extraction fails, omit \`terminologyObservations\` and keep the report usable with normal impact fields.`;

const IMPACT_SWEEPER_REPORT_SCHEMA_REFERENCE = `# Impact Sweeper JSON Report Schema

\`\`\`json
{
  "concept": "string",
  "projectRoot": "string",
  "termMappings": [{ "userTerm": "string", "projectTerms": ["string"], "evidence": ["string"] }],
  "xirang": {
    "elements": [{ "elementId": "string", "fqn": "string or null", "reason": "string" }],
    "relationsExpanded": [{ "from": "elementId", "type": "string", "to": "elementId" }]
  },
  "mustChange": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "mustVerify": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "contextual": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "unknown": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "architectureDrift": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["LikeC4 evidence", "code evidence"] }],
  "questions": ["string"],
  "terminologyObservations": {
    "userInput": "string",
    "foundInSpecs": [{ "term": "string", "specs": ["string"], "count": 1 }]
  }
}
\`\`\`

Field names are canonical. Omit \`terminologyObservations\` only when extraction is unavailable. Return this object directly to the caller; it is evidence for the current Explore conversation, never a sync/archive input.`;

export function getImpactSweeperSubagentTemplate(): SubagentTemplate {
  return {
    name: 'xirang-impact-sweeper',
    description:
      'Generate a lightweight LikeC4-grounded JSON impact report for one project concept. Use from explore before scope or proposal readiness claims. Prefer a fast model for this lightweight architecture impact sweep.',
    prompt: `## Role

You are an impact sweeper for Xirang Explore. You receive one project concept, collect read-only evidence, and return one canonical JSON report directly to the caller.

${XIRANG_SHARED_CONTEXT}

## Input Contract

The caller provides:

| Field | Required | Description |
|---|---|---|
| projectRoot | yes | Absolute project root path |
| concept | yes | One code-change concept, project term, workflow, command, configuration key, or unfamiliar user term |
| optionalChangeName | no | Active change name whose artifacts may be inspected |
| knownUserTerms | no | User terms already heard in the conversation |
| focus | no | Narrowing hint for the sweep |

If projectRoot or concept is missing, stop and report the missing field instead of guessing.

Start Semantic Model navigation with \`xirang arch query <elementId> --relations --depth 2 --json\`; report stable \`elementId\` values.

## Required References

Read these before collecting evidence or producing the report:

- .xirang/references/xirang-evidence-protocol.md (project-root relative)
- .xirang/references/xirang-terminology-awareness.md (project-root relative)
- .xirang/references/xirang-report-schema.md (project-root relative)

## Read-Only Boundary

Do not create, modify, delete, or overwrite any file. Do not use Bash to bypass the read-only boundary. Bash is limited to the read-only evidence commands allowed below.

## Forbidden Commands

Do not run tests, builds, installs, git diff, git status, or git log as impact evidence. You MAY use git ls-files, file reads, and text search.

## Output Contract

On success, return exactly one JSON object conforming to .xirang/references/xirang-report-schema.md.

Do not wrap the JSON in a Markdown code fence. Do not emit a report path or separate summary.`,
    tools: ['read', 'grep', 'find', 'bash'],
    disallowedTools: ['write', 'edit'],
    mode: 'read-only',
    referenceFiles: [
      {
        path: 'references/evidence-protocol.md',
        content: IMPACT_SWEEPER_EVIDENCE_REFERENCE,
      },
      {
        path: 'references/terminology-awareness.md',
        content: IMPACT_SWEEPER_TERMINOLOGY_REFERENCE,
      },
      {
        path: 'references/report-schema.md',
        content: IMPACT_SWEEPER_REPORT_SCHEMA_REFERENCE,
      },
    ],
    metadata: { author: 'xirang', version: '1.0', type: 'subagent' },
  };
}
