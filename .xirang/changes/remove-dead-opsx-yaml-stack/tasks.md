### Task 1: 确立删除前测试基线

**Goal**: 记录受影响范围的当前通过状态，使后续每步删除都有可比对的基准。

**Files**:
- Test: `test/utils/xirang-utils.test.ts`
- Test: `test/core/relations/registry.test.ts`
- Test: `test/core/relations/renderers.test.ts`
- Test: `test/core/relations/validator.test.ts`

**Requirements**:
- 记录全量测试文件数与通过数，作为后续比对基准
- 记录 `test/utils/xirang-utils*.test.ts` 与 `test/core/relations/` 的通过数
- 记录 `xirang help` 当前输出，用于验证 `relations/` 存活路径未受影响
- 不修改任何文件

#### Checks

- [ ] C1 基线可复现
  - Command: `pnpm exec vitest run test/utils/ test/core/relations/`
  - Expect: 全部通过；`test/utils/xirang-utils*.test.ts` 与 `test/core/relations/` 合计 80 tests 通过
  - Remediation: 基线不通过时先修复既有失败，不得在红状态下开始删除

- [ ] C2 记录全量基线
  - Command: `pnpm exec vitest run 2>&1 | tail -5`
  - Expect: 记录测试文件总数（当前 148）与通过数
  - Remediation: 若已有失败用例，逐一记录并在后续步骤中排除干扰

- [ ] C3 记录 help 输出基线
  - Command: `pnpm xirang help > /tmp/help-before.txt && wc -l /tmp/help-before.txt`
  - Expect: 输出成功，包含 relation authoring reference 段落
  - Remediation: 命令失败说明 `relations/` 存活路径已有问题，先查明再继续

### Task 2: 删除 opsx YAML 栈测试文件

**Goal**: 先删测试再删源码，使源码删除时的引用遗漏能以编译错误精确暴露。

**Files**:
- Delete: `test/utils/xirang-utils.test.ts`
- Delete: `test/utils/xirang-utils.edge-cases.test.ts`
- Delete: `test/utils/xirang-utils.integration-workflow.test.ts`
- Delete: `test/utils/xirang-utils.integration-multi-change.test.ts`
- Delete: `test/utils/xirang-utils.integration-bootstrap.test.ts`
- Delete: `test/utils/xirang-utils.benchmark.test.ts`
- Delete: `test/utils/xirang-utils.pbt.atomic-write.test.ts`
- Delete: `test/utils/xirang-utils.pbt.merge-idempotency.test.ts`
- Delete: `test/utils/xirang-utils.pbt.yaml-structure.test.ts`
- Delete: `test/utils/xirang-utils.pbt.file-size-boundaries.test.ts`
- Delete: `test/utils/xirang-utils.pbt.referential-integrity.test.ts`
- Delete: `test/core/relations/validator.test.ts`

**Requirements**:
- 仅删除上述 12 个文件，合计 2463 行
- 不改动任何源码
- 不改动 `test/core/relations/registry.test.ts` 与 `test/core/relations/renderers.test.ts`
- `test/utils/xirang-utils.integration-bootstrap.test.ts` 另引 `architecture-reader.js`，确认该引用不影响其他测试后再删

#### Checks

- [ ] C1 测试文件数按预期减少
  - Command: `find test tests -name "*.test.ts" | wc -l`
  - Expect: 从 148 降至 136
  - Remediation: 数目不符时核对删除清单，不得多删

- [ ] C2 剩余套件无新增失败
  - Command: `pnpm exec vitest run`
  - Expect: 与 Task 1 基线相比无新增失败
  - Remediation: 出现失败说明存在跨文件夹具或 setup 依赖，恢复该文件并在 design 中记录

- [ ] C3 relations 存活测试仍通过
  - Command: `pnpm exec vitest run test/core/relations/`
  - Expect: `registry.test.ts` 与 `renderers.test.ts` 通过
  - Remediation: 失败说明误删了共享夹具

### Task 3: 删除 opsx YAML 栈源文件

**Goal**: 删除闭合互引环的两个源文件，以类型检查证明无遗留引用。

**Files**:
- Delete: `src/utils/xirang-utils.ts`
- Delete: `src/core/relations/validator.ts`

**Requirements**:
- 两文件必须同批删除：`src/utils/xirang-utils.ts:10` 引用 validator，`src/core/relations/validator.ts:2` 引用 `ProjectXirangBundle`，单删任一侧产生悬空 import
- 不改动 `src/core/relations/registry.ts`、`renderers.ts`、`active-registry.ts`
- 删除后 `src/core/relations/` 应剩 3 个文件

#### Checks

- [ ] C1 类型检查无悬空引用
  - Command: `pnpm exec tsc --noEmit`
  - Expect: 无错误
  - Remediation: 报错即为符号核查遗漏，逐个定位真实消费者后再决定删除范围

