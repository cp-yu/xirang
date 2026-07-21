import { OPSX_DIR_NAME } from './config.js';
import { promises as fs } from 'fs';
import path from 'path';
import {
  extractRequirementsSection,
  normalizeRequirementName,
  parseDeltaSpec,
  parseScenarioOperationLabel,
  type RequirementBlock,
  type ScenarioOperation,
} from './parsers/requirement-blocks.js';

export type ScenarioLabelOperation = ScenarioOperation | 'UNCHANGED';

export interface ScenarioLabelSuggestion {
  specId: string;
  requirementTitle: string;
  scenarioTitle: string;
  operation: ScenarioLabelOperation;
  label: `[${ScenarioOperation}]` | null;
  reason: string;
}

export interface ScenarioLabelFileReport {
  path: string;
  changed: boolean;
  suggestions: ScenarioLabelSuggestion[];
}

export interface ScenarioLabelReport {
  changeName: string;
  files: ScenarioLabelFileReport[];
}

interface ScenarioBlock {
  title: string;
  body: string;
  raw: string;
}

const SCENARIO_HEADER = /^####\s+Scenario:\s+(.+?)\s*$/;

export async function previewScenarioLabelsForChange(
  projectRoot: string,
  changeName: string
): Promise<ScenarioLabelReport> {
  return processScenarioLabels(projectRoot, changeName, false);
}

export async function applyScenarioLabelsForChange(
  projectRoot: string,
  changeName: string
): Promise<ScenarioLabelReport> {
  return processScenarioLabels(projectRoot, changeName, true);
}

async function processScenarioLabels(
  projectRoot: string,
  changeName: string,
  write: boolean
): Promise<ScenarioLabelReport> {
  const changeDir = path.join(projectRoot, OPSX_DIR_NAME, 'changes', changeName);
  await assertChangeDir(changeDir, changeName);

  const reports: ScenarioLabelFileReport[] = [];
  for (const specId of await listChangeSpecIds(changeDir)) {
    const changeSpecPath = path.join(changeDir, 'specs', specId, 'spec.md');
    const mainSpecPath = path.join(projectRoot, OPSX_DIR_NAME, 'specs', specId, 'spec.md');
    const changeContent = normalizeLineEndings(await fs.readFile(changeSpecPath, 'utf-8'));
    const mainContent = await readOptional(mainSpecPath);
    if (mainContent === null) continue;

    const result = applyScenarioLabelsInContent(changeContent, normalizeLineEndings(mainContent), specId);
    const relativePath = path.join(OPSX_DIR_NAME, 'changes', changeName, 'specs', specId, 'spec.md');
    reports.push({ path: relativePath, changed: result.content !== changeContent, suggestions: result.suggestions });
    if (write && result.content !== changeContent) await fs.writeFile(changeSpecPath, result.content, 'utf-8');
  }

  return { changeName, files: reports };
}

export function applyScenarioLabelsInContent(
  changeContent: string,
  mainContent: string,
  specId: string
): { content: string; suggestions: ScenarioLabelSuggestion[] } {
  let content = normalizeLineEndings(changeContent);
  const mainBlocks = new Map(
    extractRequirementsSection(mainContent).bodyBlocks.map(block => [normalizeRequirementName(block.name), block])
  );
  const suggestions: ScenarioLabelSuggestion[] = [];

  for (const changeBlock of parseDeltaSpec(content).modified) {
    const mainBlock = mainBlocks.get(normalizeRequirementName(changeBlock.name));
    if (!mainBlock) continue;

    const applied = applyScenarioLabelsToRequirement(changeBlock, mainBlock, specId);
    suggestions.push(...applied.suggestions);
    content = replaceOnce(content, changeBlock.raw, applied.raw);
  }

  return { content, suggestions };
}

