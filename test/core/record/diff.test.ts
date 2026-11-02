import { describe, expect, it } from 'vitest';
import { diffRecordPayloads } from '../../../src/core/record/workspace.js';
import type { DesignRecordPayload, RecordEntry } from '../../../src/core/record/types.js';

const entry = (identity: string, content = identity): RecordEntry => ({ identity, nature: 'normative', decision: 'accepted' as const, content });
const payload = (entries: RecordEntry[]): DesignRecordPayload => ({
  schemaVersion: 4, context: 'change', relatedIdentities: [], entries,
  structure: { elements: [], relationships: [], elementKinds: [], relationshipKinds: [] },
});
const unchanged = { added: [], modified: [], withdrawn: [] };

describe('确认条目差异', () => {
  it('按稳定身份而非顺序比较，并返回完整可审查内容', () => {
    const before = payload([entry('keep'), entry('edit', '最多 5 本'), entry('drop')]);
    const after = payload([entry('edit', '最多 3 本'), entry('new'), entry('keep')]);
    expect(diffRecordPayloads(before, after)).toEqual({
      entries: {
        added: [entry('new')],
        modified: [{ identity: 'edit', before: entry('edit', '最多 5 本'), after: entry('edit', '最多 3 本') }],
        removed: [entry('drop')],
      },
      structure: unchanged,
    });
    expect(diffRecordPayloads(before, payload([...before.entries].reverse()))).toEqual({ entries: { added: [], modified: [], removed: [] }, structure: unchanged });
  });

  it.each([{ nature: 'informative' }, { decision: 'excluded' }])('内容相同但性质或状态改变也必须可见 %j', change => {
    const before = payload([entry('a')]);
    const after = payload([{ ...entry('a'), ...change } as RecordEntry]);
    expect(diffRecordPayloads(before, after).entries.modified).toEqual([{ identity: 'a', before: before.entries[0], after: after.entries[0] }]);
  });
});
