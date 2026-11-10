import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const [baseline, current = process.cwd()] = process.argv.slice(2);
if (!baseline) throw new Error('Usage: node scripts/measure-cli-context.mjs <built-baseline-root> [built-current-root]');
const root = await mkdtemp(path.join(os.tmpdir(), 'xirang-context-measure-'));
const bytes = value => Buffer.byteLength(value);
const unit = (entity, identity, rest) => `---\nentity: ${entity}\nidentity: ${identity}\n${rest}\n---\n`;
async function fixture() {
  await rm(path.join(root, '.xirang'), { recursive: true, force: true });
  for (const partition of ['metamodel', 'elements', 'relationships', 'views']) await mkdir(path.join(root, '.xirang/model', partition), { recursive: true });
  await writeFile(path.join(root, '.xirang/model/metamodel/project.md'), unit('element-kind', 'project', 'contract: optional\nroot: true'));
  await writeFile(path.join(root, '.xirang/model/elements/root.md'), unit('element-declaration', 'root', 'kind: project\nparent: null\ntitle: Root\ndefinition: A measured project root.'));
  const change = path.join(root, '.xirang/changes/sample');
  await mkdir(path.join(change, 'elements'), { recursive: true });
  await writeFile(path.join(change, 'proposal.md'), '## Why\n\nA representative CLI context measurement.\n\n## What Changes\n\n- Update root intent.\n');
  await writeFile(path.join(change, 'design.md'), '## Context\n\nPreserve the confirmed scope.\n');
  await writeFile(path.join(change, 'tasks.md'), '## Goals\n\n- [ ] G1: Implement the confirmed root intent\n  - Contract: `root` / Section "Intent"\n  - Verify: The confirmed outcome is observable.\n');
  await writeFile(path.join(change, 'elements/root.md'), unit('element-declaration', 'root', 'operation: MODIFIED\nkind: project\nparent: null\ntitle: Root\ndefinition: The complete measured target scope.'));
  await writeFile(path.join(root, '.xirang/config.yaml'), 'schema: semantic-model\nproseLanguage: 中文\ncontext: Preserve the confirmed project boundary.\nrules:\n  proposal: [State the concrete motivation.]\n  specs: [Preserve conditions and observable outcomes.]\n  design: [Explain consequential decisions.]\n  tasks: [Use goal-level verification directions.]\napply:\n  defaultIsolation: branch\n');
  const entries = Array.from({ length: 10 }, (_, i) => ({ identity: `E${i + 1}`, nature: 'normative', decision: 'accepted', content: `Confirmed behavior ${i + 1}: preserve its conditions, exceptions, timing and observable results.\nThe example succeeds with all required inputs and fails when a required input is absent.` }));
  await writeFile(path.join(root, 'payload.json'), JSON.stringify({ schemaVersion: 4, context: 'change', entries }));
  await writeFile(path.join(root, 'patch.json'), JSON.stringify({ entries: { upsert: [{ ...entries[1], content: entries[1].content + '\nA newly confirmed exception preserves the original scope.' }] } }));
}
async function measure(tree, legacy) {
  await fixture();
  const steps = [];
  async function cli(group, args) {
    const result = spawnSync(process.execPath, [path.resolve(tree, 'bin/xirang.js'), ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', XIRANG_TELEMETRY: '0', XIRANG_INTERACTIVE: '0' } });
    if (result.status !== 0) throw new Error(`${args.join(' ')}: ${result.stderr || result.stdout}`);
    steps.push({ group, command: args.join(' '), stdout: bytes(result.stdout), stderr: bytes(result.stderr), reads: 0 });
    return result.stdout && args.includes('--json') ? JSON.parse(result.stdout) : undefined;
  }
  async function load(group, relative) {
    const content = await readFile(path.join(tree, relative));
    steps.push({ group, file: relative, stdout: 0, stderr: 0, reads: content.length });
  }
  await cli('single-config', legacy ? ['config', 'project', '--json'] : ['config', 'project', '--select', 'proseLanguage', '--select', 'apply', '--json']);
  await cli('single-query', ['arch', 'query', 'root', '--contract', '--json']);
  await cli('single-validation', ['validate', '--change', 'sample', '--json']);
  await cli('propose', ['status', '--change', 'sample', '--json']);
  await load('propose', '.pi/skills/xirang-propose/SKILL.md');
  if (legacy) {
    for (const artifact of ['proposal', 'specs', 'design', 'tasks', 'proposal', 'design', 'tasks']) await cli('propose', ['instructions', artifact, '--change', 'sample', '--json']);
  } else {
    for (const artifact of ['proposal', 'specs', 'design', 'tasks']) {
      await load('propose', `.xirang/references/xirang-artifact-${artifact}.md`);
      await cli('propose', ['config', 'project', '--artifact', artifact, '--select', 'proseLanguage', '--select', 'context', '--select', 'rules', '--json']);
    }
  }
  await cli('propose', ['validate', '--change', 'sample', '--json']);
  await load('apply', '.pi/skills/xirang-apply-change/SKILL.md');
  await load('apply', '.xirang/references/xirang-apply-step-1-preparation.md');
  await cli('apply', ['status', '--change', 'sample', '--json']);
  if (legacy) {
    await cli('apply', ['instructions', 'apply', '--change', 'sample', '--json']);
    await cli('apply', ['quality', 'status', 'sample', '--json']);
  } else await cli('apply', ['config', 'project', '--select', 'proseLanguage', '--select', 'apply', '--json']);
  await load('record', '.xirang/references/xirang-design-record.md');
  const created = await cli('record', legacy ? ['record', 'create', '--slug', 'sample', '--from', path.join(root, 'payload.json'), '--json'] : ['record', 'create', 'sample.md', '--from', path.join(root, 'payload.json'), '--json']);
  const id = legacy ? created.result.explorationId : 'sample.md';
  let shown = await cli('record', ['record', 'show', id, '--json']);
  if (legacy) {
    await cli('record', ['record', 'status', id, '--json']);
    await cli('record', ['record', 'validate', id, '--json']);
  }
  await cli('record', ['record', 'show', id, '--entry', 'E2', '--json']);
  await cli('record', ['record', 'update', id, '--from', path.join(root, 'patch.json'), ...(legacy ? ['--source-version', shown.result.sourceVersion] : []), '--json']);
  await cli('candidate', ['candidate', 'init', '--from', 'current']);
  await cli('candidate', ['candidate', 'validate', '--json']);
  const groups = {};
  for (const step of steps) {
    const group = groups[step.group] ??= { calls: 0, stdout: 0, stderr: 0, reads: 0, total: 0 };
    if (step.command) group.calls++;
    for (const field of ['stdout', 'stderr', 'reads']) group[field] += step[field];
    group.total += step.stdout + step.stderr + step.reads;
  }
  return { groups, steps };
}
try {
  const before = await measure(baseline, true);
  const after = await measure(current, false);
  const comparison = Object.fromEntries(Object.keys(before.groups).map(group => [group, { before: before.groups[group], after: after.groups[group], reductionPercent: Number(((1 - after.groups[group].total / before.groups[group].total) * 100).toFixed(2)) }]));
  console.log(JSON.stringify({ unit: 'UTF-8 bytes, not tokens', fixture: 'Same directory, model, Change, config and ten-entry source reset before each variant', scope: 'Executed CLI invocations and files actually read by these representative recipes; excludes identical model/code reads, reasoning and conversation. First-load file cost is included; repeated static reads are avoided only where the workflow says to reuse them.', comparison, before: before.steps, after: after.steps }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
