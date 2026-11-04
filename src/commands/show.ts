import { promises as fs } from 'fs';
import path from 'path';
import { compileChange, compileChangeDelta } from '../core/change-compiler.js';
import { serializeSemanticModel } from '../core/model/serializer.js';
import { conciseDiffEntries } from '../core/change-diff-renderer.js';
import { XIRANG_DIR_NAME } from '../core/config.js';
import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds } from '../utils/item-discovery.js';
import { nearestMatches } from '../utils/match.js';

interface ShowOptions {
  json?: boolean;
  review?: boolean;
  noInteractive?: boolean;
}

export class ShowCommand {
  async execute(itemName?: string, options: ShowOptions = {}): Promise<void> {
    if (!itemName) {
      if (isInteractive(options)) {
        const { select } = await import('@inquirer/prompts');
        const changes = await getActiveChangeIds();
        if (changes.length === 0) {
          console.error('No changes found.');
          process.exitCode = 1;
          return;
        }
        itemName = await select<string>({
          message: 'Pick a change',
          choices: changes.map(id => ({ name: id, value: id })),
        });
      } else {
        this.printNonInteractiveHint();
        process.exitCode = 1;
        return;
      }
    }

    const changes = await getActiveChangeIds();
    if (!changes.includes(itemName)) {
      console.error(`Unknown item '${itemName}'`);
      const suggestions = nearestMatches(itemName, changes);
      if (suggestions.length) console.error(`Did you mean: ${suggestions.join(', ')}?`);
      process.exitCode = 1;
      return;
    }

    if (options.review && options.json) {
      const result = await compileChangeDelta(process.cwd(), itemName);
      const compiled = result.compiled;
      const common = { id: itemName, title: compiled.title, valid: compiled.valid, diagnostics: compiled.diagnostics };
      if (!compiled.valid || !compiled.target) {
        console.log(JSON.stringify(common, null, 2));
        return;
      }
      const before = serializeSemanticModel(result.base.model);
      const after = serializeSemanticModel(compiled.target);
      const sources = result.sources.map(source => ({
        path: source.path,
        entries: source.entities.map(({ entity, identity }) => {
          const host = identity.split('#')[0];
          const relationKind = entity === 'relationship' ? identity.split('\0')[1] : undefined;
          const modelPath = entity === 'relationship' ? `relationships/${relationKind}.yaml`
            : entity === 'element-kind' || entity === 'relationship-kind' ? `metamodel/${host}.md`
              : entity === 'authored-view' ? `views/${host}.md` : `elements/${host}.md`;
          return {
            entity,
            identity,
            operation: result.delta.entries.find(entry => entry.entity === entity && entry.identity === identity)?.operation,
            before: before.get(modelPath)?.toString('utf8') ?? '',
            after: after.get(modelPath)?.toString('utf8') ?? '',
          };
        }),
      }));
      const changeDir = path.join(process.cwd(), XIRANG_DIR_NAME, 'changes', itemName);
      const plans = [];
      for (const file of ['proposal.md', 'design.md', 'tasks.md']) {
        const content = await fs.readFile(path.join(changeDir, file), 'utf8').catch(() => undefined);
        if (content !== undefined) plans.push({ path: file, content });
      }
      console.log(JSON.stringify({ ...common, sources, plans }, null, 2));
      return;
    }

    if (!options.json) {
      const proposalPath = path.join(process.cwd(), XIRANG_DIR_NAME, 'changes', itemName, 'proposal.md');
      const content = await fs.readFile(proposalPath, 'utf-8');
      console.log(content);
      return;
    }

    const compiled = await compileChange(process.cwd(), itemName);
    console.log(JSON.stringify({
      id: itemName,
      title: compiled.title,
      valid: compiled.valid,
      summary: compiled.diff.summary,
      entries: conciseDiffEntries(compiled.diff),
      diagnostics: compiled.diagnostics,
    }, null, 2));
  }

  private printNonInteractiveHint(): void {
    console.error('Nothing to show. Try one of:');
    console.error('  xirang show <change>');
    console.error('Or run in an interactive terminal.');
  }
}
