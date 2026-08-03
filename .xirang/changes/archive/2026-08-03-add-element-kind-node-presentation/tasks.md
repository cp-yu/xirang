### Task 1: Element Kind 模型层扩展

**Goal**: 在 `ElementKind` IR、parser 和 serializer 中增加 `nodePresentation` 支持。

**Files**:
- Modify: `src/core/model/types.ts`
- Modify: `src/core/model/parser.ts`
- Modify: `src/core/model/frontmatter.ts`
- Test: `test/core/model/parser.test.ts`
- Test: `test/core/model/frontmatter.test.ts`

**Requirements**:
- `ElementKind` interface 增加可选的 `nodePresentation` 字段，包含 `shape`、`color`、`border`
- Parser 对 `nodePresentation` 执行严格校验：字段名精确匹配、值属于 Xirang 自有枚举
- Serializer 支持确定性嵌套 YAML mapping，固定 key 顺序
- parse → serialize → parse 保持等价
- 未知字段、非法枚举、错误类型产生 `ERROR`
- 无 `nodePresentation` 的旧 Kind 保持兼容

#### Checks

- [ ] C1 验证 `nodePresentation` 完整声明解析
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts -t "parses element kind with complete nodePresentation"`
  - Expect: `shape`、`color`、`border` 三个字段均正确解析

- [ ] C2 验证部分声明解析
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts -t "parses element kind with partial nodePresentation"`
  - Expect: 只声明 `shape` 时，其余字段为 `undefined`

- [ ] C3 验证非法节点呈现值被拒绝
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "非法节点呈现值被拒绝"
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts -t "rejects invalid nodePresentation values"`
  - Expect: 未知字段、非法枚举、错误类型均产生 `ERROR` diagnostic

- [ ] C4 验证 serializer 嵌套 YAML 确定性输出
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/model/frontmatter.test.ts -t "serializes nodePresentation deterministically"`
  - Expect: 字段顺序固定为 `shape`、`color`、`border`；key 顺序变化不影响语义等价

- [ ] C5 验证 round-trip 等价
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts -t "round-trips element kind with nodePresentation"`
  - Expect: parse → serialize → parse 结果与原始输入语义等价

### Task 2: Semantic Delta、diff 与 fingerprint

**Goal**: 确保 `nodePresentation` 变化进入 Semantic Delta、semantic diff 和各类 fingerprint。

**Files**:
- Modify: `src/core/model/delta.ts`
- Modify: `src/core/semantic-diff.ts`
- Modify: `src/core/view.ts`
- Test: `test/core/semantic-diff.test.ts`
- Test: `test/core/model/delta.test.ts`

**Requirements**:
- ADDED/MODIFIED Element Kind 携带完整 `nodePresentation`
- REMOVED 只携带 `identity`
- `nodePresentation` 变化形成 Element Kind `MODIFIED` diff
- 相关 fingerprint 包含 `nodePresentation`

#### Checks

- [ ] C6 验证 ADDED Element Kind 携带 `nodePresentation`
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/model/delta.test.ts -t "adds element kind with nodePresentation"`
  - Expect: ADDED 条目包含完整 `nodePresentation`

- [ ] C7 验证 MODIFIED Element Kind 携带完整目标态
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/model/delta.test.ts -t "modifies element kind nodePresentation"`
  - Expect: MODIFIED 条目包含完整 `nodePresentation`，before/after 准确

- [ ] C8 验证 presentation-only 变化不影响非相关 fingerprint
  - Verifies: `elements/visual-presentation.md` / Requirement "视觉选择不构成规范性语义" / Scenario "持久呈现配置不改变 Kind 语义"
  - Command: `pnpm exec vitest run test/core/semantic-diff.test.ts -t "does not change element contract or relationship fingerprints after presentation change"`
  - Expect: 仅 metamodel partition fingerprint 变化，elements/relationships/views fingerprint 不变

### Task 3: Definition Framing CLI 扩展

**Goal**: 扩展 framing types、payload 校验、document render/parse 和 baseline drift 检测，支持 `nodePresentation`。

**Files**:
- Modify: `src/core/framing/types.ts`
- Modify: `src/core/framing/document.ts`
- Modify: `src/core/framing/baseline.ts`
- Test: `test/core/framing/document.test.ts`
- Test: `test/core/framing/baseline.test.ts`

**Requirements**:
- `ElementKindTarget` 增加 `nodePresentation`
- `parseElementKinds` 的 `exactKeys` 允许 `nodePresentation`
- `parseElementKinds` 对 `nodePresentation` 值做枚举校验
- `renderChangeStructuralDefinition` 序列化 `nodePresentation`
- baseline capture 包含 `nodePresentation`
- drift detection 识别 presentation 变化为 relevant
- 旧 records 无 `nodePresentation` 时兼容

#### Checks

- [ ] C9 验证 framing create/update 保留 `nodePresentation`
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/framing/document.test.ts -t "preserves nodePresentation in framing payload"`
  - Expect: create/update 的 Element Kind target 包含完整 `nodePresentation`

