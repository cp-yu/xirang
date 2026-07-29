import * as fs from 'node:fs';
import * as path from 'node:path';

export interface TaskStructureIssue {
  code:
    | 'missing-actions-section'
    | 'missing-checks-section'
    | 'missing-task-heading'
    | 'malformed-task-heading'
    | 'missing-task-goal'
    | 'missing-task-files'
    | 'missing-task-requirements'
    | 'missing-task-checks'
    | 'too-many-task-requirements'
    | 'malformed-action-id'
    | 'malformed-check-id'
    | 'missing-covers'
    | 'dangling-covers'
    | 'uncovered-action'
    | 'missing-verifies'
    | 'invalid-verifies-path'
    | 'missing-verifies-element'
    | 'missing-verifies-requirement'
    | 'missing-verifies-scenario'
    | 'verifies-cross-check-skipped'
    | 'missing-evidence-field';
  message: string;
  line?: number;
  severity: 'error' | 'warning';
}

export interface TaskStructureValidation {
  valid: boolean;
  issues: TaskStructureIssue[];
  actions: string[];
  checks: string[];
  format: 'actions-checks' | 'coarse-tasks';
}

export interface TaskStructureValidationOptions {
  changeDir?: string;
}

interface TaskItem {
  id: string;
  line: number;
  fields: Set<string>;
  covers: string[];
  verifies?: string;
  preserves?: string;
}

interface ContractRequirement {
  name: string;
  scenarios: Set<string>;
  isRemoved?: boolean;
}

interface CoarseTask {
  id: string;
  title: string;
  line: number;
  range: { start: number; end: number };
}

