import type { SkillTemplate } from '../types.js';
import { XIRANG_PHILOSOPHY } from '../fragments/xirang-fragments.js';

export function getBuildSkillTemplate(): SkillTemplate {
  return {
    name: 'xirang-build',
    description: 'Build or rebuild the project Xirang Semantic Model as one reviewed Candidate.',
    instructions: `Build the project Xirang Semantic Model from user-authorized intent and evidence.

${XIRANG_PHILOSOPHY}

## Workflow

1. Confirm that the project has been prepared with \`xirang setup\` and inspect whether an active \`.xirang/candidate/\` exists.
2. Ask the user to choose the exploration scope: whole project, code and tests, documentation and current Xirang, or custom paths and rules.
3. Record the user's current requirements and any explicit source of truth in \`.xirang/candidate/build.md\`. Current user requirements have highest priority. If conflicting evidence would change target behavior or architecture and the user has not resolved it, ask the user instead of guessing.
4. When formal Xirang exists, summarize it and ask the user to choose one starting point before running \`xirang candidate init\`:
   - \`xirang candidate init --from current\`
   - \`xirang candidate init --from clean\`
   - \`xirang candidate init --from-path <path>\`
5. Explore the authorized scope in any useful order. Code, tests, documents, configuration, Git history, and current Xirang are evidence only unless the user explicitly designates them as source of truth. You MAY use subagents as optional task-specific accelerators; the workflow must still complete without them.
6. Author one Candidate by writing \`.xirang/candidate/{metamodel,elements,relationships,views}/\`. An Element Contract is the body of its Element unit, so one Element has at most one Contract; whether a Contract is required comes from the \`contract\` field of its Element Kind.
7. Run \`xirang candidate validate\`. Fix the reported Candidate source directly and repeat until validation succeeds. The CLI is read-only and must not author or normalize semantics.
8. Present the Project Root, Metamodel, hierarchy, Element Contracts, Relationships, Authored Views, important confirmed decisions, formal diff, and returned \`reviewDigest\` directly to the user.
9. Only after the user confirms that exact version, run \`xirang candidate promote --digest <reviewDigest>\`. Promotion replaces \`.xirang/model/\` with the Candidate as a whole; a unit absent from the Candidate is not retained.

## Guardrails

- The Candidate is one complete Semantic Model, authored and reviewed as a whole.
- \`build.md\` is temporary compilation scaffolding, not durable semantic source.
- Do not impose a fixed scan order, directory list, evidence schema, element granularity, Contract granularity, subagent role, or reviewer role.
- Do not infer hierarchy, behavior, or relationships from paths, imports, calls, passing tests, or implementation existence alone.
- Do not modify formal \`.xirang/model/\` before digest-confirmed promotion.
- Preserve canonical identities, paths, commands, and schema keys.`,
    license: 'MIT',
    compatibility: 'Requires xirang CLI with candidate commands.',
    metadata: { author: 'xirang', version: '1.0' },
  };
}
