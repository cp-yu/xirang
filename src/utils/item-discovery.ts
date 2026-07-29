import { promises as fs } from 'fs';
import path from 'path';
import { XIRANG_DIR_NAME } from '../core/config.js';
import { modelRoot } from '../core/model/paths.js';
import { parseSemanticModel } from '../core/model/parser.js';

export async function getActiveChangeIds(root: string = process.cwd()): Promise<string[]> {
  const changesPath = path.join(root, XIRANG_DIR_NAME, 'changes');
  try {
    const entries = await fs.readdir(changesPath, { withFileTypes: true });
    const result: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'archive') continue;
      const proposalPath = path.join(changesPath, entry.name, 'proposal.md');
      try {
        await fs.access(proposalPath);
        result.push(entry.name);
      } catch {
        // skip directories without proposal.md
      }
    }
    return result.sort();
  } catch {
    return [];
  }
}

/** A Contract is not an independent object: its identity is the Element that carries it. */
export async function getContractElementIds(root: string = process.cwd()): Promise<string[]> {
  const { model } = await parseSemanticModel(modelRoot(root));
  return model.elements
    .filter(element => element.requirements.length > 0)
    .map(element => element.declaration.identity)
    .sort();
}

export async function getArchivedChangeIds(root: string = process.cwd()): Promise<string[]> {
  const archivePath = path.join(root, XIRANG_DIR_NAME, 'changes', 'archive');
  try {
    const entries = await fs.readdir(archivePath, { withFileTypes: true });
    const result: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const proposalPath = path.join(archivePath, entry.name, 'proposal.md');
      try {
        await fs.access(proposalPath);
        result.push(entry.name);
      } catch {
        // skip directories without proposal.md
      }
    }
    return result.sort();
  } catch {
    return [];
  }
}

