import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { consumeFraming } from '../../../src/core/framing/consume.js';
import { createFraming } from '../../../src/core/framing/workspace.js';
import { modelRoot } from '../../../src/core/model/paths.js';
import { parseSemanticModel } from '../../../src/core/model/parser.js';
import { readSemanticTree, semanticTreeFingerprint } from '../../../src/core/model/transaction.js';
import { writeChangeDelta, writeProjectModel, minimalModel, elementUnit } from '../../helpers/model-fixture.js';

import { initializeCandidate } from '../../../src/core/candidate/workspace.js';
import { validateCandidate } from '../../../src/core/candidate/validator.js';

const roots: string[] = [];
afterEach(async () => {
  while (roots.length > 0) await fs.rm(roots.pop()!, { recursive: true, force: true });
});

async function setup(changeName = 'sample', contextKind: 'build' | 'change' = 'change') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-consume-'));
  roots.push(root);
  await writeProjectModel(root, minimalModel());
  const parsed = await parseSemanticModel(modelRoot(root));
  const context = {
    model: parsed.model,
    semanticModelFingerprint: semanticTreeFingerprint(await readSemanticTree(root)),
  };
  const payload = {
    schemaVersion: 2, context: contextKind, relatedIdentities: ['root'],
    entries: [{ identity: 'limit', nature: 'normative', content: '最多 5 本，闭馆日顺延。' }],
  } satisfies import('../../../src/core/framing/types.js').ChangeStructuralDefinitionPayload;
  const framing = await createFraming(root, 'sample', payload, context, {
    now: new Date('2026-07-29T12:00:00Z'), randomHex: 'a1b2c3d4',
  });
  return { root, changeName, framing };
}

async function validChange(root: string, changeName: string): Promise<string> {
  return writeChangeDelta(root, changeName, {
    'proposal.md': '## Why\n\nEnough context for a valid change proposal.\n\n## What Changes\n\n- Add new capability.\n',
    'elements/new.md': `---\noperation: ADDED\n${elementUnit({ identity: 'new', title: 'New', definition: 'New capability.' }).slice(4)}`,
  });
}

