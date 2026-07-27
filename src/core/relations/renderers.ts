import { ActiveRelationDefinitionRegistry } from './active-registry.js';

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
