import type { Command } from 'commander';
import { RelationDefinitionRegistry } from '../core/relations/registry.js';
import { renderRelationAuthoringReference } from '../core/relations/renderers.js';

const AUTHORING_TOPICS = [
  'project.opsx.yaml',
  'project.opsx.relations.yaml',
  'opsx-delta.yaml',
] as const;

type AuthoringTopic = typeof AUTHORING_TOPICS[number];

interface HelpOptions {
  json?: boolean;
}

interface AuthoringHelp {
  file: AuthoringTopic;
  purpose: string;
  structure: Record<string, unknown>;
  validationCommands: string[];
  relations?: typeof RelationDefinitionRegistry;
}

export class AuthoringHelpCommand {
  async execute(file: string | undefined, options: HelpOptions): Promise<void> {
    if (!file) {
      if (options.json) {
        console.log(JSON.stringify({ topics: AUTHORING_TOPICS }, null, 2));
      } else {
        console.log(`可用 authoring topics:\n${AUTHORING_TOPICS.map((topic) => `  ${topic}`).join('\n')}\n运行 openspec help authoring <file> 获取详细帮助。`);
      }
      return;
    }

    const topic = resolveTopic(file);
    if (!topic) {
      throw new Error(`未知 authoring topic '${file}'。合法 topics: ${AUTHORING_TOPICS.join(', ')}`);
    }

    const help = buildHelp(topic);
    if (options.json) {
      console.log(JSON.stringify(help, null, 2));
      return;
    }

    console.log(renderTextHelp(help));
  }
}

function resolveTopic(input: string): AuthoringTopic | undefined {
  const canonical = input.replaceAll('\\', '/').split('/').at(-1);
  return AUTHORING_TOPICS.find((topic) => topic === canonical);
}

function buildHelp(file: AuthoringTopic): AuthoringHelp {
  if (file === 'project.opsx.yaml') {
    return {
      file,
      purpose: '定义 OPSX v2 project metadata、domains 与 capabilities。',
      structure: {
        schema_version: 2,
        project: { id: 'proj.example', name: 'Example', intent: '...', scope: '...' },
        domains: [],
        capabilities: [],
      },
      validationCommands: ['openspec validate --all', 'openspec opsx query <node-id> --json'],
    };
  }

  return {
    file,
    purpose: file === 'project.opsx.relations.yaml'
      ? '定义 OPSX v2 canonical semantic relations。'
      : '声明 change 对 OPSX v2 nodes 与 relations 的 ADDED、MODIFIED、REMOVED 操作。',
    structure: file === 'project.opsx.relations.yaml'
      ? { schema_version: 2, relations: [] }
      : { schema_version: 2, ADDED: {}, MODIFIED: {}, REMOVED: {} },
    validationCommands: file === 'project.opsx.relations.yaml'
      ? ['openspec validate --all', 'openspec opsx query <node-id...> --json']
      : ['openspec validate --change <name> --artifacts opsx-delta --json', 'openspec validate --change <name> --json'],
    relations: RelationDefinitionRegistry,
  };
}

function renderTextHelp(help: AuthoringHelp): string {
  const lines = [
    `# ${help.file}`,
    '',
    help.purpose,
    '',
    '## Structure',
    '',
    JSON.stringify(help.structure, null, 2),
  ];
  if (help.relations) {
    lines.push('', renderRelationAuthoringReference());
  }
  lines.push('', '## Validation commands', '', ...help.validationCommands.map((command) => `- ${command}`));
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
