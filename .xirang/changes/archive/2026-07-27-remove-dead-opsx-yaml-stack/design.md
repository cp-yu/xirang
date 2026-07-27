## Context

opsx YAML 栈是 Hierarchical Elements 之前的语义模型实现。`src/utils/xirang-utils.ts:14-18` 定义 `XIRANG_PATHS.PROJECT_FILE`、`RELATIONS_FILE` 与 `deltaPath('opsx-delta.yaml')`，`:246-292` 提供读写，`:393-558` 提供 delta 读取、应用与引用完整性校验，全部基于 `domains` + `capabilities` 二元节点（`:444-527`）。

## Decisions

### 1. 死代码判定依据

以符号级引用核查为准，不依赖文件名或注释：

- `readProjectOpsx`、`writeProjectOpsx`、`applyXirangDelta`、`readXirangDelta`、`hasXirangDeltaOperations`、`validateReferentialIntegrity`、`XirangDeltaSchema`、`ProjectOpsxFileSchema` 在 `src/` 内除 `src/utils/xirang-utils.ts` 自身外零匹配。
- `validateRelationGraph` 在 `src/` 内除 `src/core/relations/validator.ts` 自身外，仅 `src/utils/xirang-utils.ts:10` 引用。
- `src/` 外（构建脚本、配置、文档）对两个文件路径零引用。

两文件构成闭合互引环：`src/utils/xirang-utils.ts:10` → `validator.ts`，`src/core/relations/validator.ts:2` → `xirang-utils.ts` 的 `ProjectXirangBundle` 类型。环外无入口，故必须整对删除；单删任一侧都会留下悬空 import。

### 2. 保留 `relations/` 其余文件

`src/core/relations/` 四个文件的存活性不同，不可整目录处理：

| 文件 | 判定 | 依据 |
|---|---|---|
| `validator.ts` | 删除 | 仅被待删文件引用 |
| `registry.ts` | 保留 | `renderers.ts:2` 与 `active-registry.ts:1` 消费 |
| `renderers.ts` | 保留 | `src/commands/help.ts:3` 消费 |
| `active-registry.ts` | 保留 | `src/commands/help.ts:2` 消费 |

`registry.ts` 的存活路径不经过 `xirang-utils.ts`：`help.ts` 用的是 `active-registry.ts` 的 `ActiveRelationDefinitionRegistry` 与 `renderers.ts` 的 `renderRelationAuthoringReference`，二者各自 import `registry.ts` 的类型与数据。

### 3. 孤儿导出处置

删除后失去 `src/` 内消费者的导出：

`registry.ts`：`RELATION_TYPES`、`RelationType`、`RelationEndpointKind`、`RelationTypeSchema`、`getRelationDefinition`。
存活：`RelationDefinition`（`active-registry.ts:1,16`）、`RelationDefinitionRegistry`（`renderers.ts:2,12`）。

`renderers.ts`：`renderRelationWorkflowSummary`、`renderXirangDeltaTemplate`、`GENERATED_RELATION_FILES`。
存活：`renderRelationAuthoringReference`（`help.ts:3,74`）。

处置策略：删除孤儿导出及其仅存的测试断言。这些导出目前仍被 `test/core/relations/registry.test.ts` 与 `test/core/relations/renderers.test.ts` 覆盖，测试通过不构成存活证据——测试覆盖的是即将失去调用方的代码。其中 `renderXirangDeltaTemplate` 生成的正是 `opsx-delta.yaml` 模板，与被删栈同源。

`RelationType` 与 `RelationEndpointKind` 若在删除 `RELATION_TYPES` 后仍被 `RelationDefinition` 的字段类型引用，则随之保留；判定以实际类型引用为准，不预设结论。

### 4. 执行顺序

先确立测试基线，再删除，每步独立验证：

1. 记录基线（当前 `test/utils/xirang-utils*.test.ts` 与 `test/core/relations/` 共 80 tests 通过）。
2. 删除测试文件——此时源码仍在，全量套件应从 148 降至 136 文件且无失败。
3. 删除两个源文件——若第 2 步遗漏任何引用，此步立即以编译错误暴露。
4. 逐个核查并删除孤儿导出，同步调整 `registry.test.ts` 与 `renderers.test.ts`。

顺序不可颠倒：先删源码会让 12 个测试文件同时红，掩盖真实的引用遗漏点。

### 5. Test Maintenance

11 个 `xirang-utils` 测试文件中，5 个是 PBT（原子写、合并幂等、YAML 结构往返、文件尺寸边界、引用完整性）。它们验证的属性在新栈仍然需要——`xirang-contract.md` 的「Sync 保证」要求 `parse(serialize(ir))` 与 `ir` 相等的属性测试。这些属性由 C1 模型内核重新建立，不在本 Change 补写；本 Change 只删除绑定旧 YAML 结构的实现。

## Risks / Trade-offs

- 覆盖率短期下降 2463 行测试。属于净删除，被测对象同时消失，非覆盖缺口。
- `registry.ts` 与 `renderers.ts` 收缩后可能仅剩单一消费路径。不在本 Change 内合并文件，避免把结构调整混入删除。

## Rollback

任一步骤出现下列情况即回滚该步骤并重新核查：

- 删除测试文件后全量套件出现失败（说明存在跨文件夹具依赖）。
- 删除源文件后 `pnpm exec tsc --noEmit` 报出预期外的引用错误（说明符号核查有遗漏）。
- `xirang help` 输出发生变化（说明误删了 `relations/` 的存活路径）。

回滚方式为 `git restore` 对应文件；本 Change 无数据迁移与状态转换，无需额外恢复步骤。