- [ ] C10 验证旧 framing record 兼容
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/framing/document.test.ts -t "accepts framing record without nodePresentation"`
  - Expect: 无 `nodePresentation` 的旧 record 解析成功且不产生错误

- [ ] C11 验证 presentation drift 被识别为 relevant
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/framing/baseline.test.ts -t "detects nodePresentation drift as relevant"`
  - Expect: baseline 中 `nodePresentation` 变化被报告为 relevant drift

### Task 4: LikeC4 adapter 与 Browser 统一消费

**Goal**: 建立统一的 Xirang→LikeC4 presentation adapter，并让所有 Browser runtime sources 一致消费 Kind presentation。

**Files**:
- Create: `src/core/likec4/presentation-adapter.ts`
- Modify: `src/core/likec4/generator.ts`
- Modify: `src/core/view.ts`
- Modify: `likec4/packages/diagram/src/xirang/architectureView.ts`
- Modify: `likec4/packages/diagram/src/xirang/ContractLoaderContext.tsx`
- Test: `test/core/likec4/generator.test.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`

**Requirements**:
- 建立唯一 `presentationAdapter` 函数，映射 Xirang 枚举→LikeC4 枚举
- generator 与 Browser materializer 强制使用同一 adapter
- 无 `nodePresentation` 的 Kind 不生成显式 style block
- 所有 Browser runtime sources 使用相同 Kind presentation

#### Checks

- [ ] C12 验证 adapter 映射所有合法值
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts -t "maps all valid nodePresentation values to LikeC4"`
  - Expect: 所有 Xirang 枚举值映射到正确 LikeC4 值

- [ ] C13 验证 LikeC4 specification 生成正确
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts -t "generates LikeC4 style block for nodePresentation"`
  - Expect: Element Kind 的 `nodePresentation` 正确生成为 LikeC4 `style { shape ... color ... border ... }`

- [ ] C14 验证无配置时输出裸 Kind
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts -t "outputs bare kind without nodePresentation"`
  - Expect: 无 `nodePresentation` 的 Kind 不生成 style block

- [ ] C15 验证所有 Browser source 使用相同 presentation
  - Verifies: `elements/metamodel.md` / Requirement "使用规范 Kind 字段" / Scenario "Element Kind 声明节点呈现"
  - Command: `pnpm --dir likec4 exec vitest run --no-isolate packages/diagram/src/xirang/architectureView.spec.ts -t "applies kind presentation uniformly across sources"`
  - Expect: Model、Candidate、Change-derived sources 对同一 Kind 使用相同 presentation

### Task 5: `perspective` Kind 更新与验证

**Goal**: 将当前项目 `perspective` Kind 的 delta 文件应用到正式模型，并验证迁移正确性。

**Files**:
- Modify: `.xirang/model/metamodel/perspective.md`
- Test: `test/core/model/parser.test.ts`
- Test: `test/core/likec4/generator.test.ts`

**Requirements**:
- `perspective` Kind 携带 `nodePresentation: { shape: document, color: indigo, border: solid }`
- 其他普通 Kind 不受影响
- 无 `nodePresentation` 的 Kind 保持 renderer 默认

#### Checks

- [ ] C16 验证 `perspective` 获得正确 presentation
  - Verifies: `metamodel/perspective.md` / Requirement "Element Kind 声明" / Scenario "Kind 共享语义"
  - Command: `pnpm exec vitest run test/core/model/parser.test.ts -t "perspective kind has nodePresentation"`
  - Expect: `perspective` Kind 的 `nodePresentation` 为 `{ shape: 'document', color: 'indigo', border: 'solid' }`

- [ ] C17 验证 LikeC4 生成正确包含 perspective style
  - Verifies: `metamodel/perspective.md` / Requirement "Element Kind 声明" / Scenario "Kind 共享语义"
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts -t "generates perspective with style block"`
  - Expect: LikeC4 specification 中 `perspective` 包含 `style { shape document color indigo border solid }`

### Task 6: E2E 与边界验证

**Goal**: 端到端验证 Kind presentation 在 Browser 中的完整链路。

**Files**:
- Test: `test/e2e/semantic-browser-node-presentation.spec.ts`

**Requirements**:
- desktop 和 mobile 视口均验证 Kind presentation 生效
- diff source 中状态颜色清晰且未被 Kind color 覆盖
- 未配置 presentation 的 Kind 使用 renderer 默认值

#### Checks

- [ ] C18 验证 Model View 中 Kind presentation 生效
  - Verifies: `elements/visual-presentation.md` / Requirement "视觉选择不构成规范性语义" / Scenario "持久呈现配置不改变 Kind 语义"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-node-presentation.spec.ts --project=desktop --project=mobile -g "applies kind presentation in model view"`
  - Expect: `perspective` Elements 显示 `document` shape 和 `indigo` 颜色

- [ ] C19 验证 diff source 中 operation color 优先
  - Verifies: `elements/visual-presentation.md` / Requirement "视觉选择不构成规范性语义" / Scenario "持久呈现配置不改变 Kind 语义"
  - Command: `pnpm exec playwright test test/e2e/semantic-browser-node-presentation.spec.ts --project=desktop --project=mobile -g "keeps operation color above kind color in diff"`
  - Expect: Change-derived View 中 ADDED/MODIFIED 节点的状态色覆盖 Kind `color`，`shape` 和 `border` 保留