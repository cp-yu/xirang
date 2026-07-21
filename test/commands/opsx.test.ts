import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { runCLI } from '../helpers/run-cli.js';

describe('opsx command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-opsx-command-'));
    await fs.mkdir(path.join(tempDir, '.opsx'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function writeOpsxProject(): Promise<void> {
    await fs.writeFile(
      path.join(tempDir, '.opsx', 'project.opsx.yaml'),
      `schema_version: 2
project:
  id: proj.test
  name: Test
domains:
  - id: dom.cli
    type: domain
    intent: CLI domain
    status: active
capabilities:
  - id: cap.cli.list
    type: capability
    intent: List items
    status: active
  - id: cap.cli.opsx-query
    type: capability
    intent: Query OPSX nodes
    status: active
  - id: cap.cli.show
    type: capability
    intent: Show items
    status: active
  - id: cap.cli.unused
    type: capability
    intent: No relations or code-map refs
    status: active
`
    );
    await fs.writeFile(
      path.join(tempDir, '.opsx', 'project.opsx.relations.yaml'),
      `schema_version: 2
relations:
  - from: cap.cli.list
    to: dom.cli
    type: belongs_to
  - from: cap.cli.opsx-query
    to: dom.cli
    type: belongs_to
  - from: cap.cli.opsx-query
    to: cap.cli.list
    type: consumes
  - from: cap.cli.show
    to: dom.cli
    type: belongs_to
  - from: cap.cli.show
    to: cap.cli.list
    type: consumes
  - from: cap.cli.unused
    to: dom.cli
    type: belongs_to
`
    );
  }

  it('query存在节点返回完整信息', async () => {
    await writeOpsxProject();

    const result = await runCLI(['opsx', 'query', 'cap.cli.list', '--json'], { cwd: tempDir });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const output = JSON.parse(result.stdout);
    expect(output.node).toMatchObject({
      id: 'cap.cli.list',
      type: 'capability',
      intent: 'List items',
      status: 'active',
    });
    expect(output.relations.incoming).toEqual([
      { from: 'cap.cli.opsx-query', to: 'cap.cli.list', type: 'consumes' },
      { from: 'cap.cli.show', to: 'cap.cli.list', type: 'consumes' },
    ]);
    expect(output.relations.outgoing).toEqual([
      { from: 'cap.cli.list', to: 'dom.cli', type: 'belongs_to' },
    ]);
    expect(output).not.toHaveProperty('seeds');
    expect(output).not.toHaveProperty('nodes');
    expect(output).not.toHaveProperty('missing');
  });

  it('不存在节点报错', async () => {
    await writeOpsxProject();

    const result = await runCLI(['opsx', 'query', 'cap.nonexistent', '--json'], { cwd: tempDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Node 'cap.nonexistent' not found in OPSX");
    expect(result.stderr).toContain('cap.cli.list');
  });

  it('OPSX文件不存在时报错', async () => {
    const result = await runCLI(['opsx', 'query', 'cap.cli.list', '--json'], { cwd: tempDir });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('OPSX files not found');
    expect(result.stderr).toContain('openspec bootstrap init');
    expect(result.stderr).toContain('openspec init');
  });

  it('relations filter works and code-map option is rejected', async () => {
    await writeOpsxProject();
    const relationsResult = await runCLI(['opsx', 'query', 'cap.cli.list', '--relations', '--json'], { cwd: tempDir });
    expect(relationsResult.exitCode).toBe(0);
    expect(JSON.parse(relationsResult.stdout)).toHaveProperty('relations');

    const codeMapResult = await runCLI(['opsx', 'query', 'cap.cli.list', '--code-map', '--json'], { cwd: tempDir });
    expect(codeMapResult.exitCode).toBe(1);
    expect(codeMapResult.stderr).toContain('unknown option');
  });

  it('节点仅有 ownership relation 时返回该 relation', async () => {
    await writeOpsxProject();

    const result = await runCLI(['opsx', 'query', 'cap.cli.unused', '--json'], { cwd: tempDir });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.relations).toEqual({
      incoming: [],
      outgoing: [{ from: 'cap.cli.unused', to: 'dom.cli', type: 'belongs_to' }],
    });
    expect(output).not.toHaveProperty('codeMap');
  });

  it('批量查询全部缺失时报错并保留可用节点提示', async () => {
    await writeOpsxProject();

    const result = await runCLI(
      ['opsx', 'query', 'cap.nope1', 'cap.nope2', '--json'],
      { cwd: tempDir }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('not found in OPSX');
    expect(result.stderr).toContain('cap.cli.list');
  });

  it('depth展开覆盖双向二跳并去重', async () => {
    await writeOpsxProject();

    const result = await runCLI(
      ['opsx', 'query', 'cap.cli.opsx-query', '--depth', '2', '--json'],
      { cwd: tempDir }
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    const output = JSON.parse(result.stdout);
    const nodeIds = output.nodes.map((node: { id: string }) => node.id);
    const relationKeys = output.relations.map((relation: { from: string; to: string; type: string }) => (
      `${relation.from}|${relation.type}|${relation.to}`
    ));
    expect(nodeIds).toEqual(['cap.cli.opsx-query', 'dom.cli', 'cap.cli.list', 'cap.cli.show', 'cap.cli.unused']);
    expect(new Set(nodeIds).size).toBe(nodeIds.length);
    expect(relationKeys).toEqual([
      'cap.cli.list|belongs_to|dom.cli',
      'cap.cli.opsx-query|belongs_to|dom.cli',
      'cap.cli.opsx-query|consumes|cap.cli.list',
      'cap.cli.show|belongs_to|dom.cli',
      'cap.cli.show|consumes|cap.cli.list',
      'cap.cli.unused|belongs_to|dom.cli',
    ]);
    expect(new Set(relationKeys).size).toBe(relationKeys.length);
  });

  it('非法depth参数报错', async () => {
    await writeOpsxProject();

    const overLimit = await runCLI(
      ['opsx', 'query', 'cap.cli.list', '--depth', '6', '--json'],
      { cwd: tempDir }
    );
    const zero = await runCLI(
      ['opsx', 'query', 'cap.cli.list', '--depth', '0', '--json'],
      { cwd: tempDir }
    );
    const text = await runCLI(
      ['opsx', 'query', 'cap.cli.list', '--depth', 'abc', '--json'],
      { cwd: tempDir }
    );

    expect(overLimit.exitCode).toBe(1);
    expect(overLimit.stderr).toContain('--depth');
    expect(overLimit.stderr).toContain('1 to 5');
    expect(zero.exitCode).toBe(1);
    expect(zero.stderr).toContain('positive integer');
    expect(text.exitCode).toBe(1);
    expect(text.stderr).toContain('positive integer');
  });



});
