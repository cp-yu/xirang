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
import { readLikeC4Architecture } from '../../src/utils/likec4-reader.js';

describe('bootstrap-utils invalid domain-map handling', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `opsx-bootstrap-utils-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, '.opsx'), { recursive: true });
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

    await fs.writeFile(path.join(testDir, '.opsx', 'bootstrap', 'evidence.yaml'), content, 'utf-8');
  }

  async function writeScope(scope: {
    mode?: 'full' | 'opsx-first' | 'seed';
    include?: string[];
    exclude?: string[];
    granularity?: 'coarse' | 'fine';
  }): Promise<void> {
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'scope.yaml'),
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

    const filePath = path.join(testDir, '.opsx', 'bootstrap', 'domain-map', `${domainId}.yaml`);
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
    const filePath = path.join(testDir, '.opsx', 'bootstrap', 'domain-map', `${domainId}.yaml`);
    void filePath;
    await writeDomainMap({ domainId, capabilityId });
  }

  async function writeInvalidDomainMap(domainId: string): Promise<void> {
    const filePath = path.join(testDir, '.opsx', 'bootstrap', 'domain-map', `${domainId}.yaml`);
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
    const reviewPath = path.join(testDir, '.opsx', 'bootstrap', 'review.md');
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
    await fs.mkdir(path.join(testDir, '.opsx', 'bootstrap'), { recursive: true });
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', '.bootstrap.yaml'),
      stringifyYaml({
        phase: 'init',
        baseline_type: 'raw',
        mode: 'seed',
        created_at: '2026-03-20T00:00:00.000Z',
      }),
      'utf-8'
    );
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'scope.yaml'),
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
    await fs.mkdir(path.join(testDir, '.opsx', 'specs', 'auth'), { recursive: true });
    await fs.writeFile(path.join(testDir, '.opsx', 'specs', 'auth', 'spec.md'), '# Existing auth spec\n', 'utf-8');

    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);

    const filePath = path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.auth.yaml');
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
        expect.stringContaining("Capability 'cap.auth.login' maps to existing spec path '.opsx/specs/auth/spec.md'"),
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
      path.join(testDir, '.opsx', 'config.yaml'),
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
      fs.readFile(path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'specs', 'auth', 'spec.md'), 'utf-8')
    ).resolves.toContain('# Spec: auth');
  });

  it('localizes bootstrap review and starter prose through runtime projection while preserving canonical headings', async () => {
    await fs.writeFile(
      path.join(testDir, '.opsx', 'config.yaml'),
      'schema: spec-driven\ndocLanguage: 中文\n',
      'utf-8'
    );
    await initBootstrap(testDir, { mode: 'opsx-first', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth');

    await refreshBootstrapDerivedArtifacts(testDir);
    await approveReview();
    await promoteBootstrap(testDir);

    const review = await fs.readFile(path.join(testDir, '.opsx', 'bootstrap', 'review.md'), 'utf-8');
    const starter = await fs.readFile(path.join(testDir, '.opsx', 'specs', 'README.md'), 'utf-8');

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

    const mapPath = path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.auth.yaml');
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

    const relations = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'architecture', 'relations.c4'), 'utf-8'
    );
    expect(relations).toContain('projectRoot.dom_auth.cap_auth_login -[invokes]-> projectRoot.dom_auth.cap_auth_session');
    expect(relations).toContain('Creates a session after successful authentication.');
  });

  it('projects uncertain interaction evidence into review gaps without creating a relation', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeDomainMap({ domainId: 'dom.auth', capabilityId: 'cap.auth.login' });

    const mapPath = path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.auth.yaml');
    const map = parseYaml(await fs.readFile(mapPath, 'utf-8')) as Record<string, unknown>;
    map.review_gaps = [{
      evidence: 'import src/auth/login.ts -> src/session/store.ts',
      reason: 'Cannot prove whether the interaction invokes or consumes.',
    }];
    await fs.writeFile(mapPath, stringifyYaml(map, { lineWidth: 0 }), 'utf-8');

    await refreshBootstrapDerivedArtifacts(testDir);

    const review = await fs.readFile(path.join(testDir, '.opsx', 'bootstrap', 'review.md'), 'utf-8');
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
    expect(promoteGate.passed).toBe(false);
    expect(promoteGate.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("Unresolved review gap in 'dom.auth'"),
    ]));
    await expect(promoteBootstrap(testDir)).rejects.toThrow('Cannot promote: gate validation failed.');

    const relations = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'architecture', 'relations.c4'), 'utf-8'
    );
    expect(relations).not.toContain('belongs_to');
    expect(relations).toContain('model {');
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

    const candidate = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'architecture', 'model.c4'), 'utf-8'
    );

    expect(candidate).toContain("projectRoot = project '@acme/manifest-name'");
    expect(candidate).toContain("elementId 'project.root'");
    expect(candidate).toContain('dom.auth boundary');
    expect(candidate).toContain('dom.cli boundary');
    expect(candidate).not.toContain('Manifest description');
  });

  it('rejects obsolete code_refs in v2 domain maps instead of silently stripping them', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.auth.yaml'),
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
      path.join(testDir, '.opsx', 'bootstrap', 'evidence.yaml'),
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

    const candidate = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'architecture', 'model.c4'), 'utf-8'
    );

    expect(candidate).toContain('Project intent is reviewed before promotion.');
  });

  it('keeps existing formal OPSX files unchanged when a non-refresh mode is requested on a formal baseline', async () => {
    const originalProjectOpsx = `schema_version: 2
project:
  id: proj.demo
  name: Demo
  intent: Existing formal intent
`;

    await fs.writeFile(path.join(testDir, '.opsx', 'project.opsx.yaml'), originalProjectOpsx, 'utf-8');
    await fs.writeFile(path.join(testDir, '.opsx', 'project.opsx.relations.yaml'), 'schema_version: 2\nrelations: []\n', 'utf-8');

    await expect(initBootstrap(testDir, { mode: 'full', granularity: 'fine' })).rejects.toThrow(
      "Bootstrap mode 'full' is not supported for baseline 'formal-opsx'. Valid modes: refresh"
    );
    await expect(fs.readFile(path.join(testDir, '.opsx', 'project.opsx.yaml'), 'utf-8')).resolves.toBe(originalProjectOpsx);
    await expect(fs.stat(path.join(testDir, '.opsx', 'bootstrap'))).rejects.toThrow();
  });

  it('writes a v1 candidate architecture tree and promotes only to formal LikeC4 files', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await writeEvidence(['dom.auth']);
    await writeValidDomainMap('dom.auth', 'cap.auth.login');

    await refreshBootstrapDerivedArtifacts(testDir);

    const candidateArchitecture = path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'architecture');
    const candidateModel = await fs.readFile(path.join(candidateArchitecture, 'model.c4'), 'utf-8');
    expect(candidateModel).toContain("elementId 'project.root'");
    expect(candidateModel).toContain("elementId 'dom.auth'");
    expect(candidateModel).toContain("elementId 'cap.auth.login'");
    expect(candidateModel).toContain('cap_auth_login = capability');
    expect(await fs.readFile(path.join(candidateArchitecture, 'specification.c4'), 'utf-8')).toContain("languageVersion '1'");
    expect(await fs.readFile(path.join(candidateArchitecture, 'relations.c4'), 'utf-8')).not.toContain('belongs_to');
    await expect(fs.stat(path.join(candidateArchitecture, 'views.c4'))).resolves.toBeDefined();
    expect(await fileExists(path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'project.opsx.yaml'))).toBe(false);

    const candidateSpec = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'specs', 'auth', 'spec.md'),
      'utf-8'
    );
    expect(candidateSpec).toMatch(/^---\nelement: cap\.auth\.login\n---/);
    expect(candidateSpec).not.toContain('capabilities:');

    await approveReview();
    await refreshBootstrapDerivedArtifacts(testDir);
    const result = await promoteBootstrap(testDir);

    expect(result.retainedWorkspaceNotice).toBe(BOOTSTRAP_WORKSPACE_RETAINED_NOTICE);
    expect(await fileExists(path.join(testDir, '.opsx', 'architecture', 'model.c4'))).toBe(true);
    expect(await fileExists(path.join(testDir, '.opsx', 'architecture', 'relations.c4'))).toBe(true);
    expect(await fileExists(path.join(testDir, '.opsx', 'architecture', 'views.c4'))).toBe(true);
    expect(await fileExists(path.join(testDir, '.opsx', 'project.opsx.yaml'))).toBe(false);
    expect(await fileExists(path.join(testDir, '.opsx', 'project.opsx.relations.yaml'))).toBe(false);
  });

  it('blocks coarse promotion when a spec group has multiple possible owners', async () => {
    await initBootstrap(testDir, { mode: 'full', granularity: 'coarse' });
    await writeEvidence(['dom.auth']);
    const mapPath = path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.auth.yaml');
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.writeFile(mapPath, stringifyYaml({
      domain: { id: 'dom.auth', type: 'domain', intent: 'Authentication' },
      capabilities: [
        { id: 'cap.auth.login', type: 'capability', intent: 'Login' },
        { id: 'cap.auth.session', type: 'capability', intent: 'Sessions' },
      ],
      spec_groups: [{
        folder: 'auth',
        capabilities: ['cap.auth.login', 'cap.auth.session'],
        purpose: 'Authentication contract',
        requirements: [{
          title: 'Authentication',
          text: 'The system SHALL authenticate users.',
          scenarios: [{ title: 'Login', steps: [
            { keyword: 'WHEN', text: 'a user logs in' },
            { keyword: 'THEN', text: 'the user is authenticated' },
          ] }],
        }],
      }],
      relations: [],
    }, { lineWidth: 0 }), 'utf-8');

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors.join('\n')).toMatch(/ambiguous|multiple|owner/i);
    await expect(promoteBootstrap(testDir)).rejects.toThrow(/gate validation failed/);
  });

  async function fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
});

// ─── Task 2: spec_groups validation tests ──────────────────────────────────

describe('bootstrap-utils spec_groups validation', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `opsx-bootstrap-specgroups-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, '.opsx'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function initCoarse(testDir: string): Promise<void> {
    await initBootstrap(testDir, { mode: 'full', granularity: 'coarse' });
    await fs.mkdir(path.join(testDir, 'src', 'cli'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'cli', 'index.ts'), 'export {};\n', 'utf-8');
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'evidence.yaml'),
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

  it('accepts a coarse spec_group with one unambiguous owner', async () => {
    await initCoarse(testDir);
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      domainMapYaml('dom.cli', ['cap.cli.init'], [
        { folder: 'cli', capabilities: ['cap.cli.init'] },
      ]),
      'utf-8'
    );

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed, gate.errors.join('\n')).toBe(true);
    expect(gate.errors).toEqual([]);
  });

  it('rejects a coarse domain-map without spec_groups', async () => {
    await initCoarse(testDir);
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
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
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
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
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
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
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
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
    testDir = path.join(os.tmpdir(), `opsx-bootstrap-compile-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, '.opsx'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function setupCoarseWorkspace(): Promise<void> {
    await initBootstrap(testDir, { mode: 'full', granularity: 'coarse' });
    await fs.mkdir(path.join(testDir, 'src', 'cli'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'src', 'cli', 'index.ts'), 'export {};\n', 'utf-8');
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'evidence.yaml'),
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
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      coarseDomainMapYaml('dom.cli', ['cap.cli.init', 'cap.cli.validate'], [
        { folder: 'cli-core', capabilities: ['cap.cli.init'] },
      ]),
      'utf-8'
    );

    await refreshBootstrapDerivedArtifacts(testDir);

    const candidateSpec = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'specs', 'cli-core', 'spec.md'),
      'utf-8'
    );
    expect(candidateSpec).toContain('# Spec: cli-core');
    expect(candidateSpec).toContain('The system SHALL support cli-core');
  });

  it('coarse candidate spec frontmatter contains one singular element owner', async () => {
    await setupCoarseWorkspace();
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'dom.cli.yaml'),
      coarseDomainMapYaml('dom.cli', ['cap.cli.init', 'cap.cli.validate'], [
        { folder: 'cli-core', capabilities: ['cap.cli.init'] },
      ]),
      'utf-8'
    );

    await refreshBootstrapDerivedArtifacts(testDir);

    const candidateSpec = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'specs', 'cli-core', 'spec.md'),
      'utf-8'
    );
    expect(candidateSpec).toContain('element: cap.cli.init');
    expect(candidateSpec).not.toContain('capabilities:');
  });
});

describe('bootstrap-utils generic element candidates', () => {
  let testDir: string;

  const evidence = {
    elements: [
      {
        elementId: 'commerce',
        kind: 'area',
        contractPolicy: 'optional',
        localId: 'commerce',
        title: 'Commerce',
        summary: 'Commerce intent.',
        confidence: 'high',
        sources: ['code:src/commerce/index.ts'],
      },
      {
        elementId: 'checkout',
        kind: 'workflow',
        contractPolicy: 'optional',
        localId: 'checkout',
        title: 'Checkout',
        summary: 'Checkout intent.',
        confidence: 'high',
        sources: ['code:src/commerce/checkout.ts'],
      },
      {
        elementId: 'payment.authorize',
        kind: 'operation',
        contractPolicy: 'optional',
        localId: 'authorize',
        title: 'Authorize payment',
        summary: 'Authorize a payment.',
        confidence: 'high',
        sources: ['code:src/commerce/authorize.ts'],
      },
      {
        elementId: 'payment.capture',
        kind: 'operation',
        contractPolicy: 'optional',
        localId: 'capture',
        title: 'Capture payment',
        summary: 'Capture a payment.',
        confidence: 'medium',
        sources: ['code:src/commerce/capture.ts'],
      },
    ],
  };

  const operationSpec = {
    folder: 'payment-authorize',
    purpose: 'Authorize checkout payments.',
    requirements: [{
      title: 'Payment authorization',
      text: 'The system SHALL authorize an eligible payment.',
      scenarios: [{
        title: 'Authorization succeeds',
        steps: [
          { keyword: 'WHEN', text: 'an eligible payment is submitted' },
          { keyword: 'THEN', text: 'the payment is authorized' },
        ],
      }],
    }],
  };

  const elementMap = {
    elements: evidence.elements.map(({ confidence: _confidence, sources: _sources, ...element }) => ({
      ...element,
      ...(element.elementId === 'payment.authorize' ? { spec: operationSpec } : {}),
    })),
    parent_links: [
      { parent: 'project.root', child: 'commerce' },
      { parent: 'commerce', child: 'checkout' },
      { parent: 'checkout', child: 'payment.authorize' },
      { parent: 'checkout', child: 'payment.capture' },
    ],
    relations: [],
    review_gaps: [],
  };

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `opsx-bootstrap-generic-${randomUUID()}`);
    await fs.mkdir(path.join(testDir, '.opsx'), { recursive: true });
    await initBootstrap(testDir, { mode: 'full', granularity: 'fine' });
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'evidence.yaml'),
      stringifyYaml(evidence, { lineWidth: 0 }),
      'utf-8'
    );
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function writeElementMap(value: unknown): Promise<void> {
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'domain-map', 'semantic-model.yaml'),
      stringifyYaml(value, { lineWidth: 0 }),
      'utf-8'
    );
  }

  async function approveGenericReview(): Promise<void> {
    const reviewPath = path.join(testDir, '.opsx', 'bootstrap', 'review.md');
    const content = await fs.readFile(reviewPath, 'utf-8');
    await fs.writeFile(reviewPath, content.replace(/- \[ \]/g, '- [x]'), 'utf-8');
  }

  it('preserves arbitrary depth, siblings, project-defined kinds, stable IDs, and parentage through promotion', async () => {
    await writeElementMap(elementMap);

    const mapGate = await validateGate(testDir, 'map_to_review');
    expect(mapGate.passed, mapGate.errors.join('\n')).toBe(true);
    const status = await getBootstrapStatus(testDir);
    expect(status.initialized).toBe(true);
    if (!status.initialized) throw new Error('Expected initialized bootstrap status');
    expect(status.domains).toEqual([]);
    expect(status.totalElements).toBe(4);
    expect(status.mappedElements).toBe(4);
    await refreshBootstrapDerivedArtifacts(testDir);

    const candidateRoot = path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'architecture');
    const specification = await fs.readFile(path.join(candidateRoot, 'specification.c4'), 'utf-8');
    const model = await fs.readFile(path.join(candidateRoot, 'model.c4'), 'utf-8');
    expect(specification).toContain('element area');
    expect(specification).toContain('element workflow');
    expect(specification).toContain('element operation');
    expect(specification).toMatch(/element operation[\s\S]*?contract optional/);
    expect(specification).toContain('parents [project]');
    expect(specification).toContain('parents [area]');
    expect(specification).toContain('parents [workflow]');
    expect(model.indexOf('commerce = area')).toBeLessThan(model.indexOf('checkout = workflow'));
    expect(model.indexOf('checkout = workflow')).toBeLessThan(model.indexOf('authorize = operation'));
    expect(model).toContain('capture = operation');
    expect(model).toContain("elementId 'payment.authorize'");
    expect(model).toContain("elementId 'payment.capture'");

    const candidateSpec = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'specs', 'payment-authorize', 'spec.md'),
      'utf-8'
    );
    expect(candidateSpec).toMatch(/^---\nelement: payment\.authorize\n---/);

    await approveGenericReview();
    await promoteBootstrap(testDir);

    const promoted = await readLikeC4Architecture(testDir);
    expect(promoted.elements.map((element) => ({
      id: element.id,
      kind: element.kind,
      parent: element.parent,
      children: element.children,
    }))).toEqual([
      { id: 'project.root', kind: 'project', parent: null, children: ['commerce'] },
      { id: 'commerce', kind: 'area', parent: 'project.root', children: ['checkout'] },
      { id: 'checkout', kind: 'workflow', parent: 'commerce', children: ['payment.authorize', 'payment.capture'] },
      { id: 'payment.authorize', kind: 'operation', parent: 'checkout', children: [] },
      { id: 'payment.capture', kind: 'operation', parent: 'checkout', children: [] },
    ]);
  });

  it('renders the reviewed generic contract policy without defaulting the kind to optional', async () => {
    const requiredEvidence = structuredClone(evidence);
    requiredEvidence.elements[0]!.contractPolicy = 'required';
    const requiredMap = structuredClone(elementMap);
    requiredMap.elements[0]!.contractPolicy = 'required';
    await fs.writeFile(
      path.join(testDir, '.opsx', 'bootstrap', 'evidence.yaml'),
      stringifyYaml(requiredEvidence, { lineWidth: 0 }),
      'utf-8'
    );
    await writeElementMap(requiredMap);

    await refreshBootstrapDerivedArtifacts(testDir);

    const specification = await fs.readFile(
      path.join(testDir, '.opsx', 'bootstrap', 'candidate', 'architecture', 'specification.c4'),
      'utf-8'
    );
    expect(specification).toMatch(/element area[\s\S]*?contract required/);
  });

  it.each(['evidence', 'map'] as const)('blocks a generic candidate when %s omits an explicit contract policy', async source => {
    if (source === 'evidence') {
      const missingPolicyEvidence = structuredClone(evidence) as { elements: Array<Record<string, unknown>> };
      delete missingPolicyEvidence.elements[0]!.contractPolicy;
      await fs.writeFile(
        path.join(testDir, '.opsx', 'bootstrap', 'evidence.yaml'),
        stringifyYaml(missingPolicyEvidence, { lineWidth: 0 }),
        'utf-8'
      );
      await writeElementMap(elementMap);
    } else {
      const missingPolicyMap = structuredClone(elementMap) as { elements: Array<Record<string, unknown>> };
      delete missingPolicyMap.elements[0]!.contractPolicy;
      await writeElementMap(missingPolicyMap);
    }

    const gate = await validateGate(testDir, 'map_to_review');

    expect(gate.passed).toBe(false);
    expect(gate.errors.join('\n')).toMatch(/review gap.*contractPolicy/i);
    await expect(promoteBootstrap(testDir)).rejects.toThrow('Cannot promote: gate validation failed.');
  });

  it.each([
    {
      name: 'orphan',
      mutate: (value: typeof elementMap) => ({
        ...value,
        parent_links: value.parent_links.filter((link) => link.child !== 'payment.authorize'),
      }),
      expected: /payment\.authorize.*exactly one parent/i,
    },
    {
      name: 'multiple parents',
      mutate: (value: typeof elementMap) => ({
        ...value,
        parent_links: [...value.parent_links, { parent: 'commerce', child: 'payment.authorize' }],
      }),
      expected: /payment\.authorize.*multiple parents/i,
    },
    {
      name: 'unknown kind',
      mutate: (value: typeof elementMap) => ({
        ...value,
        elements: value.elements.map((element) => element.elementId === 'payment.authorize'
          ? { ...element, kind: 'service' }
          : element),
      }),
      expected: /payment\.authorize.*unknown kind 'service'/i,
    },
    {
      name: 'duplicate stable ID',
      mutate: (value: typeof elementMap) => ({
        ...value,
        elements: [...value.elements, { ...value.elements[2]!, localId: 'authorizeAgain' }],
      }),
      expected: /duplicate elementId.*payment\.authorize/i,
    },
  ])('turns $name into a blocking review gap', async ({ mutate, expected }) => {
    await writeElementMap(mutate(structuredClone(elementMap)));

    const gate = await validateGate(testDir, 'map_to_review');
    expect(gate.passed).toBe(false);
    expect(gate.errors.join('\n')).toMatch(expected);
    await expect(promoteBootstrap(testDir)).rejects.toThrow('Cannot promote: gate validation failed.');
    await expect(fs.access(path.join(testDir, '.opsx', 'architecture', 'model.c4'))).rejects.toThrow();
  });
});
