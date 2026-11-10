import { XIRANG_DIR_NAME } from '../../core/config.js';
/**
 * New Change Command
 *
 * Creates a new change directory with optional description and schema.
 */

import path from 'path';
import { createChange, validateChangeName } from '../../utils/change-utils.js';
import { validateSchemaExists } from './shared.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface NewChangeOptions {
  description?: string;
  schema?: string;
}

// -----------------------------------------------------------------------------
// Command Implementation
// -----------------------------------------------------------------------------

export async function newChangeCommand(name: string | undefined, options: NewChangeOptions): Promise<void> {
  if (!name) {
    throw new Error('Missing required argument <name>');
  }

  const validation = validateChangeName(name);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const projectRoot = process.cwd();

  // Validate schema if provided
  if (options.schema) {
    validateSchemaExists(options.schema, projectRoot);
  }

  await createChange(projectRoot, name, { schema: options.schema });
  if (options.description) {
    const { promises: fs } = await import('fs');
    await fs.writeFile(path.join(projectRoot, XIRANG_DIR_NAME, 'changes', name, 'README.md'), `# ${name}\n\n${options.description}\n`, 'utf-8');
  }
}
