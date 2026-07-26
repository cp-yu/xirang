### Task 1: 建立缓存目录常量与局部名派生

**Goal**: 以 TDD 实现 identity → LikeC4 局部名的确定性派生与同 parent 碰撞消解，并固定生成产物落盘位置。

**Files**:
- Create: `src/core/likec4/paths.ts`
- Create: `src/core/likec4/local-names.ts`
- Test: `test/core/likec4/local-names.test.ts`
- Modify: `.gitignore`

**Requirements**:
- `LIKEC4_CACHE_DIR_NAME = '.cache-likec4'`；`likec4CacheDir(projectRoot)` 返回 `<projectRoot>/.xirang/.cache-likec4`，用 `path.join` 构造
- `deriveLocalNames(elements)` 返回 `LocalNames`，提供 `nameOf(identity)` 与 `pathOf(identity)`
- 基名取 identity 按 `.` 切分的末段；非法字符替换为 `_`；首字符非字母或 `_` 时前置 `_`
- 同一 parent 下基名重复时，按 identity 字节序追加 `_2`、`_3` 消解
- `pathOf` 由 parent 链的 `nameOf` 以 `.` 连接
- 派生按 identity 字节序处理，不依赖输入数组顺序
- 不复用 `src/utils/architecture-delta-merger.ts:159` 的 `buildFqns`：它优先读已被 C1 移除的 `element.fqn`（`:170`），且不处理同 parent 碰撞（`:174`）
- `.gitignore` 加入 `.xirang/.cache-likec4/`

#### Checks

- [ ] C1 验证派生规则与碰撞消解
  - Verifies: `xirang-contract.md:132` / 局部名只需单次生成内无冲突
  - Command: `pnpm exec vitest run test/core/likec4/local-names.test.ts`
  - Expect: `cap.architecture.likec4-reader` → `likec4_reader`；同 parent 下 `a.reader` 与 `b.reader` 得到 `reader` 与 `reader_2`；首字符为数字的 identity 前置 `_`
  - Remediation: 碰撞后缀按 identity 字节序分配，不按遍历序

- [ ] C2 验证派生确定性
  - Verifies: `design.md` / 确定性节
  - Command: `pnpm exec vitest run test/core/likec4/local-names.test.ts`
  - Expect: 同一元素集合以不同数组顺序输入，`nameOf` 与 `pathOf` 结果完全相同
  - Remediation: 派生前先按 identity 字节序排序

- [ ] C3 验证缓存目录被忽略
  - Verifies: `xirang-contract.md:130` / 生成产物不纳入版本控制
  - Command: `git check-ignore -v .xirang/.cache-likec4/model.c4`
  - Expect: 命中 `.gitignore` 中的 `.xirang/.cache-likec4/` 规则
  - Remediation: 现有 `.gitignore:171` 是历史 `/.opsx/architecture/.likec4/`，不覆盖新路径，需新增条目

---

### Task 2: 实现 specification 与 views 生成

**Goal**: 以 TDD 实现 Metamodel 与 Authored View 的 `.c4` 生成，确认不输出任何 `xirang {}` 块。

**Files**:
- Create: `src/core/likec4/generator.ts`
- Test: `test/core/likec4/generator.test.ts`

**Requirements**:
- `generateLikeC4(model)` 返回 `Map<相对文件名, 内容>`，键为 `specification.c4`、`model.c4`、`relations.c4`、`views.c4`
- 生成器是纯函数，不做任何文件 I/O，从结构上无法回写持久源
- `specification.c4` 只输出 `element <kind>` 与 `relationship <kind>` 名
- `root`、`contract`、`parents`、`children`、`sourceKinds`、`targetKinds` 一律不输出——由 `metamodel/` frontmatter 承载（`xirang-contract.md:83-85`）
- 不输出 `xirang { languageVersion }`，对比 `src/utils/architecture-delta-merger.ts:202` 的现有行为
- 不输出 `element X { xirang { ... } }`，对比同文件 `:210` 与 `:217`
- `views.c4` 输出 `view <identity>`，可选 `of`、`title`、`autoLayout`；`include: '*'` 输出 `include *`，identity 列表经 `pathOf` 转换
- kind 与 View 均按 identity 字节序输出

