import type { Command } from 'commander';
import ora from 'ora';
import {
  fixScenarioLabelsForChange,
  previewScenarioLabelsForChange,
  type ScenarioLabelReport,
} from '../core/scenario-labels.js';

interface FixScenarioLabelsOptions {
  write?: boolean;
  json?: boolean;
}

export async function fixScenarioLabelsCommand(
  changeName: string,
  options: FixScenarioLabelsOptions = {}
): Promise<void> {
  const projectRoot = process.cwd();
  const shouldWrite = options.write === true;
  const report = shouldWrite
    ? await fixScenarioLabelsForChange(projectRoot, changeName)
    : await previewScenarioLabelsForChange(projectRoot, changeName);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHuman(report, shouldWrite);
}

function printHuman(report: ScenarioLabelReport, wrote: boolean): void {
  const suggestions = report.files.flatMap(file => file.suggestions);
  if (suggestions.length === 0) {
    console.log('No scenario label suggestions found.');
    return;
  }

  console.log('Spec | Requirement | Scenario | Operation | Label | Reason');
  for (const suggestion of suggestions) {
    console.log([
      suggestion.specId,
      suggestion.requirementTitle,
      suggestion.scenarioTitle,
      suggestion.operation,
      suggestion.label ?? '',
      suggestion.reason,
    ].join(' | '));
  }

  if (!wrote) return;
  const changed = report.files.filter(file => file.changed);
  if (changed.length === 0) {
    console.log('No scenario label updates are needed.');
    return;
  }
  const count = changed.reduce((total, file) => total + file.suggestions.length, 0);
  console.log(`Updated ${changed.length} file(s), ${count} scenario suggestion(s).`);
}

export function registerFixScenarioLabelsCommand(program: Command): void {
  program
    .command('fix-scenario-labels <change-name>')
    .description('Preview or write deterministic change-local scenario operation labels')
    .option('--preview', 'Preview suggested labels without writing files')
    .option('--write', 'Write suggested labels to change-local specs')
    .option('--json', 'Output JSON')
    .action(async (changeName: string, options: FixScenarioLabelsOptions = {}) => {
      try {
        await fixScenarioLabelsCommand(changeName, options);
      } catch (error) {
        if (options.json) {
          console.log(JSON.stringify({ valid: false, error: (error as Error).message }, null, 2));
        } else {
          ora().fail(`Error: ${(error as Error).message}`);
        }
        process.exitCode = 1;
      }
    });
}
