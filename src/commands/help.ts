import type { Command } from 'commander';
import { RelationDefinitionRegistry } from '../core/relations/registry.js';
import { renderRelationAuthoringReference } from '../core/relations/renderers.js';
import { resolveSchema } from '../core/artifact-graph/resolver.js';
import type { FileDefinition } from '../core/artifact-graph/types.js';

const AUTHORING_TOPICS = [
  'project.opsx.yaml',
  'project.opsx.relations.yaml',
  'architecture-delta.c4',
] as const;

type AuthoringTopic = typeof AUTHORING_TOPICS[number];

interface HelpOptions {
  json?: boolean;
}

interface AuthoringHelp {
  file: AuthoringTopic;
  definition: FileDefinition;
  relations?: typeof RelationDefinitionRegistry;
}

const FILE_LOOKUP: Record<AuthoringTopic, { schema: 'spec-driven' | 'bootstrap'; fileId?: string; artifactId?: string }> = {
  'project.opsx.yaml': { schema: 'bootstrap', fileId: 'formal-project' },
  'project.opsx.relations.yaml': { schema: 'bootstrap', fileId: 'formal-relations' },
  'architecture-delta.c4': { schema: 'spec-driven', artifactId: 'architecture-delta' },
};

export class AuthoringHelpCommand {
  async execute(file: string | undefined, options: HelpOptions): Promise<void> {
    if (!file) {
      if (options.json) console.log(JSON.stringify({ topics: AUTHORING_TOPICS }, null, 2));
      else console.log(`可用 authoring topics:\n${AUTHORING_TOPICS.map((topic) => `  ${topic}`).join('\n')}\n运行 openspec help authoring <file> 获取详细帮助。`);
      return;
    }

    const topic = AUTHORING_TOPICS.find((candidate) => candidate === file);
    if (!topic) throw new Error(`未知 authoring topic '${file}'。合法 topics: ${AUTHORING_TOPICS.join(', ')}`);

    const help = buildHelp(topic);
    if (options.json) console.log(JSON.stringify(help, null, 2));
    else console.log(renderTextHelp(help));
  }
}

function buildHelp(file: AuthoringTopic): AuthoringHelp {
  const lookup = FILE_LOOKUP[file];
  const schema = resolveSchema(lookup.schema);
  const definition = lookup.fileId
    ? schema.files?.find((candidate) => candidate.id === lookup.fileId)?.definition
    : schema.artifacts.find((candidate) => candidate.id === lookup.artifactId)?.definition;
  if (!definition) throw new Error(`Missing file definition for '${file}' in built-in schema '${lookup.schema}'.`);

  return {
    file,
    definition,
    ...(file === 'project.opsx.yaml' ? {} : { relations: RelationDefinitionRegistry }),
  };
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
  if (help.relations) lines.push('', renderRelationAuthoringReference());
  lines.push('', '## Validation commands', '', ...definition.validation.map((command) => `- ${command}`));
  return lines.join('\n');
}

export function registerHelpCommand(program: Command): Command {
  program.addHelpText('after', '\nAuthoring help: openspec help authoring [file]');
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
