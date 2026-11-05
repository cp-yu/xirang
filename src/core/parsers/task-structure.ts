export interface TaskStructureIssue {
  code: 'missing-goals-section' | 'unsupported-task-format' | 'missing-goals' | 'malformed-goal' | 'missing-goal-contract' | 'missing-goal-verification';
  message: string;
  line?: number;
  severity: 'error' | 'warning';
}

export interface TaskStructureValidation {
  valid: boolean;
  issues: TaskStructureIssue[];
  actions: string[];
  checks: string[];
  format: 'goal-level';
}

const GOAL_SECTION = /^##\s+Goals\s*$/;
const SECOND_LEVEL_HEADING = /^##\s+/;
const GOAL_ITEM = /^\s*-\s+\[([ xX])\]\s+(G\d+):\s*(\S.*)$/;
const CONTRACT_FIELD = /^\s+-\s+Contract:\s*`([^`]+)`\s*\/\s*Section\s+"([^"]+)"\s*$/;
const VERIFY_FIELD = /^\s+-\s+Verify:\s*(\S.*)$/;
const LEGACY_MARKER = /^#{1,4}\s+(?:\d+\.\s+)?(?:Actions|Checks)\s*$|^###\s+Task\s+\d+:|^\*\*(?:Goal|Files|Sections)\*\*:/;

export function validateTaskStructure(content: string): TaskStructureValidation {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const issues: TaskStructureIssue[] = [];
  const sectionStart = lines.findIndex((line) => GOAL_SECTION.test(line));
  const goalIds: string[] = [];

  if (sectionStart < 0) {
    issues.push(error(
      'unsupported-task-format',
      LEGACY_MARKER.test(content)
        ? 'Legacy task formats are unsupported. Rewrite tasks.md using the goal-level ## Goals format.'
        : 'Expected the goal-level ## Goals section; legacy task formats are unsupported.'
    ));
    return result(issues, goalIds);
  }

  if (lines.some((line) => LEGACY_MARKER.test(line))) {
    issues.push(error('unsupported-task-format', 'Legacy Actions/Checks and coarse Task layouts are unsupported.'));
  }

  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (SECOND_LEVEL_HEADING.test(lines[i])) {
      sectionEnd = i;
      break;
    }
  }

  let current: { id: string; line: number; hasContract: boolean; hasVerify: boolean } | undefined;
  const finishGoal = () => {
    if (!current) return;
    if (!current.hasContract) {
      issues.push(error('missing-goal-contract', `Goal ${current.id} must reference a Contract Section.`, current.line));
    }
    if (!current.hasVerify) {
      issues.push(error('missing-goal-verification', `Goal ${current.id} must state a verification direction.`, current.line));
    }
  };

  for (let i = sectionStart + 1; i < sectionEnd; i++) {
    const line = lines[i];
    if (/^\s*-\s+\[[ xX]\]/.test(line)) {
      finishGoal();
      const match = line.match(GOAL_ITEM);
      if (!match) {
        issues.push(error('malformed-goal', 'Goal checkbox must use `G<n>: <goal>` format.', i + 1));
        current = undefined;
      } else {
        current = { id: match[2], line: i + 1, hasContract: false, hasVerify: false };
        if (goalIds.includes(current.id)) {
          issues.push(error('malformed-goal', `Duplicate goal identity ${current.id}.`, i + 1));
        }
        goalIds.push(current.id);
      }
      continue;
    }
    if (!current) continue;
    if (CONTRACT_FIELD.test(line)) current.hasContract = true;
    if (VERIFY_FIELD.test(line)) current.hasVerify = true;
  }
  finishGoal();

  if (goalIds.length === 0) {
    issues.push(error('missing-goals', 'The ## Goals section must contain at least one goal.'));
  }

  return result(issues, goalIds);
}

function error(code: TaskStructureIssue['code'], message: string, line?: number): TaskStructureIssue {
  return { severity: 'error', code, message, line };
}

function result(issues: TaskStructureIssue[], goalIds: string[]): TaskStructureValidation {
  return {
    valid: issues.every((issue) => issue.severity !== 'error'),
    issues,
    actions: goalIds,
    checks: [],
    format: 'goal-level',
  };
}
