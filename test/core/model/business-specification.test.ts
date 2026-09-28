import { describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseSemanticModel, parseSemanticModelFiles } from '../../../src/core/model/parser.js';
import { serializeSemanticModel } from '../../../src/core/model/serializer.js';
import { validateSemanticModel } from '../../../src/core/model/validator.js';
import { compileChange } from '../../../src/core/change-compiler.js';
import { createModelRoot } from './fixtures.js';
import { runCLI } from '../../helpers/run-cli.js';

const kind = '---\nentity: element-kind\nidentity: business\ncontract: required\ncontractFormat: business-specification\n---\n';
const contract = `## Specification

### Section: Scope and Non-goals
库存 SHALL 不负责支付。

### Section: Business Logic
库存 SHALL 原子扣减并在到期时返还。

#### 扣减与返还

data flows and diagrams may be kept together:

\`\`\`mermaid
stateDiagram-v2
  Available --> Reserved
  Reserved --> Available
\`\`\`

### Section: Edge Cases and Exception Handling
库存 SHALL 拒绝空商品 ID。

### Section: Key Acceptance Cases
以下结果 SHALL 成立。

#### Acceptance Case: 库存不足
库存为零时下单失败，库存不变。
`;

function files(body = contract, kindText = kind): [string, string][] {
  return [
    ['metamodel/project.md', '---\nentity: element-kind\nidentity: project\ncontract: optional\nroot: true\n---\n'],
    ['metamodel/business.md', kindText],
    ['elements/root.md', '---\nentity: element-declaration\nidentity: root\nkind: project\nparent: null\ntitle: Root\ndefinition: Project.\n---\n'],
    ['elements/inventory.md', '---\nentity: element-declaration\nidentity: inventory\nkind: business\nparent: root\ntitle: 库存\ndefinition: 库存管理。\n---\n\n' + body],
  ];
}

async function createProject(body = contract, kindText = kind): Promise<string> {
  const project = await createModelRoot({});
  const root = path.join(project, '.xirang/model');
  for (const partition of ['elements', 'metamodel', 'relationships', 'views']) {
    await fs.mkdir(path.join(root, partition), { recursive: true });
  }
  for (const [name, text] of files(body, kindText)) {
    await fs.writeFile(path.join(root, name), text);
  }
  return project;
}

function diagnostics(body = contract, kindText = kind) {
  const parsed = parseSemanticModelFiles(files(body, kindText));
  return [...parsed.diagnostics, ...validateSemanticModel(parsed.model)];
}