function applyScenarioLabelsToRequirement(
  changeBlock: RequirementBlock,
  mainBlock: RequirementBlock,
  specId: string
): { raw: string; suggestions: ScenarioLabelSuggestion[] } {
  const changeParts = splitScenarioBlocks(changeBlock.raw);
  const mainScenarios = splitScenarioBlocks(mainBlock.raw).scenarios;
  const mainByTitle = new Map(mainScenarios.map(scenario => [scenario.title, scenario]));
  const seenTitles = new Set<string>();
  const suggestions: ScenarioLabelSuggestion[] = [];
  const rewrittenScenarios: string[] = [];

  for (const scenario of changeParts.scenarios) {
    seenTitles.add(scenario.title);
    const existingLabel = parseScenarioOperationLabel(scenario.raw.split('\n')[0] ?? '');
    const mainScenario = mainByTitle.get(scenario.title);
    const operation: ScenarioLabelOperation = existingLabel?.operation === 'REMOVED'
      ? 'REMOVED'
      : !mainScenario
        ? 'ADDED'
        : normalizeScenarioBody(mainScenario.body) === normalizeScenarioBody(scenario.body)
          ? 'UNCHANGED'
          : 'MODIFIED';
    const label = operation === 'UNCHANGED' ? null : (`[${operation}]` as `[${ScenarioOperation}]`);
    suggestions.push({
      specId,
      requirementTitle: changeBlock.name,
      scenarioTitle: scenario.title,
      operation,
      label,
      reason: reasonFor(operation),
    });
    rewrittenScenarios.push(formatScenarioBlock(scenario, label));
  }

  for (const mainScenario of mainScenarios) {
    if (seenTitles.has(mainScenario.title)) continue;
    suggestions.push({
      specId,
      requirementTitle: changeBlock.name,
      scenarioTitle: mainScenario.title,
      operation: 'REMOVED',
      label: '[REMOVED]',
      reason: reasonFor('REMOVED'),
    });
    rewrittenScenarios.push(formatScenarioBlock(mainScenario, '[REMOVED]'));
  }

  return {
    raw: [changeParts.beforeScenarios.trimEnd(), ...rewrittenScenarios]
      .filter(part => part.length > 0)
      .join('\n\n'),
    suggestions,
  };
}

function splitScenarioBlocks(raw: string): { beforeScenarios: string; scenarios: ScenarioBlock[] } {
  const lines = normalizeLineEndings(raw).split('\n');
  const firstScenario = lines.findIndex(line => SCENARIO_HEADER.test(line));
  if (firstScenario === -1) return { beforeScenarios: raw.trimEnd(), scenarios: [] };

  const scenarios: ScenarioBlock[] = [];
  let index = firstScenario;
  while (index < lines.length) {
    const header = lines[index];
    const headerMatch = header.match(SCENARIO_HEADER);
    if (!headerMatch) break;

    const blockLines = [header];
    index++;
    while (index < lines.length && !SCENARIO_HEADER.test(lines[index]) && !/^###\s+Requirement:/.test(lines[index]) && !/^##\s+/.test(lines[index])) {
      blockLines.push(lines[index]);
      index++;
    }

    const label = parseScenarioOperationLabel(header);
    scenarios.push({
      title: label?.title ?? headerMatch[1].trim(),
      body: blockLines.slice(1).join('\n').trimEnd(),
      raw: blockLines.join('\n').trimEnd(),
    });
  }

  return { beforeScenarios: lines.slice(0, firstScenario).join('\n'), scenarios };
}

function formatScenarioBlock(scenario: ScenarioBlock, label: `[${ScenarioOperation}]` | null): string {
  const heading = label
    ? `#### Scenario: ${label} ${scenario.title}`
    : `#### Scenario: ${scenario.title}`;
  return scenario.body ? `${heading}\n${scenario.body}` : heading;
}

function normalizeScenarioBody(body: string): string {
  return normalizeLineEndings(body)
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trimEnd();
}

function reasonFor(operation: ScenarioLabelOperation): string {
  switch (operation) {
    case 'ADDED': return 'scenario exists only in change-local spec';
    case 'MODIFIED': return 'scenario body differs from main spec';
    case 'REMOVED': return 'scenario exists only in main spec';
    case 'UNCHANGED': return 'scenario title and body match main spec';
  }
}

async function assertChangeDir(changeDir: string, changeName: string): Promise<void> {
  try {
    if (!(await fs.stat(changeDir)).isDirectory()) throw new Error();
  } catch {
    throw new Error(`Change '${changeName}' not found.`);
  }
}

async function listChangeSpecIds(changeDir: string): Promise<string[]> {
  const specsDir = path.join(changeDir, 'specs');
  try {
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    const ids: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        await fs.access(path.join(specsDir, entry.name, 'spec.md'));
        ids.push(entry.name);
      } catch {
        // ignore incomplete spec directories
      }
    }
    return ids.sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function readOptional(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

function replaceOnce(content: string, from: string, to: string): string {
  const index = content.indexOf(from);
  if (index === -1) return content;
  return content.slice(0, index) + to + content.slice(index + from.length);
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, '\n');
}
