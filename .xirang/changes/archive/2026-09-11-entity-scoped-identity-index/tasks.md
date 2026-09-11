### Task 1: 实体分域索引与单元保真路由

**Goal**: 让索引与所有定位消费方按 (entity type, identity) 解析存储单元，使跨类型同名模型的加载、sync 物化与诊断定位全部正确。

**Files**:
- Modify: `src/core/model/index-map.ts`
- Modify: `src/core/model/sync-writer.ts`
- Modify: `src/core/model/types.ts`
- Modify: `src/core/model/validator.ts`
- Modify: `src/core/model/delta.ts`
- Modify: `src/core/change-compiler.ts`
- Modify: `src/commands/validate.ts`
- Test: `test/core/model/index-map.test.ts`
- Test: `test/core/model/parser.test.ts`
- Test: `test/core/model/sync-writer.test.ts`
- Test: `test/core/model/validator.test.ts`
- Test: `test/core/change-compiler.test.ts`

**Requirements**:
- 索引以 (entity type, identity) 为键；`moduleOf(entity, identity)` 为唯一单元查找 API，不提供忽略实体类型的查询
- `sync-writer` 四个集合循环各按自身 entity 路由；未触及单元仍复用原字节
- 诊断携带实体类型（`ModelDiagnostic.entity` 在 validator 与 delta apply 生成点填实）；change diff 与 contract 校验定位按实体精确
- 跨类型同名模型加载不产生冲突诊断；element+element-kind 与 element+authored-view 单元均保真物化
- 既有 `moduleOf` 调用点与受诊断形状影响的断言同步更新；无碰撞模型的目标树与输出保持不变

#### Checks

- [x] C1 索引按实体类型分域
  - Verifies: `elements/semantic-model.md` / Requirement "建立 Identity Source Index" / Scenario "跨类型同名单元各自定位"
  - Command: `pnpm exec vitest run test/core/model/index-map.test.ts test/core/model/parser.test.ts`
  - Expect: 同名 element 与 element-kind 分别解析到各自 module；`moduleOf` 按 entity 返回对应存储单元，测试通过

- [x] C2 跨类型同名模型被接受且引用按类型解析
  - Verifies: `elements/semantic-model.md` / Requirement "保持 Identity 命名空间独立" / Scenario "Element 与 Element Kind 跨类型同名"
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts test/core/model/validator.test.ts`
  - Expect: 模型无冲突诊断且两个实体独立存在；Element 的 `kind` 引用解析到 element-kind，测试通过

- [x] C3 Element 与 Element Kind 同名时两单元保真物化
  - Verifies: `elements/change-sync.md` / Requirement "保持 Target 单元完整" / Scenario "跨类型同名 Element 与 Element Kind 保真同步"
  - Command: `pnpm exec vitest run test/core/model/sync-writer.test.ts`
  - Expect: 目标树同时包含 `elements/<identity>.md` 与 `metamodel/<identity>.md` 且各为自身目标内容；manifest 无 delete；target tree reparse 等于 expected，测试通过

- [x] C4 Element 与 Authored View 同名时两单元保真物化
  - Verifies: `elements/change-sync.md` / Requirement "保持 Target 单元完整" / Scenario "跨类型同名 Element 与 Authored View 保真同步"
  - Command: `pnpm exec vitest run test/core/model/sync-writer.test.ts`
  - Expect: 目标树同时包含 element 单元与 view 单元且内容正确；测试通过

- [x] C5 诊断定位在碰撞模型下指向实体自身单元
  - Verifies: `elements/semantic-model.md` / Requirement "建立 Identity Source Index" / Scenario "定位语义实体来源"
  - Command: `pnpm exec vitest run test/core/change-compiler.test.ts`
  - Expect: element 诊断的 `path` 指向 element 单元，而非同名的 kind 单元；测试通过

### Task 2: 目标路径冲突显式失败

**Goal**: Target 目标树中两个单元争用同一存储路径时，sync 在生成 manifest 前显式失败，Formal Semantic Model 零改动。

**Files**:
- Modify: `src/core/model/sync-writer.ts`
- Test: `test/core/model/sync-writer.test.ts`

**Requirements**:
- `writeMinimal` 维护目标路径认领表；两个不同单元（unit 或 relationship container）认领同一路径时抛错，错误信息包含路径与两个 owner
- 冲突在返回目标树前发生；既有合法模型的目标树输出保持不变

#### Checks

- [x] C6 路径冲突失败且模型零改动
  - Verifies: `elements/change-sync.md` / Requirement "拒绝目标路径冲突" / Scenario "既有单元占用另一单元的目标路径"
  - Command: `pnpm exec vitest run test/core/model/sync-writer.test.ts`
  - Expect: `writeMinimal` 抛出包含冲突路径与两个 owner 的错误；磁盘模型树字节不变；测试通过

- [x] C7 一次性验证：全量测试、构建与 lint
  - Verifies: `elements/change-sync.md` / Requirement "保持 Target 单元完整" / Scenario "跨类型同名 Element 与 Element Kind 保真同步"
  - Command: `pnpm exec vitest run && pnpm build && pnpm lint`
  - Expect: 全量测试通过；构建（含 typecheck）与 lint 通过
