### Task 1: 建立 Architecture delta compiler 与统一 Diff IR

**Goal**: 以 TDD 实现 identity-level Architecture delta parser、Target Semantic Model materializer、完整 validation 与统一 Diff IR。

**Files**:
- Create: `src/core/architecture-delta-parser.ts`
- Create: `src/core/change-compiler.ts`
- Create: `src/core/semantic-diff.ts`
- Modify: `likec4/packages/language-server/src/like-c4.langium`
- Modify: `src/utils/semantic-model.ts`
- Modify: `src/utils/likec4-reader.ts`
- Modify: `src/validation/architecture-delta-validator.ts`
- Test: `test/unit/utils/architecture-delta-merger.test.ts`
- Test: `test/core/architecture-delta-parser.test.ts`
- Test: `test/core/change-compiler.test.ts`

**Requirements**:
- Parser 只接受顶层 ADDED、MODIFIED、REMOVED 与 element replacement hint。
- MODIFIED aggregates 使用完整 target payload；element parent 可改，kind 不可改。
- Relationship identity 固定为 source、kind、target tuple，Metamodel kinds 使用完整 target constraints。
- 严格非级联删除与 declared/effective reconciliation 必须在完整 target 上验证。
- Diff IR 不包含 UI state，Scenario/property entries 由 Formal/Target 比较派生。

#### Checks

- [ ] C1 验证 Architecture delta grammar 与 identity preconditions
  - Verifies: `specs/architecture-delta-artifact/spec.md` / Requirement "Delta 文件 SHALL 使用 LikeC4 extend 语法" / Scenario "修改 existing element", Scenario "Relationship identity", Scenario "Metamodel target state"
  - Command: `pnpm vitest run test/core/architecture-delta-parser.test.ts`
  - Expect: 合法完整 target operations 通过，raw extend、partial payload 与 identity conflict 失败

- [ ] C2 验证 replacement hint 不改变 target
  - Verifies: `specs/architecture-delta-artifact/spec.md` / Requirement "Element replacement review hint" / Scenario "删除 hint 不改变 target", Scenario "Hint 不迁移引用"
  - Command: `pnpm vitest run test/core/change-compiler.test.ts`
  - Expect: 有无 hint 的 Target Semantic Model 相同，未处理引用保持 diagnostics

- [ ] C3 验证 strict removal 与完整 Diff IR
  - Verifies: `specs/architecture-delta-artifact/spec.md` / Requirement "Delta 验证 SHALL 检查 extend 目标存在" / Scenario "删除存在未处理依赖", Scenario "Declared MODIFIED 无 effective change"
  - Command: `pnpm vitest run test/core/change-compiler.test.ts test/unit/utils/architecture-delta-merger.test.ts`
  - Expect: compiler 返回全部 unresolved dependencies，并为 Scenario/property 生成 derived entries

### Task 2: 提供 validate preview、diff CLI 与 deterministic report

**Goal**: 让 validate、text diff、JSON 与 `effective-change.md` 共享同一个 compiled change result。

**Files**:
- Create: `src/commands/diff.ts`
- Create: `src/core/change-diff-renderer.ts`
- Modify: `src/commands/validate.ts`
- Modify: `src/cli/index.ts`
- Test: `test/commands/diff.test.ts`
- Test: `test/commands/validate.test.ts`
- Test: `test/commands/validate.enriched-output.test.ts`

**Requirements**:
- `opsx diff` 默认只读，semantic differences 不导致非零退出。
- `diff --json` 输出完整 IR，validate JSON 只输出 concise projection。
- `--write` 通过明确文件名常量与原子写入生成 deterministic `effective-change.md`。
- 无效 change 保留 partial diff、写入 Failed report 并返回非零。
- 所有 change/report paths 使用 Node.js path API。

#### Checks

- [ ] C4 验证 diff text、scope 与 JSON projections
  - Verifies: `specs/cli-diff/spec.md` / Requirement "Diff projections share one result" / Scenario "JSON 输出完整 Diff IR", Scenario "只显示 Specs", Scenario "只显示 Architecture"
  - Command: `pnpm vitest run test/commands/diff.test.ts`
  - Expect: 各 projection 的 identities、counts、valid 与 diagnostics 一致