describe('business specification 4+N', () => {
  it('accepts English headings with localized prose, diagrams and arbitrary additional Sections', () => {
    expect(diagnostics(contract + '\n### Section: 独立保留策略\nSHALL 保留必要记录。\n')).toEqual([]);
  });

  it.each(['Scope and Non-goals', 'Business Logic', 'Edge Cases and Exception Handling', 'Key Acceptance Cases'])(
    'rejects renaming or omitting the fixed Section %s', name => {
      const result = diagnostics(contract.replace(`### Section: ${name}`, '### Section: 自选标题'));
      expect(result).toContainEqual(expect.objectContaining({ code: 'MISSING_BUSINESS_SECTION', level: 'ERROR', identity: 'inventory' }));
    },
  );

  it('rejects duplicates and empty required Sections', () => {
    expect(diagnostics(contract + '\n### Section: Business Logic\nSHALL do it.\n'))
      .toContainEqual(expect.objectContaining({ code: 'DUPLICATE_SECTION_NAME' }));
    expect(diagnostics(contract.replace('库存 SHALL 拒绝空商品 ID。', '   ')))
      .toContainEqual(expect.objectContaining({ code: 'EMPTY_BUSINESS_SECTION' }));
  });

  it('requires a nonempty acceptance case in its dedicated Section', () => {
    expect(diagnostics(contract.slice(0, contract.indexOf('#### Acceptance Case:'))))
      .toContainEqual(expect.objectContaining({ code: 'MISSING_KEY_ACCEPTANCE_CASE' }));
    expect(diagnostics(contract.replace('库存为零时下单失败，库存不变。', '')))
      .toContainEqual(expect.objectContaining({ code: 'EMPTY_KEY_ACCEPTANCE_CASE' }));
    expect(diagnostics(contract.replace('#### 扣减与返还', '#### Acceptance Case: misplaced')))
      .toContainEqual(expect.objectContaining({ code: 'MISPLACED_ACCEPTANCE_CASE' }));
  });

  it('does not infer applicability from prose, identities or titles', () => {
    expect(diagnostics('## Specification\n\n### Section: 概念定义\nSHALL define business-specification and inventory.\n',
      kind.replace('contractFormat: business-specification\n', ''))).toEqual([]);
  });

  it('rejects an unknown format or optional business contract policy', () => {
    expect(diagnostics(contract, kind.replace('business-specification', 'typo')))
      .toContainEqual(expect.objectContaining({ code: 'INVALID_CONTRACT_FORMAT' }));
    expect(diagnostics(contract, kind.replace('contract: required', 'contract: optional')))
      .toContainEqual(expect.objectContaining({ code: 'INVALID_BUSINESS_CONTRACT_POLICY' }));
    expect(diagnostics('')).toContainEqual(expect.objectContaining({ code: 'MISSING_BUSINESS_SECTION' }));
  });

  it('preserves the declared format through parse/serialize round trips', async () => {
    const parsed = parseSemanticModelFiles(files());
    const business = parsed.model.elementKinds.find(item => item.identity === 'business');
    expect(business).toHaveProperty('contractFormat', 'business-specification');
    const serialized = serializeSemanticModel(parsed.model);
    const root = await createModelRoot(Object.fromEntries([...serialized].map(([name, bytes]) => [name, bytes.toString()])));
    expect((await parseSemanticModel(root)).model).toEqual(parsed.model);
  });

  it('validates the complete expected model rather than requiring all four Sections in each delta', async () => {
    const project = await createProject();
    const changeDir = path.join(project, '.xirang/changes/test/elements');
    await fs.mkdir(changeDir, { recursive: true });
    const unit = '---\nentity: element-declaration\nidentity: inventory\ndefinition: 库存管理。\n---\n\n';
    await fs.writeFile(path.join(changeDir, 'inventory.md'), unit + '## MODIFIED Sections\n\n### Section: Business Logic\n库存 SHALL 原子扣减，30 分钟未支付时返还。\n');
    const compiled = await compileChange(project, 'test');
    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.valid).toBe(true);
    await fs.writeFile(path.join(changeDir, 'inventory.md'), unit + '## REMOVED Sections\n\n### Section: Key Acceptance Cases\n');
    const invalid = await compileChange(project, 'test');
    expect(invalid.valid).toBe(false);
    expect(invalid.diagnostics).toContainEqual(expect.objectContaining({ code: 'MISSING_BUSINESS_SECTION' }));
  });

  it('applies a Kind format change to existing instances even without Element deltas', async () => {
    const project = await createProject('## Specification\n\n### Section: Old\nSHALL hold.\n',
      kind.replace('contractFormat: business-specification\n', ''));
    const delta = path.join(project, '.xirang/changes/format/metamodel');
    await fs.mkdir(delta, { recursive: true });
    await fs.writeFile(path.join(delta, 'business.md'), kind.replace('---\nentity:', '---\noperation: MODIFIED\nentity:'));
    const compiled = await compileChange(project, 'format');
    expect(compiled.valid).toBe(false);
    expect(compiled.diagnostics.filter(item => item.code === 'MISSING_BUSINESS_SECTION')).toHaveLength(4);
  });

  it('enforces the format through architecture, direct Contract and bulk CLI validation', async () => {
    const project = await createProject();
    for (const args of [['arch', 'validate', '--json'], ['validate', 'inventory', '--type', 'contract', '--json'], ['validate', '--contracts', '--json']]) {
      expect((await runCLI(args, { cwd: project })).exitCode).toBe(0);
    }
    for (const body of [contract.replace('### Section: Business Logic', '### Section: 自选机制'), '']) {
      await fs.writeFile(path.join(project, '.xirang/model/elements/inventory.md'), files(body)[3][1]);
      for (const args of [['arch', 'validate', '--json'], ['validate', 'inventory', '--type', 'contract', '--json'], ['validate', '--contracts', '--json']]) {
        const result = await runCLI(args, { cwd: project });
        expect(result.exitCode).toBe(1);
        expect(result.stdout).toContain('MISSING_BUSINESS_SECTION');
      }
    }
  });

  it('exposes the format to Agents through outline and query', async () => {
    const project = await createProject();
    const outline = await runCLI(['arch', 'outline', '--format', 'json'], { cwd: project });
    expect(outline.exitCode).toBe(0);
    expect(JSON.parse(outline.stdout).metamodel.elementKinds).toContainEqual(expect.objectContaining({
      identity: 'business', contractFormat: 'business-specification',
    }));
    const query = await runCLI(['arch', 'query', 'inventory', '--json'], { cwd: project });
    expect(query.exitCode).toBe(0);
    expect(JSON.parse(query.stdout).elements.inventory.contractFormat).toBe('business-specification');
  });

});
