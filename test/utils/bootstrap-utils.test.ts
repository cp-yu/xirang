import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  BOOTSTRAP_WORKSPACE_RETAINED_NOTICE,
  getBootstrapStatus,
  initBootstrap,
  promoteBootstrap,
  refreshBootstrapDerivedArtifacts,
  readBootstrapState,
  validateGate,
} from '../../src/utils/bootstrap-utils.js';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

describe('bootstrap-utils invalid domain-map handling', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-bootstrap-utils-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function writeEvidence(domains: string[]): Promise<void> {
    const content = [
      'domains:',
      ...domains.flatMap((domainId, index) => [
        `  - id: ${domainId}`,
        `    confidence: ${index === 0 ? 'high' : index === 1 ? 'medium' : 'low'}`,
        '    sources:',
        `      - code:src/${domainId.replace('dom.', '')}/index.ts`,
        `    intent: ${domainId} intent`,
      ]),
      '',
    ].join('\n');

    await fs.writeFile(path.join(testDir, 'openspec', 'bootstrap', 'evidence.yaml'), content, 'utf-8');
  }

  async function writeScope(scope: {
    mode?: 'full' | 'opsx-first' | 'seed';
    include?: string[];
    exclude?: string[];
    granularity?: 'coarse' | 'fine';
  }): Promise<void> {
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'scope.yaml'),
      stringifyYaml({
        mode: scope.mode ?? 'full',
        include: scope.include ?? [],
        exclude: scope.exclude ?? [],
        granularity: scope.granularity ?? 'fine',
      }),
      'utf-8'
    );
  }

  async function writeDomainMap(options: {
    domainId: string;
    capabilityId?: string;
    folder?: string;
    requirementText?: string;
    whenText?: string;
    thenText?: string;
    extraSteps?: Array<{ keyword: 'GIVEN' | 'WHEN' | 'THEN' | 'AND'; text: string }>;
  }): Promise<void> {
    const domainId = options.domainId;
    const capabilityId = options.capabilityId ?? `cap.${domainId.slice(4)}.work`;
    const domainSuffix = domainId.replace('dom.', '');
    const folder = options.folder ?? domainSuffix;
    const requirementText = options.requirementText ?? `The system SHALL support ${capabilityId}.`;
    const whenText = options.whenText ?? `${capabilityId} is invoked`;
    const thenText = options.thenText ?? `${capabilityId} succeeds`;

    const filePath = path.join(testDir, 'openspec', 'bootstrap', 'domain-map', `${domainId}.yaml`);
    const content = stringifyYaml(
      {
        domain: {
          id: domainId,
          type: 'domain',
          intent: `${domainId} boundary`,
        },
        capabilities: [
          {
            id: capabilityId,
            type: 'capability',
            intent: `${capabilityId} intent`,
            spec: {
              folder,
              purpose: `${capabilityId} purpose`,
              requirements: [
                {
                  title: `${capabilityId} requirement`,
                  text: requirementText,
                  scenarios: [
                    {
                      title: 'Basic flow',
                      steps: [
                        { keyword: 'WHEN', text: whenText },
                        { keyword: 'THEN', text: thenText },
                        ...(options.extraSteps ?? []),
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
        relations: [
          {
            from: capabilityId,
            to: domainId,
            type: 'belongs_to',
          },
        ],
      },
      { lineWidth: 0 }
    );

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', domainSuffix), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', domainSuffix, 'index.ts'), 'export {};\n', 'utf-8');
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async function writeValidDomainMap(domainId: string, capabilityId = `cap.${domainId.slice(4)}.work`): Promise<void> {
    const filePath = path.join(testDir, 'openspec', 'bootstrap', 'domain-map', `${domainId}.yaml`);
    void filePath;
    await writeDomainMap({ domainId, capabilityId });
  }

  async function writeInvalidDomainMap(domainId: string): Promise<void> {
    const filePath = path.join(testDir, 'openspec', 'bootstrap', 'domain-map', `${domainId}.yaml`);
    const content = `domain:
  id: ${domainId}
capabilities:
  - id: invalid-capability
    type: capability
    intent: broken capability
`;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async function approveReview(): Promise<void> {
    const reviewPath = path.join(testDir, 'openspec', 'bootstrap', 'review.md');
    const review = await fs.readFile(reviewPath, 'utf-8');
    await fs.writeFile(reviewPath, review.replace(/- \[ \]/g, '- [x]'), 'utf-8');
  }

  function getDomain(status: Extract<Awaited<ReturnType<typeof getBootstrapStatus>>, { initialized: true }>, domainId: string) {
    const domain = status.domains.find((entry) => entry.id === domainId);
    expect(domain).toBeDefined();
    return domain!;
  }

  it('distinguishes valid, missing, and invalid domain-map states in bootstrap status', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth', 'dom.billing', 'dom.docs']);
    await writeValidDomainMap('dom.auth');
    await writeInvalidDomainMap('dom.billing');

    const status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }

    const validDomain = getDomain(status, 'dom.auth');
    expect(validDomain.mapState).toBe('valid');
    expect(validDomain.mapped).toBe(true);
    expect(validDomain.capabilityCount).toBe(1);

    const invalidDomain = getDomain(status, 'dom.billing');
    expect(invalidDomain.mapState).toBe('invalid');
    expect(invalidDomain.mapped).toBe(false);
    expect(invalidDomain.mapError).toContain('Invalid input');

    const missingDomain = getDomain(status, 'dom.docs');
    expect(missingDomain.mapState).toBe('missing');
    expect(missingDomain.mapped).toBe(false);
    expect(missingDomain.mapError).toBeUndefined();
  });

  it('fails map_to_review and downgrades derived artifacts to stale when a domain-map becomes invalid', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);
    let status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('current');
    expect(status.reviewState).toBe('current');

    await writeInvalidDomainMap('dom.auth');

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Domain 'dom.auth' has invalid domain-map: dom.auth.yaml"),
      ])
    );
    expect(gate.errors.join('\n')).not.toContain('has no domain-map file');

    status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('stale');
    expect(status.reviewState).toBe('stale');
    expect(getDomain(status, 'dom.auth').mapState).toBe('invalid');

    await expect(promoteBootstrap(testDir)).rejects.toThrow('Cannot promote: gate validation failed.');
  });

  it('normalizes legacy seed mode to canonical opsx-first when reading bootstrap state', async () => {
    await fs.mkdir(path.join(testDir, 'openspec', 'bootstrap'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', '.bootstrap.yaml'),
      stringifyYaml({
        phase: 'init',
        baseline_type: 'raw',
        mode: 'seed',
        created_at: '2026-03-20T00:00:00.000Z',
      }),
      'utf-8'
    );
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'scope.yaml'),
      stringifyYaml({
        mode: 'seed',
        include: [],
        exclude: [],
        granularity: 'fine',
      }),
      'utf-8'
    );

    const state = await readBootstrapState(testDir);
    expect(state.metadata.mode).toBe('opsx-first');
    expect(state.scope?.mode).toBe('opsx-first');
  });

  it('fails fast when specs-based full would generate into an existing spec path without preserve_existing', async () => {
    await fs.mkdir(path.join(testDir, 'openspec', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'openspec', 'specs', 'auth', 'spec.md'), '# Existing auth spec\n', 'utf-8');

    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);

    const filePath = path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.auth.yaml');
    const content = `domain:
  id: dom.auth
  type: domain
  intent: dom.auth boundary
capabilities:
  - id: cap.auth.login
    type: capability
    intent: cap.auth.login intent
    spec:
      folder: auth
      purpose: cap.auth.login purpose
      requirements:
        - title: cap.auth.login requirement
          text: The system SHALL support cap.auth.login.
          scenarios:
            - title: Basic flow
              steps:
                - keyword: WHEN
                  text: cap.auth.login is invoked
                - keyword: THEN
                  text: cap.auth.login succeeds
relations:
  - from: cap.auth.login
    to: dom.auth
    type: belongs_to
`;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src', 'auth'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'auth', 'index.ts'), 'export {};\n', 'utf-8');
    await fs.writeFile(filePath, content, 'utf-8');

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Capability 'cap.auth.login' maps to existing spec path 'openspec/specs/auth/spec.md'"),
      ])
    );
  });

  it('marks candidate and review stale when a requirement text change alters candidate spec content', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);
    let status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('current');
    expect(status.reviewState).toBe('current');

    await writeDomainMap({
      domainId: 'dom.auth',
      requirementText: 'The system SHALL support cap.auth.work with MFA.',
    });

    status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('stale');
    expect(status.reviewState).toBe('stale');
  });

  it('marks candidate and review stale when scenario steps change', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);
    let status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('current');
    expect(status.reviewState).toBe('current');

    await writeDomainMap({
      domainId: 'dom.auth',
      thenText: 'cap.auth.work succeeds and returns a stable session',
      extraSteps: [{ keyword: 'AND', text: 'an audit event is recorded' }],
    });

    status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('stale');
    expect(status.reviewState).toBe('stale');
  });

  it('marks candidate and review stale when projection-affecting config changes', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);
    let status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('current');
    expect(status.reviewState).toBe('current');

    await fs.writeFile(
      path.join(testDir, 'openspec', 'config.yaml'),
      'schema: spec-driven\ndocLanguage: 中文\n',
      'utf-8'
    );

    status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('stale');
    expect(status.reviewState).toBe('stale');
  });

  it('marks candidate and review stale when spec folder mapping changes (spec-path change)', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);
    let status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('current');
    expect(status.reviewState).toBe('current');

    await writeDomainMap({
      domainId: 'dom.auth',
      folder: 'auth2',
    });

    status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) {
      throw new Error('Expected initialized bootstrap status');
    }
    expect(status.candidateState).toBe('stale');
    expect(status.reviewState).toBe('stale');
  });

  it('writes candidate spec files to cross-platform joined paths', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);

    await expect(
      fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'candidate', 'specs', 'auth', 'spec.md'), 'utf-8')
    ).resolves.toContain('# Spec: auth');
  });

  it('localizes bootstrap review and starter prose through runtime projection while preserving canonical headings', async () => {
    await fs.writeFile(
      path.join(testDir, 'openspec', 'config.yaml'),
      'schema: spec-driven\ndocLanguage: 中文\n',
      'utf-8'
    );
    await initBootstrap(testDir, { mode: 'opsx-first', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);
    await approveReview();
    await promoteBootstrap(testDir);

    const review = await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'review.md'), 'utf-8');
    const starter = await fs.readFile(path.join(testDir, 'openspec', 'specs', 'README.md'), 'utf-8');

    expect(review).toContain('# Bootstrap Review');
    expect(review).toContain('Review the mapped architecture before promoting');
    expect(review).toContain('## Validation');
    expect(starter).toContain('# Specs Starter');
    expect(starter).toContain('This repository was bootstrapped in `opsx-first` mode');
  });

  it('rejects spec folders that embed path separators (Windows/posix)', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);

    // This should be treated as an invalid domain-map, not a missing one.
    await writeDomainMap({ domainId: 'dom.auth', folder: 'auth/login' });
    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("Domain 'dom.auth' has invalid domain-map: dom.auth.yaml")])
    );

    await writeDomainMap({ domainId: 'dom.auth', folder: 'auth\\\\login' });
    const gate2 = await validateGate(testDir, 'map_to_review');
    expect(gate2.passed).toBe(false);
    expect(gate2.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("Domain 'dom.auth' has invalid domain-map: dom.auth.yaml")])
    );
  });

  it('enforces Registry note policy and preserves valid relation notes', async () => {
    await initBootstrap(testDir, { mode: 'opsx-first', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeDomainMap({ domainId: 'dom.auth', capabilityId: 'cap.auth.login' });

    const mapPath = path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.auth.yaml');
    const readMap = async () => parseYaml(await fs.readFile(mapPath, 'utf-8')) as {
      capabilities: Array<{ id: string; type: string; intent: string }>;
      relations: Array<{ from: string; to: string; type: string; note?: string }>;
    };
    const writeMap = async (map: Awaited<ReturnType<typeof readMap>>) => {
      await fs.writeFile(mapPath, stringifyYaml(map, { lineWidth: 0 }), 'utf-8');
    };

    let map = await readMap();
    map.relations[0]!.note = 'Ownership note is forbidden';
    await writeMap(map);
    let gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("Domain 'dom.auth' has invalid domain-map: dom.auth.yaml"),
    ]));

    await writeDomainMap({ domainId: 'dom.auth', capabilityId: 'cap.auth.login' });
    map = await readMap();
    map.capabilities.push({
      ...map.capabilities[0]!,
      id: 'cap.auth.session',
      intent: 'Track sessions',
    });
    map.relations.push(
      { from: 'cap.auth.session', to: 'dom.auth', type: 'belongs_to' },
      {
        from: 'cap.auth.login',
        to: 'cap.auth.session',
        type: 'invokes',
        note: 'x'.repeat(201),
      }
    );
    await writeMap(map);
    gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("Domain 'dom.auth' has invalid domain-map: dom.auth.yaml"),
    ]));

    map.relations[2]!.note = 'Creates a session after successful authentication.';
    await writeMap(map);
    gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed, gate.errors.join('\n')).toBe(true);
    await refreshBootstrapDerivedArtifacts(testDir);

    const relations = parseYaml(
      await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'candidate', 'project.opsx.relations.yaml'), 'utf-8')
    ) as { relations: Array<{ from: string; to: string; type: string; note?: string }> };
    expect(relations.relations).toContainEqual({
      from: 'cap.auth.login',
      to: 'cap.auth.session',
      type: 'invokes',
      note: 'Creates a session after successful authentication.',
    });
  });

  it('projects uncertain interaction evidence into review gaps without creating a relation', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeDomainMap({ domainId: 'dom.auth', capabilityId: 'cap.auth.login' });

    const mapPath = path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.auth.yaml');
    const map = parseYaml(await fs.readFile(mapPath, 'utf-8')) as Record<string, unknown>;
    map.review_gaps = [{
      evidence: 'import src/auth/login.ts -> src/session/store.ts',
      reason: 'Cannot prove whether the interaction invokes or consumes.',
    }];
    await fs.writeFile(mapPath, stringifyYaml(map, { lineWidth: 0 }), 'utf-8');

    await refreshBootstrapDerivedArtifacts(testDir);

    const review = await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'review.md'), 'utf-8');
    expect(review).toContain('## Review Gaps');
    expect(review).toContain('- [ ] dom.auth: import src/auth/login.ts -> src/session/store.ts');
    expect(review).toContain('Cannot prove whether the interaction invokes or consumes.');
    let promoteGate = await validateGate(testDir, 'review_to_promote');
    expect(promoteGate.passed).toBe(false);
    expect(promoteGate.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('Unchecked review item: - [ ] dom.auth: import src/auth/login.ts -> src/session/store.ts'),
    ]));
    await approveReview();
    promoteGate = await validateGate(testDir, 'review_to_promote');
    expect(promoteGate.passed, promoteGate.errors.join('\n')).toBe(true);

    const relations = parseYaml(
      await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'candidate', 'project.opsx.relations.yaml'), 'utf-8')
    ) as { relations: unknown[] };
    expect(relations.relations).toEqual([{ from: 'cap.auth.login', to: 'dom.auth', type: 'belongs_to' }]);
  });

  it('derives bootstrap project identity and architecture metadata from current evidence', async () => {
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        name: '@acme/manifest-name',
        description: 'Manifest description that must not become project metadata',
      }, null, 2),
      'utf-8'
    );

    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeScope({
      mode: 'full',
      include: ['src', 'docs'],
      exclude: ['vendor'],
    });
    await writeEvidence(['dom.auth', 'dom.cli']);
    await writeDomainMap({
      domainId: 'dom.auth',
      capabilityId: 'cap.auth.login',
    });
    await writeDomainMap({
      domainId: 'dom.cli',
      capabilityId: 'cap.cli.run',
    });

    await refreshBootstrapDerivedArtifacts(testDir);

    const candidate = parseYaml(
      await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'candidate', 'project.opsx.yaml'), 'utf-8')
    ) as {
      project: {
        id: string;
        name: string;
        intent?: string;
        scope?: string;
      };
    };

    expect(candidate.project.id).toBe('acme-manifest-name');
    expect(candidate.project.name).toBe('@acme/manifest-name');
    expect(candidate.project.intent).toContain('dom.auth boundary');
    expect(candidate.project.intent).toContain('dom.cli boundary');
    expect(candidate.project.intent).not.toContain('Manifest description');
    expect(candidate.project.scope).toContain('mode=full');
    expect(candidate.project.scope).toContain('include=src, docs');
    expect(candidate.project.scope).toContain('exclude=vendor');
    expect(candidate.project.scope).toContain('mapped domains=dom.auth, dom.cli');
  });

  it('rejects obsolete code_refs in v2 domain maps instead of silently stripping them', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.auth.yaml'),
      stringifyYaml({
        domain: { id: 'dom.auth', type: 'domain', intent: 'Authentication boundary' },
        capabilities: [{ id: 'cap.auth.login', type: 'capability', intent: 'Log in' }],
        relations: [{ from: 'cap.auth.login', to: 'dom.auth', type: 'belongs_to' }],
        code_refs: [{ id: 'cap.auth.login', refs: [{ path: 'src/auth/login.ts' }] }],
      }),
      'utf-8'
    );

    const state = await readBootstrapState(testDir);
    expect(state.domainMaps.has('dom.auth')).toBe(false);
    expect(state.invalidDomainMaps.get('dom.auth')?.error).toMatch(/code_refs|unrecognized/i);
  });

  it('leaves bootstrap project intent and scope undefined when workspace inputs are insufficient', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'evidence.yaml'),
      stringifyYaml({
        domains: [
          {
            id: 'dom.auth',
            confidence: 'high',
            sources: ['code:src/auth/index.ts'],
            intent: '',
          },
        ],
      }),
      'utf-8'
    );

    await refreshBootstrapDerivedArtifacts(testDir);

    const candidate = parseYaml(
      await fs.readFile(path.join(testDir, 'openspec', 'bootstrap', 'candidate', 'project.opsx.yaml'), 'utf-8')
    ) as { project: Record<string, unknown> };

    expect(candidate.project.intent).toBeUndefined();
    expect(candidate.project.scope).toBeUndefined();
  });

  it('keeps existing formal OPSX files unchanged when a non-refresh mode is requested on a formal baseline', async () => {
    const originalProjectOpsx = `schema_version: 2
project:
  id: proj.demo
  name: Demo
  intent: Existing formal intent
`;

    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), originalProjectOpsx, 'utf-8');
    await fs.writeFile(path.join(testDir, 'openspec', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n', 'utf-8');

    await expect(initBootstrap(testDir, { mode: 'full', granularity: 'fine' })).rejects.toThrow(
      "Bootstrap mode 'full' is not supported for baseline 'formal-opsx'. Valid modes: refresh"
    );
    await expect(fs.readFile(path.join(testDir, 'openspec', 'project.opsx.yaml'), 'utf-8')).resolves.toBe(originalProjectOpsx);
    await expect(fs.stat(path.join(testDir, 'openspec', 'bootstrap'))).rejects.toThrow();
  });

  it('retains the bootstrap workspace after promote and returns a manual cleanup notice', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);
    await approveReview();
    await refreshBootstrapDerivedArtifacts(testDir);

    const result = await promoteBootstrap(testDir);

    expect(result.retainedWorkspaceNotice).toBe(BOOTSTRAP_WORKSPACE_RETAINED_NOTICE);
    await expect(fs.stat(path.join(testDir, 'openspec', 'bootstrap'))).resolves.toBeDefined();
  });
});