- [ ] C2 构建通过
  - Command: `pnpm build`
  - Expect: 成功
  - Remediation: 失败时检查是否有动态 import 或字符串路径引用

- [ ] C3 全量测试无新增失败
  - Command: `pnpm exec vitest run`
  - Expect: 与 Task 2 结果一致
  - Remediation: 失败说明存在运行时引用，恢复并核查

- [ ] C4 help 输出不变
  - Command: `pnpm xirang help > /tmp/help-after.txt && diff /tmp/help-before.txt /tmp/help-after.txt`
  - Expect: 无差异
  - Remediation: 有差异说明误删存活路径，立即恢复

### Task 4: 收缩孤儿导出

**Goal**: 逐个核查 `registry.ts` 与 `renderers.ts` 的导出，删除失去消费者的部分，保留 help 路径所需。

**Files**:
- Modify: `src/core/relations/registry.ts`
- Modify: `src/core/relations/renderers.ts`
- Test: `test/core/relations/registry.test.ts`
- Test: `test/core/relations/renderers.test.ts`

**Requirements**:
- 逐个导出核查，不按文件整体判断
- `registry.ts` 预期孤儿：`RELATION_TYPES`、`RelationTypeSchema`、`getRelationDefinition`；`RelationType`、`RelationEndpointKind` 依其是否仍被 `RelationDefinition` 字段类型引用决定去留
- `registry.ts` 必须保留：`RelationDefinition`（`active-registry.ts:1,16`）、`RelationDefinitionRegistry`（`renderers.ts:2,12`）
- `renderers.ts` 预期孤儿：`renderRelationWorkflowSummary`、`renderXirangDeltaTemplate`、`GENERATED_RELATION_FILES`
- `renderers.ts` 必须保留：`renderRelationAuthoringReference`（`help.ts:3,74`）
- 同步删除仅覆盖孤儿导出的测试断言，不删除覆盖存活导出的用例
- 测试覆盖不构成存活证据：判定依据是 `src/` 内是否存在非测试消费者

#### Checks

- [ ] C1 孤儿判定有据
  - Command: `for s in RELATION_TYPES RelationType RelationEndpointKind RelationTypeSchema getRelationDefinition renderRelationWorkflowSummary renderXirangDeltaTemplate GENERATED_RELATION_FILES; do echo "--- $s"; rg -n "\b$s\b" src/ | grep -v "relations/registry.ts" | grep -v "relations/renderers.ts"; done`
  - Expect: 每个待删符号在 `src/` 内无其他消费者
  - Remediation: 出现消费者则保留该导出并记录原因

- [ ] C2 存活导出未受影响
  - Command: `rg -n "RelationDefinition|RelationDefinitionRegistry|renderRelationAuthoringReference" src/core/relations/ src/commands/help.ts`
  - Expect: 三者定义与引用完整
  - Remediation: 缺失则恢复

- [ ] C3 类型检查与构建通过
  - Command: `pnpm exec tsc --noEmit && pnpm build`
  - Expect: 无错误
  - Remediation: 报错说明误删存活导出

- [ ] C4 relations 测试通过
  - Command: `pnpm exec vitest run test/core/relations/`
  - Expect: 调整后通过，无对已删导出的断言残留
  - Remediation: 断言失败时确认是删除导出所致而非行为回归

- [ ] C5 help 输出仍不变
  - Command: `pnpm xirang help | diff /tmp/help-before.txt -`
  - Expect: 无差异
  - Remediation: 有差异立即恢复对应导出

### Task 5: 全量回归

**Goal**: 确认删除未引入任何行为变化。

**Files**:
- Test: 全量套件

**Requirements**:
- 全量测试通过状态与 Task 1 基线一致，仅少掉已删文件
- `xirang` 命令面行为不变
- 工作区无残留悬空引用

#### Checks

- [ ] C1 全量测试通过
  - Command: `pnpm exec vitest run`
  - Expect: 136 个测试文件，无新增失败
  - Remediation: 逐一定位失败来源

- [ ] C2 无残留引用
  - Command: `rg -n "xirang-utils|relations/validator" src/ test/ tests/ 2>/dev/null || echo "clean"`
  - Expect: 输出 `clean`
  - Remediation: 有残留则删除或修正

- [ ] C3 lint 通过
  - Command: `pnpm lint`
  - Expect: 无未使用 import 等新增告警
  - Remediation: 修正本次删除造成的孤儿 import

- [ ] C4 净删除量核对
  - Command: `git diff --stat HEAD`
  - Expect: 源码 702 行、测试 2463 行删除，加 Task 4 的孤儿导出收缩；无新增功能代码
  - Remediation: 出现新增行说明混入了非删除改动，剥离到独立 Change