#### Checks

- [ ] C1 验证零 xirang 输出
  - Verifies: `proposal.md` / fork 回退硬前置
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts`
  - Expect: 四个产物内容均不含子串 `xirang`；含全部六类约束的 `ElementKind`/`RelationshipKind` 夹具仍只产出裸 kind 名
  - Remediation: 约束字段不得以任何形式泄漏进产物；它们的权威位置是 `metamodel/` frontmatter

- [ ] C2 验证 views 生成
  - Verifies: `xirang-contract.md:85` / `authored-view` 字段
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts`
  - Expect: `include: '*'` 产出 `include *`；`of` 与 identity 列表经 `pathOf` 转为 LikeC4 引用；缺省 `title`/`autoLayout` 不产生空行
  - Remediation: 可选字段缺省时整行省略，不输出空值

---

### Task 3: 实现 model 与 relations 生成

**Goal**: 以 TDD 实现按 `parent` 重建嵌套 element 树与关系边，保留 `metadata { elementId }` 作为 identity 回溯依据。

**Files**:
- Modify: `src/core/likec4/generator.ts`
- Test: `test/core/likec4/generator.test.ts`

**Requirements**:
- `parent` 为 null 的 `ModelElement` 为根，按 `parent` 递归嵌套
- 每个 element 输出 `<localName> = <kind> '<title>' '<summary>'`，并在 body 输出 `metadata { elementId '<identity>' }`
- `metadata { elementId }` 必须保留：`src/utils/likec4-reader.ts:86` 的 `fqn → identity` 映射与 `ElementDetailsCard.tsx:132` 的 `stableElementId` 均依赖它
- Element Contract 正文不进入 `.c4`——LikeC4 无 Requirement 记法
- 同一 parent 下兄弟元素按 identity 字节序
- `relations.c4` 输出 `<pathOf(source)> -[<kind>]-> <pathOf(target)>`，按 `source`、`kind`、`target` 依次字节序
- 不输出关系 `description`——IR 已无该字段
- 字符串转义遵循 LikeC4 单引号记法，覆盖引号、反斜杠、换行
- 排序一律字节序比较，不用 `localeCompare`（对比 `architecture-delta-merger.ts:203` 的现有实现）

#### Checks

- [ ] C1 验证嵌套结构与 identity 保留
  - Verifies: `xirang-definition.md:77` / identity 是唯一引用依据
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts`
  - Expect: 四层嵌套 IR 产出对应四层缩进；每个 element body 含 `elementId '<identity>'`；Requirement 正文不出现在产物中
  - Remediation: 层级由 `parent` 字段重建，不依赖输入数组的排列

- [ ] C2 验证生成确定性
  - Verifies: `design.md` / 确定性节
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts`
  - Expect: 同一 IR 连续两次调用产出相同字节；元素、关系、kind、View 乱序输入产出相同结果
  - Remediation: 全部排序改字节序；`localeCompare` 跨 locale 不稳定

