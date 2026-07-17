import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { bootstrapInstructionsCommand, bootstrapPromoteCommand, bootstrapStatusCommand } from '../../src/commands/bootstrap.js';
import {
  bootstrapAdvanceCommand,
  bootstrapInitCommand,
  bootstrapValidateCommand,
} from '../../src/commands/bootstrap.js';
import {
  getBootstrapStatus,
  initBootstrap,
  refreshBootstrapDerivedArtifacts,
} from '../../src/utils/bootstrap-utils.js';

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

async function withCwd<T>(cwd: string, fn: () => Promise<T>): Promise<T> {
  const original = process.cwd();
  process.chdir(cwd);
  try {
    return await fn();
  } finally {
    process.chdir(original);
  }
}

async function captureJsonOutput(fn: () => Promise<void>): Promise<any> {
  const messages: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    messages.push(args.join(' '));
  };

  try {
    await fn();
  } finally {
    console.log = originalLog;
  }

  const output = messages.join('\n');
  const start = output.indexOf('{');
  if (start === -1) {
    throw new Error(`No JSON output captured: ${output}`);
  }
  return JSON.parse(output.slice(start));
}

async function captureTextOutput(fn: () => Promise<void>): Promise<string> {
  const messages: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    messages.push(args.join(' '));
  };

  try {
    await fn();
  } finally {
    console.log = originalLog;
  }

  return messages.join('\n');
}

async function setBootstrapPhase(projectDir: string, phase: string): Promise<void> {
  const metadataPath = path.join(projectDir, 'openspec', 'bootstrap', '.bootstrap.yaml');
  const metadata = parseYaml(await fs.readFile(metadataPath, 'utf-8')) as Record<string, unknown>;
  metadata.phase = phase;
  await fs.writeFile(metadataPath, stringifyYaml(metadata, { lineWidth: 0 }), 'utf-8');
}

