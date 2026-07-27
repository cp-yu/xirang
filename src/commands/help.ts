import type { Command } from 'commander';
import { ActiveRelationDefinitionRegistry } from '../core/relations/active-registry.js';
import { resolveSchema } from '../core/artifact-graph/resolver.js';
import type { FileDefinition } from '../core/artifact-graph/types.js';

const AUTHORING_TOPICS = ['semantic-delta'] as const;

type AuthoringTopic = typeof AUTHORING_TOPICS[number];

interface HelpOptions {
  json?: boolean;
}

interface SemanticDeltaRelationship {
  operation: 'ADDED';
  source: string;
  kind: string;
  target: string;
}

interface AuthoringHelp {
  file: AuthoringTopic;
  definition: FileDefinition;
  relations: SemanticDeltaRelationship[];
}

const FILE_LOOKUP: Record<AuthoringTopic, { schema: 'spec-driven'; artifactId: string }> = {
  'semantic-delta': { schema: 'spec-driven', artifactId: 'specs' },
};

const SEMANTIC_DELTA_RELATIONSHIPS: SemanticDeltaRelationship[] = ActiveRelationDefinitionRegistry.map(
  ({ type, example }) => ({
    operation: 'ADDED',
    source: example.from,
    kind: type,
    target: example.to,
  })
);

export class AuthoringHelpCommand {
  async execute(file: string | undefined, options: HelpOptions): Promise<void> {
    if (!file) {
      if (options.json) console.log(JSON.stringify({ topics: AUTHORING_TOPICS }, null, 2));
      else console.log(`可用 authoring topics:\n${AUTHORING_TOPICS.map((topic) => `  ${topic}`).join('\n')}\n运行 xirang help authoring <file> 获取详细帮助。`);
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
  const definition = schema.artifacts.find((candidate) => candidate.id === lookup.artifactId)?.definition;
  if (!definition) throw new Error(`Missing file definition for '${file}' in built-in schema '${lookup.schema}'.`);

  return { file, definition, relations: SEMANTIC_DELTA_RELATIONSHIPS };
}

function renderSemanticDeltaRelationships(relations: SemanticDeltaRelationship[]): string {
  const entries = relations.flatMap(({ operation, source, kind, target }) => [
    `  - operation: ${operation}`,
    `    source: ${source}`,
    `    kind: ${kind}`,
    `    target: ${target}`,
  ]);
  return `# Semantic Delta Relationship Authoring

## 选择规则

1. 所有 relationship endpoint 都引用持久化 Element；无法解析 endpoint 时不创建 Relationship。
2. 主动触发执行使用 \`invokes\`；创建或发布目标 Element 使用 \`produces\`。
3. 只读取数据、配置、制品或合同使用 \`consumes\`。
4. 正确性要求先后顺序使用 \`precedes\`；规则限制目标行为使用 \`constrains\`；判定目标有效性使用 \`validates\`。
5. Relationship Delta 只支持 \`ADDED\` 与 \`REMOVED\`。

\`\`\`yaml
relationships:
${entries.join('\n')}
\`\`\``;
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
  lines.push('', renderSemanticDeltaRelationships(help.relations));
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