// ─── Task 2: spec_groups validation tests ──────────────────────────────────

describe('bootstrap-utils spec_groups validation', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-bootstrap-specgroups-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function initCoarse(testDir: string): Promise<void> {
    await initBootstrap(testDir, { mode: 'full', granularity: 'coarse' });
    await fs.mkdir(path.join(testDir, 'src', 'cli'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'cli', 'index.ts'), 'export {};\n', 'utf-8');
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'evidence.yaml'),
      `domains:
  - id: dom.cli
    confidence: high
    sources:
      - code:src/cli/index.ts
    intent: CLI intent
`,
      'utf-8'
    );
  }

  function domainMapYaml(domainId: string, capabilityIds: string[], specGroups?: Array<{ folder: string; capabilities: string[] }>): string {
    const capabilities = capabilityIds.map((id) => ({
      id,
      type: 'capability',
      intent: `${id} intent`,
      ...(!specGroups ? {
        spec: {
          folder: id.replace('cap.', '').replace('.', '-'),
          purpose: `${id} purpose`,
          requirements: [{
            title: `${id} requirement`,
            text: `The system SHALL support ${id}.`,
            scenarios: [{
              title: 'Basic flow',
              steps: [
                { keyword: 'WHEN', text: `${id} is invoked` },
                { keyword: 'THEN', text: `${id} succeeds` },
              ],
            }],
          }],
        },
      } : {}),
    }));

    const data: Record<string, unknown> = {
      domain: { id: domainId, type: 'domain', intent: `${domainId} boundary` },
      capabilities,
      relations: capabilityIds.map((id) => ({ from: id, to: domainId, type: 'belongs_to' })),
    };

    if (specGroups) {
      data.spec_groups = specGroups.map((g) => ({ folder: g.folder, capabilities: g.capabilities }));
    }

    return stringifyYaml(data, { lineWidth: 0 });
  }

  it('accepts a valid coarse domain-map with spec_groups', async () => {
    await initCoarse(testDir);
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      domainMapYaml('dom.cli', ['cap.cli.init', 'cap.cli.validate'], [
        { folder: 'cli', capabilities: ['cap.cli.init', 'cap.cli.validate'] },
      ]),
      'utf-8'
    );

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(true);
    expect(gate.errors).toEqual([]);
  });

  it('rejects a coarse domain-map without spec_groups', async () => {
    await initCoarse(testDir);
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      domainMapYaml('dom.cli', ['cap.cli.init']),
      'utf-8'
    );

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('spec_groups'),
        expect.stringContaining('coarse'),
      ])
    );
  });

  it('rejects spec_groups referencing capabilities not in the domain-map', async () => {
    await initCoarse(testDir);
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      domainMapYaml('dom.cli', ['cap.cli.init'], [
        { folder: 'cli', capabilities: ['cap.cli.init', 'cap.cli.missing'] },
      ]),
      'utf-8'
    );

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('cap.cli.missing'),
      ])
    );
  });

  it('rejects duplicate spec_groups folders', async () => {
    await initCoarse(testDir);
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      domainMapYaml('dom.cli', ['cap.cli.init', 'cap.cli.validate'], [
        { folder: 'cli', capabilities: ['cap.cli.init'] },
        { folder: 'cli', capabilities: ['cap.cli.validate'] },
      ]),
      'utf-8'
    );

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('folder'),
        expect.stringContaining('cli'),
      ])
    );
  });

  it('rejects spec_groups folder with Windows path separators', async () => {
    await initCoarse(testDir);
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      `domain:
  id: dom.cli
  type: domain
  intent: dom.cli boundary
capabilities:
  - id: cap.cli.init
    type: capability
    intent: cap.cli.init intent
relations:
  - from: cap.cli.init
    to: dom.cli
    type: belongs_to
spec_groups:
  - folder: cli\\commands
    capabilities:
      - cap.cli.init
`,
      'utf-8'
    );

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('spec_groups'),
      ])
    );
  });
});