describe('bootstrap command Phase 1 baseline contract', () => {
  let testDir: string;
  let originalIsTTY: boolean | undefined;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-bootstrap-cli-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });
    originalIsTTY = (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY;
  });

  afterEach(async () => {
    (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY = originalIsTTY;
    await fs.rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('returns structured pre-init status for raw repositories with an empty specs directory', async () => {
    await fs.mkdir(path.join(testDir, 'openspec', 'specs'), { recursive: true });

    const status = await withCwd(testDir, () => captureJsonOutput(() => bootstrapStatusCommand({ json: true })));
    expect(status).toMatchObject({
      initialized: false,
      baselineType: 'raw',
      supported: true,
      allowedModes: ['full', 'opsx-first'],
      nextAction: 'init',
    });
  });

  it('returns structured pre-init status for specs-based repositories', async () => {
    await fs.mkdir(path.join(testDir, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'openspec', 'specs', 'auth', 'spec.md'), '# Auth\n', 'utf-8');

    const status = await withCwd(testDir, () => captureJsonOutput(() => bootstrapStatusCommand({ json: true })));
    expect(status).toMatchObject({
      initialized: false,
      baselineType: 'specs-based',
      supported: true,
      allowedModes: ['full'],
      nextAction: 'init',
    });
  });

  it('returns structured pre-init status for formal-opsx repositories with refresh as the only allowed mode', async () => {
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), 'schema_version: 2\nproject:\n  id: demo\n  name: Demo\n');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n');

    const status = await withCwd(testDir, () => captureJsonOutput(() => bootstrapStatusCommand({ json: true })));
    expect(status).toMatchObject({
      initialized: false,
      baselineType: 'formal-opsx',
      supported: true,
      allowedModes: ['refresh'],
      nextAction: 'init',
    });
    expect(status.reason).toContain('Use refresh');
  });

  it('rejects semantically invalid two-file graphs as bootstrap baselines', async () => {
    await fs.writeFile(
      path.join(testDir, 'openspec', 'project.opsx.yaml'),
      'schema_version: 2\nproject:\n  id: demo\n  name: Demo\ncapabilities:\n  - id: cap.demo.run\n    type: capability\n'
    );
    await fs.writeFile(
      path.join(testDir, 'openspec', 'project.opsx.relations.yaml'),
      'schema_version: 2\nrelations: []\n'
    );

    const status = await withCwd(testDir, () => captureJsonOutput(() => bootstrapStatusCommand({ json: true })));
    expect(status).toMatchObject({
      initialized: false,
      baselineType: 'invalid-partial-opsx',
      supported: false,
      allowedModes: [],
    });
  });

  it('returns pre-init instructions json instead of init-first error', async () => {
    await fs.mkdir(path.join(testDir, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'openspec', 'specs', 'auth', 'spec.md'), '# Auth\n', 'utf-8');

    const instructions = await withCwd(
      testDir,
      () => captureJsonOutput(() => bootstrapInstructionsCommand(undefined, { json: true }))
    );
    expect(instructions).toMatchObject({
      initialized: false,
      phase: 'init',
      currentPhase: null,
      baselineType: 'specs-based',
      supported: true,
      allowedModes: ['full'],
      nextAction: 'init',
    });
    expect(instructions.instruction).toContain('Read `fileDefinitions` first');
    expect(instructions.instruction).toContain('MUST NOT copy file definitions');
    expect(instructions.instruction).toContain('Run: openspec bootstrap init --mode full');
    expect(instructions.fileDefinitions.map((file: { id: string }) => file.id)).toEqual([
      'metadata',
      'scope',
    ]);
  });

  it('prints file definitions before bootstrap phase instructions in text mode', async () => {
    await fs.mkdir(path.join(testDir, 'openspec', 'specs'), { recursive: true });

    const output = await withCwd(
      testDir,
      () => captureTextOutput(() => bootstrapInstructionsCommand(undefined, { json: false }))
    );

    const definitionsIndex = output.indexOf('<file_definitions>');
    const instructionIndex = output.indexOf('<instruction>');
    expect(definitionsIndex).toBeGreaterThanOrEqual(0);
    expect(instructionIndex).toBeGreaterThan(definitionsIndex);
    expect(output).toContain('"id": "metadata"');
    expect(output).toContain('"id": "scope"');
  });

  it('rejects unsupported mode on a formal-opsx baseline before creating bootstrap workspace', async () => {
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), 'schema_version: 2\nproject:\n  id: demo\n  name: Demo\n');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n');

    await expect(initBootstrap(testDir, { mode: 'full', granularity: 'fine' })).rejects.toThrow(
      "Bootstrap mode 'full' is not supported for baseline 'formal-opsx'. Valid modes: refresh"
    );
    await expect(fs.stat(path.join(testDir, 'openspec', 'bootstrap'))).rejects.toThrow();
  });

  it('keeps every refresh CLI guidance branch on complete-rebuild v2 semantics', async () => {
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), 'schema_version: 2\nproject:\n  id: demo\n  name: Demo\n');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n');

    const preInit = await withCwd(
      testDir,
      () => captureJsonOutput(() => bootstrapInstructionsCommand(undefined, { json: true }))
    );
    expect(preInit.instruction).toContain('complete candidate');
    expect(preInit.instruction).toContain('review diff');
    expect(preInit.instruction).toContain('replaces both formal OPSX v2 files');

    const initOutput = await withCwd(
      testDir,
      () => captureTextOutput(() => bootstrapInitCommand({ mode: 'refresh', granularity: 'fine' }))
    );
    expect(initOutput).toContain('complete candidate');
    expect(initOutput).toContain('review-only baseline evidence');

    for (const phase of ['scan', 'map', 'review']) {
      const result = await withCwd(
        testDir,
        () => captureJsonOutput(() => bootstrapInstructionsCommand(phase, { json: true }))
      );
      expect(result.instruction).not.toMatch(/git diff|code refs|existing formal OPSX bundle and current specs as the baseline/i);
      expect(result.fileDefinitions.length).toBeGreaterThan(0);
    }

    const initDefinitions = await withCwd(
      testDir,
      () => captureJsonOutput(() => bootstrapInstructionsCommand('init', { json: true }))
    );
    expect(initDefinitions.fileDefinitions.map((file: { id: string }) => file.id)).toEqual(['metadata', 'scope']);

    const scan = await withCwd(testDir, () => captureJsonOutput(() => bootstrapInstructionsCommand('scan', { json: true })));
    expect(scan.instruction).toContain('all current source, specs, configuration, and package/build metadata');
    expect(scan.fileDefinitions.map((file: { id: string }) => file.id)).toEqual(['metadata', 'scope', 'evidence']);
    const map = await withCwd(testDir, () => captureJsonOutput(() => bootstrapInstructionsCommand('map', { json: true })));
    expect(map.instruction).toContain('semantic relations');
    expect(map.instruction).toContain('review_gaps');
    expect(map.fileDefinitions.map((file: { id: string }) => file.id)).toEqual(['scope', 'evidence', 'domain-map']);
    const review = await withCwd(testDir, () => captureJsonOutput(() => bootstrapInstructionsCommand('review', { json: true })));
    expect(review.instruction).toContain('semantic relation type/direction');
    expect(review.instruction).toContain('review gaps');
    expect(review.fileDefinitions.map((file: { id: string }) => file.id)).toEqual([
      'evidence', 'domain-map', 'candidate-project', 'candidate-relations', 'candidate-specs', 'review',
    ]);
  });

  it('projects bootstrap inputs, derived candidates, and durable sources with distinct semantics', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });

    const scan = await withCwd(testDir, () =>
      captureJsonOutput(() => bootstrapInstructionsCommand('scan', { json: true }))
    );
    const evidence = scan.fileDefinitions.find((file: { id: string }) => file.id === 'evidence');
    expect(evidence.definition).toMatchObject({
      compilationRole: 'Retained bootstrap authoring input for architecture discovery.',
      content: {
        includes: [
          'Repository locations, candidate domains, confidence, provisional intents, and supporting evidence.',
        ],
        excludes: [
          'Final architecture claims, derived candidates, review approval, and unsupported conclusions.',
        ],
      },
    });

    const map = await withCwd(testDir, () =>
      captureJsonOutput(() => bootstrapInstructionsCommand('map', { json: true }))
    );
    const domainMap = map.fileDefinitions.find((file: { id: string }) => file.id === 'domain-map');
    expect(domainMap.definition.compilationRole).toBe(
      'Retained bootstrap authoring input compiled into candidate OPSX and Specs.'
    );
    expect(domainMap.definition.content.excludes[0]).toContain(
      'mechanical import or call edges presented as semantic relations'
    );

    const promote = await withCwd(testDir, () =>
      captureJsonOutput(() => bootstrapInstructionsCommand('promote', { json: true }))
    );
    expect(promote.fileDefinitions.map((file: { id: string }) => file.id)).toEqual([
      'candidate-project',
      'candidate-relations',
      'candidate-specs',
      'review',
      'formal-project',
      'formal-relations',
      'formal-specs',
    ]);
    const formalProject = promote.fileDefinitions.find(
      (file: { id: string }) => file.id === 'formal-project'
    );
    expect(formalProject.definition).toMatchObject({
      purpose: 'Define the current project intent and durable non-relation architecture model.',
      compilationRole: 'Durable architecture source in the formal OPSX bundle.',
    });
    const formalSpecs = promote.fileDefinitions.find(
      (file: { id: string }) => file.id === 'formal-specs'
    );
    expect(formalSpecs).toMatchObject({
      path: 'openspec/specs/**/*.md',
      definition: {
        purpose: 'Define the observable behavior the current program must continue to exhibit.',
        compilationRole: 'Durable behavior source in the formal Specs collection.',
        writePolicy: 'workflow-managed',
        validation: ['openspec validate --specs --strict'],
      },
    });
  });

  it('publicly advances init to scan and reports the transition', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });

    const output = await withCwd(
      testDir,
      () => captureJsonOutput(() => bootstrapAdvanceCommand('scan', { json: true }))
    );

    expect(output).toEqual({ fromPhase: 'init', toPhase: 'scan' });
    const status = await getBootstrapStatus(testDir);
    expect(status.initialized && status.phase).toBe('scan');
    expect(status.initialized && status.nextAction).toBe('map');
    expect(status.initialized && status.transitionCommand).toBeNull();
  });

  it('reports the public transition while phase is init', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });

    const status = await withCwd(
      testDir,
      () => captureJsonOutput(() => bootstrapStatusCommand({ json: true }))
    );

    expect(status).toMatchObject({
      phase: 'init',
      nextAction: 'scan',
      transitionCommand: 'openspec bootstrap advance scan',
    });
  });

  it('rejects public phase skips and transitions after init', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });

    await expect(
      withCwd(testDir, () => bootstrapAdvanceCommand('map', { json: true }))
    ).rejects.toThrow("only supports 'init' -> 'scan'");

    await withCwd(testDir, () => bootstrapAdvanceCommand('scan', { json: true }));
    await expect(
      withCwd(testDir, () => bootstrapAdvanceCommand('scan', { json: true }))
    ).rejects.toThrow("only supports 'init' -> 'scan'");
  });

  it('allows formal-opsx repositories to initialize refresh mode', async () => {
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), 'schema_version: 2\nproject:\n  id: demo\n  name: Demo\n');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n');

    await initBootstrap(testDir, { mode: 'refresh', granularity: 'fine' });

    const metadata = await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml'), 'utf-8');
    expect(metadata).toContain('baseline_type: formal-opsx');
    expect(metadata).toContain('mode: refresh');
    await expect(fs.stat(path.join(testDir, 'openspec', 'bootstrap'))).resolves.toBeDefined();
  });

  it('rejects unsupported baseline-to-mode combinations with valid modes listed', async () => {
    await fs.mkdir(path.join(testDir, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'openspec', 'specs', 'auth', 'spec.md'), '# Auth\n', 'utf-8');

    await expect(initBootstrap(testDir, { mode: 'opsx-first', granularity: 'fine' })).rejects.toThrow(
      "Bootstrap mode 'opsx-first' is not supported for baseline 'specs-based'. Valid modes: full"
    );
    await expect(fs.stat(path.join(testDir, 'openspec', 'bootstrap'))).rejects.toThrow();
  });

  it('persists baseline type and approved mode names on init', async () => {
    await initBootstrap(testDir, { mode: 'opsx-first', granularity: 'fine' });
    const metadata = await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml'), 'utf-8');
    expect(metadata).toContain('baseline_type: raw');
    expect(metadata).toContain('mode: opsx-first');
  });

  it('prompts for bootstrap mode on TTY when --mode is omitted', async () => {
    const { select } = await import('@inquirer/prompts');
    const mockSelect = select as unknown as ReturnType<typeof vi.fn>;
    (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY = true;
    mockSelect.mockResolvedValueOnce('opsx-first');
    mockSelect.mockResolvedValueOnce('coarse');

    await withCwd(testDir, () => bootstrapInitCommand({}));

    expect(mockSelect).toHaveBeenCalledWith({
      message: 'Select bootstrap mode',
      choices: [
        { name: 'full', value: 'full' },
        { name: 'opsx-first', value: 'opsx-first' },
      ],
    });

    const metadata = await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml'), 'utf-8');
    expect(metadata).toContain('mode: opsx-first');
  });

  it('fails fast on non-TTY when --mode is omitted', async () => {
    const { select } = await import('@inquirer/prompts');
    const mockSelect = select as unknown as ReturnType<typeof vi.fn>;
    (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY = false;

    await expect(withCwd(testDir, () => bootstrapInitCommand({ granularity: 'fine' }))).rejects.toThrow(
      'Missing required option --mode in non-interactive mode.'
    );
    expect(mockSelect).not.toHaveBeenCalled();
    await expect(fs.stat(path.join(testDir, 'openspec', 'bootstrap'))).rejects.toThrow();
  });

  it('does not prompt on TTY when --mode is explicitly provided', async () => {
    const { select } = await import('@inquirer/prompts');
    const mockSelect = select as unknown as ReturnType<typeof vi.fn>;
    (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY = true;

    await withCwd(testDir, () => bootstrapInitCommand({ mode: 'full', granularity: 'fine' }));

    expect(mockSelect).not.toHaveBeenCalled();
    const metadata = await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml'), 'utf-8');
    expect(metadata).toContain('mode: full');
  });

  it('allows explicit --mode on non-TTY without prompting', async () => {
    const { select } = await import('@inquirer/prompts');
    const mockSelect = select as unknown as ReturnType<typeof vi.fn>;
    (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY = false;

    await withCwd(testDir, () => bootstrapInitCommand({ mode: 'opsx-first', granularity: 'fine' }));

    expect(mockSelect).not.toHaveBeenCalled();
    const metadata = await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml'), 'utf-8');
    expect(metadata).toContain('mode: opsx-first');
  });

  it('bootstrap validate restores current derived states after an invalid domain-map is fixed', async () => {
    const originalExitCode = process.exitCode;
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });

    await fs.mkdir(path.join(testDir, 'src', 'auth'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'auth', 'index.ts'), 'export {};\n', 'utf-8');
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'evidence.yaml'),
      `domains:
  - id: dom.auth
    confidence: high
    sources:
      - code:src/auth/index.ts
    intent: Authentication
`,
      'utf-8'
    );
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.auth.yaml'),
      `domain:
  id: dom.auth
  type: domain
  intent: Authentication boundary
capabilities:
  - id: cap.auth.login
    type: capability
    intent: Login users
    spec:
      folder: auth
      purpose: Login users purpose
      requirements:
        - title: Login
          text: The system SHALL authenticate users.
          scenarios:
            - title: Successful login
              steps:
                - keyword: WHEN
                  text: valid credentials are submitted
                - keyword: THEN
                  text: access is granted
relations:
  - from: cap.auth.login
    to: dom.auth
    type: belongs_to
`,
      'utf-8'
    );

    await refreshBootstrapDerivedArtifacts(testDir);
    await setBootstrapPhase(testDir, 'review');

    let status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('current');
    expect(status.reviewState).toBe('current');

    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.auth.yaml'),
      `domain:
  id: dom.auth
capabilities:
  - id: invalid-capability
    type: capability
    intent: broken
`,
      'utf-8'
    );

    status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('stale');
    expect(status.reviewState).toBe('stale');

    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.auth.yaml'),
      `domain:
  id: dom.auth
  type: domain
  intent: Authentication boundary
capabilities:
  - id: cap.auth.login
    type: capability
    intent: Login users
    spec:
      folder: auth
      purpose: Login users purpose
      requirements:
        - title: Login
          text: The system SHALL authenticate users.
          scenarios:
            - title: Successful login
              steps:
                - keyword: WHEN
                  text: valid credentials are submitted
                - keyword: THEN
                  text: access is granted
relations:
  - from: cap.auth.login
    to: dom.auth
    type: belongs_to
`,
      'utf-8'
    );

    process.exitCode = undefined;
    const validateResult = await withCwd(
      testDir,
      () => captureJsonOutput(() => bootstrapValidateCommand({ json: true }))
    );
    expect(validateResult.phase).toBe('review');

    status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('current');
    expect(status.reviewState).toBe('current');
    process.exitCode = originalExitCode;
  });

  it('prints the retained bootstrap workspace notice after promote succeeds', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });

    await fs.mkdir(path.join(testDir, 'src', 'auth'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'auth', 'index.ts'), 'export {};\n', 'utf-8');
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'evidence.yaml'),
      `domains:
  - id: dom.auth
    confidence: high
    sources:
      - code:src/auth/index.ts
    intent: Authentication
`,
      'utf-8'
    );
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.auth.yaml'),
      `domain:
  id: dom.auth
  type: domain
  intent: Authentication boundary
capabilities:
  - id: cap.auth.login
    type: capability
    intent: Login users
    spec:
      folder: auth
      purpose: Login users purpose
      requirements:
        - title: Login
          text: The system SHALL authenticate users.
          scenarios:
            - title: Successful login
              steps:
                - keyword: WHEN
                  text: valid credentials are submitted
                - keyword: THEN
                  text: access is granted
relations:
  - from: cap.auth.login
    to: dom.auth
    type: belongs_to
`,
      'utf-8'
    );

    await refreshBootstrapDerivedArtifacts(testDir);

    const reviewPath = path.join(testDir, 'openspec', 'bootstrap', 'review.md');
    const review = await fs.readFile(reviewPath, 'utf-8');
    await fs.writeFile(reviewPath, review.replace(/- \[ \]/g, '- [x]'), 'utf-8');

    const output = await withCwd(testDir, () => captureTextOutput(() => bootstrapPromoteCommand({ yes: true })));

    expect(output).toContain(
      'Bootstrap workspace retained at openspec/bootstrap/. To start the next refresh run with retained granularity, use `openspec bootstrap init --mode refresh --restart`; pass `--granularity coarse|fine` to override it.'
    );
  });

  it('infers legacy completed non-refresh workspaces from the two formal OPSX v2 files', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await setBootstrapPhase(testDir, 'promote');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), 'schema_version: 2\nproject:\n  id: demo\n  name: Demo\n', 'utf-8');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n', 'utf-8');

    const metadataPath = path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml');
    const metadata = parseYaml(await fs.readFile(metadataPath, 'utf-8')) as Record<string, unknown>;
    delete metadata.completed_at;
    await fs.writeFile(metadataPath, stringifyYaml(metadata, { lineWidth: 0 }), 'utf-8');

    const statusJson = await withCwd(testDir, () => captureJsonOutput(() => bootstrapStatusCommand({ json: true })));
    expect(statusJson.workspaceState).toBe('completed');
    expect(statusJson.nextAction).toBe('restart');
    expect(statusJson.restartCommand).toBe('openspec bootstrap init --mode refresh --restart');
  });

  it('reports completed retained workspaces as restartable instead of resumable', async () => {
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), 'schema_version: 2\nproject:\n  id: demo\n  name: Demo\n', 'utf-8');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n', 'utf-8');
    await initBootstrap(testDir, { mode: 'refresh', granularity: 'fine' });
    await setBootstrapPhase(testDir, 'promote');

    const metadataPath = path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml');
    const metadata = parseYaml(await fs.readFile(metadataPath, 'utf-8')) as Record<string, unknown>;
    metadata.completed_at = '2026-04-20T00:00:00.000Z';
    metadata.refresh_anchor_commit = 'abc123';
    await fs.writeFile(metadataPath, stringifyYaml(metadata, { lineWidth: 0 }), 'utf-8');

    const statusJson = await withCwd(testDir, () => captureJsonOutput(() => bootstrapStatusCommand({ json: true })));
    expect(statusJson.workspaceState).toBe('completed');
    expect(statusJson.nextAction).toBe('restart');
    expect(statusJson.restartCommand).toBe('openspec bootstrap init --mode refresh --restart');

    const instructions = await withCwd(
      testDir,
      () => captureTextOutput(() => bootstrapInstructionsCommand(undefined, { json: false }))
    );
    expect(instructions).toContain('## Bootstrap: completed workspace');
    expect(instructions).toContain('<file_definitions>');
    expect(instructions).toContain('"id": "candidate-project"');
    expect(instructions.indexOf('<file_definitions>')).toBeLessThan(instructions.indexOf('<instruction>'));
    expect(instructions.indexOf('Read `fileDefinitions` first.')).toBeLessThan(
      instructions.indexOf('openspec bootstrap init --mode refresh --restart')
    );
    expect(instructions).toContain('openspec bootstrap init --mode refresh --restart');
    expect(instructions).not.toContain('## Bootstrap: promote phase');
  });

  // ─── Task 1: Granularity persistence tests ───────────────────────────────

  it('init with --granularity coarse writes granularity: coarse to scope.yaml', async () => {
    await withCwd(testDir, () => bootstrapInitCommand({ mode: 'full', granularity: 'coarse' }));
    const scopeRaw = await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'scope.yaml'), 'utf-8');
    expect(scopeRaw).toContain('granularity: coarse');
  });

  it('init without --granularity fails fast', async () => {
    (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY = false;
    await expect(
      withCwd(testDir, () => bootstrapInitCommand({ mode: 'full' }))
    ).rejects.toThrow('--granularity coarse|fine');
    await expect(fs.stat(path.join(testDir, 'openspec', 'bootstrap'))).rejects.toThrow();
  });

  it('init with invalid --granularity fails fast', async () => {
    await expect(
      withCwd(testDir, () => bootstrapInitCommand({ mode: 'full', granularity: 'medium' }))
    ).rejects.toThrow();
    await expect(fs.stat(path.join(testDir, 'openspec', 'bootstrap', 'scope.yaml'))).rejects.toThrow();
  });

  it('refresh restart without --granularity inherits retained scope granularity', async () => {
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), 'schema_version: 2\nproject:\n  id: demo\n  name: Demo\n', 'utf-8');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n', 'utf-8');
    await initBootstrap(testDir, { mode: 'refresh', granularity: 'coarse' });
    await setBootstrapPhase(testDir, 'promote');

    const metadataPath = path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml');
    const metadata = parseYaml(await fs.readFile(metadataPath, 'utf-8')) as Record<string, unknown>;
    metadata.completed_at = '2026-07-14T00:00:00.000Z';
    await fs.writeFile(metadataPath, stringifyYaml(metadata, { lineWidth: 0 }), 'utf-8');

    await withCwd(testDir, () => bootstrapInitCommand({ mode: 'refresh', restart: true }));

    const scope = parseYaml(
      await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'scope.yaml'), 'utf-8')
    ) as Record<string, unknown>;
    expect(scope.granularity).toBe('coarse');
  });
});
