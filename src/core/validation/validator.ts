import { XIRANG_DIR_NAME } from '../config.js';
import { promises as fs } from 'fs';
import path from 'path';
import { ValidationReport, ValidationIssue } from './types.js';
import {
  MAX_REQUIREMENT_TEXT_LENGTH,
  VALIDATION_MESSAGES
} from './constants.js';
import {
  parseDeltaSpec,
  normalizeRequirementName,
  extractRequirementsSection,
} from '../parsers/requirement-blocks.js';
import { splitFrontmatter } from '../model/frontmatter.js';
import { normalizeProse, readEntity } from '../model/parser.js';
import { PARTITIONS, type ModelElement } from '../model/types.js';
import {
  containsShallOrMust as containsShallOrMustShared,
  extractRequirementBody,
  listNonFencedScenarioHeaders,
} from '../parsers/requirement-text.js';

export interface ChangeDeltaValidationContext {
  projectRoot?: string;
  allowAlreadyApplied?: boolean;
}

export class Validator {
  private strictMode: boolean;

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode;
  }

  /**
   * Notation-level validation of the Requirement deltas carried by the change's Element units.
   * Identity resolution against the Formal model belongs to `applySemanticDelta`, not here.
   */
  async validateChangeDeltaSpecs(changeDir: string, context?: ChangeDeltaValidationContext): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const missingHeaderSpecs: string[] = [];
    const emptySectionSpecs: Array<{ path: string; sections: string[] }> = [];

    for (const [entryPath, unit] of await readElementDeltaUnits(changeDir)) {
      const plan = parseDeltaSpec(unit);
      const sectionNames: string[] = [];
      if (plan.sectionPresence.added) sectionNames.push('## ADDED Requirements');
      if (plan.sectionPresence.modified) sectionNames.push('## MODIFIED Requirements');
      if (plan.sectionPresence.removed) sectionNames.push('## REMOVED Requirements');
      const hasSections = sectionNames.length > 0;
      const hasEntries = plan.added.length + plan.modified.length + plan.removed.length > 0;
      for (const section of plan.unsupportedSections) issues.push({
        level: 'ERROR', path: entryPath,
        message: `${section} is unsupported. Use REMOVED old Requirement plus ADDED new Requirement.`,
      });
      for (const label of plan.scenarioOperationLabels) issues.push({
        level: 'ERROR', path: `${entryPath}:${label.line}`,
        message: `Unsupported Scenario operation metadata [${label.prefix}]. Remove the label and express the complete target Scenario set.`,
      });
      if (!hasEntries) {
        if (hasSections) emptySectionSpecs.push({ path: entryPath, sections: sectionNames });
        else missingHeaderSpecs.push(entryPath);
      }

      const addedNames = new Set<string>();
      const modifiedNames = new Set<string>();
      const removedNames = new Set<string>();

      this.validateDeltaRequirementBlocks(plan.added, 'ADDED', addedNames, entryPath, issues);
      this.validateDeltaRequirementBlocks(plan.modified, 'MODIFIED', modifiedNames, entryPath, issues);

      // Validate REMOVED (names only)
      for (const name of plan.removed) {
        const key = normalizeRequirementName(name);
        if (removedNames.has(key)) {
          issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate requirement in REMOVED: "${name}"` });
        } else {
          removedNames.add(key);
        }
      }

      // Cross-section conflicts within the same unit
      for (const n of modifiedNames) {
        if (removedNames.has(n)) {
          issues.push({ level: 'ERROR', path: entryPath, message: `Requirement present in both MODIFIED and REMOVED: "${n}"` });
        }
        if (addedNames.has(n)) {
          issues.push({ level: 'ERROR', path: entryPath, message: `Requirement present in both MODIFIED and ADDED: "${n}"` });
        }
      }
      for (const n of addedNames) {
        if (removedNames.has(n)) {
          issues.push({ level: 'ERROR', path: entryPath, message: `Requirement present in both ADDED and REMOVED: "${n}"` });
        }
      }
    }

    for (const { path: specPath, sections } of emptySectionSpecs) {
      issues.push({
        level: 'ERROR',
        path: specPath,
        message: `Delta sections ${this.formatSectionList(sections)} were found, but no requirement entries parsed. Ensure each section includes at least one "### Requirement:" block (REMOVED may use bullet list syntax).`,
      });
    }
    for (const path of missingHeaderSpecs) {
      issues.push({
        level: 'ERROR',
        path,
        message: 'No delta sections found. Add headers such as "## ADDED Requirements" to the Element delta unit.',
      });
    }

    if (!context?.allowAlreadyApplied && !await carriesSemanticDelta(changeDir)) {
      issues.push({ level: 'ERROR', path: 'file', message: this.enrichTopLevelError('change', VALIDATION_MESSAGES.CHANGE_NO_DELTAS) });
    }

    return this.createReport(issues);
  }

  /** Element Contract validation over the IR; the Contract is the `## Requirements` section alone. */
  validateElementContract(element: ModelElement, unitPath: string): ValidationReport {
    const issues: ValidationIssue[] = [];
    if (element.requirements.length === 0) {
      issues.push({ level: 'ERROR', path: unitPath, message: VALIDATION_MESSAGES.CONTRACT_NO_REQUIREMENTS });
    }
    for (const requirement of element.requirements) {
      if (!this.containsShallOrMust(requirement.body)) {
        issues.push({ level: 'ERROR', path: unitPath, message: `Requirement "${requirement.name}" ${VALIDATION_MESSAGES.REQUIREMENT_NO_SHALL}` });
      }
      if (requirement.body.length > MAX_REQUIREMENT_TEXT_LENGTH) {
        issues.push({ level: 'INFO', path: unitPath, message: `Requirement "${requirement.name}": ${VALIDATION_MESSAGES.REQUIREMENT_TOO_LONG}` });
      }
      if (requirement.scenarios.length === 0) {
        issues.push({
          level: 'WARNING',
          path: unitPath,
          message: `Requirement "${requirement.name}" ${VALIDATION_MESSAGES.REQUIREMENT_NO_SCENARIOS}. ${VALIDATION_MESSAGES.GUIDE_SCENARIO_FORMAT}`,
        });
      }
    }
    return this.createReport(issues);
  }

  private enrichTopLevelError(itemId: string, baseMessage: string): string {
    const msg = baseMessage.trim();
    if (msg === VALIDATION_MESSAGES.CHANGE_NO_DELTAS) {
      return `${msg}. ${VALIDATION_MESSAGES.GUIDE_NO_DELTAS}`;
    }
    return msg;
  }

  private createReport(issues: ValidationIssue[]): ValidationReport {
    const errors = issues.filter(i => i.level === 'ERROR').length;
    const warnings = issues.filter(i => i.level === 'WARNING').length;
    const info = issues.filter(i => i.level === 'INFO').length;
    
    const valid = this.strictMode 
      ? errors === 0 && warnings === 0
      : errors === 0;
    
    return {
      valid,
      issues,
      summary: {
        errors,
        warnings,
        info,
      },
    };
  }

  isValid(report: ValidationReport): boolean {
    return report.valid;
  }

  private validateDeltaRequirementBlocks(
    blocks: Array<{ name: string; raw: string }>,
    section: 'ADDED' | 'MODIFIED',
    seenNames: Set<string>,
    entryPath: string,
    issues: ValidationIssue[],
  ): void {
    for (const block of blocks) {
      const key = normalizeRequirementName(block.name);

      if (seenNames.has(key)) {
        issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate requirement in ${section}: "${block.name}"` });
      } else {
        seenNames.add(key);
      }

      const requirementText = this.extractRequirementText(block.raw);
      if (!requirementText) {
        issues.push({ level: 'ERROR', path: entryPath, message: `${section} "${block.name}" is missing requirement text` });
      } else if (!this.containsShallOrMust(requirementText)) {
        issues.push({ level: 'ERROR', path: entryPath, message: `${section} "${block.name}" must contain SHALL or MUST` });
      }

      if (this.countSurvivingScenarios(block.raw) < 1) {
        issues.push({ level: 'ERROR', path: entryPath, message: `${section} "${block.name}" must include at least one canonical unlabeled Scenario` });
      }
    }
  }

  private extractRequirementText(blockRaw: string): string | undefined {
    // Line 0 is the requirement header; body is fence/metadata/multi-line aware.
    const bodyLines = blockRaw.replace(/\r\n?/g, '\n').split('\n').slice(1);
    return extractRequirementBody(bodyLines) || undefined;
  }

  private containsShallOrMust(text: string): boolean {
    return containsShallOrMustShared(text);
  }

  private countSurvivingScenarios(blockRaw: string): number {
    const lines = blockRaw.replace(/\r\n?/g, '\n').split('\n');
    let count = 0;
    for (const _line of listNonFencedScenarioHeaders(lines)) count++;
    return count;
  }

  private formatSectionList(sections: string[]): string {
    if (sections.length === 0) return '';
    if (sections.length === 1) return sections[0];
    const head = sections.slice(0, -1);
    const last = sections[sections.length - 1];
    return `${head.join(', ')} and ${last}`;
  }

}

/** A change carries a Semantic Delta when any of its four partitions holds a unit. */
async function carriesSemanticDelta(changeDir: string): Promise<boolean> {
  for (const partition of PARTITIONS) {
    const entries = await fs.readdir(path.join(changeDir, partition), { withFileTypes: true }).catch(() => []);
    if (entries.some(entry => entry.isFile() || entry.isDirectory())) return true;
  }
  return false;
}

/** Requirement deltas live in the `elements/` partition of the change; paths locate the unit itself. */
async function readElementDeltaUnits(changeDir: string): Promise<Array<[string, string]>> {
  const partition = path.join(changeDir, 'elements');
  const units: Array<[string, string]> = [];
  const visit = async (directory: string, relative: string): Promise<void> => {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await visit(path.join(directory, entry.name), child);
        continue;
      }
      const content = await fs.readFile(path.join(directory, entry.name), 'utf-8');
      const split = splitFrontmatter(content);
      if (!split.ok || readEntity(split.data) !== 'element-declaration') continue;
      // A Declaration-only delta carries no Contract body; there is no Requirement notation to check.
      if (normalizeProse(split.body) === '') continue;
      units.push([`elements/${child}`, split.body]);
    }
  };
  await visit(partition, '');
  return units;
}
