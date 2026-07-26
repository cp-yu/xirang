import { isInteractive } from '../utils/interactive.js';
import { getActiveChangeIds } from '../utils/item-discovery.js';
import { ChangeCommand } from './change.js';
import { nearestMatches } from '../utils/match.js';

export class ShowCommand {
  async execute(itemName?: string, options: { json?: boolean; noInteractive?: boolean; [k: string]: any } = {}): Promise<void> {
    if (!itemName) {
      if (isInteractive(options)) {
        const { select } = await import('@inquirer/prompts');
        const changes = await getActiveChangeIds();
        if (changes.length === 0) {
          console.error('No changes found.');
          process.exitCode = 1;
          return;
        }
        const picked = await select<string>({ message: 'Pick a change', choices: changes.map(id => ({ name: id, value: id })) });
        await new ChangeCommand().show(picked, options as any);
        return;
      }
      this.printNonInteractiveHint();
      process.exitCode = 1;
      return;
    }

    const changes = await getActiveChangeIds();
    if (!changes.includes(itemName)) {
      console.error(`Unknown item '${itemName}'`);
      const suggestions = nearestMatches(itemName, changes);
      if (suggestions.length) console.error(`Did you mean: ${suggestions.join(', ')}?`);
      process.exitCode = 1;
      return;
    }

    await new ChangeCommand().show(itemName, options as any);
  }

  private printNonInteractiveHint(): void {
    console.error('Nothing to show. Try one of:');
    console.error('  xirang show <change>');
    console.error('  xirang change show');
    console.error('Or run in an interactive terminal.');
  }
}