- [ ] C3 验证转义与边界
  - Verifies: `design.md` / 生成内容节
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts`
  - Expect: 含单引号、反斜杠、换行的 title/summary 正确转义；空模型（零元素/零关系/零 View）产出结构合法的空产物
  - Remediation: 转义与 `architecture-delta-merger.ts:139` 的 `quote` 语义一致，但不复用其模块

---

### Task 4: 以真实 LikeC4 校验生成产物

**Goal**: 用未回退的 fork 校验生成产物语法合法，建立回退前的正向基线。

**Files**:
- Test: `test/core/likec4/generator-validate.test.ts`

**Requirements**:
- 将 `generateLikeC4` 产物写入临时目录，经 `src/commands/arch/runner.ts:6` 的 `runLikeC4(['validate', <dir>])` 校验
- 夹具覆盖：多层嵌套、多 kind、关系端点跨子树、View 的 `of` 与 identity 列表
- 夹具须含末段为 LikeC4 保留字的 identity（如 `x.model`、`y.views`），验证派生名不与关键字冲突
- 测试写临时目录，不写 `.xirang/.cache-likec4/`，不读取仓库现有 `.xirang/architecture/`
- 此校验在 Task 5 回退前执行，产物不含 xirang 块也应通过——语法扩展是可选挂载，删除前后均不影响裸产物

#### Checks

- [ ] C1 验证产物被 LikeC4 接受
  - Verifies: `xirang-contract.md:126` / `.c4` 用于渲染与校验
  - Command: `pnpm exec vitest run test/core/likec4/generator-validate.test.ts`
  - Expect: `runLikeC4(['validate', dir])` 退出码 0，无诊断输出
  - Remediation: 若报保留字冲突，在 `local-names.ts` 增加关键字避让并回归 Task 1 的确定性检查

---

### Task 5: 回退 fork grammar 的 Xirang 扩展

**Goal**: 删除 `.langium` 六条 Xirang 规则与三个挂载点，经脚本重生成产物，不手改任何生成文件。

**Files**:
- Modify: `likec4/packages/language-server/src/like-c4.langium`
- Modify: `likec4/packages/language-server/src/generated/ast.ts`
- Modify: `likec4/packages/language-server/src/generated/grammar.ts`
- Modify: `likec4/packages/language-server/src/generated/module.ts`
- Modify: `likec4/packages/language-server/src/generated-lib/icons.ts`

**Requirements**:
- 删 `like-c4.langium:13` 的 `xirang+=XirangLanguageBlock |`
- 删 `:35-59` 六条规则：`XirangLanguageBlock`、`XirangElementAnnotation`、`XirangElementAnnotationProperty`、`XirangRelationshipAnnotation`、`XirangRelationshipAnnotationProperty`、`XirangKindArray`
- 删 `:80` 的 `xirang=XirangElementAnnotation?` 与 `:112` 的 `xirang=XirangRelationshipAnnotation?`
- 生成物一律经 `pnpm generate` 重建，**绝不手改**：`generated/ast.ts` 现有 93 处 Xirang 引用，`generated/grammar.ts` 是单行序列化 JSON，手改必然与 `.langium` 失配
- 必须用 `pnpm generate` 而非裸 `langium generate`：`package.json:131` 的 `pregenerate` 清空整个 `src/generated`（含 `module.ts`），`:134` 串联 `tsx scripts/generate-icons.ts` 重建 `src/generated-lib/icons.ts`（`scripts/generate-icons.ts:68-69`）
- 不改动 `.langium` 中任何非 Xirang 规则

#### Checks

- [ ] C1 验证语法与生成物零残留
  - Verifies: `proposal.md` / BREAKING 删除范围
  - Command: `rg -c "Xirang" likec4/packages/language-server/src/like-c4.langium likec4/packages/language-server/src/generated/ast.ts`
  - Expect: 两文件均零命中
  - Remediation: 漏删挂载点会使 `langium generate` 报未定义规则并立即失败；漏删规则本体则留下不可达死语法，需回到 `.langium` 补删后重跑生成

- [ ] C2 验证生成物齐全且与 langium 配置一致
  - Verifies: `design.md` / 生成物重生成节
  - Command: `cd likec4/packages/language-server && pnpm generate && ls src/generated src/generated-lib`
  - Expect: `src/generated/` 含 `ast.ts`、`grammar.ts`、`module.ts`；`src/generated-lib/` 含 `icons.ts`
  - Remediation: 只跑 `langium generate` 会因 `pregenerate` 清空而缺失 `module.ts` 与 `icons.ts`

- [ ] C3 验证类型自洽
  - Verifies: `design.md` / R3
  - Command: `cd likec4/packages/language-server && pnpm typecheck`
  - Expect: 无 Xirang 相关类型错误
  - Remediation: 若报错指向非生成文件，说明存在此前未发现的运行时消费者，需先确认其归属再决定删除或改造

---

### Task 6: 修复受回退影响的 fork 测试

**Goal**: 使 language-server 包内部测试恢复绿，并保留产物形态的接缝证据。

**Files**:
- Modify: `likec4/packages/language-server/src/__tests__/specification.spec.ts`
- Modify: `likec4/packages/language-server/src/__tests__/model.spec.ts`
- Modify: `likec4/packages/language-server/src/lsp/CompletionProvider.spec.ts`

**Requirements**:
- `specification.spec.ts:5-34`：删整个 `'OPSX v1 annotations'` 用例——整例基于 xirang 块，无可保留断言
- `model.spec.ts:276-297`：删首行 `xirang { languageVersion '1' }` 与四处 `{ xirang { ... } }`，kind 声明退化为 `element project` 等
- `model.spec.ts` 必须保留任意深度嵌套结构与全部 `metadata { elementId }` 断言——它们与 xirang 语法无关，且正是生成器的产物形态，是生成器与 fork 的接缝证据
- `CompletionProvider.spec.ts:34`：从 entry 级 `expectedItems` 移除 `'xirang'`
- `CompletionProvider.spec.ts:63`：从 element body 级 `expectedItems` 移除 `'xirang'`
- 不改动任何与 Xirang 无关的用例

#### Checks

- [ ] C1 验证 fork 包测试为绿
  - Verifies: `proposal.md` / 中间态节
  - Command: `cd likec4/packages/language-server && pnpm test`
  - Expect: 无失败；若有失败须与回退前基线比对，仅接受与本改动无关的既有失败
  - Remediation: 回退前先跑一次记录既有失败集（`design.md` R4），只对比新增失败

- [ ] C2 验证嵌套能力断言保留
  - Verifies: `design.md` / 测试修复节
  - Command: `rg -n "elementId" likec4/packages/language-server/src/__tests__/model.spec.ts`
  - Expect: 改造后的用例仍含四处 `metadata { elementId ... }` 与四层嵌套
  - Remediation: 若连同嵌套断言一并删除，则失去产物形态被 LikeC4 接受的证据，须恢复

---

### Task 7: 验收——生成器与回退后的 fork 协同

**Goal**: 确认回退后的 fork 仍接受生成产物，且生成器无任何持久源写入。

**Files**:
- Test: `test/core/likec4/generator-validate.test.ts`

**Requirements**:
- 回退完成后重跑 Task 4 的校验，确认产物在无 Xirang 语法的 fork 下依然合法
- 断言 `generateLikeC4` 全程无文件写入：以临时目录快照前后比对，或确认函数签名不接受路径参数
- 断言产物不落入 `.xirang/model/`

#### Checks

- [ ] C1 验证回退后产物仍合法
  - Verifies: `xirang-contract.md:126-128` / `.c4` 为渲染与校验产物
  - Command: `pnpm exec vitest run test/core/likec4/generator-validate.test.ts`
  - Expect: 回退后 `runLikeC4(['validate', dir])` 仍退出码 0
  - Remediation: 若报错涉及 xirang 关键字，说明生成器仍有残留输出，回到 Task 2 的 C1

- [ ] C2 验证不回写持久源
  - Verifies: `xirang-contract.md:132` / 不得回写持久源
  - Command: `pnpm exec vitest run test/core/likec4/generator.test.ts test/core/likec4/generator-validate.test.ts`
  - Expect: 测试执行前后 `.xirang/model/` 与 `.xirang/architecture/` 内容不变
  - Remediation: 生成器必须保持纯函数，落盘由调用方（C3）承担

- [ ] C3 确认中间态边界
  - Verifies: `proposal.md` / 中间态节
  - Command: `rg -n "xirang \{" src/utils/architecture-delta-merger.ts`
  - Expect: `:202`、`:210`、`:217` 的旧 xirang 输出仍在——它们属于 C3 的删除范围，本 Change 不动
  - Remediation: 若已被本 Change 误删，说明越界改了旧栈，须还原并移交 C3
