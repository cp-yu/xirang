### Task 1: 接线 change-compiler 到新内核

**Goal**: 以 TDD 把 `change-compiler.ts` 的读取与 Delta 解析层替换为 C1 内核，保留 diff 与校验逻辑。

**Files**:
- Modify: `src/core/change-compiler.ts`
- Test: `test/core/change-compiler.test.ts`

**Requirements**:
- `readArchitectureModel:529` 与 `readFormalSemanticModel:595` 改为 `parseSemanticModel(root)`
- Delta 解析改为 `parseSemanticDelta(changeRoot)`，应用改为 `applySemanticDelta(base, delta)`
- 删除 `:531` profile 分支
- 诊断 `path` 由固定 `'architecture-delta.c4'`（`:80,117,122,270-301`）与 `specs/<id>/spec.md`（`:325,584-586`）改为 `ModelIndex.moduleOf` 解析出的实际单元路径
- 保留 `:219 validateTarget` 与 `:342 validateTargetSemanticModel` 的校验语义，改为消费内存 IR
- 不重复 C1 已声明的 `:165 ELEMENT_KIND_CHANGE` 删除

#### Checks

- [x] C1 验证编译产出 Expected Semantic Model
  - Verifies: `xirang-contract.md` / 「Semantic Delta 记法」/ per-entry 完整目标内容
  - Command: `pnpm exec vitest run test/core/change-compiler.test.ts`
  - Expect: 四分区 Delta 编译出的 target 与手写期望 IR 相等；诊断 path 指向具体单元文件
  - Remediation: 诊断 path 必须经 `ModelIndex` 解析，不得硬编码分区前缀

---

### Task 2: 接线 change-sync 到新内核

**Goal**: 以 TDD 把 `change-sync.ts` 的记法相关部分替换为 C1 内核，保留事务骨架。

**Files**:
- Modify: `src/core/change-sync.ts`
- Test: `test/integration/sync-workflow.test.ts`

**Requirements**:
- 删除 legacy delta 路径 `:632-729`（含 `parseLegacyArchitectureDelta`、`sameDomain:672`、`sameCapability:679`、`assessLegacyElementExtensions:688`）
- 删除 `:756-810` 的 `readArchitectureDelta` / `assertArchitectureDeltaOperations` / `stripLikeC4Comments` / `architectureDeltaModuleName`，改为 `parseSemanticDelta`
- 写回分派 `:229-232` 由 `writeSemanticArchitectureSnapshot` / `mergeArchitectureDelta` 二选一改为 `writeMinimal` 单一路径
- 删除 `:233 writeSpecsToTarget`，Contract 随 Element 单元一并写出
- `:236 validateTargetSemanticModel` 改为内存 `validateSemanticModel(expected)`，不再落盘后经 LikeC4 校验
- 删除 `:209,237,583,853` profile 分支
- 保留 journal、`buildManifest`、`assertManifestPreimages`、`applyManifestEntry`、`rollbackManifest`、`applySemanticDirectoryTransaction`、`recoverSemanticDirectoryTransaction` 不动

#### Checks

- [x] C1 验证最小重写
  - Verifies: `xirang-contract.md` / 「Sync 保证」/ 最小重写
  - Command: `pnpm exec vitest run test/integration/sync-workflow.test.ts`
  - Expect: 仅 Delta 影响的单元出现在 manifest；未受影响单元字节不变
  - Remediation: 受影响单元须由 `DeltaApplication.touched` 推导，不得全量重写

- [x] C2 验证全或无
  - Verifies: `xirang-contract.md` / 「Sync 保证」/ 全或无
  - Command: `pnpm exec vitest run test/integration/sync-workflow.test.ts`
  - Expect: 注入写失败后全部单元回滚至 preimage
  - Remediation: 回滚依赖既有 `rollbackManifest`，不得绕过 manifest 直接写文件

---

### Task 3: 迁移 arch query 到 IR 并内联 Contract

