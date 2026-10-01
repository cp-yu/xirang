import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readRecordSemanticContext } from '../../../src/core/record/validator.js';
import { minimalModel, writeProjectModel, elementUnit } from '../../helpers/model-fixture.js';

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true }); });
async function workspace() { const root = await fs.mkdtemp(path.join(os.tmpdir(), 'record-context-')); roots.push(root); return root; }

describe('Record 上下文读取', () => {
  it('只允许初次 Build 缺失正式模型，且只读操作不创建目录', async () => {
    const root = await workspace();
    expect(await readRecordSemanticContext(root, 'build')).toMatchObject({ model: null, semanticModelFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) });
    await expect(readRecordSemanticContext(root, 'change')).rejects.toMatchObject({ code: 'SEMANTIC_MODEL_MISSING' });
    expect(await fs.readdir(root)).toEqual([]);
  });

  it('存在但解析损坏或语义无效时不得退化为不存在', async () => {
    const root = await workspace();
    await writeProjectModel(root, minimalModel());
    const valid = await readRecordSemanticContext(root, 'build');
    expect(valid.model?.elements[0].declaration.identity).toBe('root');
    const file = path.join(root, '.xirang', 'model', 'elements', 'root.md');
    for (const bad of ['---\ninvalid: [\n', elementUnit({ identity: 'root', kind: 'ghost', parent: null })]) {
      await fs.writeFile(file, bad);
      await expect(readRecordSemanticContext(root, 'build')).rejects.toMatchObject({ code: 'SEMANTIC_MODEL_INVALID' });
      expect(await fs.readFile(file, 'utf8')).toBe(bad);
    }
  });

  it.runIf(process.platform !== 'win32')('拒绝符号链接，不读取链接指向的模型', async () => {
    const root = await workspace(); const outside = await workspace();
    await writeProjectModel(outside, minimalModel());
    await fs.mkdir(path.join(root, '.xirang'));
    await fs.symlink(path.join(outside, '.xirang', 'model'), path.join(root, '.xirang', 'model'));
    await expect(readRecordSemanticContext(root, 'build')).rejects.toMatchObject({ code: 'UNSAFE_MANAGED_PATH' });
  });
});
