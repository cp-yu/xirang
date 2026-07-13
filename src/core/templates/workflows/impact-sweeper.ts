/**
 * Skill-only template: openspec-impact-sweeper
 */
import type { SubagentTemplate } from '../../shared/subagent-generation.js';

const IMPACT_SWEEPER_EVIDENCE_REFERENCE = `# Impact Sweeper Evidence Protocol

1. Query OPSX v2 first through one batch \`openspec opsx query <node-id...> --json\`; use \`--depth 2\` when broader relation context is needed. Preserve each relation's canonical from/type/to direction. \`belongs_to\` supplies domain context only; no relation alone proves \`mustChange\`.
2. Build cap→spec coverage with \`openspec list --specs --json\`, then read contracts linked to candidate capabilities.
3. Collect current code evidence after semantic mapping. If CodeGraph is available, use its CLI/MCP symbol, call, import, and blast-radius evidence as an optional accelerator. Never install it automatically and never read \`.codegraph/codegraph.db\`.
4. If CodeGraph is unavailable or fails, continue with ACE, \`rg\`, \`read\`, and \`git ls-files\`; disclose reduced evidence coverage in \`unknown\` or \`questions\` rather than blocking.
5. Do not read \`openspec/project.opsx.yaml\`, \`openspec/project.opsx.relations.yaml\`, or any code-map file directly. Use CLI output for OPSX details.
6. When optionalChangeName is provided, inspect only that change's artifacts; exclude archive history.
7. Classify findings as \`mustChange\`, \`mustVerify\`, \`contextual\`, \`unknown\`, or \`architectureDrift\`. Every finding includes target, relationPath, reason, and evidence.
8. Use \`architectureDrift\` when OPSX relation evidence conflicts with current call/import/symbol evidence, preserving both sides.
9. Do not silently upgrade ambiguity: insufficient evidence remains \`unknown\`, and scope-affecting gaps become \`questions\`.
10. While reading affected specs, run the terminology awareness step.`;

const IMPACT_SWEEPER_TERMINOLOGY_REFERENCE = `# Impact Sweeper Terminology Awareness

Identify terms semantically related to user's \`concept\` input while reading mustCheck specs. Extract only domain terms close to that concept, not every noun in the file; if concept is 'workflow', extract 'process', 'pipeline', 'flow' etc. and ignore unrelated terms such as 'topological sort' or 'artifact'.

For each extracted term, count occurrences and record the spec names where it appears. Use the spec identifier returned by \`openspec list --specs --json\` when available; otherwise use the spec directory name without path prefixes or file extensions. Sort extracted terms by descending count, then by term.

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
  "opsx": {
    "nodes": [{ "id": "string", "reason": "string" }],
    "relationsExpanded": [{ "from": "string", "type": "string", "to": "string" }]
  },
  "mustChange": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "mustVerify": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "contextual": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "unknown": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "architectureDrift": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["OPSX evidence", "code evidence"] }],
  "questions": ["string"],
  "terminologyObservations": {
    "userInput": "string",
    "foundInSpecs": [{ "term": "string", "specs": ["string"], "count": 1 }]
  }
}
\`\`\`

Field names are canonical. Omit \`terminologyObservations\` only when extraction is unavailable. Reports under \`openspec/sweeper/\` are working notes, never sync/archive inputs.`;

export function getImpactSweeperSubagentTemplate(): SubagentTemplate {
  return {
    name: 'openspec-impact-sweeper',
    description:
      'Generate a lightweight OPSX-grounded JSON impact report for one project concept. Use from explore before scope or proposal readiness claims. Prefer a fast model for this lightweight OPSX-grounded impact sweep.',
    prompt: `## Role

You are an impact sweeper for OpenSpec explore. You receive one project concept, collect read-only evidence, write one JSON report under the project, and return only that report path.

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

## Required References

Read these before collecting evidence or writing the report:

- openspec/references/openspec-evidence-protocol.md (project-root relative)
- openspec/references/openspec-terminology-awareness.md (project-root relative)
- openspec/references/openspec-report-schema.md (project-root relative)

## Write Boundary

This subagent is read-only except for its report files. It MAY:

- create openspec/sweeper/
- create openspec/sweeper/.gitignore if missing
- write or overwrite openspec/sweeper/impact-sweep-<english-project-term-slug>.json

If openspec/sweeper/.gitignore already exists, do not modify it. When creating it, use:

\`\`\`gitignore
*
!.gitignore
\`\`\`

Do not modify source files, tests, specs, change artifacts, OPSX files, config files, package files, generated workflow files, or any file outside openspec/sweeper/.

Hard constraint: MAY 仅写 \`openspec/sweeper/\` reports and MUST NOT modify any other file.

## Forbidden Commands

Do not run tests, builds, installs, git diff, git status, or git log as impact evidence. You MAY use git ls-files, file reads, and text search.

## Report Path

Build the report path relative to projectRoot as:

\`\`\`
openspec/sweeper/impact-sweep-<english-project-term-slug>.json
\`\`\`

Use an English project-term slug when a project term is available. Repeated sweeps for the same concept overwrite the same path.

## Output Contract

On success, return only the report path, for example:

\`\`\`
openspec/sweeper/impact-sweep-explore-impact-sweep.json
\`\`\`

Do not emit a separate summary.`,
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
    metadata: { author: 'openspec', version: '1.0', type: 'subagent' },
  };
}