// ─── Task 3: Coarse/Fine candidate spec compilation ─────────────────────

describe('bootstrap-utils coarse candidate spec compilation', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `openspec-bootstrap-compile-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, 'openspec'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function setupCoarseWorkspace(): Promise<void> {
    await initBootstrap(testDir, { mode: 'full', granularity: 'coarse' });
    await fs.mkdir(path.join(testDir, 'src', 'cli'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'cli', 'index.ts'), 'export {};\n', 'utf-8');
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'evidence.yaml'),
      `domains:
  - id: dom.cli
    confidence: high
    sources:
      - code:src/cli/index.ts
    intent: CLI
`,
      'utf-8'
    );
  }

  function coarseDomainMapYaml(domainId: string, capabilityIds: string[], deps: Array<{ folder: string; capabilities: string[] }>): string {
    const data: Record<string, unknown> = {
      domain: { id: domainId, type: 'domain', intent: `${domainId} boundary` },
      capabilities: capabilityIds.map((id) => ({
        id,
        type: 'capability',
        intent: `${id} intent`,
      })),
      relations: capabilityIds.map((id) => ({ from: id, to: domainId, type: 'belongs_to' })),
      spec_groups: deps.map((dep) => ({
        folder: dep.folder,
        capabilities: dep.capabilities,
        purpose: `${dep.folder} purpose`,
        requirements: [{
          title: `${dep.folder} requirement`,
          text: `The system SHALL support ${dep.folder}.`,
          scenarios: [{
            title: 'Basic flow',
            steps: [
              { keyword: 'WHEN', text: `${dep.folder} is used` },
              { keyword: 'THEN', text: `${dep.folder} succeeds` },
            ],
          }],
        }],
      })),
    };
    return stringifyYaml(data, { lineWidth: 0 });
  }

  it('generates one candidate spec per spec_groups entry in coarse mode', async () => {
    await setupCoarseWorkspace();
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      coarseDomainMapYaml('dom.cli', ['cap.cli.init', 'cap.cli.validate'], [
        { folder: 'cli-core', capabilities: ['cap.cli.init', 'cap.cli.validate'] },
      ]),
      'utf-8'
    );

    await refreshBootstrapDerivedArtifacts(testDir);

    const candidateSpec = await fs.readFile(
      path.join(testDir, 'openspec', 'bootstrap', 'candidate', 'specs', 'cli-core', 'spec.md'),
      'utf-8'
    );
    expect(candidateSpec).toContain('# Spec: cli-core');
    expect(candidateSpec).toContain('The system SHALL support cli-core');
  });

  it('coarse candidate spec frontmatter contains multiple capabilities', async () => {
    await setupCoarseWorkspace();
    await fs.writeFile(
      path.join(testDir, 'openspec', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      coarseDomainMapYaml('dom.cli', ['cap.cli.init', 'cap.cli.validate'], [
        { folder: 'cli-core', capabilities: ['cap.cli.init', 'cap.cli.validate'] },
      ]),
      'utf-8'
    );

    await refreshBootstrapDerivedArtifacts(testDir);

    const candidateSpec = await fs.readFile(
      path.join(testDir, 'openspec', 'bootstrap', 'candidate', 'specs', 'cli-core', 'spec.md'),
      'utf-8'
    );
    // Frontmatter should list the capabilities
    expect(candidateSpec).toContain('cap.cli.init');
    expect(candidateSpec).toContain('cap.cli.validate');
  });
});
