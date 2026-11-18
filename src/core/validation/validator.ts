import { XIRANG_DIR_NAME } from '../config.js';
import { promises as fs } from 'fs';
import path from 'path';
import { ValidationReport, ValidationIssue } from './types.js';
import {
  MAX_SECTION_TEXT_LENGTH,
  VALIDATION_MESSAGES
} from './constants.js';
import {
  parseDeltaSpec,
  normalizeSectionName,
  extractSpecificationSection,
} from '../parsers/section-blocks.js';
import { splitFrontmatter } from '../model/frontmatter.js';
import { normalizeProse, readEntity, readDeltaFiles } from '../model/parser.js';
import type { ModelElement } from '../model/types.js';
import {
  containsShallOrMust as containsShallOrMustShared,
  extractSectionBody,
} from '../parsers/section-text.js';

export interface ChangeDeltaValidationContext {
  projectRoot?: string;
  allowAlreadyApplied?: boolean;
  files?: ReadonlyMap<string, string>;
}

export class Validator {
  private strictMode: boolean;

  constructor(strictMode: boolean = false) {
    this.strictMode = strictMode;
  }

  /**
   * Notation-level validation of the Section deltas carried by the change's Element units.
   * Identity resolution against the Formal model belongs to `applySemanticDelta`, not here.
   */
  async validateChangeDeltaSpecs(changeDir: string, context?: ChangeDeltaValidationContext): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    const missingHeaderSpecs: string[] = [];
    const emptySectionSpecs: Array<{ path: string; sections: string[] }> = [];
    const files = context?.files ?? await readDeltaFiles(changeDir);