const CHECKBOX_RE = /^\s*-\s+\[[ xX]\]\s+(\S+)/;
const ACTION_ID_RE = /^A\d+$/;
const CHECK_ID_RE = /^C\d+$/;
const FIELD_RE = /^\s*-\s+(Covers|Verifies|Preserves|Command|Evidence|Expect):\s*(.*)$/;
const TASK_FIELD_RE = /^\*\*(Goal|Files|Requirements)\*\*:\s*(.*)$/;
const TASK_CHECKS_HEADING_RE = /^####\s+Checks\s*$/;
const ELEMENT_PATH_RE = /`([^`]+)`/;
const REQUIREMENT_RE = /\bRequirement\s+"([^"]+)"/;
const REMOVED_REQUIREMENT_RE = /\bREMOVED\s+Requirement\s+"([^"]+)"/;
const SCENARIOS_RE = /\bScenarios?\s+(.+)$/;
const SCENARIO_NAME_RE = /"([^"]+)"/g;
/** An Element Contract is the body of its Element unit; the unit name is `<identity>.md`. */
const ELEMENTS_PARTITION = 'elements';
const UNIT_FILE_RE = /^[A-Za-z0-9._-]+\.md$/;

export function validateTaskStructure(
  content: string,
  options: TaskStructureValidationOptions = {}
): TaskStructureValidation {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const mask = buildCodeFenceMask(lines);
  const coarseTasks = parseCoarseTasks(lines, mask);
  if (coarseTasks.length > 0) {
    return validateCoarseTasks(lines, mask, coarseTasks, options);
  }

  const sections = findTaskSections(lines, mask);
  const issues: TaskStructureIssue[] = [];
  const elementUnits = options.changeDir ? listChangeElementUnits(options.changeDir) : new Set<string>();

  if (!sections.actions) {
    issues.push(error('missing-actions-section', 'Missing Actions section.'));
  }
  if (!sections.checks) {
    issues.push(error('missing-checks-section', 'Missing Checks section.'));
  }

  const actions = sections.actions ? parseItems(lines, mask, sections.actions) : [];
  const checks = sections.checks ? parseItems(lines, mask, sections.checks) : [];
  const actionIds = new Set(actions.map((item) => item.id));
  const coveredActions = new Set<string>();

  for (const item of actions) {
    if (!isActionId(item.id)) {
      issues.push(error('malformed-action-id', `Action checkbox must use an A-prefixed ID: ${item.id}.`, item.line));
    }
  }

  for (const item of checks) {
    if (!isCheckId(item.id)) {
      issues.push(error('malformed-check-id', `Check checkbox must use a C-prefixed ID: ${item.id}.`, item.line));
    }

    if (item.covers.length === 0) {
      issues.push(error('missing-covers', `Check ${item.id} is missing Covers.`, item.line));
    }

    for (const id of item.covers) {
      if (!actionIds.has(id)) {
        issues.push(error('dangling-covers', `Check ${item.id} covers unknown action ${id}.`, item.line));
      } else {
        coveredActions.add(id);
      }
    }

    validateVerifies(item, elementUnits, options.changeDir, issues);

    if (!hasEvidenceField(item)) {
      issues.push(error('missing-evidence-field', `Check ${item.id} must include Command, Evidence, or Expect.`, item.line));
    }
  }

  for (const item of actions) {
    if (isActionId(item.id) && !coveredActions.has(item.id)) {
      issues.push(error('uncovered-action', `Action ${item.id} is not covered by any check.`, item.line));
    }
  }

  return {
    valid: issues.every((issue) => issue.severity !== 'error'),
    issues,
    actions: actions.map((item) => item.id),
    checks: checks.map((item) => item.id),
    format: 'actions-checks',
  };
}

function validateCoarseTasks(
  lines: string[],
  mask: boolean[],
  tasks: CoarseTask[],
  options: TaskStructureValidationOptions
): TaskStructureValidation {
  const issues: TaskStructureIssue[] = [];
  const elementUnits = options.changeDir ? listChangeElementUnits(options.changeDir) : new Set<string>();
  const checks: TaskItem[] = [];

  for (const task of tasks) {
    if (!task.title) {
      issues.push(error('malformed-task-heading', `Task ${task.id} heading must include a title.`, task.line));
    }

    const fields = parseTaskFields(lines, mask, task.range);
    if (!fields.has('Goal')) {
      issues.push(error('missing-task-goal', `Task ${task.id} is missing Goal.`, task.line));
    }
    if (!fields.has('Files')) {
      issues.push(error('missing-task-files', `Task ${task.id} is missing Files.`, task.line));
    }
    if (!fields.has('Requirements')) {
      issues.push(error('missing-task-requirements', `Task ${task.id} is missing Requirements.`, task.line));
    }
    if (!fields.has('Checks')) {
      issues.push(error('missing-task-checks', `Task ${task.id} is missing Checks.`, task.line));
    }

    const requirementCount = countListItemsInField(lines, mask, fields.get('Requirements'), task.range.end);
    if (requirementCount > 5) {
      issues.push(error('too-many-task-requirements', `Task ${task.id} must not have more than 5 Requirements.`, task.line));
    }

    const taskChecks = fields.has('Checks')
      ? parseItems(lines, mask, fields.get('Checks')!)
      : [];
    for (const item of taskChecks) {
      validateVerifies(item, elementUnits, options.changeDir, issues);
      if (!hasEvidenceField(item)) {
        issues.push(error('missing-evidence-field', `Check ${item.id} must include Command, Evidence, or Expect.`, item.line));
      }
    }
    checks.push(...taskChecks);
  }

  return {
    valid: issues.every((issue) => issue.severity !== 'error'),
    issues,
    actions: tasks.map((task) => `Task ${task.id}`),
    checks: checks.map((item) => item.id),
    format: 'coarse-tasks',
  };
}

function error(code: TaskStructureIssue['code'], message: string, line?: number): TaskStructureIssue {
  return { severity: 'error', code, message, line };
}

function warning(code: TaskStructureIssue['code'], message: string, line?: number): TaskStructureIssue {
  return { severity: 'warning', code, message, line };
}

function isActionId(id: string): boolean {
  return ACTION_ID_RE.test(id);
}

function isCheckId(id: string): boolean {
  return CHECK_ID_RE.test(id);
}

function hasEvidenceField(item: TaskItem): boolean {
  return item.fields.has('Command') || item.fields.has('Evidence') || item.fields.has('Expect');
}

function validateVerifies(
  item: TaskItem,
  elementUnits: Set<string>,
  changeDir: string | undefined,
  issues: TaskStructureIssue[]
): void {
  const hasVerifies = item.verifies?.trim();
  const hasPreserves = item.preserves?.trim();

  if (!hasVerifies && !hasPreserves) {
    issues.push(error('missing-verifies', `Check ${item.id} is missing Verifies or Preserves.`, item.line));
  }

  if (hasVerifies) {
    validateVerifiesField(item, elementUnits, changeDir, issues);
  }

  if (hasPreserves) {
    validatePreservesField(item, changeDir, issues);
  }
}

function validateVerifiesField(
  item: TaskItem,
  elementUnits: Set<string>,
  changeDir: string | undefined,
  issues: TaskStructureIssue[]
): void {
  const value = item.verifies!.trim();

  if (!changeDir || elementUnits.size === 0) {
    issues.push(
      warning(
        'verifies-cross-check-skipped',
        `Check ${item.id} Verifies could not be cross-checked because this change has no local Contract delta units.`,
        item.line
      )
    );
    return;
  }

  const parsed = parseVerifies(value);
  if (!parsed || !isValidChangeElementPath(parsed.elementPath)) {
    issues.push(error('invalid-verifies-path', `Check ${item.id} has an invalid Verifies Element path.`, item.line));
    return;
  }

  if (!elementUnits.has(parsed.elementPath)) {
    issues.push(
      error(
        'missing-verifies-element',
        `Check ${item.id} Verifies references missing Element unit ${parsed.elementPath}.`,
        item.line
      )
    );
    return;
  }

  const contract = parseContractRequirements(fs.readFileSync(path.join(changeDir, parsed.elementPath), 'utf8'));
  const requirement = contract.get(parsed.requirement);
  if (!requirement) {
    issues.push(
      error(
        'missing-verifies-requirement',
        `Check ${item.id} Verifies references missing requirement "${parsed.requirement}".`,
        item.line
      )
    );
    return;
  }

  if (parsed.isRemoved && !requirement.isRemoved) {
    issues.push(
      error(
        'missing-verifies-requirement',
        `Check ${item.id} Verifies references "${parsed.requirement}" as REMOVED, but it is not in a REMOVED Requirements section.`,
        item.line
      )
    );
    return;
  }

  if (!parsed.isRemoved) {
    for (const scenario of parsed.scenarios) {
      if (!requirement.scenarios.has(scenario)) {
        issues.push(
          error(
            'missing-verifies-scenario',
            `Check ${item.id} Verifies references missing scenario "${scenario}".`,
            item.line
          )
        );
      }
    }
  }
}

function validatePreservesField(
  item: TaskItem,
  changeDir: string | undefined,
  issues: TaskStructureIssue[]
): void {
  const value = item.preserves!.trim();

  const parsed = parsePreserves(value);
  if (!parsed || !isValidFormalElementPath(parsed.elementPath)) {
    issues.push(error('invalid-verifies-path', `Check ${item.id} has an invalid Preserves Element path.`, item.line));
    return;
  }

  if (!changeDir) {
    return;
  }

  const projectRoot = projectRootForChangeDir(changeDir);
  const formalElementPath = path.join(projectRoot, parsed.elementPath);

  if (!fs.existsSync(formalElementPath)) {
    issues.push(
      error(
        'missing-verifies-element',
        `Check ${item.id} Preserves references missing Element unit ${parsed.elementPath}.`,
        item.line
      )
    );
    return;
  }

  const contract = parseContractRequirements(fs.readFileSync(formalElementPath, 'utf8'));
  const requirement = contract.get(parsed.requirement);
  if (!requirement) {
    issues.push(
      error(
        'missing-verifies-requirement',
        `Check ${item.id} Preserves references missing requirement "${parsed.requirement}".`,
        item.line
      )
    );
    return;
  }

  for (const scenario of parsed.scenarios) {
    if (!requirement.scenarios.has(scenario)) {
      issues.push(
        error(
          'missing-verifies-scenario',
          `Check ${item.id} Preserves references missing scenario "${scenario}".`,
          item.line
        )
      );
    }
  }
}

function projectRootForChangeDir(changeDir: string): string {
  const resolved = path.resolve(changeDir);
  const changesDir = path.dirname(resolved);
  const xirangDir = path.dirname(changesDir);
  return path.basename(changesDir) === 'changes' && path.basename(xirangDir) === '.xirang'
    ? path.dirname(xirangDir)
    : path.dirname(resolved);
}

function parseVerifies(value: string): { elementPath: string; requirement: string; scenarios: string[]; isRemoved?: boolean } | undefined {
  const elementPath = value.match(ELEMENT_PATH_RE)?.[1]?.trim();

  const removedMatch = value.match(REMOVED_REQUIREMENT_RE);
  if (removedMatch) {
    const requirement = removedMatch[1]?.trim();
    if (!elementPath || !requirement) {
      return undefined;
    }
    return { elementPath, requirement, scenarios: [], isRemoved: true };
  }

  const requirement = value.match(REQUIREMENT_RE)?.[1]?.trim();
  const scenarioText = value.match(SCENARIOS_RE)?.[1] ?? '';
  const scenarios = [...scenarioText.matchAll(SCENARIO_NAME_RE)].map((match) => match[1].trim());

  if (!elementPath || !requirement || scenarios.length === 0 || scenarios.some((scenario) => !scenario)) {
    return undefined;
  }

  return { elementPath, requirement, scenarios };
}

function parsePreserves(value: string): { elementPath: string; requirement: string; scenarios: string[] } | undefined {
  const elementPath = value.match(ELEMENT_PATH_RE)?.[1]?.trim();
  const requirement = value.match(REQUIREMENT_RE)?.[1]?.trim();
  const scenarioText = value.match(SCENARIOS_RE)?.[1] ?? '';
  const scenarios = [...scenarioText.matchAll(SCENARIO_NAME_RE)].map((match) => match[1].trim());

  if (!elementPath || !requirement || scenarios.length === 0 || scenarios.some((scenario) => !scenario)) {
    return undefined;
  }

  return { elementPath, requirement, scenarios };
}

function listChangeElementUnits(changeDir: string): Set<string> {
  const elementsDir = path.join(changeDir, ELEMENTS_PARTITION);
  if (!fs.existsSync(elementsDir)) {
    return new Set();
  }

  const files = new Set<string>();
  for (const unit of fs.readdirSync(elementsDir, { withFileTypes: true })) {
    if (unit.isFile() && UNIT_FILE_RE.test(unit.name)) {
      files.add(path.posix.join(ELEMENTS_PARTITION, unit.name));
    }
  }

  return files;
}

function hasInvalidPathChars(elementPath: string): boolean {
  return (
    elementPath.includes('\\') ||
    elementPath.startsWith('/') ||
    path.win32.isAbsolute(elementPath) ||
    elementPath.includes('../')
  );
}

function isValidChangeElementPath(elementPath: string): boolean {
  if (hasInvalidPathChars(elementPath) || elementPath.startsWith('.xirang/')) {
    return false;
  }

  const parts = elementPath.split('/');
  return parts.length === 2 && parts[0] === ELEMENTS_PARTITION && UNIT_FILE_RE.test(parts[1]);
}

function isValidFormalElementPath(elementPath: string): boolean {
  if (hasInvalidPathChars(elementPath)) {
    return false;
  }

  const parts = elementPath.split('/');
  return (
    parts.length === 4 &&
    parts[0] === '.xirang' &&
    parts[1] === 'model' &&
    parts[2] === ELEMENTS_PARTITION &&
    UNIT_FILE_RE.test(parts[3])
  );
}

function parseContractRequirements(content: string): Map<string, ContractRequirement> {
  const requirements = new Map<string, ContractRequirement>();
  let current: ContractRequirement | undefined;
  let inRemovedSection = false;

  for (const line of content.replace(/\r\n?/g, '\n').split('\n')) {
    const sectionHeader = line.match(/^##\s+(REMOVED|ADDED|MODIFIED)\s+Requirements\s*$/);
    if (sectionHeader) {
      inRemovedSection = sectionHeader[1] === 'REMOVED';
      current = undefined;
      continue;
    }

    const requirement = line.match(/^###\s+Requirement:\s+(.+?)\s*$/);
    if (requirement) {
      current = { name: requirement[1], scenarios: new Set(), isRemoved: inRemovedSection };
      requirements.set(current.name, current);
      continue;
    }

    const scenario = line.match(/^####\s+Scenario:\s+(.+?)\s*$/);
    if (scenario && current && !inRemovedSection) {
      current.scenarios.add(scenario[1]);
    }
  }

  return requirements;
}

function parseCoarseTasks(lines: string[], mask: boolean[]): CoarseTask[] {
  const tasks: CoarseTask[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) {
      continue;
    }

    const match = lines[i].match(/^###\s+Task\s+(\d+):\s*(.*?)\s*$/);
    if (!match) {
      continue;
    }

    tasks.push({
      id: match[1],
      title: match[2],
      line: i + 1,
      range: { start: i + 1, end: lines.length },
    });
  }

  for (let i = 0; i < tasks.length; i++) {
    tasks[i].range.end = tasks[i + 1]?.line ? tasks[i + 1].line - 1 : lines.length;
  }

  return tasks;
}

function parseTaskFields(
  lines: string[],
  mask: boolean[],
  range: { start: number; end: number }
): Map<string, { start: number; end: number }> {
  const fields = new Map<string, { start: number; end: number }>();
  const starts: Array<{ name: string; line: number }> = [];

  for (let i = range.start; i < range.end; i++) {
    if (mask[i]) {
      continue;
    }

    const checks = lines[i].match(TASK_CHECKS_HEADING_RE);
    if (checks) {
      starts.push({ name: 'Checks', line: i });
      continue;
    }

    const match = lines[i].match(TASK_FIELD_RE);
    if (match) {
      starts.push({ name: match[1], line: i });
    }
  }

  for (let i = 0; i < starts.length; i++) {
    fields.set(starts[i].name, {
      start: starts[i].line + 1,
      end: starts[i + 1]?.line ?? range.end,
    });
  }

  return fields;
}

function countListItemsInField(
  lines: string[],
  mask: boolean[],
  range: { start: number; end: number } | undefined,
  fallbackEnd: number
): number {
  if (!range) {
    return 0;
  }

  const end = Math.min(range.end, fallbackEnd);
  let count = 0;
  for (let i = range.start; i < end; i++) {
    if (!mask[i] && /^\s*-\s+/.test(lines[i])) {
      count++;
    }
  }
  return count;
}

function parseItems(
  lines: string[],
  mask: boolean[],
  range: { start: number; end: number }
): TaskItem[] {
  const items: TaskItem[] = [];
  let current: TaskItem | undefined;

  for (let i = range.start; i < range.end; i++) {
    if (mask[i]) {
      continue;
    }

    const checkbox = lines[i].match(CHECKBOX_RE);
    if (checkbox) {
      current = { id: checkbox[1], line: i + 1, fields: new Set(), covers: [] };
      items.push(current);
      continue;
    }

    const field = lines[i].match(FIELD_RE);
    if (!field || !current) {
      continue;
    }

    const name = field[1];
    current.fields.add(name);
    if (name === 'Covers') {
      current.covers.push(...field[2].split(',').map((part) => part.trim()).filter(Boolean));
    } else if (name === 'Verifies') {
      current.verifies = field[2];
    } else if (name === 'Preserves') {
      current.preserves = field[2];
    }
  }

  return items;
}

function findTaskSections(lines: string[], mask: boolean[]) {
  const headings: Array<{ title: string; line: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) {
      continue;
    }
    const match = lines[i].match(/^##\s+(.+)$/);
    if (match) {
      headings.push({ title: normalizeHeading(match[1]), line: i });
    }
  }

  return {
    actions: sectionRange(headings, 'actions', lines.length),
    checks: sectionRange(headings, 'checks', lines.length),
  };
}

function sectionRange(
  headings: Array<{ title: string; line: number }>,
  title: string,
  lineCount: number
): { start: number; end: number } | undefined {
  const index = headings.findIndex((heading) => heading.title === title);
  if (index < 0) {
    return undefined;
  }
  return {
    start: headings[index].line + 1,
    end: headings[index + 1]?.line ?? lineCount,
  };
}

function normalizeHeading(title: string): string {
  return title.trim().replace(/^\d+\.\s+/, '').toLowerCase();
}

function buildCodeFenceMask(lines: string[]): boolean[] {
  const mask = new Array(lines.length).fill(false);
  let active: { marker: string; length: number } | undefined;

  for (let i = 0; i < lines.length; i++) {
    const fence = lines[i].match(/^\s*(`{3,}|~{3,})/);
    if (!active) {
      if (fence) {
        active = { marker: fence[1][0], length: fence[1].length };
        mask[i] = true;
      }
      continue;
    }

    mask[i] = true;
    const closing = lines[i].match(/^\s*(`{3,}|~{3,})\s*$/);
    if (closing && closing[1][0] === active.marker && closing[1].length >= active.length) {
      active = undefined;
    }
  }

  return mask;
}
