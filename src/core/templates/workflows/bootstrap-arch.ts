import type { SkillTemplate } from '../types.js';
import { OPENSPEC_PHILOSOPHY } from '../fragments/opsx-fragments.js';

export function getBootstrapArchSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-bootstrap-arch',
    description: 'Bootstrap a LikeC4 architecture model from existing code using a five-phase workflow (init → scan → map → review → promote).',
    instructions: `Bootstrap the LikeC4 architecture model from current repository evidence.

${OPENSPEC_PHILOSOPHY}

## Workflow

1. **init** — inspect the repository, Specs, and config; create \`openspec/architecture/candidates/\`.
2. **scan** — collect evidence for domains, capabilities, ownership, and semantic relations. Use CodeGraph or ACE/\`rg\`/\`read\` only as current implementation evidence.
3. **map** — generate one candidate \`.c4\` file per domain. Nest every capability in exactly one domain; do not emit a \`belongs_to\` relationship.
4. **review** — compare candidate elements, metadata, and typed relations with Specs and current code evidence. Record uncertainty instead of guessing.
5. **promote** — after explicit review approval, write \`openspec/architecture/specification.c4\`, \`domains/*.c4\`, and \`views.c4\`; run \`openspec arch validate\`.

## Candidate Contract

Use LikeC4 DSL only. MUST NOT generate YAML architecture candidates.

\`\`\`likec4
model {
  cli = domain 'CLI' {
    query = capability 'Query architecture' {
      metadata {
        capabilityId 'cap.cli.arch-query'
        specs ['openspec/specs/arch-query-command/spec.md']
      }
    }
  }
  cli.query -[invokes]-> architecture.reader
}
\`\`\`

Element IDs use snake_case locally. Semantic relations use \`-[invokes]->\`, \`-[consumes]->\`, \`-[precedes]->\`, \`-[constrains]->\`, or \`-[validates]->\`. Keep evidence paths out of durable architecture metadata.

## Guardrails

- Do not write formal LikeC4 files before review approval.
- Do not infer architecture directly from imports or calls.
- Do not emit explicit \`belongs_to\`; nesting is the ownership source.
- Preserve project prose language while keeping IDs, paths, commands, and DSL tokens canonical.`,
    license: 'MIT',
    compatibility: 'Requires openspec CLI with arch commands.',
    metadata: { author: 'openspec', version: '3.0' },
  };
}
