import { z } from 'zod';
import { commandSchemas, qualityOptionMetadata } from './command-schema.js';

export const QUALITY_SUBCOMMANDS = ['review', 'opt', 'seal', 'status'] as const;
export const QUALITY_EXIT_CODES = [
  { code: 0, meaning: 'the opinion was recorded or status was read successfully' },
  { code: 1, meaning: 'a workflow prerequisite or referenced Git commit is missing' },
  { code: 2, meaning: 'the payload, revision, path or stored format was rejected' },
];

type SchemaName = keyof typeof commandSchemas;
type OptionName = keyof typeof qualityOptionMetadata;

function option(name: OptionName): string { return qualityOptionMetadata[name].flags; }

export function renderQualityPayloadSchema(name: SchemaName): string {
  const schema = z.toJSONSchema(commandSchemas[name], { io: 'input' });
  return `**${name}**\n\n\`\`\`json\n${JSON.stringify(schema)}\n\`\`\``;
}

export function renderQualityOverview(command = 'xirang quality'): string {
  return [
    'Quality stores commit-bound Review opinions by reviewKind, an explicit Opt disposition and a main-agent Seal in one .quality.json record (schemaVersion 4).',
    'The CLI validates structure, revision and Git commit existence. It does not run tests, compare HEAD/workspace freshness, edit tasks.md or choose whether Opt is needed.',
    `Subcommands: ${QUALITY_SUBCOMMANDS.map(name => `${command} ${name}`).join(', ')}`,
    ...Object.values(qualityOptionMetadata).map(item => `${item.flags}: ${item.label}`),
    ...QUALITY_EXIT_CODES.map(item => `Exit ${item.code}: ${item.meaning}`),
  ].join('\n');
}

export function renderQualityErrorRecovery(): string {
  return 'Read the reported revision and diagnostic. Reconcile concurrent changes before retrying. A .quality.json with schemaVersion 3 or older is unsupported: preserve its bytes and ask the user how to proceed. Preserve other unsupported legacy files unchanged; the new protocol never imports their contents.';
}

export function renderReviewHelp(): string {
  return [
    `xirang quality review <change-name> ${option('version')} ${option('input')}|${option('from')}`,
    'Record one Reviewer opinion by reviewKind, bound to an existing Git commit. Review findings and any task corrections remain with the main Agent. Revisions are compare-and-swap tokens.',
    renderQualityPayloadSchema('review'),
  ].join('\n\n');
}

export function renderOptHelp(): string {
  return [
    `xirang quality opt <change-name> ${option('version')} ${option('input')}|${option('from')}`,
    'Record delivered Opt opinions bound to baseCommit/resultCommit, or an explicit not_performed reason. The CLI does not select the disposition or run tests.',
    renderQualityPayloadSchema('opt'),
  ].join('\n\n');
}

export function renderSealHelp(): string {
  return [
    `xirang quality seal <change-name> ${option('version')} ${option('input')}|${option('from')}`,
    'The main Agent declares canRun, testsExpectedToPass, testScope and assessment for an existing commit. Seal does not compare that commit to HEAD or the workspace.',
    renderQualityPayloadSchema('seal'),
  ].join('\n\n');
}

export function renderQualityCliReference(): string {
  return ['# Quality CLI', renderQualityOverview(), renderReviewHelp(), renderOptHelp(), renderSealHelp()].join('\n\n');
}
