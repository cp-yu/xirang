import { promises as fs } from 'node:fs';
import type { Command } from 'commander';
import { resolveSchema } from '../core/artifact-graph/resolver.js';
import type { FileDefinition } from '../core/artifact-graph/types.js';
import { compareUtf8Bytes } from '../core/candidate/canonical.js';
import { modelRoot } from '../core/model/paths.js';
import { parseSemanticModel } from '../core/model/parser.js';
import type { ModelDiagnostic, RelationshipKind } from '../core/model/types.js';
import { validateSemanticModel } from '../core/model/validator.js';

const AUTHORING_TOPICS = ['semantic-delta'] as const;
const RELATIONSHIP_DELTA = {
  operations: ['ADDED', 'REMOVED'],
  identityFields: ['source', 'kind', 'target'],
} as const;

type AuthoringTopic = typeof AUTHORING_TOPICS[number];

interface HelpOptions {
  json?: boolean;
}

interface AuthoringHelp {
  file: AuthoringTopic;
  definition: FileDefinition;
  relationshipDelta: typeof RELATIONSHIP_DELTA;
  relationshipKinds: RelationshipKind[];
}

const FILE_LOOKUP: Record<AuthoringTopic, { schema: 'spec-driven'; artifactId: string }> = {
  'semantic-delta': { schema: 'spec-driven', artifactId: 'specs' },
};

export class AuthoringHelpCommand {
  constructor(private readonly projectRoot: string = process.cwd()) {}

  async execute(file: string | undefined, options: HelpOptions): Promise<void> {
    if (!file) {
      if (options.json) console.log(JSON.stringify({ topics: AUTHORING_TOPICS }, null, 2));
      else console.log(`可用 authoring topics:\n${AUTHORING_TOPICS.map((topic) => `  ${topic}`).join('\n')}\n运行 xirang help authoring <file> 获取详细帮助。`);
      return;
    }

    const topic = AUTHORING_TOPICS.find((candidate) => candidate === file);
    if (!topic) throw new Error(`未知 authoring topic '${file}'。合法 topics: ${AUTHORING_TOPICS.join(', ')}`);

    const help = await this.buildHelp(topic);
    if (options.json) console.log(JSON.stringify(help, null, 2));
    else console.log(renderTextHelp(help));
  }

  private async buildHelp(file: AuthoringTopic): Promise<AuthoringHelp> {
    const lookup = FILE_LOOKUP[file];
    const schema = resolveSchema(lookup.schema);
    const definition = schema.artifacts.find((candidate) => candidate.id === lookup.artifactId)?.definition;
    if (!definition) throw new Error(`Missing file definition for '${file}' in built-in schema '${lookup.schema}'.`);

    const semanticModelRoot = modelRoot(this.projectRoot);
    await fs.access(semanticModelRoot).catch(() => {
      throw new Error(`Semantic Model unavailable: ${semanticModelRoot}`);
    });
    const parsed = await parseSemanticModel(semanticModelRoot);
    if (parsed.model.elementKinds.length === 0 && parsed.model.elements.length === 0) {
      throw new Error(`Semantic Model unavailable: ${semanticModelRoot}`);
    }
    const errors = [
      ...parsed.diagnostics,
      ...validateSemanticModel(parsed.model),
    ].filter(({ level }) => level === 'ERROR');
    if (errors.length > 0) throw new Error(errors.map(formatDiagnostic).join('\n'));
    const relationshipKinds = [...parsed.model.relationshipKinds]
      .sort((left, right) => compareUtf8Bytes(left.identity, right.identity));
    return { file, definition, relationshipDelta: RELATIONSHIP_DELTA, relationshipKinds };
  }
}

function formatDiagnostic({ code, path, message }: ModelDiagnostic): string {
  return `${code}${path === '' ? '' : ` ${path}`}: ${message}`;
}

function endpointKinds(kinds: string[] | undefined): string {
  if (kinds === undefined) return '`*`';
  if (kinds.length === 0) return '`∅`';
  return kinds.map(kind => `\`${kind}\``).join(', ');
}

