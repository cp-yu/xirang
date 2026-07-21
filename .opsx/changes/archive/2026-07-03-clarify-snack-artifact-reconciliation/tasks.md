### Task 1: 强化 snack template 的 artifact reconciliation 指令

**Goal**: 更新 generated snack skill template，使 snack 明确表达 code-first artifact reconciliation、broader evidence sources、conditional artifact updates，以及 no `tasks.md` 边界。

**Files**:
- Modify: `src/core/templates/workflows/snack.ts`
- Test: `test/core/templates/snack-template.test.ts`

**Done**: ✅ TDD red→green — 新增 `snack-template.test.ts`（12 tests，先 red 7 fail），更新 `snack.ts` 模板（evidence sources、reconciliation、conditional states），green 全部通过；instruction 127 行（≤200）。

**Requirements**:
- snack template description 不再把 `git diff` 表达为唯一来源。
- Flow 包含 conversation context、working tree diff、staged diff、`git diff HEAD` 和自然语言 commit/range selector。
- Flow 明确读取 existing artifacts 并按 missing/stale/inconsistent/current 条件式 reconcile。
- Flow 区分 delta spec Markdown headings 与 `opsx-delta.yaml` YAML keys。
- instructions 部分保持不超过 200 行。

#### Checks

- [x] C1 Verify code-change evidence collection guidance
  - Verifies: `specs/snack-skill/spec.md` / Requirement "Git diff 分析" / Scenario "获取修改文件列表", Scenario "用户指定 commit range"
  - Command: `pnpm test -- test/core/templates/snack-template.test.ts`
  - Expect: template test confirms generated snack skill mentions conversation context, `git diff --cached`, `git diff HEAD`, and natural-language commit/range evidence selectors

- [x] C2 Verify artifact reconciliation guidance
  - Verifies: `specs/snack-skill/spec.md` / Requirement "snack skill 基本流程" / Scenario "首次调用 snack 创建 change", Scenario "更新已有 change"
  - Command: `pnpm test -- test/core/templates/snack-template.test.ts`
  - Expect: template test confirms generated snack skill describes no-change and stale-change scenarios plus missing/stale/inconsistent/current conditional artifact updates

- [x] C3 Verify generated skill length boundary
  - Verifies: `specs/snack-skill-generation/spec.md` / Requirement "snack skill 纳入生成管线" / Scenario "skill 文件长度验证"
  - Command: `pnpm test -- test/core/templates/snack-template.test.ts test/integration/snack-workflow.test.ts`
  - Expect: generated `openspec-snack` instructions remain within the 200-line limit

### Task 2: 增强 generated snack skill 安装测试

**Goal**: 增强 integration assertions，确保 `openspec init` 和 `openspec update` 安装出的 snack skill 包含新的 reconciliation 语义。

**Files**:
- Modify: `test/integration/snack-workflow.test.ts`

**Requirements**:
- init path 断言 generated skill 包含 artifact reconciliation 关键语义。
- update path 断言 refreshed skill 包含 broader evidence source 关键语义。
- 测试只断言关键行为短语，不使用整文件 snapshot。

**Done**: ✅ 增强 init/update 两条 integration 断言（reconciliation、conditional states、conversation context、staged/HEAD diff、commit/range、no tasks.md），3 tests 全绿；行为在 Task 1 单元层已 red→green 驱动。

#### Checks

- [x] C4 Verify installed skill exposes reconciliation guidance
  - Verifies: `specs/snack-skill-generation/spec.md` / Requirement "snack skill 纳入生成管线" / Scenario "generated skill text exposes reconciliation guidance"
  - Command: `pnpm test -- test/integration/snack-workflow.test.ts`
  - Expect: integration test confirms installed/generated `openspec-snack/SKILL.md` includes artifact reconciliation, conditional artifact updates, conversation context, staged diff, `git diff HEAD`, commit/range selectors, and no `tasks.md`

### Task 3: 更新 snack formal specs 与 Purpose 文案

**Goal**: 更新 snack 三个正式 specs，使行为规约与新设计一致，并移除仅限 snack specs 的占位 Purpose 文案。

**Files**:
- Modify: `openspec/specs/snack-skill/spec.md`
- Modify: `openspec/specs/snack-skill-generation/spec.md`
- Modify: `openspec/specs/snack-workflow-manifest/spec.md`

**Requirements**:
- `snack-skill` Purpose 描述 code-first artifact reconciliation 职责。
- `snack-skill-generation` Purpose 描述 generated skill 管线职责。
- `snack-workflow-manifest` Purpose 描述 manifest 注册职责。
- 仅清理 snack 三个 specs 的占位 Purpose，不做全项目清理。

**Done**: ✅ 三个 snack 主 spec 的占位 Purpose 已替换为 meaningful Purpose（中文），rg 验证占位文本在三个 snack specs 中缺失（exit=1）。全项目其他占位 Purpose 按设计 out-of-scope。

#### Checks

- [x] C5 Verify snack Purpose cleanup
  - Verifies: `specs/snack-workflow-manifest/spec.md` / Requirement "snack workflow specs include finalized purpose text" / Scenario "snack specs purpose cleanup"
  - Command: `! rg -n '此规约记录变更 snack-workflow 引入的行为，请在后续同步或归档前补全正式 Purpose。' openspec/specs/snack-skill/spec.md openspec/specs/snack-skill-generation/spec.md openspec/specs/snack-workflow-manifest/spec.md`
  - Expect: the placeholder Purpose text is absent from the three snack specs only

### Task 4: 验证 OpenSpec artifacts 与 OPSX delta

**Goal**: 验证本 change 的 delta specs、OPSX delta 和 task structure，确保后续 apply/archive 可以消费。

**Files**:
- Modify: `openspec/changes/clarify-snack-artifact-reconciliation/proposal.md`
- Modify: `openspec/changes/clarify-snack-artifact-reconciliation/design.md`
- Modify: `openspec/changes/clarify-snack-artifact-reconciliation/specs/snack-skill/spec.md`
- Modify: `openspec/changes/clarify-snack-artifact-reconciliation/specs/snack-skill-generation/spec.md`
- Modify: `openspec/changes/clarify-snack-artifact-reconciliation/specs/snack-workflow-manifest/spec.md`
- Modify: `openspec/changes/clarify-snack-artifact-reconciliation/opsx-delta.yaml`
- Modify: `openspec/changes/clarify-snack-artifact-reconciliation/tasks.md`

**Requirements**:
- Change-local specs validate with required SHALL/MUST and `#### Scenario:` structure.
- OPSX delta uses YAML keys `ADDED`, `MODIFIED`, and `REMOVED`.
- Task checks use change-local `Verifies:` paths.

**Done**: ✅ `openspec validate ... --type change --json` 返回 0 ERROR，change passed (1/1)。残留 WARNING 均为全项目预存（主 spec 缺 capabilities frontmatter），不在本 change scope 内。

#### Checks

- [x] C6 Verify change artifact structure
  - Verifies: `specs/snack-skill/spec.md` / Requirement "生成后 validate 自检" / Scenario "自检通过"
  - Command: `openspec validate "clarify-snack-artifact-reconciliation" --type change --json`
  - Expect: validation returns no ERROR; warnings, if any, are reviewed and repaired once when actionable
