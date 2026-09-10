import type { CommandDefinition } from './types.js';

/**
 * Centralized mapping of command paths to their positional argument types.
 *
 * This map supplements Commander.js introspection with completion semantics
 * that cannot be derived from the command tree structure alone.
 *
 * Format: dot-notation path (e.g., 'validate', 'quality.review')
 */
export const POSITIONAL_TYPE_MAP: Record<string, NonNullable<CommandDefinition['positionalType']>> = {
  // Top-level commands
  'setup': 'path',
  'update': 'path',
  'validate': 'change-or-contract-id',
  'show': 'change-id',
  'archive': 'change-id',
  'sync': 'change-id',
  'instructions': 'change-or-contract-id',
  'help': 'text',
  'feedback': 'text',

  // completion subcommands
  'completion.generate': 'shell',
  'completion.install': 'shell',
  'completion.uninstall': 'shell',

  // schema subcommands
  'schema.which': 'schema-name',
  'schema.validate': 'schema-name',
  'schema.fork': 'schema-name',

  // new subcommands
  'new.change': 'change-or-contract-id',

  // framing subcommands
  'framing.show': 'text',
  'framing.status': 'text',
  'framing.validate': 'text',
  'framing.update': 'text',
  'framing.rename': 'text',
  'framing.consume': 'text',
  'framing.discard': 'text',

  // config subcommands
  'config.get': 'text',
  'config.set': 'text',
  'config.unset': 'text',

  // arch subcommands
  'arch.query': 'element-id',
  'arch.search': 'text',
  'arch.impact': 'element-id',
  'arch.plan-remove': 'element-id',

  // quality subcommands
  'quality.review': 'change-id',
  'quality.optimize': 'change-id',
  'quality.seal': 'change-id',
  'quality.status': 'change-id',
} as const;
