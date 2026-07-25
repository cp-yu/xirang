import { ActiveRelationDefinitionRegistry } from './active-registry.js';
import { RelationDefinitionRegistry } from './registry.js';

export function renderRelationWorkflowSummary(): string {
  return ActiveRelationDefinitionRegistry
    .map(({ type, direction, useWhen }) => `- \`${type}\` (${direction}): ${useWhen}`)
    .join('\n');
}

/** Legacy YAML compatibility template; active architecture-delta help uses the v1 reference below. */
export function renderXirangDeltaTemplate(): string {
  const relationHelp = RelationDefinitionRegistry
    .map(({ type, direction, useWhen, notePolicy }) => {
      const note = notePolicy.allowed ? `note 可选，最多 ${notePolicy.maxLength} 字符` : '禁止 note';
      return `# - ${type}: ${direction}；${useWhen}；${note}`;
    })
    .join('\n');

  return `schema_version: 2

# Canonical no-op: 确认 Architecture Source 无变化时，最终文件只保留 schema_version。
# Real delta: 仅保留至少包含一项 operation 的 section；不得保留 ADDED: {} 或 relations: []。
# 以下是 real delta 的结构示例，不要求所有 section 同时存在。
# Relation 只能从 Registry 定义中选择；无法精确分类时不要创建 relation，并记录 review gap。
# import/call edge 只是 evidence，不自动构成 semantic relation。
${relationHelp}
ADDED:
  capabilities:
    - id: cap.example.feature
      type: capability
      intent: 描述目标架构中持续成立的 capability 职责
  relations:
    - from: cap.example.feature
      type: belongs_to
      to: dom.example
MODIFIED:
  capabilities:
    - id: cap.example.existing
      intent: 描述修改后完整、稳定的 capability 职责
REMOVED:
  capabilities:
    - id: cap.example.legacy
`;
}

export function renderRelationAuthoringReference(): string {
  const definitions = ActiveRelationDefinitionRegistry.map((definition) => {
    const note = definition.notePolicy.allowed
      ? `可选，最多 ${definition.notePolicy.maxLength} 字符，只解释非显而易见的交互条件。`
      : '禁止。';
    const example = [
      `from: ${definition.example.from}`,
      `type: ${definition.example.type}`,
      `to: ${definition.example.to}`,
      ...('note' in definition.example ? [`note: ${definition.example.note}`] : []),
    ].map((line) => `  ${line}`).join('\n');
    return `## ${definition.type}

- Direction: ${definition.direction}
- Endpoints: ${definition.fromKinds.join(' | ')} → ${definition.toKinds.join(' | ')}
- Meaning: ${definition.meaning}
- Use when: ${definition.useWhen}
- Do not use when: ${definition.doNotUseWhen}
- Propagation: ${definition.propagationHint}
- Note: ${note}

\`\`\`yaml
${example}
\`\`\``;
  }).join('\n\n');

  return `# Xirang Relation Authoring

## 选择规则

1. 所有 relation endpoint 都引用持久化 element；无法解析 endpoint 时不创建 relation。
2. 主动触发执行使用 \`invokes\`；创建或发布目标 element 使用 \`produces\`。
3. 只读取数据、配置、制品或合同使用 \`consumes\`。
4. 正确性要求先后顺序使用 \`precedes\`；规则限制目标行为使用 \`constrains\`；判定目标有效性使用 \`validates\`。
5. 无法精确分类时不创建 relation，记录 review gap。

## Note policy

所有 relation 的 \`note\` 可选且最多 200 字符，不得承载路径、symbol 清单或替代 relation type。

${definitions}

## 非法用法

- 不使用 compatibility alias 或模糊通用边。
- 不存储反向重复边。
- 不把 import/call 自动提升为架构 relation。
- containment 表达 refinement，不复制为 semantic relation。
`;
}

export const GENERATED_RELATION_FILES = [
  {
    path: '.xirang/references/xirang-relation-authoring.md',
    render: renderRelationAuthoringReference,
  },
] as const;