**Goal**: 以 TDD 重写 `arch query`，新增 `--contract` 开关（默认关闭）控制 Contract 全文内联，删除 FQN 与 specs 字段。

**Files**:
- Modify: `src/commands/arch/query.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- 读取改 `parseSemanticModel`；删除 `:137` profile 分叉与 legacy 分支（`:21 canonicalId`、legacy 查找）
- 删除 `element.fqn`（`:35` 查找键、`:158` 文本输出）、`element.metadata`、`specs: string[]`（`:12`、`:42`）
- `contractPolicy`（`:11`、`:41`）改名 `contract`，来源为 metamodel element-kind 的 `contract` 字段
- 内联 `requirements: Requirement[]`，来源 `ModelElement.requirements`，无 Contract 时为空数组
- 删除 `relation.description`（`:172` 文本渲染）
- `children` 保留为派生字段，由 `parent` 反向索引推导，用于 `refinement[]` 展开
- FQN 输入返回显式错误，文案对齐 `impact.ts:126` 现有做法
- 删除 `buildSpecRegistry` 导入（`:1`）与 `specPath`（`:26`）

#### Checks

- [x] C1 验证 `--contract` 开关：默认不内联，传入时内联全文
  - Verifies: 决策 2 修正版 / `arch query --contract`
  - Command: `pnpm exec vitest run test/integration/arch-command.test.ts`
  - Expect: `--json` 输出含完整 `requirements[]`（含 scenarios），顺序与源单元一致
  - Remediation: Requirement 与 Scenario 顺序属语义（契约「语义差异判定」），不得排序

- [x] C2 验证 identity-only 查找
  - Verifies: `xirang-definition.md` / §1 Semantic Model / identity 是唯一引用依据
  - Command: `pnpm exec vitest run test/integration/arch-command.test.ts`
  - Expect: identity 命中；FQN 形态输入返回显式错误而非静默未找到
  - Remediation: 不得保留 `element.fqn === id` 回退分支

---

### Task 4: 迁移 arch search 与 impact

**Goal**: 以 TDD 收缩 search 证据枚举、删除 impact 的 FQN 探测与 contract 绑定诊断。

**Files**:
- Modify: `src/commands/arch/search.ts`
- Modify: `src/commands/arch/impact.ts`
- Test: `test/commands/arch-search.test.ts`
- Test: `test/commands/arch-impact.test.ts`

**Requirements**:
- search：evidence 枚举（`:13`）收缩为 `elementId | title | summary | requirement`，删 `fqn`/`specId`/`spec.purpose`/`spec.requirement`；删 `ownedSpecs`；rank 常量重编号并保持确定性排序
- search：删 `:66` profile 早退
- impact：删 `:110` profile 早退；删 `:126-127` FQN 探测分支，错误退化为单一 `Focus Element not found`
- impact：`contractPolicy`（`:11` 类型、`:116` 赋值、`:236` 判定）改名 `contract`
- impact：`relationKey`（`:55`）去掉 description 项
- impact：删除 registry 诊断与 `invalidBindings` 整块，`contracts[]` 由 `{specId, elementId, path, content}` 改 `{elementId, requirements}`
- impact：保留 `statistics` 字段，`contractCount`/`contractBytes` 按新形状重算
- impact：`element.children` 的 descendant 展开改用派生索引

#### Checks

- [x] C1 验证证据枚举收缩且排序确定
  - Verifies: `xirang-contract.md` / 「引用规则」/ FQN 不入持久源
  - Command: `pnpm exec vitest run test/commands/arch-search.test.ts`
  - Expect: 无 `fqn`/`specId` 证据；相同输入两次运行结果逐字段相同
  - Remediation: rank 重编号后须重验排序稳定性，不得依赖对象键顺序

- [x] C2 验证 contract 绑定诊断消失
  - Verifies: `xirang-definition.md` / §3 Element Contract / 一个 Element 至多一个 Contract
  - Command: `pnpm exec vitest run test/commands/arch-impact.test.ts`
  - Expect: 不再产出「owner not found」「source missing」类诊断；`contracts[]` 为 `{elementId, requirements}`
  - Remediation: Contract 与 Declaration 同单元，不存在绑定失败状态，不得保留该诊断分支

---

### Task 5: 迁移 arch plan-remove、validate、export

**Goal**: 以 TDD 完成三个只读命令的参数与校验对象迁移。

**Files**:
- Modify: `src/commands/arch/plan-remove.ts`
- Modify: `src/commands/arch/validate.ts`
- Modify: `src/commands/arch/export.ts`
- Modify: `src/commands/arch/index.ts`
- Test: `test/commands/arch-plan-remove.test.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- plan-remove：命令参数由 `<element-id-or-fqn>` 改 `<element-id>`；删 `:75` FQN 查找与 `subject.fqn`（`:15`）
- plan-remove：`RemovalDependencyType`（`:6`）删 `spec-binding`（`:67`）与 `reference`（`:52`），保留 `descendant`（`:45`）与 `relationship`（`:60`）
- validate：校验对象由 `.xirang/architecture` 改 `.xirang/model/`，改用 `validateSemanticModel(model)`，删除 LikeC4 `runner(['validate'])` 调用
- validate：`--delta <path>` 改 `--change <name>`，经 `parseSemanticDelta` + `applySemanticDelta` 后校验 expected
- export：先调用 C2 生成器产出 `.c4` 至 `.xirang/.cache-likec4/`，再交 LikeC4 export；不得回写 `.xirang/model/`
- `arch/index.ts` 同步更新三个命令的参数与选项声明