function renderRelationshipKinds(kinds: RelationshipKind[]): string {
  if (kinds.length === 0) return 'No Relationship Kinds are declared by the current Metamodel.';
  const rows = kinds.map(kind =>
    `| \`${kind.identity}\` | ${endpointKinds(kind.sourceKinds)} | ${endpointKinds(kind.targetKinds)} |`);
  const bodies = kinds
    .filter(kind => kind.body !== '')
    .map(kind => `### \`${kind.identity}\`\n\n${kind.body}`);
  return [
    '`*` means unrestricted; `∅` means no Element Kind is allowed.',
    '',
    '| Kind | Source | Target |',
    '|---|---|---|',
    ...rows,
    ...(bodies.length > 0 ? ['', bodies.join('\n\n')] : []),
  ].join('\n');
}

function renderSemanticDeltaRelationships(kinds: RelationshipKind[]): string {
  return `# Semantic Delta Relationship Authoring

## Add a Relationship

Use a Relationship Kind declared by the Expected Semantic Model:

\`\`\`yaml
relationships:
  - operation: ADDED
    source: <source-element-identity>
    kind: <relationship-kind-identity>
    target: <target-element-identity>
\`\`\`

- \`source\` and \`target\` reference persistent Element identities.
- Relationship identity is the directed \`(source, kind, target)\` tuple.
- Relationship Delta supports only \`ADDED\` and \`REMOVED\`.
- Changing any identity field requires \`REMOVED\` old tuple and \`ADDED\` new tuple.
- Container paths and filenames carry no semantics.

## Add a Relationship Kind

Only when no declared Kind accurately expresses the intended semantics, add one under \`.xirang/changes/<change>/metamodel/\`:

\`\`\`markdown
---
operation: ADDED
entity: relationship-kind
identity: <relationship-kind-identity>
sourceKinds:
  - <source-element-kind>
targetKinds:
  - <target-element-kind>
---

<shared semantics of this Relationship Kind>
\`\`\`

\`sourceKinds\` and \`targetKinds\` are optional; omission means unrestricted. A Relationship in the same Semantic Delta MAY reference the newly added Kind.

## Relationship Kinds in the current Metamodel

${renderRelationshipKinds(kinds)}`;
}

function renderTextHelp(help: AuthoringHelp): string {
  const { definition } = help;
  const lines = [
    `# ${help.file}`,
    '',
    definition.purpose,
    '',
    '## Compilation role',
    '',
    definition.compilationRole,
    '',
    '## Includes',
    '',
    ...definition.content.includes.map((item) => `- ${item}`),
    '',
    '## Excludes',
    '',
    ...definition.content.excludes.map((item) => `- ${item}`),
    '',
    '## Write policy',
    '',
    definition.writePolicy,
  ];
  lines.push('', renderSemanticDeltaRelationships(help.relationshipKinds));
  lines.push('', '## Validation commands', '', ...definition.validation.map((command) => `- ${command}`));
  return lines.join('\n');
}

export function registerHelpCommand(program: Command): Command {
  program.addHelpText('after', '\nAuthoring help: xirang help authoring [file]');
  const help = program
    .command('help [topics...]')
    .description('Display command or authoring help')
    .option('--json', 'Output authoring help as JSON')
    .action(async (topics: string[], options: HelpOptions) => {
      if (topics[0] === 'authoring') {
        await new AuthoringHelpCommand().execute(topics[1], options);
        return;
      }
      const command = findCommand(program, topics);
      if (!command) throw new Error(`Unknown command path: ${topics.join(' ')}`);
      console.log(command.helpInformation());
    });
  return help;
}

function findCommand(program: Command, names: string[]): Command | undefined {
  let current: Command = program;
  for (const name of names) {
    const next = current.commands.find((command) => command.name() === name);
    if (!next) return undefined;
    current = next;
  }
  return current;
}
