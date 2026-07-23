/**
 * Spec Application Logic
 *
 * Extracted from ArchiveCommand to enable standalone spec application.
 * Applies delta specs from a change to main specs without archiving.
 */

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import {
  extractRequirementsSection,
  parseDeltaSpec,
  normalizeRequirementName,
  type RequirementBlock,
} from './parsers/requirement-blocks.js';
import { projectConfigForRuntime, type RuntimeProjection } from './config-projection.js';
import { OPSX_DIR_NAME } from './config.js';
import { readProjectConfig } from './project-config.js';
import { parseSpecFrontmatter } from './parsers/spec-frontmatter.js';
import { findMainSpecStructureIssues } from './parsers/spec-structure.js';
import { stringify } from 'yaml';
import { Validator } from './validation/validator.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SpecUpdate {
  source: string;
  target: string;
  exists: boolean;
}

export interface ApplyResult {
  capability: string;
  added: number;
  modified: number;
  removed: number;
}

export interface SpecsApplyOutput {
  changeName: string;
  capabilities: ApplyResult[];
  totals: {
    added: number;
    modified: number;
    removed: number;
  };
  noChanges: boolean;
}

function normalizeRequirementBlockRaw(raw: string): string {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

function normalizeRequirementBlockForSync(block: RequirementBlock): RequirementBlock {
  return block;
}

export function isDeltaSpecAlreadyApplied(
  changeContent: string,
  targetContent: string
): boolean {
  const plan = parseDeltaSpec(changeContent);
  const parts = extractRequirementsSection(targetContent);
  const currentBlocks = new Map(
    parts.bodyBlocks.map((block) => [normalizeRequirementName(block.name), block])
  );
  let confirmedAppliedState = false;

  for (const name of plan.removed) {
    if (currentBlocks.has(normalizeRequirementName(name))) {
      return false;
    }
    confirmedAppliedState = true;
  }

  for (const modified of plan.modified) {
    const current = currentBlocks.get(normalizeRequirementName(modified.name));
    if (!current || normalizeRequirementBlockRaw(current.raw) !== normalizeRequirementBlockRaw(modified.raw)) {
      return false;
    }
    confirmedAppliedState = true;
  }

  for (const added of plan.added) {
    const current = currentBlocks.get(normalizeRequirementName(added.name));
    if (!current || normalizeRequirementBlockRaw(current.raw) !== normalizeRequirementBlockRaw(added.raw)) {
      return false;
    }
    confirmedAppliedState = true;
  }

  return confirmedAppliedState;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Find all delta spec files that need to be applied from a change.
 */
export async function findSpecUpdates(changeDir: string, mainSpecsDir: string): Promise<SpecUpdate[]> {
  const updates: SpecUpdate[] = [];
  const changeSpecsDir = path.join(changeDir, 'specs');

  try {
    const entries = await fs.readdir(changeSpecsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const specFile = path.join(changeSpecsDir, entry.name, 'spec.md');
        const targetFile = path.join(mainSpecsDir, entry.name, 'spec.md');

        try {
          await fs.access(specFile);

          // Check if target exists
          let exists = false;
          try {
            await fs.access(targetFile);
            exists = true;
          } catch {
            exists = false;
          }

          updates.push({
            source: specFile,
            target: targetFile,
            exists,
          });
        } catch {
          // Source spec doesn't exist, skip
        }
      }
    }
  } catch {
    // No specs directory in change
  }

  return updates;
}

/**
 * Build an updated spec by applying delta operations.
 * Returns the rebuilt content and counts of operations.
 */
export async function buildUpdatedSpec(
  update: SpecUpdate,
  changeName: string,
  projectRoot?: string
): Promise<{ rebuilt: string; counts: { added: number; modified: number; removed: number } }> {
  // Read change spec content (delta-format expected)
  const changeContent = await fs.readFile(update.source, 'utf-8');

  // Parse deltas from the change spec file
  const plan = parseDeltaSpec(changeContent);
  const specName = path.basename(path.dirname(update.target));

  // Pre-validate duplicates within sections
  const addedNames = new Set<string>();
  for (const add of plan.added) {
    const name = normalizeRequirementName(add.name);
    if (addedNames.has(name)) {
      throw new Error(
        `${specName} validation failed - duplicate requirement in ADDED for header "### Requirement: ${add.name}"`
      );
    }
    addedNames.add(name);
  }
  const modifiedNames = new Set<string>();
  for (const mod of plan.modified) {
    const name = normalizeRequirementName(mod.name);
    if (modifiedNames.has(name)) {
      throw new Error(
        `${specName} validation failed - duplicate requirement in MODIFIED for header "### Requirement: ${mod.name}"`
      );
    }
    modifiedNames.add(name);
  }
  const removedNamesSet = new Set<string>();
  for (const rem of plan.removed) {
    const name = normalizeRequirementName(rem);
    if (removedNamesSet.has(name)) {
      throw new Error(
        `${specName} validation failed - duplicate requirement in REMOVED for header "### Requirement: ${rem}"`
      );
    }
    removedNamesSet.add(name);
  }
  // Pre-validate cross-section conflicts
  const conflicts: Array<{ name: string; a: string; b: string }> = [];
  for (const n of modifiedNames) {
    if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'REMOVED' });
    if (addedNames.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'ADDED' });
  }
  for (const n of addedNames) {
    if (removedNamesSet.has(n)) conflicts.push({ name: n, a: 'ADDED', b: 'REMOVED' });
  }
  if (conflicts.length > 0) {
    const c = conflicts[0];
    throw new Error(
      `${specName} validation failed - requirement present in multiple sections (${c.a} and ${c.b}) for header "### Requirement: ${c.name}"`
    );
  }
  if (plan.unsupportedSections.length > 0) {
    throw new Error(`${specName}: RENAMED Requirements is unsupported; use REMOVED old plus ADDED new.`);
  }
  if (plan.scenarioOperationLabels.length > 0) {
    const label = plan.scenarioOperationLabels[0];
    throw new Error(`${specName}: Scenario operation metadata [${label.prefix}] is unsupported at line ${label.line}`);
  }
  const hasAnyDelta = plan.added.length + plan.modified.length + plan.removed.length > 0;
  if (!hasAnyDelta) {
    throw new Error(
      `Delta parsing found no operations for ${path.basename(path.dirname(update.source))}. ` +
        `Provide ADDED/MODIFIED/REMOVED sections in change spec.`
    );
  }

  // Load or create base target content
  let targetContent: string;
  let isNewSpec = false;
  const runtimeProjection = projectConfigForRuntime(
    projectRoot ? readProjectConfig(projectRoot) : null,
    { consumer: 'spec-skeleton' }
  );
  try {
    targetContent = await fs.readFile(update.target, 'utf-8');
  } catch {
    // Target spec does not exist; MODIFIED is not allowed for new specs
    // REMOVED will be ignored with a warning since there's nothing to remove
    if (plan.modified.length > 0) {
      throw new Error(
        `${specName}: target spec does not exist; only ADDED requirements are allowed for new specs. MODIFIED operations require an existing spec.`
      );
    }
    // Warn about REMOVED requirements being ignored for new specs
    if (plan.removed.length > 0) {
      console.log(
        chalk.yellow(
          `⚠️  Warning: ${specName} - ${plan.removed.length} REMOVED requirement(s) ignored for new spec (nothing to remove).`
        )
      );
    }
    isNewSpec = true;
    targetContent = buildSpecSkeleton(specName, changeName, runtimeProjection);
    const frontmatter = parseSpecFrontmatter(changeContent);
    if (frontmatter.element !== null) {
      targetContent = `---\n${stringify({ element: frontmatter.element }).trimEnd()}\n---\n${targetContent}`;
    } else {
      const capabilities = frontmatter.issues
        ?.find(issue => issue.code === 'LEGACY_SPEC_OWNERSHIP')?.values;
      if (capabilities && capabilities.length > 0) {
        targetContent = `---\n${stringify({ capabilities }).trimEnd()}\n---\n${targetContent}`;
      }
    }
  }

  const structureIssues = findMainSpecStructureIssues(targetContent);
  if (structureIssues.length > 0) {
    const details = structureIssues
      .map(issue => `line ${issue.line}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `${specName}: target spec is structurally invalid and cannot be updated until fixed:\n${details}`
    );
  }

  // Extract requirements section and build name->block map
  const parts = extractRequirementsSection(targetContent);
  const nameToBlock = new Map<string, RequirementBlock>();
  for (const block of parts.bodyBlocks) {
    nameToBlock.set(normalizeRequirementName(block.name), block);
  }

  // Apply operations in order: REMOVED → MODIFIED → ADDED
  // REMOVED
  for (const name of plan.removed) {
    const key = normalizeRequirementName(name);
    if (!nameToBlock.has(key)) {
      // For new specs, REMOVED requirements are already warned about and ignored
      // For existing specs, missing requirements are an error
      if (!isNewSpec) {
        throw new Error(`${specName} REMOVED failed for header "### Requirement: ${name}" - not found`);
      }
      // Skip removal for new specs (already warned above)
      continue;
    }
    nameToBlock.delete(key);
  }

  // MODIFIED
  for (const mod of plan.modified) {
    const key = normalizeRequirementName(mod.name);
    if (!nameToBlock.has(key)) {
      throw new Error(`${specName} MODIFIED failed for header "### Requirement: ${mod.name}" - not found`);
    }
    // Replace block with provided raw (ensure header line matches key)
    const modHeaderMatch = mod.raw.split('\n')[0].match(/^###\s*Requirement:\s*(.+)\s*$/);
    if (!modHeaderMatch || normalizeRequirementName(modHeaderMatch[1]) !== key) {
      throw new Error(
        `${specName} MODIFIED failed for header "### Requirement: ${mod.name}" - header mismatch in content`
      );
    }
    nameToBlock.set(key, normalizeRequirementBlockForSync(mod));
  }

  // ADDED
  for (const add of plan.added) {
    const key = normalizeRequirementName(add.name);
    if (nameToBlock.has(key)) {
      throw new Error(`${specName} ADDED failed for header "### Requirement: ${add.name}" - already exists`);
    }
    nameToBlock.set(key, normalizeRequirementBlockForSync(add));
  }

  // Duplicates within resulting map are implicitly prevented by key uniqueness.

  // Recompose requirements section preserving original ordering where possible
  const keptOrder: RequirementBlock[] = [];
  const seen = new Set<string>();
  for (const block of parts.bodyBlocks) {
    const key = normalizeRequirementName(block.name);
    const replacement = nameToBlock.get(key);
    if (replacement) {
      keptOrder.push(replacement);
      seen.add(key);
    }
  }
  // Append any newly added that were not in original order
  for (const [key, block] of nameToBlock.entries()) {
    if (!seen.has(key)) {
      keptOrder.push(block);
    }
  }

  const reqBody = [parts.preamble && parts.preamble.trim() ? parts.preamble.trimEnd() : '']
    .filter(Boolean)
    .concat(keptOrder.map((b) => b.raw))
    .join('\n\n')
    .trimEnd();

  const rebuilt = [parts.before.trimEnd(), parts.headerLine, reqBody, parts.after]
    .filter((s, idx) => !(idx === 0 && s === ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  return {
    rebuilt,
    counts: {
      added: plan.added.length,
      modified: plan.modified.length,
      removed: plan.removed.length,
    },
  };
}

/**
 * Write an updated spec to disk.
 */
export async function writeUpdatedSpec(
  update: SpecUpdate,
  rebuilt: string,
  counts: { added: number; modified: number; removed: number }
): Promise<void> {
  // Create target directory if needed
  const targetDir = path.dirname(update.target);
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(update.target, rebuilt);

  const specName = path.basename(path.dirname(update.target));
  console.log(`Applying changes to .opsx/specs/${specName}/spec.md:`);
  if (counts.added) console.log(`  + ${counts.added} added`);
  if (counts.modified) console.log(`  ~ ${counts.modified} modified`);
  if (counts.removed) console.log(`  - ${counts.removed} removed`);
}

/**
 * Build a skeleton spec for new capabilities.
 */
function buildSpecSkeletonPurpose(changeName: string, projection: RuntimeProjection): string {
  return `This specification records behavior introduced by change ${changeName}. Replace this Purpose with the formal capability intent before archive.`;
}

export function buildSpecSkeleton(
  specFolderName: string,
  changeName: string,
  projection?: RuntimeProjection
): string {
  const titleBase = specFolderName;
  const effectiveProjection = projection ?? projectConfigForRuntime(null, { consumer: 'spec-skeleton' });
  return `# ${titleBase} Specification\n\n## Purpose\n${buildSpecSkeletonPurpose(changeName, effectiveProjection)}\n\n## Requirements\n`;
}

/**
 * Apply all delta specs from a change to main specs.
 *
 * @param projectRoot - The project root directory
 * @param changeName - The name of the change to apply
 * @param options - Options for the operation
 * @returns Result of the operation with counts
 */
export async function applySpecs(
  projectRoot: string,
  changeName: string,
  options: {
    dryRun?: boolean;
    skipValidation?: boolean;
    silent?: boolean;
  } = {}
): Promise<SpecsApplyOutput> {
  const changeDir = path.join(projectRoot, OPSX_DIR_NAME, 'changes', changeName);
  const mainSpecsDir = path.join(projectRoot, OPSX_DIR_NAME, 'specs');

  // Verify change exists
  try {
    const stat = await fs.stat(changeDir);
    if (!stat.isDirectory()) {
      throw new Error(`Change '${changeName}' not found.`);
    }
  } catch {
    throw new Error(`Change '${changeName}' not found.`);
  }

  // Find specs to update
  const specUpdates = await findSpecUpdates(changeDir, mainSpecsDir);

  if (specUpdates.length === 0) {
    return {
      changeName,
      capabilities: [],
      totals: { added: 0, modified: 0, removed: 0 },
      noChanges: true,
    };
  }

  // Prepare all updates first (validation pass, no writes)
  const prepared: Array<{
    update: SpecUpdate;
    rebuilt: string;
    counts: { added: number; modified: number; removed: number };
  }> = [];

  for (const update of specUpdates) {
    const built = await buildUpdatedSpec(update, changeName, projectRoot);
    prepared.push({ update, rebuilt: built.rebuilt, counts: built.counts });
  }

  // Validate rebuilt specs unless validation is skipped
  if (!options.skipValidation) {
    const validator = new Validator();
    for (const p of prepared) {
      const specName = path.basename(path.dirname(p.update.target));
      const report = await validator.validateSpecContent(specName, p.rebuilt);
      if (!report.valid) {
        const errors = report.issues
          .filter((i) => i.level === 'ERROR')
          .map((i) => `  ✗ ${i.message}`)
          .join('\n');
        throw new Error(`Validation errors in rebuilt spec for ${specName}:\n${errors}`);
      }
    }
  }

  // Build results
  const capabilities: ApplyResult[] = [];
  const totals = { added: 0, modified: 0, removed: 0 };

  for (const p of prepared) {
    const capability = path.basename(path.dirname(p.update.target));

    if (!options.dryRun) {
      // Write the updated spec
      const targetDir = path.dirname(p.update.target);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(p.update.target, p.rebuilt);

      if (!options.silent) {
        console.log(`Applying changes to .opsx/specs/${capability}/spec.md:`);
        if (p.counts.added) console.log(`  + ${p.counts.added} added`);
        if (p.counts.modified) console.log(`  ~ ${p.counts.modified} modified`);
        if (p.counts.removed) console.log(`  - ${p.counts.removed} removed`);
      }
    } else if (!options.silent) {
      console.log(`Would apply changes to .opsx/specs/${capability}/spec.md:`);
      if (p.counts.added) console.log(`  + ${p.counts.added} added`);
      if (p.counts.modified) console.log(`  ~ ${p.counts.modified} modified`);
      if (p.counts.removed) console.log(`  - ${p.counts.removed} removed`);
    }

    capabilities.push({
      capability,
      ...p.counts,
    });

    totals.added += p.counts.added;
    totals.modified += p.counts.modified;
    totals.removed += p.counts.removed;
  }

  return {
    changeName,
    capabilities,
    totals,
    noChanges: false,
  };
}