#### Checks

- [x] C1 验证 plan-remove 依赖类型收缩
  - Verifies: `xirang-definition.md` / §3 Element Contract / Contract 随 Element 单元
  - Command: `pnpm exec vitest run test/commands/arch-plan-remove.test.ts`
  - Expect: 输出无 `subject.fqn`；依赖类型仅 `descendant` 与 `relationship`
  - Remediation: metadata 字段已不存在，`reference` 类型无数据来源，须删除而非置空

- [x] C2 验证生成产物不回写持久源
  - Verifies: `xirang-contract.md` / 「LikeC4 边界」/ 不得写入 `.xirang/model/`
  - Command: `pnpm exec vitest run test/integration/arch-command.test.ts`
  - Expect: export 后 `.xirang/model/` 字节不变，`.c4` 仅出现在 `.xirang/.cache-likec4/`
  - Remediation: 生成目录须为独立产物目录，不得复用模型根

---

### Task 6: 迁移 diff 到 entity 过滤

**Goal**: 以 TDD 用 `--entity` 替换 `--scope`，并补齐 `DiffKind` 的 `authored-view`。

**Files**:
- Modify: `src/commands/diff.ts`
- Modify: `src/core/semantic-diff.ts`
- Modify: `src/core/change-diff-renderer.ts`
- Test: `test/commands/diff.test.ts`

**Requirements**:
- 删除 `normalizeScope`（`diff.ts:19-23`）与 `--scope` 选项，新增 `--entity <type>` 支持逗号分隔多值
- 非法 entity 值报错并列出合法取值
- `DiffKind`（`semantic-diff.ts:15`）取值改名对齐契约 `entity`：`element` → `element-declaration`、`elementKind` → `element-kind`、`relationshipKind` → `relationship-kind`
- `DiffKind` 新增 `authored-view`，补齐 Authored View 可被 Delta 作用但 Diff IR 无对应类型的缺口
- `scenario` 与 `property` 保留为细粒度类型，`--entity` 过滤时按父条目 entity 归属
- 渲染器随取值改名同步更新
- 不重复 C1 已声明的 `DiffScope:14` 与 `ChangeDiffEntry.scope:27` 删除

#### Checks