- [ ] C5 验证 deterministic effective-change.md
  - Verifies: `specs/cli-diff/spec.md` / Requirement "Effective change review artifact" / Scenario "相同输入生成相同文件", Scenario "无效 change 覆盖旧报告"
  - Command: `pnpm vitest run test/commands/diff.test.ts`
  - Expect: 重复写入字节一致，Failed report 原子替换旧成功报告

- [ ] C6 验证 validate concise preview
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Change validation effective preview" / Scenario "Human-readable concise preview", Scenario "JSON concise preview", Scenario "Preview 不写 review artifact"
  - Command: `pnpm vitest run test/commands/validate.test.ts test/commands/validate.enriched-output.test.ts`
  - Expect: validate 输出 summary 与 concise entries，且不创建 effective-change.md

### Task 3: 实现只读删除影响分析

**Goal**: 新增 `opsx arch plan-remove`，在 Formal 或 selected change target 上区分 Handled 与 Unresolved dependencies。

**Files**:
- Create: `src/commands/arch/plan-remove.ts`
- Modify: `src/commands/arch/index.ts`
- Test: `test/commands/arch-plan-remove.test.ts`

**Requirements**:
- 接受 stable element identity 或当前 FQN。
- 分析 descendants、incident relationships、Spec bindings、parent context 与其他显式 references。
- `--change` 必须复用 change compiler，不得自动迁移 replacement references。
- 发现 dependencies 返回 0；identity/parse error 返回非零。
- Text 与 JSON outputs 使用 canonical identities 与 deterministic ordering。

#### Checks

- [ ] C7 验证 Formal removal plan
  - Verifies: `specs/arch-plan-remove-command/spec.md` / Requirement "Architecture removal impact planning" / Scenario "分析 formal element", Scenario "Element 不存在"
  - Command: `pnpm vitest run test/commands/arch-plan-remove.test.ts`
  - Expect: 只读输出完整依赖，not-found 使用非零退出

- [ ] C8 验证 change-aware Handled 与 Unresolved
  - Verifies: `specs/arch-plan-remove-command/spec.md` / Requirement "Change-aware removal planning" / Scenario "区分 Handled 与 Unresolved", Scenario "Replacement hint 不自动处理引用"
  - Command: `pnpm vitest run test/commands/arch-plan-remove.test.ts`
  - Expect: 已显式 operations 与残留 dependencies 分类准确

### Task 4: 将 sync 与 archive 切换到 snapshot transaction

**Goal**: 让 sync 编译干净 Formal target modules，并让 archive 在移动前生成 final review report。

**Files**:
- Modify: `src/core/change-sync.ts`
- Modify: `src/utils/architecture-delta-merger.ts`
- Modify: `src/commands/sync.ts`
- Modify: `src/core/archive.ts`
- Test: `test/commands/sync.test.ts`
- Test: `test/core/archive.test.ts`
- Test: `test/integration/sync-workflow.test.ts`
- Test: `test/integration/archive-workflow.test.ts`

**Requirements**:
- Sync 不得复制 negative delta module到 Formal Architecture。
- Prepare 后必须复核 Formal fingerprint，stale 时零写入。
- Graph、Specs、registry 与 filesystem writes 必须作为一个 rollback-capable transaction。
- Sync 不修改 change artifacts；archive 重建 final effective-change.md 后再移动。
- Windows EXDEV/EPERM、backup 与 rollback paths 使用 Node.js path API。

#### Checks

- [ ] C9 验证原子 sync 与 stale fingerprint
  - Verifies: `specs/cli-sync/spec.md` / Requirement "Semantic Delta SHALL 原子提升" / Scenario "Stale Formal snapshot", Scenario "Contract failure 回滚 graph", Scenario "Windows 原子 sync"
  - Command: `pnpm vitest run test/commands/sync.test.ts test/integration/sync-workflow.test.ts`
  - Expect: stale 或任一 failure 后 Formal graph 与 Specs 均无部分写入

