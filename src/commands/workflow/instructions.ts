/**
 * Instructions Command
 *
 * Generates enriched instructions for creating artifacts or applying tasks.
 * Includes both artifact instructions and apply instructions.
 */

import ora from 'ora';
import path from 'path';
import * as fs from 'fs';
import {
  loadChangeContext,
  generateInstructions,
  resolveSchema,
  resolveArtifactOutputs,
  type ArtifactInstructions,
} from '../../core/artifact-graph/index.js';
import {
  validateChangeExists,
  validateSchemaExists,
  type TaskItem,
  type ApplyInstructions,
} from './shared.js';
import { readQualityCompletion } from '../../core/quality/state.js';
import { readProjectConfig } from '../../core/project-config.js';
import { projectConfigForInstructions } from '../../core/config-projection.js';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface InstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

export interface ApplyInstructionsOptions {
  change?: string;
  schema?: string;
  json?: boolean;
}

// -----------------------------------------------------------------------------
// Artifact Instructions Command
// -----------------------------------------------------------------------------

export async function instructionsCommand(
  artifactId: string | undefined,
  options: InstructionsOptions
): Promise<void> {
  const spinner = options.json ? undefined : ora('Generating instructions...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // loadChangeContext will auto-detect schema from metadata if not provided
    const context = loadChangeContext(projectRoot, changeName, options.schema);

    if (!artifactId) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `Missing required argument <artifact>. Valid artifacts:\n  ${validIds.join('\n  ')}`
      );
    }

    const artifact = context.graph.getArtifact(artifactId);

    if (!artifact) {
      spinner?.stop();
      const validIds = context.graph.getAllArtifacts().map((a) => a.id);
      throw new Error(
        `Artifact '${artifactId}' not found in schema '${context.schemaName}'. Valid artifacts:\n  ${validIds.join('\n  ')}`
      );
    }

    const instructions = generateInstructions(context, artifactId, projectRoot);
    const isBlocked = instructions.dependencies.some((d) => !d.done);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printInstructionsText(instructions, isBlocked);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printInstructionsText(instructions: ArtifactInstructions, isBlocked: boolean): void {
  const {
    artifactId,
    changeName,
    schemaName,
    changeDir,
    outputPath,
    currentState,
    description,
    definition,
    fileDefinitions,
    instruction,
    configProjection,
    template,
    dependencies,
    unlocks,
  } = instructions;

  // Opening tag
  console.log(`<artifact id="${artifactId}" change="${changeName}" schema="${schemaName}">`);
  console.log();

  // Warning for blocked artifacts
  if (isBlocked) {
    const missing = dependencies.filter((d) => !d.done).map((d) => d.id);
    console.log('<warning>');
    console.log('This artifact has unmet dependencies. Complete them first or proceed with caution.');
    console.log(`Missing: ${missing.join(', ')}`);
    console.log('</warning>');
    console.log();
  }

  // Task directive
  console.log('<task>');
  console.log(`Create the ${artifactId} artifact for change "${changeName}".`);
  console.log(description);
  console.log('</task>');
  console.log();

  if (definition) {
    console.log('<definition>');
    console.log('Do not copy this definition into the artifact.');
    console.log(JSON.stringify(definition, null, 2));
    console.log('</definition>');
    console.log();
  }

  if (fileDefinitions && fileDefinitions.length > 0) {
    console.log('<file_definitions>');
    console.log('Read these definitions before following the phase instruction.');
    console.log(JSON.stringify(fileDefinitions, null, 2));
    console.log('</file_definitions>');
    console.log();
  }

  // Dependencies (files to read for context)
  if (dependencies.length > 0) {
    console.log('<dependencies>');
    console.log('Read these files for context before creating this artifact:');
    console.log();
    for (const dep of dependencies) {
      const status = dep.done ? 'done' : 'missing';
      const fullPath = path.join(changeDir, dep.path);
      console.log(`<dependency id="${dep.id}" status="${status}">`);
      console.log(`  <path>${fullPath}</path>`);
      console.log(`  <description>${dep.description}</description>`);
      console.log('</dependency>');
    }
    console.log('</dependencies>');
    console.log();
  }

  console.log(`<current_state completed="${currentState.completed}">`);
  if (currentState.outputs.length === 0) {
    console.log('No current artifact outputs.');
  } else {
    for (const currentOutput of currentState.outputs) {
      console.log(`<output>${currentOutput}</output>`);
    }
  }
  if (currentState.completionMarker) {
    console.log(`<completion_marker present="${currentState.completionMarker.present}">${currentState.completionMarker.path}</completion_marker>`);
  }
  console.log('</current_state>');
  console.log();

  const context = configProjection.prompt.fragments.find((fragment) => fragment.key === 'context')?.lines.join('\n');
  const rules = configProjection.prompt.fragments.find((fragment) => fragment.key === 'rules')?.lines;

  // Project context (AI constraint - do not include in output)
  if (context) {
    console.log('<project_context>');
    console.log('<!-- This is background information for you. Do NOT include this in your output. -->');
    console.log(context);
    console.log('</project_context>');
    console.log();
  }

  // Rules (AI constraint - do not include in output)
  if (rules && rules.length > 0) {
    console.log('<rules>');
    console.log('<!-- These are constraints for you to follow. Do NOT include this in your output. -->');
    for (const rule of rules) {
      console.log(`- ${rule}`);
    }
    console.log('</rules>');
    console.log();
  }

  const remainingFragments = configProjection.prompt.fragments.filter(
    (fragment) => fragment.key !== 'context' && fragment.key !== 'rules'
  );
  if (remainingFragments.length > 0) {
    console.log('<config_projection>');
    console.log('<!-- This is the compiled config contract. Do NOT copy it into the artifact. -->');
    for (const fragment of remainingFragments) {
      console.log(`<fragment key="${fragment.key}" scope="${fragment.scope}">`);
      for (const line of fragment.lines) {
        console.log(line);
      }
      console.log('</fragment>');
    }
    console.log('</config_projection>');
    console.log();
  }

  // Output location
  console.log('<output>');
  console.log(`Write to: ${path.join(changeDir, outputPath)}`);
  console.log('</output>');
  console.log();

  // Instruction (guidance)
  if (instruction) {
    console.log('<instruction>');
    console.log(instruction.trim());
    console.log('</instruction>');
    console.log();
  }

  // Template
  console.log('<template>');
  console.log('<!-- Use this as the structure for your output file. Fill in the sections. -->');
  console.log(template.trim());
  console.log('</template>');
  console.log();

  // Success criteria placeholder
  console.log('<success_criteria>');
  console.log('<!-- To be defined in schema validation rules -->');
  console.log('</success_criteria>');
  console.log();

  // Unlocks
  if (unlocks.length > 0) {
    console.log('<unlocks>');
    console.log(`Completing this artifact enables: ${unlocks.join(', ')}`);
    console.log('</unlocks>');
    console.log();
  }

  // Closing tag
  console.log('</artifact>');
}