- [x] C1 验证差异输出不携带分区
  - Verifies: `xirang-contract.md` / 「语义差异判定」/ 以 entity type 与 identity 为键
  - Command: `pnpm exec vitest run test/commands/diff.test.ts`
  - Expect: `--json` 输出无 `scope` 字段；`kind` 取值与契约 `entity` 一致
  - Remediation: 分区是组织约定，不得进入 Diff IR

- [x] C2 验证 authored-view 差异可呈现
  - Verifies: `xirang-definition.md` / §3 Semantic Delta Entry / entity type 覆盖 Authored View
  - Command: `pnpm exec vitest run test/commands/diff.test.ts`
  - Expect: 新增/修改/删除 Authored View 均产出对应 diff 条目
  - Remediation: 缺该类型会使视图变更静默丢失，须补齐而非忽略

---

### Task 7: 迁移 sync、archive、list 的分区词汇

**Goal**: 以 TDD 把两分区计数与目录遍历改为四分区。

**Files**:
- Modify: `src/commands/sync.ts`
- Modify: `src/core/archive.ts`
- Modify: `src/core/list.ts`
- Modify: `src/cli/index.ts`
- Test: `test/commands/sync.test.ts`
- Test: `test/core/archive.test.ts`
- Test: `test/integration/archive-workflow.test.ts`

**Requirements**:
- sync：输出摘要由 `specs: N` / `architecture: N`（`:84-86`）改为四分区计数
- archive：sync gate 计数（`:255-266`）改四分区；删 `:293-297,:380` profile 分支；change 内 `specs/` 遍历（`:324,331`）改四分区
- list：删除 specs 模式（`:180-223`）与 `--specs` 选项（`cli/index.ts:161`）
- list：changes 模式的 change 目录内容计数由 `specs/ + architecture-delta.c4` 改四分区
- `.specs-noop` 标记（`archive.ts:170`）改名或删除，与新分区一致

#### Checks

- [x] C1 验证四分区计数
  - Verifies: `xirang-contract.md` / 「存储结构」/ Semantic Delta 采用同构四类分区
  - Command: `pnpm exec vitest run test/commands/sync.test.ts test/core/archive.test.ts`
  - Expect: 摘要与 gate 计数覆盖四分区，无 `architecture`/`specs` 词汇残留
  - Remediation: 分区列表须来自 `PARTITIONS` 常量，不得再硬编码两值

- [x] C2 验证 list --specs 已移除
  - Verifies: `xirang-definition.md` / §3 Element Contract / Contract 不是独立对象
  - Command: `pnpm exec vitest run test/cli-e2e/basic.test.ts`
  - Expect: `--specs` 选项不存在，调用返回未知选项错误
  - Remediation: spec 已非独立对象，须删除子模式而非返回空列表

---

### Task 8: 迁移 validate、candidate、setup、help

**Goal**: 以 TDD 完成聚合命令与骨架文案的四分区迁移。

**Files**:
- Modify: `src/commands/validate.ts`
- Modify: `src/core/candidate/workspace.ts`
- Modify: `src/core/candidate/validator.ts`
- Modify: `src/commands/candidate.ts`
- Modify: `src/core/setup.ts`
- Modify: `src/commands/help.ts`
- Delete: `src/core/templates/architecture-skeleton.ts`
- Test: `test/commands/validate.test.ts`
- Test: `test/commands/candidate-init.test.ts`
- Test: `test/commands/candidate-validate.test.ts`
- Test: `test/core/setup.test.ts`
- Test: `test/commands/help.test.ts`

