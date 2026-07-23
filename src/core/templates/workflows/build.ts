import type { SkillTemplate } from '../types.js';
import { OPSX_PHILOSOPHY } from '../fragments/opsx-fragments.js';

export function getBuildSkillTemplate(): SkillTemplate {
  return {
    name: 'opsx-build',
    description: 'Build or rebuild the project OPSX Semantic Model as one reviewed Architecture and Specs Candidate.',
    instructions: `Build the project OPSX Semantic Model from user-authorized intent and evidence.

${OPSX_PHILOSOPHY}

## Workflow

1. Confirm that the project has been prepared with \`opsx setup\` and inspect whether an active \`.opsx/candidate/\` exists.
2. Ask the user to choose the exploration scope: whole project, code and tests, documentation and current OPSX, or custom paths and rules.
3. Record the user's current requirements and any explicit source of truth in \`.opsx/candidate/build.md\`. Current user requirements have highest priority. If conflicting evidence would change target behavior or architecture and the user has not resolved it, ask the user instead of guessing.
4. When formal OPSX exists, summarize it and ask the user to choose one starting point before running \`opsx candidate init\`:
   - \`opsx candidate init --from current\`
   - \`opsx candidate init --from clean\`
   - \`opsx candidate init --from-path <path>\`
5. Explore the authorized scope in any useful order. Code, tests, documents, configuration, Git history, and current OPSX are evidence only unless the user explicitly designates them as source of truth. You MAY use subagents as optional task-specific accelerators; the workflow must still complete without them.
6. Author one Candidate by writing both \`.opsx/candidate/architecture/\` and \`.opsx/candidate/specs/\`. Each Spec binds one stable element; an element may own multiple Specs; required-contract elements must have at least one Spec.
7. Run \`opsx candidate validate\`. Fix the reported Candidate source directly and repeat until validation succeeds. The CLI is read-only and must not author or normalize semantics.
8. Present the Project Root, metamodel, hierarchy, Spec ownership, semantic relations, important confirmed decisions, formal diff, and returned \`reviewDigest\` directly to the user.
9. Only after the user confirms that exact version, run \`opsx candidate promote --digest <reviewDigest>\`.

## Guardrails

- Architecture and Specs are one Candidate and are authored and reviewed together.
- \`build.md\` is temporary compilation scaffolding, not durable graph or contract source.
- Do not impose a fixed scan order, directory list, evidence schema, element granularity, Spec granularity, subagent role, or reviewer role.
- Do not infer ownership, hierarchy, behavior, or relations from paths, imports, calls, passing tests, or implementation existence alone.
- Do not modify formal \`.opsx/architecture/\` or \`.opsx/specs/\` before digest-confirmed promotion.
- Preserve canonical IDs, paths, commands, schema keys, and LikeC4 tokens.`,
    license: 'MIT',
    compatibility: 'Requires opsx CLI with candidate commands.',
    metadata: { author: 'opsx', version: '1.0' },
  };
}