    for (const [entryPath, unit] of elementDeltaUnits(files)) {
      const plan = parseDeltaSpec(unit);
      const sectionNames: string[] = [];
      if (plan.sectionPresence.added) sectionNames.push('## ADDED Sections');
      if (plan.sectionPresence.modified) sectionNames.push('## MODIFIED Sections');
      if (plan.sectionPresence.removed) sectionNames.push('## REMOVED Sections');
      const hasSections = sectionNames.length > 0;
      const hasEntries = plan.added.length + plan.modified.length + plan.removed.length > 0;
      for (const line of plan.malformedOperationLines) issues.push({
        level: 'ERROR', path: entryPath, message: `Expected a named ## Section operation header at body line ${line}`,
      });
      for (const line of plan.malformedSectionLines) issues.push({
        level: 'ERROR', path: entryPath,
        message: `Malformed Section header at body line ${line}; use ### Section: <name>`,
      });
      for (const line of plan.unscopedContentLines) issues.push({
        level: 'ERROR', path: entryPath,
        message: `Content at body line ${line} is outside a Section operation`,
      });
      for (const line of plan.removedContentLines) issues.push({
        level: 'ERROR', path: entryPath,
        message: `REMOVED Sections may only name a Section (body line ${line})`,
      });
      for (const section of plan.unscopedSections) issues.push({
        level: 'ERROR', path: entryPath,
        message: `Section "${section}" is outside an ADDED, MODIFIED or REMOVED Sections block`,
      });
      for (const section of plan.unsupportedSections) issues.push({
        level: 'ERROR', path: entryPath,
        message: `${section} is unsupported. Use ADDED, MODIFIED or REMOVED Sections. For a rename, use REMOVED old Section plus ADDED new Section.`,
      });
      if (!hasEntries) {
        if (hasSections) emptySectionSpecs.push({ path: entryPath, sections: sectionNames });
        else missingHeaderSpecs.push(entryPath);
      }

      const addedNames = new Set<string>();
      const modifiedNames = new Set<string>();
      const removedNames = new Set<string>();

      this.validateDeltaSectionBlocks(plan.added, 'ADDED', addedNames, entryPath, issues);
      this.validateDeltaSectionBlocks(plan.modified, 'MODIFIED', modifiedNames, entryPath, issues);

      // Validate REMOVED (names only)
      for (const name of plan.removed) {
        const key = normalizeSectionName(name);
        if (removedNames.has(key)) {
          issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate Section in REMOVED: "${name}"` });
        } else {
          removedNames.add(key);
        }
      }

      // Cross-section conflicts within the same unit
      for (const n of modifiedNames) {
        if (removedNames.has(n)) {
          issues.push({ level: 'ERROR', path: entryPath, message: `Section present in both MODIFIED and REMOVED: "${n}"` });
        }
        if (addedNames.has(n)) {
          issues.push({ level: 'ERROR', path: entryPath, message: `Section present in both MODIFIED and ADDED: "${n}"` });
        }
      }
      for (const n of addedNames) {
        if (removedNames.has(n)) {
          issues.push({ level: 'ERROR', path: entryPath, message: `Section present in both ADDED and REMOVED: "${n}"` });
        }
      }
    }

    for (const { path: specPath, sections } of emptySectionSpecs) {
      issues.push({
        level: 'ERROR',
        path: specPath,
        message: `Delta sections ${this.formatSectionList(sections)} were found, but no Section entries parsed. Ensure each section includes at least one "### Section:" block (REMOVED may use bullet list syntax).`,
      });
    }
    for (const path of missingHeaderSpecs) {
      issues.push({
        level: 'ERROR',
        path,
        message: 'No delta sections found. Add headers such as "## ADDED Sections" to the Element delta unit.',
      });
    }

    if (!context?.allowAlreadyApplied && files.size === 0 && !await declaresExplicitNoDelta(changeDir)) {
      issues.push({ level: 'ERROR', path: 'file', message: this.enrichTopLevelError('change', VALIDATION_MESSAGES.CHANGE_NO_DELTAS) });
    }

    return this.createReport(issues);
  }

  /** Element Contract validation over the IR; the Contract is the `## Specification` section alone. */
  validateElementContract(element: ModelElement, unitPath: string): ValidationReport {
    const issues: ValidationIssue[] = [];
    if (element.sections.length === 0) {
      issues.push({ level: 'ERROR', path: unitPath, message: VALIDATION_MESSAGES.CONTRACT_NO_SECTIONS });
    }
    for (const section of element.sections) {
      if (!this.containsShallOrMust(section.body)) {
        issues.push({ level: 'ERROR', path: unitPath, message: `Section "${section.name}" ${VALIDATION_MESSAGES.SECTION_NO_SHALL}` });
      }
      if (section.body.length > MAX_SECTION_TEXT_LENGTH) {
        issues.push({ level: 'INFO', path: unitPath, message: `Section "${section.name}": ${VALIDATION_MESSAGES.SECTION_TOO_LONG}` });
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

  private validateDeltaSectionBlocks(
    blocks: Array<{ name: string; raw: string }>,
    section: 'ADDED' | 'MODIFIED',
    seenNames: Set<string>,
    entryPath: string,
    issues: ValidationIssue[],
  ): void {
    for (const block of blocks) {
      const key = normalizeSectionName(block.name);

      if (seenNames.has(key)) {
        issues.push({ level: 'ERROR', path: entryPath, message: `Duplicate Section in ${section}: "${block.name}"` });
      } else {
        seenNames.add(key);
      }

      const sectionText = this.extractSectionText(block.raw);
      if (!sectionText) {
        issues.push({ level: 'ERROR', path: entryPath, message: `${section} "${block.name}" is missing Section text` });
      } else if (!this.containsShallOrMust(sectionText)) {
        issues.push({ level: 'ERROR', path: entryPath, message: `${section} "${block.name}" must contain SHALL or MUST` });
      }
    }
  }

  private extractSectionText(blockRaw: string): string | undefined {
    // Line 0 is the Section header; body is fence/metadata/multi-line aware.
    const bodyLines = blockRaw.replace(/\r\n?/g, '\n').split('\n').slice(1);
    return extractSectionBody(bodyLines) || undefined;
  }

  private containsShallOrMust(text: string): boolean {
    return containsShallOrMustShared(text);
  }

  private formatSectionList(sections: string[]): string {
    if (sections.length === 0) return '';
    if (sections.length === 1) return sections[0];
    const head = sections.slice(0, -1);
    const last = sections[sections.length - 1];
    return `${head.join(', ')} and ${last}`;
  }
}

/** `.delta-noop` is the explicit declaration that a Change intentionally carries no Semantic Delta. */
async function declaresExplicitNoDelta(changeDir: string): Promise<boolean> {
  return fs.stat(path.join(changeDir, '.delta-noop')).then(() => true).catch(() => false);
}

/** Section notation applies by declared entity, independent of which partition holds the unit. */
function elementDeltaUnits(files: ReadonlyMap<string, string>): Array<[string, string]> {
  return [...files].flatMap(([file, content]): Array<[string, string]> => {
    const split = splitFrontmatter(content);
    return split.ok && readEntity(split.data) === 'element-declaration'
      && normalizeProse(split.body) !== '' ? [[file, split.body]] : [];
  });
}
