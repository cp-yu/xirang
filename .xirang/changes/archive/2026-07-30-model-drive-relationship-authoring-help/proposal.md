## Why

`xirang help authoring semantic-delta` 原先从硬编码的 `ActiveRelationDefinitionRegistry` 派生六种 relationship kinds 和伪造 relationship entries，与「Relationship Kinds 由 Metamodel 声明」的架构相悖。当前项目 Metamodel 已声明八种 Relationship Kinds（含 `responsible-for`、`supports-presentation`），但 authoring help 无法反映，且输出了不存在于当前模型的伪 Element identities。

## What Changes

- Authoring help 从当前项目 Semantic Model 的 Metamodel 只读投影 Relationship Kinds，不再维护代码内置默认。
- 输出区分「新增 Relationship」与「新增 Relationship Kind」两种操作，使用占位符而非预设 entries。
- Kind 列表以约束表格呈现，`sourceKinds`/`targetKinds` 缺失显示 `*`（unrestricted）、显式空数组显示 `∅`；非空 Kind body 原样输出。
- `--json` 返回 `relationshipKinds` 声明和 `relationshipDelta` 语法元数据，不再返回虚构的 `relations`。
- 缺失或空模型目录、语义无效模型均拒绝输出。
- 删除 `src/core/relations/active-registry.ts`、`registry.ts`、`renderers.ts` 及对应测试。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `cap.cli.authoring-help`: Relationship authoring help 从静态 registry 驱动改为当前 Semantic Model Metamodel 驱动，不预设 relationship kinds 或 entries。

### Architecture Source

None

## Impact

- 代码：
  - `src/commands/help.ts` — 从当前 Semantic Model 加载 Relationship Kinds 并渲染
  - 删除 `src/core/relations/active-registry.ts`、`src/core/relations/registry.ts`、`src/core/relations/renderers.ts`
- 测试：
  - `test/commands/help.test.ts` — 改为模型驱动契约测试
  - 删除 `test/core/relations/registry.test.ts`、`test/core/relations/renderers.test.ts`
  - `test/helpers/model-fixture.ts` — 支持 relationship kind body 与显式空约束
- 无 CLI 命令接口、文件格式或安装行为变更。