describe('framing consume', () => {
  it('consumes an explicit active Candidate and binds the source bytes to its digest', async () => {
    const { root, framing } = await setup('build', 'build');
    const id = framing.document.metadata.explorationId;
    await expect(consumeFraming(root, id, { candidate: true }, framing.sourceVersion))
      .rejects.toMatchObject({ code: 'INVALID_CANDIDATE_PATH' });
    await expect(fs.access(framing.absolutePath)).resolves.toBeUndefined();
    await initializeCandidate(root, { kind: 'current' });
    const before = await validateCandidate(root);
    const result = await consumeFraming(root, id, { candidate: true }, framing.sourceVersion);
    expect(result.path).toBe('.xirang/candidate/framing-source.md');
    expect(await fs.readFile(path.join(root, result.path))).toEqual(framing.bytes);
    const after = await validateCandidate(root);
    expect(after.valid).toBe(true);
    expect(after.reviewDigest).not.toBe(before.reviewDigest);
    await expect(fs.access(framing.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('preserves Candidate and source on invalid target, conflicting snapshot, or stale source', async () => {
    const { root, framing } = await setup('build', 'build');
    await initializeCandidate(root, { kind: 'current' });
    const id = framing.document.metadata.explorationId;
    const destination = path.join(root, '.xirang', 'candidate', 'framing-source.md');
    const build = path.join(root, '.xirang', 'candidate', 'build.md');
    await fs.writeFile(build, 'invalid  \r\n');
    await expect(consumeFraming(root, id, { candidate: true }, framing.sourceVersion))
      .rejects.toMatchObject({ code: 'CANDIDATE_VALIDATION_FAILED' });
    await expect(fs.access(destination)).rejects.toMatchObject({ code: 'ENOENT' });
    await fs.writeFile(build, 'valid\n');
    await fs.writeFile(destination, 'existing snapshot\n');
    await expect(consumeFraming(root, id, { candidate: true }, framing.sourceVersion))
      .rejects.toMatchObject({ code: 'PROVENANCE_CONFLICT' });
    expect(await fs.readFile(destination, 'utf8')).toBe('existing snapshot\n');
    await expect(consumeFraming(root, id, { candidate: true }, '0'.repeat(64)))
      .rejects.toMatchObject({ code: 'SOURCE_VERSION_MISMATCH' });
    expect(await fs.readFile(framing.absolutePath)).toEqual(framing.bytes);
  });

  it('revalidates an identical Candidate snapshot before recovering interrupted consumption', async () => {
    const { root, framing } = await setup('build', 'build');
    await initializeCandidate(root, { kind: 'current' });
    const destination = path.join(root, '.xirang', 'candidate', 'framing-source.md');
    await fs.writeFile(destination, framing.bytes);
    const result = await consumeFraming(root, framing.document.metadata.explorationId, { candidate: true }, framing.sourceVersion);
    expect(result.recovered).toBe(true);
    expect(await fs.readFile(destination)).toEqual(framing.bytes);
    await expect(fs.access(framing.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.each([
    ['change', false], ['change', true], ['build', false], ['build', true],
  ] as const)('preserves %s source if the final snapshot disappears (recovery: %s)', async (contextKind, recovery) => {
    const { root, framing, changeName } = await setup('missing-snapshot', contextKind);
    const directory = contextKind === 'build'
      ? (await initializeCandidate(root, { kind: 'current' }), path.join(root, '.xirang', 'candidate'))
      : await validChange(root, changeName);
    const destination = path.join(directory, 'framing-source.md');
    if (recovery) await fs.writeFile(destination, framing.bytes);
    let destinationChecks = 0;
    const filesystem = {
      ...fs,
      lstat: (async (...args: Parameters<typeof fs.lstat>) => {
        if (args[0] === destination && ++destinationChecks === 2) await fs.rm(destination);
        return fs.lstat(...args);
      }) as typeof fs.lstat,
    };
    const target = contextKind === 'build' ? { candidate: true as const } : { change: changeName };
    await expect(consumeFraming(root, framing.document.metadata.explorationId, target, framing.sourceVersion, filesystem))
      .rejects.toMatchObject({ code: 'PROVENANCE_MISSING' });
    expect(await fs.readFile(framing.absolutePath)).toEqual(framing.bytes);
    await expect(fs.access(destination)).rejects.toMatchObject({ code: 'ENOENT' });
    await consumeFraming(root, framing.document.metadata.explorationId, target, framing.sourceVersion);
    expect(await fs.readFile(destination)).toEqual(framing.bytes);
    await expect(fs.access(framing.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects ambiguous targets and cross-context consumption', async () => {
    const { root, framing } = await setup();
    const id = framing.document.metadata.explorationId;
    await expect(consumeFraming(root, id, { candidate: true, change: 'sample' } as any, framing.sourceVersion))
      .rejects.toMatchObject({ code: 'INVALID_CONSUME_TARGET' });
    await expect(consumeFraming(root, id, { candidate: true }, framing.sourceVersion))
      .rejects.toMatchObject({ code: 'CONTEXT_MISMATCH' });
    expect(await fs.readFile(framing.absolutePath)).toEqual(framing.bytes);
  });

  it.runIf(process.platform !== 'win32')('rejects symlinked Candidate and provenance destinations', async () => {
    const { root, framing } = await setup('build', 'build');
    await initializeCandidate(root, { kind: 'current' });
    const candidate = path.join(root, '.xirang', 'candidate');
    const outside = path.join(root, 'outside');
    await fs.rename(candidate, outside);
    await fs.symlink(outside, candidate, 'dir');
    const id = framing.document.metadata.explorationId;
    await expect(consumeFraming(root, id, { candidate: true }, framing.sourceVersion))
      .rejects.toMatchObject({ code: 'INVALID_CANDIDATE_PATH' });
    await fs.unlink(candidate);
    await fs.rename(outside, candidate);
    await fs.symlink(framing.absolutePath, path.join(candidate, 'framing-source.md'));
    await expect(consumeFraming(root, id, { candidate: true }, framing.sourceVersion))
      .rejects.toMatchObject({ code: 'INVALID_CANDIDATE_PATH' });
    expect(await fs.readFile(framing.absolutePath)).toEqual(framing.bytes);
  });

  it('拒绝过期的来源版本，保留来源和目标', async () => {
    const { root, changeName, framing } = await setup();
    const changeDir = await validChange(root, changeName);
    await expect(consumeFraming(root, framing.document.metadata.explorationId, { change: changeName }, '0'.repeat(64)))
      .rejects.toMatchObject({ code: 'SOURCE_VERSION_MISMATCH' });
    await expect(fs.access(framing.absolutePath)).resolves.toBeUndefined();
    await expect(fs.access(path.join(changeDir, 'framing-source.md'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('无效目标不删除来源，也不保留新写入的快照', async () => {
    const { root, changeName, framing } = await setup();
    const changeDir = await writeChangeDelta(root, changeName, {
      'elements/bad.md': `---
operation: ADDED
${elementUnit({ identity: 'bad', kind: 'missing' }).slice(4)}`,
    });
    await expect(consumeFraming(root, framing.document.metadata.explorationId, { change: changeName }, framing.sourceVersion))
      .rejects.toMatchObject({ code: 'CHANGE_VALIDATION_FAILED' });
    await expect(fs.access(framing.absolutePath)).resolves.toBeUndefined();
    await expect(fs.access(path.join(changeDir, 'framing-source.md'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('freezes provenance and removes the source only after source and target validation pass', async () => {
    const { root, changeName, framing } = await setup();
    const changeDir = await validChange(root, changeName);
    const before = await fs.readFile(framing.absolutePath);
    const result = await consumeFraming(root, framing.document.metadata.explorationId, { change: changeName }, framing.sourceVersion);
    expect(result.path).toBe(`.xirang/changes/${changeName}/framing-source.md`);
    expect(await fs.readFile(path.join(changeDir, 'framing-source.md'))).toEqual(before);
    await expect(fs.access(framing.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it.runIf(process.platform !== 'win32')('rejects symlinked Change destinations and preserves the source', async () => {
    const { root, changeName, framing } = await setup('linked');
    const changeDir = await validChange(root, changeName);
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'xirang-consume-outside-'));
    roots.push(outside);
    await fs.cp(changeDir, outside, { recursive: true });
    await fs.rm(changeDir, { recursive: true });
    await fs.symlink(outside, changeDir, 'dir');
    await expect(consumeFraming(root, framing.document.metadata.explorationId, { change: changeName }, framing.sourceVersion)).rejects.toMatchObject({
      code: 'INVALID_CHANGE_PATH',
    });
    await expect(fs.access(framing.absolutePath)).resolves.toBeUndefined();
  });

  it('recovers an identical copy and fails closed on a conflicting copy', async () => {
    const recovered = await setup('recover');
    const recoverDir = await validChange(recovered.root, recovered.changeName);
    const source = await fs.readFile(recovered.framing.absolutePath);
    await fs.writeFile(path.join(recoverDir, 'framing-source.md'), source);
    await consumeFraming(recovered.root, recovered.framing.document.metadata.explorationId, { change: recovered.changeName }, recovered.framing.sourceVersion);
    await expect(fs.access(recovered.framing.absolutePath)).rejects.toMatchObject({ code: 'ENOENT' });

    const conflict = await setup('conflict');
    const conflictDir = await validChange(conflict.root, conflict.changeName);
    await fs.writeFile(path.join(conflictDir, 'framing-source.md'), 'different', 'utf8');
    await expect(consumeFraming(conflict.root, conflict.framing.document.metadata.explorationId, { change: conflict.changeName }, conflict.framing.sourceVersion))
      .rejects.toMatchObject({ code: 'PROVENANCE_CONFLICT' });
    await expect(fs.access(conflict.framing.absolutePath)).resolves.toBeUndefined();
  });
});