// -----------------------------------------------------------------------------
// Apply Instructions Command
// -----------------------------------------------------------------------------

function parseTasksFile(content: string): TaskItem[] {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const goalsHeading = lines.findIndex((line) => /^##\s+Goals\s*$/.test(line));
  if (goalsHeading < 0) return [];

  const tasks: TaskItem[] = [];
  for (let i = goalsHeading + 1; i < lines.length && !/^##\s+/.test(lines[i]); i++) {
    const match = lines[i].match(/^\s*-\s+\[([ xX])\]\s+(G\d+):\s*(.+?)\s*$/);
    if (!match) continue;
    tasks.push({
      id: match[2],
      description: match[3],
      done: match[1].toLowerCase() === 'x',
    });
  }
  return tasks;
}

async function resolveCompletedApplyState(
  changeDir: string,
  projectRoot: string
): Promise<Pick<ApplyInstructions, 'state' | 'instruction'>> {
  const qualityState = await readQualityCompletion(changeDir, projectRoot);

  if (qualityState.status === 'needs_review' || qualityState.unsupported) {
    return {
      state: 'needs_review',
      instruction:
                'All tasks are complete, but passing full-change Review evidence is missing or invalid. Read `xirang quality status` and record an independent Review bound to an existing commit.',
    };
  }

  if (qualityState.status === 'needs_optimize' || qualityState.gaps.length > 0) {
    return {
      state: 'needs_optimize',
      instruction:
        'All tasks are complete, but Opt disposition or Seal is missing. Read `xirang quality status`; record the main Agent\'s explicit Opt choice and Seal declaration for an existing commit.',
    };
  }

  return {
    state: 'all_done',
    instruction:
      'All tasks are complete and the Quality record contains a passing commit-bound Review, explicit Opt disposition and valid Seal commit.\nThis change is ready to be archived.',
  };
}

/**
 * Generates apply instructions for implementing tasks from a change.
 * Schema-aware: reads apply phase configuration from schema to determine
 * required artifacts, tracking file, and instruction.
 */
export async function generateApplyInstructions(
  projectRoot: string,
  changeName: string,
  schemaName?: string
): Promise<ApplyInstructions> {
  // loadChangeContext will auto-detect schema from metadata if not provided
  const context = loadChangeContext(projectRoot, changeName, schemaName);
  const changeDir = context.changeDir;
  const configProjection = projectConfigForInstructions(readProjectConfig(projectRoot), {
    surface: 'apply',
  });

  // Get the full schema to access the apply phase configuration
  const schema = resolveSchema(context.schemaName, projectRoot);
  const applyConfig = schema.apply;

  // Determine required artifacts and tracking file from schema
  // Fallback: if no apply block, require all artifacts
  const requiredArtifactIds = applyConfig?.requires ?? schema.artifacts.map((a) => a.id);
  const tracksFile = applyConfig?.tracks ?? null;
  const schemaInstruction = applyConfig?.instruction ?? null;
  const prerequisiteWorkflow = 'Propose';

  // Check which required artifacts are missing
  const missingArtifacts: string[] = [];
  for (const artifactId of requiredArtifactIds) {
    const artifact = schema.artifacts.find((a) => a.id === artifactId);
    if (artifact && resolveArtifactOutputs(changeDir, artifact.generates).length === 0) {
      missingArtifacts.push(artifactId);
    }
  }

  // Build context files from all existing artifacts in schema
  const contextFiles: Record<string, string[]> = {};
  for (const artifact of schema.artifacts) {
    const outputs = resolveArtifactOutputs(changeDir, artifact.generates);
    if (outputs.length > 0) {
      contextFiles[artifact.id] = outputs;
    }
  }

  // Parse tasks if tracking file exists
  let tasks: TaskItem[] = [];
  let tracksFileExists = false;
  if (tracksFile) {
    const tracksPath = path.join(changeDir, tracksFile);
    tracksFileExists = fs.existsSync(tracksPath);
    if (tracksFileExists) {
      const tasksContent = await fs.promises.readFile(tracksPath, 'utf-8');
      tasks = parseTasksFile(tasksContent);
    }
  }

  // Calculate progress
  const total = tasks.length;
  const complete = tasks.filter((t) => t.done).length;
  const remaining = total - complete;

  // Determine state and instruction
  let state: ApplyInstructions['state'];
  let instruction: string;

  if (missingArtifacts.length > 0) {
    state = 'blocked';
    instruction = `Cannot apply this change yet. Missing artifacts: ${missingArtifacts.join(', ')}.\nReturn to the ${prerequisiteWorkflow} workflow to complete the missing artifacts before Apply.`;
  } else if (tracksFile && !tracksFileExists) {
    // Tracking file configured but doesn't exist yet
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `The ${tracksFilename} file is missing and must be created.\nReturn to the ${prerequisiteWorkflow} workflow to create ${tracksFilename} before Apply.`;
  } else if (tracksFile && tracksFileExists && total === 0) {
    // Tracking file exists but contains no tasks
    const tracksFilename = path.basename(tracksFile);
    state = 'blocked';
    instruction = `The ${tracksFilename} file exists but contains no tasks.\nReturn to the ${prerequisiteWorkflow} workflow to reconcile ${tracksFilename} before Apply.`;
  } else if (tracksFile && remaining === 0 && total > 0) {
    ({ state, instruction } = await resolveCompletedApplyState(changeDir, projectRoot));
  } else if (!tracksFile) {
    // No tracking file configured in schema - ready to apply
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? 'All required artifacts complete. Proceed with implementation.';
  } else {
    state = 'ready';
    instruction = schemaInstruction?.trim() ?? 'Read context files, work through pending tasks, mark complete as you go.\nPause if you hit blockers or need clarification.';
  }

  return {
    changeName,
    changeDir,
    schemaName: context.schemaName,
    contextFiles,
    configProjection,
    progress: { total, complete, remaining },
    tasks,
    state,
    missingArtifacts: missingArtifacts.length > 0 ? missingArtifacts : undefined,
    instruction,
  };
}

export async function applyInstructionsCommand(options: ApplyInstructionsOptions): Promise<void> {
  const spinner = options.json ? undefined : ora('Generating apply instructions...').start();

  try {
    const projectRoot = process.cwd();
    const changeName = await validateChangeExists(options.change, projectRoot);

    // Validate schema if explicitly provided
    if (options.schema) {
      validateSchemaExists(options.schema, projectRoot);
    }

    // generateApplyInstructions uses loadChangeContext which auto-detects schema
    const instructions = await generateApplyInstructions(projectRoot, changeName, options.schema);

    spinner?.stop();

    if (options.json) {
      console.log(JSON.stringify(instructions, null, 2));
      return;
    }

    printApplyInstructionsText(instructions);
  } catch (error) {
    spinner?.stop();
    throw error;
  }
}

export function printApplyInstructionsText(instructions: ApplyInstructions): void {
  const { changeName, schemaName, contextFiles, configProjection, progress, tasks, state, missingArtifacts, instruction } = instructions;

  console.log(`## Apply: ${changeName}`);
  console.log(`Schema: ${schemaName}`);
  console.log();

  // Warning for blocked state
  if (state === 'blocked' && missingArtifacts) {
    console.log('### ⚠️ Blocked');
    console.log();
    console.log(`Missing artifacts: ${missingArtifacts.join(', ')}`);
    console.log();
  }

  if (state === 'needs_review') {
    console.log('### Review Required');
    console.log();
  }

  if (state === 'needs_optimize') {
    console.log('### Optimization Required');
    console.log();
  }

  // Context files (dynamically from schema)
  const contextFileEntries = Object.entries(contextFiles);
  if (contextFileEntries.length > 0) {
    console.log('### Context Files');
    for (const [artifactId, filePaths] of contextFileEntries) {
      for (const filePath of filePaths) {
        console.log(`- ${artifactId}: ${filePath}`);
      }
    }
    console.log();
  }

  if (configProjection.prompt.fragments.length > 0) {
    console.log('<config_projection>');
    console.log('<!-- This is the compiled config contract. Do NOT copy it into implementation artifacts. -->');
    for (const fragment of configProjection.prompt.fragments) {
      console.log(`<fragment key="${fragment.key}" scope="${fragment.scope}">`);
      for (const line of fragment.lines) {
        console.log(line);
      }
      console.log('</fragment>');
    }
    console.log('</config_projection>');
    console.log();
  }

  // Progress (only show if we have tracking)
  if (progress.total > 0 || tasks.length > 0) {
    console.log('### Progress');
    if (state === 'all_done') {
      console.log(`${progress.complete}/${progress.total} complete ✓`);
    } else {
      console.log(`${progress.complete}/${progress.total} complete`);
    }
    console.log();
  }

  // Tasks
  if (tasks.length > 0) {
    console.log('### Tasks');
    for (const task of tasks) {
      const checkbox = task.done ? '[x]' : '[ ]';
      console.log(`- ${checkbox} ${task.description}`);
    }
    console.log();
  }

  // Instruction
  console.log('### Instruction');
  console.log(instruction);
}