- [ ] C10 验证 archive final report gate
  - Verifies: `specs/cli-archive/spec.md` / Requirement "Archive Process" / Scenario "直接归档", Scenario "Final report generation 失败"
  - Command: `pnpm vitest run test/core/archive.test.ts test/integration/archive-workflow.test.ts`
  - Expect: archive 只在 current Passed report 生成成功后移动目录

### Task 5: 删除 Scenario labels 与 RENAMED compatibility

**Goal**: 从 CLI、parser、sync、Schema、workflow templates、task anchors 与 tests 中彻底移除 Scenario labels 和 RENAMED operation。

**Files**:
- Delete: `src/commands/scenario-labels.ts`
- Delete: `src/core/scenario-labels.ts`
- Delete: `test/commands/scenario-labels.test.ts`
- Delete: `test/core/scenario-labels.test.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/core/parsers/requirement-blocks.ts`
- Modify: `src/core/specs-apply.ts`
- Modify: `src/core/validation/validator.ts`
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Modify: `src/core/templates/fragments/opsx-fragments.ts`
- Test: `test/core/parsers/requirement-blocks.test.ts`
- Test: `test/core/templates/transforms.test.ts`

**Requirements**:
- CLI command 与所有生成/写回代码必须删除，不保留 alias 或 migration layer。
- Parser 必须拒绝 RENAMED section 与任何 Scenario operation-like label。
- Requirement rename 只允许 REMOVED old + ADDED new。
- Schema instructions 与 generated workflows 必须运行 validate preview 和 `opsx diff --write`。
- Task anchors 只匹配 exact canonical Scenario title。

#### Checks

- [ ] C11 验证 Scenario labels command 与 writer 已删除
  - Verifies: `specs/cli-scenario-labels/spec.md` / REMOVED Requirement "Scenario label fix command"
  - Command: `node -e "const fs=require('fs');for(const p of ['src/commands/scenario-labels.ts','src/core/scenario-labels.ts'])if(fs.existsSync(p))process.exit(1);const r=require('child_process').spawnSync('rg',['-n','registerScenarioLabelsCommand|opsx scenario-labels','src','schemas','--glob','*.ts','--glob','*.yaml'],{encoding:'utf8'});if(r.status===0&&r.stdout.trim())process.exit(1);if(r.status!==0&&r.status!==1)process.exit(r.status||1)"`
  - Expect: runtime 与 generated workflow source 无 Scenario labels command 引用

- [ ] C12 验证 Scenario label derivation compatibility 已删除
  - Verifies: `specs/cli-scenario-labels/spec.md` / REMOVED Requirement "Scenario label derivation"
  - Command: `pnpm vitest run test/core/parsers/requirement-blocks.test.ts test/commands/validate.test.ts`
  - Expect: operation-like labels 与 RENAMED section 均产生 location-aware ERROR

- [ ] C13 验证 propose 与 snack 使用 effective diff
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose 使用 definition-first authoring" / Scenario "Scenario operations 通过 diff 审阅"
  - Command: `pnpm vitest run test/core/templates/transforms.test.ts test/core/templates/propose-template.test.ts test/integration/snack-workflow.test.ts`
  - Expect: generated instructions 包含 validate preview 与 opsx diff --write，且不含 scenario-labels

### Task 6: 增加 active change Web diff 与定向缓存

**Goal**: 在 `opsx view` 中复用现有 LikeC4 renderer 展示 formal 与 active change runtime variants、Specs diff 和 Architecture overlay。

