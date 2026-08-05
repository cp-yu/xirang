### Task 1: 实现 diffFramingPayloads 并接入 update 结果

**Goal**: `framing update` 返回标准三段式 diff，使全量替换中的静默删除可见。

**Files**:
- Modify: `src/core/framing/types.ts`
- Modify: `src/core/framing/workspace.ts`
- Modify: `src/commands/framing.ts`
- Modify: `test/core/framing/workspace.test.ts`
- Modify: `test/commands/framing-json.test.ts`
- Modify: `test/integration/framing-workflow.test.ts`

**Requirements**:
- 新增 `FramingPayloadDiff` 类型，按四分区输出 added/modified/removed
- 新增纯函数 `diffFramingPayloads(previous, next)`，modified 复用 normalized 语义
- `updateFraming` 返回 `{ record, diff }`
- `runUpdate` 结果含 `diff`，status 保持 ok

#### Checks

- [x] C1 验证 diff 三态判定正确
  - Verifies: `elements/definition-framing-operations.md` / Requirement "返回全量替换的相对变化" / Scenario "省略目标出现在 removed"
  - Command: `pnpm vitest run test/core/framing/workspace.test.ts`
  - Expect: 新增测试覆盖省略目标进入 removed、新增目标进入 added、内容变化进入 modified、显式 REMOVED 归入 removed

- [x] C2 验证 update JSON 结果含 diff
  - Verifies: `elements/definition-framing-operations.md` / Requirement "返回全量替换的相对变化" / Scenario "新增目标归入 added"
  - Command: `pnpm vitest run test/commands/framing-json.test.ts test/integration/framing-workflow.test.ts`
  - Expect: update 的 envelope result 包含 `diff` 且 status 为 ok

### Task 2: 同步 Definition Framing 协议硬门

**Goal**: 协议文本（模板 + 投影）增加"先读后写 + 写后审查 diff"硬门。

**Files**:
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `.xirang/references/xirang-definition-framing.md`
- Modify: `test/core/templates/definition-framing-reference.test.ts`

**Requirements**:
- Persistence boundary 增加"组合 replacement 前必须 framing show 读取完整当前 payload"
- Lifecycle update 步骤增加"update 后必须审查返回的 diff，未确认消失的目标先调和"
- 模板与投影内容一致，保留既有必备短语

#### Checks

- [x] C3 验证协议模板与投影含硬门短语且测试通过
  - Verifies: `elements/definition-framing.md` / Requirement "组合替换前读取当前完整结构" / Scenario "update 后审查 diff"
  - Command: `pnpm vitest run test/core/templates/definition-framing-reference.test.ts`
  - Expect: 测试通过，模板与 `.xirang/references/xirang-definition-framing.md` 均包含硬门表述且既有必备短语保留

- [x] C4 验证全量测试通过
  - Verifies: `elements/definition-framing.md` / Requirement "组合替换前读取当前完整结构" / Scenario "组合前读取当前 payload"
  - Command: `pnpm test`
  - Expect: 全部测试通过，无回归