**Requirements**:
- validate：删除 `--artifacts <scope>` 选项（`cli/index.ts:286`）与其 `specs|architecture-delta` 枚举消费点（`validate.ts:27,50-51,58-59,407`）
- validate：`--specs` 路径消费改为按 element identity 取 Contract
- validate：`validateCombinedV1Change`（`:421-476`）整块重写为内存 IR 合并后校验，删除临时目录 shim
- validate：删除 `validateArchitectureDeltaReport`（`:478-488`）对 `arch validate --delta` 的依赖
- validate：issue `path`（`:452,469,481,484` 固定 `'architecture-delta.c4'`）改实际单元路径；删 `:251,413` profile 分支
- candidate：inventory 由 `{architectureFiles, specFiles}`（`workspace.ts:21-22`、`validator.ts:486-487`）改四分区；文本输出（`candidate.ts:38`）同步
- candidate：`--from-path` 描述文案改为四分区
- setup：目录骨架由 `specs`（`:362,378`）+ `architecture`（`:399-408`）改 `model/{metamodel,elements,relationships,views}`
- setup：删除 `.c4` skeleton 模板，改为产出 metamodel Markdown 种子单元（至少一个 root element-kind）
- help：`AUTHORING_TOPICS`（`:7`）与 schema 映射（`:22`）中的 `architecture-delta.c4` 删除或改名

#### Checks

- [x] C1 验证 setup 后模型可校验
  - Verifies: `xirang-contract.md` / 「存储结构」/ `.xirang/model/` 四分区
  - Command: `pnpm exec vitest run test/core/setup.test.ts`
  - Expect: setup 产出四分区目录与 metamodel 种子，随后 `validate` 通过
  - Remediation: 无种子会使 setup 后模型为空且校验立即失败，须提供 root element-kind

- [x] C2 验证 candidate 四分区 inventory
  - Verifies: `xirang-contract.md` / 「存储结构」/ Candidate 与 Semantic Model 同构
  - Command: `pnpm exec vitest run test/commands/candidate-init.test.ts test/commands/candidate-validate.test.ts`
  - Expect: `--json` 的 inventory 覆盖四分区；promotion 后缺失单元不保留
  - Remediation: 分区过滤前缀须参数化，遗漏分区会使该分区文件被静默丢弃

---

### Task 9: 确认全部命令已切换

**Goal**: 在删除旧栈前，静态确认无源文件仍依赖旧读写层。

**Files**:
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- `src/` 下无任何文件 import `likec4-reader`、`likec4-parser`、`architecture-reader`、`architecture-delta-merger`、`architecture-delta-validator`、`specs-apply`
- `src/` 下无 `profile === 'v1'` 或 `profile !== 'v1'` 判定残留
- `src/` 下无 `.xirang/architecture` 或 `.xirang/specs` 路径字面量残留
- `src/` 下无 `contractPolicy` 标识符残留

#### Checks

- [x] C1 验证旧栈无消费者
  - Verifies: `xirang-contract.md` / 「存储结构」/ `.xirang/model/` 为唯一持久化根
  - Command: `rg -n "likec4-reader\|likec4-parser\|architecture-reader\|architecture-delta-merger\|architecture-delta-validator\|specs-apply\|contractPolicy\|profile [!=]== 'v1'\|\.xirang/architecture\|\.xirang/specs" src`
  - Expect: 无输出
  - Remediation: 有残留说明仍有命令未切换，须回到对应 Task 完成迁移后再进入删除

---

### Task 10: 删除旧栈

**Goal**: 删除已无消费者的旧读写层与 spec 命令面。

**Files**:
- Delete: `src/commands/spec.ts`
- Delete: `src/utils/likec4-parser.ts`
- Delete: `src/utils/likec4-reader.ts`
- Delete: `src/utils/architecture-reader.ts`
- Delete: `src/utils/architecture-delta-merger.ts`
- Delete: `src/validation/architecture-delta-validator.ts`
- Delete: `src/core/specs-apply.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/utils/semantic-model.ts`
- Modify: `src/utils/architecture-validator.ts`
- Modify: `src/core/validation/validator.ts`
- Modify: `src/commands/show.ts`