**Files**:
- Modify: `src/core/view.ts`
- Modify: `likec4/packages/diagram/src/navigationpanel/NavigationPanelDropdown.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.tsx`
- Modify: `likec4/packages/diagram/src/overlays/element-details/ElementDetailsCard.tsx`
- Modify: `likec4/packages/diagram/src/likec4diagram/DiagramUI.tsx`
- Test: `test/core/view.test.ts`
- Test: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`
- Test: `test/e2e/spec-browser.spec.ts`

**Requirements**:
- Selector 默认 Formal，并只列 active changes；Specs-only changes 也显示。
- 每个 change 使用独立 target 与 Diff IR，不得合并多个 active changes。
- Diff only 保留 changed graph 与最小上下文闭包，context 不计数。
- Specs/Architecture diagnostics 分区容错。
- Active index、Specs diff 与 Architecture diff/layout caches 分离并定向 HMR 失效。

#### Checks

- [ ] C14 验证 active change selector 与 isolation
  - Verifies: `specs/cli-view/spec.md` / Requirement "Dashboard Display" / Scenario "Active change selector", Scenario "Archive change 不显示", Scenario "Specs-only change 显示"
  - Command: `pnpm vitest run test/core/view.test.ts`
  - Expect: selector 稳定排序，archive 排除，各 change target 相互隔离

- [ ] C15 验证 Specs structured diff 与 partial diagnostics
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "Active change Specs semantic diff" / Scenario "Scenario operation 派生", Scenario "Modified text 展示"
  - Command: `pnpm --dir likec4 exec vitest run packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`
  - Expect: Requirement/Scenario badges、line/word diff 与 diagnostics 使用统一 Diff IR

- [ ] C16 验证 graph overlay、Diff only 与 HMR
  - Verifies: `specs/cli-view/spec.md` / Requirement "Dashboard Display" / Scenario "Full context 与 Diff only", Scenario "分区 diagnostics", Scenario "Active change 热更新"
  - Command: `pnpm test:e2e`
  - Expect: 单图 overlay 保留最小上下文，Specs-only 更新不触发无关 graph relayout

### Task 7: 完成 self-host validation 与跨平台回归

**Goal**: 使用新 compiler 验证本 change 的 target dialect，并在完整 root、LikeC4、browser 与三平台 CI surfaces 上证明无回归。

**Files**:
- Test: `.github/workflows/opsx-v2-cross-platform.yml`
- Test: `test/integration/validate-command.test.ts`
- Test: `test/integration/sync-workflow.test.ts`
- Test: `test/e2e/spec-browser.spec.ts`

**Requirements**:
- 本 change 的 `architecture-delta.c4` 必须由实现后的新 parser/compiler 成功验证。
- Root CLI 与 vendored LikeC4 的 lint、typecheck、test、build 全部通过。
- Browser E2E 必须覆盖 desktop 与 mobile change diff surfaces。
- CI matrix 必须继续包含 ubuntu、macOS、Windows 与 Node.js 22.22.3。
- Generated effective report 与 change fingerprints 必须在最终 gate 中一致。

#### Checks

- [ ] C17 验证本 change 的完整 Semantic Delta
  - Verifies: `specs/validate-change/spec.md` / Requirement "validate change SHALL 支持 architecture-delta.c4" / Scenario "联合 Target Semantic Model", Scenario "Validation 保持只读"
  - Command: `pnpm build && node bin/opsx.js validate --change add-semantic-change-diff --json && node bin/opsx.js diff --change add-semantic-change-diff --write`
  - Expect: validation 通过并生成 current deterministic effective-change.md

- [ ] C18 验证 root 与 LikeC4 全套检查
  - Verifies: `specs/cli-diff/spec.md` / Requirement "Partial diff diagnostics" / Scenario "Specs 失败而 Architecture 可计算", Scenario "Architecture 失败而 Specs 可计算"
  - Command: `pnpm lint && pnpm build && pnpm test && pnpm --dir likec4 typecheck && pnpm --dir likec4 test && pnpm --dir likec4 build && pnpm test:e2e`
  - Expect: root、LikeC4 与 browser suites 全部通过

- [ ] C19 验证三平台 CI matrix
  - Verifies: `specs/cli-diff/spec.md` / Requirement "Effective change review artifact" / Scenario "相同输入生成相同文件"
  - Command: `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/opsx-v2-cross-platform.yml','utf8');for(const v of ['ubuntu-latest','macos-latest','windows-latest','22.22.3'])if(!s.includes(v))process.exit(1)"`
  - Expect: CI 明确覆盖 Linux、macOS、Windows 与要求的 Node.js runtime
