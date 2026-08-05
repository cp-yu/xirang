## Why

`framing update` 是全量替换写，但 CLI 不产出任何相对旧 payload 的变化信号；agent 凭记忆组合 replacement payload 时一旦漏掉此前已确认的目标即被静默删除（上下文遗忘），无处可查。

## What Changes

- `xirang framing update` 结果新增标准三段式 diff（added / modified / removed），按 elementKinds、relationshipKinds、elements、relationships 四分区组织；added 列 identity（relationships 以 source/kind/target 三元组为键），modified 携带 before/after 完整前后内容，removed 携带完整旧条目内容；显式 `operation: REMOVED` 的目标归入 removed；update 保持 status 为 ok、不阻塞。
- Definition Framing 协议增加硬门：组合任何 replacement payload 前必须先 `framing show` 读取完整当前 payload，replacement 必须由当前完整 payload 加上本次显式确认的变更组成，严禁凭记忆重建；每次 `framing update` 后必须审查返回的 diff，未获确认即从 payload 消失的目标须先调和再继续。
- **BREAKING**: `updateFraming` 返回类型由 `FramingWorkspaceRecord` 改为 `{ record, diff }`。

## Source Impact

### Behavior Source

#### New Specs

- None

#### Modified Specs

- `definition-framing-operations`: `framing update` 返回相对上一 payload 的标准三段式 diff，使全量替换中的静默删除可见。
- `definition-framing`: 组合 replacement payload 前必须先读取完整当前 payload，update 后必须审查返回的 diff 并调和未获确认消失的目标。

### Architecture Source

#### Added Elements

- None

#### Modified Elements

- None

#### Removed Elements

- None

#### Architecture Relations

- None

## Impact

- `src/core/framing/types.ts`: 新增 `FramingPayloadDiff` 类型
- `src/core/framing/workspace.ts`: 新增纯函数 `diffFramingPayloads`；`updateFraming` 返回 `{ record, diff }`
- `src/commands/framing.ts`: `runUpdate` 结果含 `diff`
- `src/core/templates/workflows/explore.ts`: `DEFINITION_FRAMING_REFERENCE` 协议文本
- `.xirang/references/xirang-definition-framing.md`: 投影协议文本
- 测试：`test/core/framing/workspace.test.ts`、`test/commands/framing-json.test.ts`、`test/integration/framing-workflow.test.ts`、`test/core/templates/definition-framing-reference.test.ts`