**Requirements**:
- 删除 `registerSpecCommand` 注册（`cli/index.ts:12,274`）
- `show.ts` 的 `ItemType` 删除 `'spec'` 分支与歧义消解（`:8,42,61-67,82-101`）
- `architecture-validator.ts` 删除 legacy/v1 分派（`:16-19`），改为直接调 `validateSemanticModel`
- `core/validation/validator.ts` 删除 legacy spec frontmatter 校验（`:612,621-655`）与 `:612` profile 分支
- `semantic-model.ts` 删除已被 IR 取代的类型（`SemanticElement`、`SemanticContract`、`TargetSemanticModel`、`ContractPolicy`）
- 不删除 `src/core/relations/registry.ts`、`active-registry.ts`、`renderers.ts`——`help.ts` 仍依赖
- 不重复 C0 与 C1 已声明的删除项

#### Checks

- [x] C1 验证类型检查通过
  - Verifies: `xirang-contract.md` / 「存储结构」/ 旧双分区栈移除
  - Command: `pnpm exec tsc --noEmit`
  - Expect: 无错误
  - Remediation: 报错处若指向 `relations/registry.ts`，说明误删了 help 仍需的导出，须恢复

---

### Task 11: 恢复全量测试绿

**Goal**: 按勘察分类完成测试迁移，使全量测试恢复绿，终止 C1/C2 起始的构建断裂。

**Files**:
- Test: `test/unit/utils/architecture-validator.test.ts`
- Test: `test/core/validation.delta-specs.test.ts`
- Test: `test/core/validation.cross-check.test.ts`
- Test: `test/integration/validate-command.test.ts`
- Test: `test/core/view.test.ts`
- Test: `test/core/spec-registry.test.ts`
- Test: `test/commands/artifact-workflow.test.ts`
- Test: `test/commands/candidate-promote.test.ts`
- Test: `test/core/candidate-digest.test.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/core/artifact-graph/workflow.integration.test.ts`
- Test: `test/cli-e2e/basic.test.ts`
- Test: `test/fixtures/arch-impact-locale-process.fixture.ts`

**Requirements**:
- 删除被测对象已消失的测试：`test/unit/utils/likec4-reader.test.ts`、`test/unit/utils/architecture-delta-merger.test.ts`、`test/core/architecture-delta-parser.test.ts`、`test/core/specs-apply.test.ts`、`test/core/spec-registry.test.ts`
- 重写 `architecture-validator.test.ts`：删除 legacy/v1 双分支断言，改为 IR 校验断言
- 重写 `validation.delta-specs.test.ts`、`validation.cross-check.test.ts`、`validate-command.test.ts`：夹具改四分区，issue path 断言改实际单元路径
- 重写 `view.test.ts`：watcher 分区断言改四分区（C5 相关的 registry 产物断言保持现状）
- 改夹具：§6.3 的 21 个文件中构造 `.c4` / `specs/**/spec.md` 夹具者改为四分区单元；模板文本断言中的 `architecture-delta.c4` / `.xirang/specs/` 改新词汇
- 凡断言 JSON 结构的测试升级为逐字段断言，覆盖 proposal 中列出的 10 个破坏点
- 不处理 C4 范围的 workflow 模板测试内容断言（仅在文本因本 Change 改动而失败时更新对应片段）

#### Checks

- [x] C1 验证 JSON 契约破坏点均被断言
  - Verifies: `xirang-contract.md` / 「单元形态」/ 字段表
  - Command: `pnpm exec vitest run test/integration/arch-command.test.ts test/commands/arch-search.test.ts test/commands/arch-impact.test.ts test/commands/arch-plan-remove.test.ts test/commands/diff.test.ts`
  - Expect: 每个破坏点有对应逐字段断言，非仅 exit code
  - Remediation: 仅断言 exit code 会静默漏过形状变化，须补字段级断言

- [x] C2 验证全量测试绿
  - Verifies: proposal / 「Why」/ C1/C2 期间允许构建断裂，到本 Change 终止
  - Command: `pnpm exec vitest run`
  - Expect: 全部测试通过，无 skip 掩盖失败
  - Remediation: 这是本 Change 的终止条件，不得以 skip 或 todo 规避；未达成则本 Change 未完成
