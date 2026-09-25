import { describe, expect, it } from 'vitest';
import { diffFramingPayloads } from '../../../src/core/framing/workspace.js';
import type { ChangeStructuralDefinitionPayload, FramingEntry } from '../../../src/core/framing/types.js';

const entry = (identity: string, content = identity): FramingEntry => ({ identity, nature: 'normative', content });
const payload = (entries: FramingEntry[]): ChangeStructuralDefinitionPayload => ({ schemaVersion: 2, context: 'change', relatedIdentities: [], entries });

describe('确认条目差异', () => {
  it('按稳定身份而非顺序比较，并返回完整可审查内容', () => {
    const before = payload([entry('keep'), entry('edit', '最多 5 本'), entry('drop')]);
    const after = payload([entry('edit', '最多 3 本'), entry('new'), entry('keep')]);
    expect(diffFramingPayloads(before, after)).toEqual({
      added: [entry('new')],
      modified: [{ identity: 'edit', before: entry('edit', '最多 5 本'), after: entry('edit', '最多 3 本') }],
      removed: [entry('drop')],
    });
    expect(diffFramingPayloads(before, payload([...before.entries].reverse()))).toEqual({ added: [], modified: [], removed: [] });
  });

  it('内容相同但性质改变也必须可见', () => {
    const before = payload([entry('a')]);
    const after = payload([{ ...entry('a'), nature: 'informative' }]);
    expect(diffFramingPayloads(before, after).modified).toEqual([{ identity: 'a', before: before.entries[0], after: after.entries[0] }]);
  });
});
