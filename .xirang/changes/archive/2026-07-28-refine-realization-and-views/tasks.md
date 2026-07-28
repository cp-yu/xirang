### Task 1: 删除独立 Diff CLI 与 Archive 报告流程

**Goal**: 移除 `xirang diff`、持久化 Markdown renderer 和 Archive 报告生成，同时保留 Validate 的只读差异预览与共享运行时差异计算。

**Files**:
- Delete: `src/commands/diff.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/core/archive.ts`
- Modify: `src/core/change-diff-renderer.ts`
- Modify: `src/commands/validate.ts`
- Modify: `src/core/validation/constants.ts`
- Test: `test/commands/diff.test.ts`
- Test: `test/commands/validate.test.ts`
- Test: `test/core/archive.test.ts`
- Test: `test/core/validation.enriched-messages.test.ts`

**Requirements**:
- `xirang diff` 不再注册且不提供兼容别名。
- `xirang validate --change` 保留文本预览和 JSON summary、concise entries、diagnostics。
- Archive 不创建、重算、校验或覆盖 View presentation artifact。
- Archive 原样移动已有 legacy 文件，并允许不存在呈现文件。
- 内部 `ChangeDiff`、`renderChangeDiff()` 与 Browser 消费路径保持可用。

#### Checks

- [x] C1 验证 Validation 保留只读差异呈现
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Validation 呈现 Change 差异" / Scenario "校验 Change 并查看文本差异", Scenario "获取结构化校验结果"
  - Command: `pnpm vitest run test/commands/validate.test.ts`
  - Expect: 文本与 JSON validation 测试通过且 Change directory 不产生报告文件

- [x] C2 验证独立 Diff command 已删除
  - Verifies: `elements/deterministic-operations.md` / Requirement "通过 Validation 呈现 Change 差异" / Scenario "调用已删除的 Diff command"
  - Command: `pnpm vitest run test/commands/diff.test.ts`
  - Expect: CLI 将 `xirang diff` 作为 unknown command 拒绝，且 source registration 不再存在

- [x] C3 验证 Archive 不生成呈现文件
  - Verifies: `elements/change-closure.md` / Requirement "原样归档 Change 制品" / Scenario "Change 不含持久化呈现结果"
  - Command: `pnpm vitest run test/core/archive.test.ts`
  - Expect: 无报告的 Change 可在全部平台共用的 path API 路径下归档，archive 目录不新增呈现文件

- [x] C4 验证 Archive 原样保留 legacy 文件
  - Verifies: `elements/change-closure.md` / Requirement "原样归档 Change 制品" / Scenario "Change 含已有 legacy 文件"
  - Command: `pnpm vitest run test/core/archive.test.ts`
  - Expect: 已有 legacy 文件随目录移动且内容逐字节不变

### Task 2: 清理 Workflow 与受管 Agent 工作面

**Goal**: 从 Schema instructions、Propose、Snack 和生成后的 Pi Skills 中删除 `diff --write` 与持久化报告要求。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Regenerate: `.pi/skills/` via `xirang update` from source templates
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/integration/snack-workflow.test.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`

**Requirements**:
- Propose 在 combined validation 后直接报告 readiness，不生成差异文件。
- Snack 在 combined validation 后直接报告 reconciliation 结果，不要求持久化报告。
- Specs instructions 只声明 Scenario operations 由 validation 派生。
- 受管 Skills 的生成结果由 source templates 决定，不直接修改生成制品。
- 历史 Archive 目录不参与生成面清理。

#### Checks

- [x] C5 验证 Change 不持久化 Derived View artifact
  - Verifies: `elements/derived-views.md` / Requirement "不持久化" / Scenario "保存模型或 Change"
  - Command: `pnpm vitest run test/core/templates/propose-template.test.ts test/core/templates/snack-template.test.ts test/core/templates/skill-templates-parity.test.ts test/integration/snack-workflow.test.ts`
  - Expect: 生成的 workflow surfaces 不包含 `effective-change.md` 或 `xirang diff --write`

## Remediation

- [x] [code_fix] derived-views#不持久化 — Tracked Pi propose/snack skills still require diff --write and effective-change.md — Next: Regenerate `.pi/skills/xirang-propose` and `.pi/skills/xirang-snack` from updated templates; confirm no `xirang diff` / `effective-change.md` residue remains in tracked managed skills.
- [x] [code_fix] derived-views#不持久化 — Half migration of managed Pi skills — Next: After skill regeneration, re-run C5 command suite and any identity/skill audits covering `.pi/skills`.
- [x] [artifact_fix] Unaccounted Changes Detection — constants.ts and enriched-message tests are unaccounted — Next: Add `src/core/validation/constants.ts` and `test/core/validation.enriched-messages.test.ts` to Task 1 Files/Checks attribution.
- [x] [artifact_fix] Unaccounted Changes Detection — instruction-loader.test.ts is unaccounted — Next: Add `test/core/artifact-graph/instruction-loader.test.ts` to Task 2 Files/Checks attribution.

- [x] C6 验证运行表示仍可按需派生
  - Verifies: `elements/derived-views.md` / Requirement "不持久化" / Scenario "生成可重建运行表示"
  - Command: `pnpm vitest run test/core/view.test.ts`
  - Expect: View runtime snapshot 继续从当前模型与 active Changes 构建且不读取持久化报告

### Task 3: 对齐项目定义并验证 View 呈现

**Goal**: 保持项目定义、Semantic Delta 和现有 Semantic Browser 对 View Composition 与 View Presentation 的表达一致，并完成整体回归验证。

**Files**:
- Modify: `xirang-definition.md`
- Test: `test/core/view.test.ts`
- Test: `likec4/packages/diagram/src/xirang/architectureView.spec.ts`
- Test: `likec4/packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx`

**Requirements**:
- View Composition 与 View Presentation 保持正交。
- Authored View 与 Derived View 均可采用 Visual 或 Text Presentation。
- Semantic Browser 的 Change selector、Full context、Diff only 和 Contract diff 保持可用。
- 视觉布局、文本排版和程序化 JSON 均不成为规范性语义。
- 完整测试、lint、build 与 Change validation 通过。

#### Checks

- [x] C7 验证 View 的组成与呈现维度
  - Verifies: `elements/views.md` / Requirement "区分 View Composition 与 View Presentation" / Scenario "同一 View 采用多种呈现方法"
  - Command: `pnpm xirang arch validate --change "refine-realization-and-views" --json && git diff --check`
  - Expect: Expected Semantic Model 无错误或 warning，定义与 Delta 不含格式问题

- [x] C8 验证 Visual Presentation 保持交互式差异浏览
  - Verifies: `elements/visual-presentation.md` / Requirement "以视觉形式传达 View" / Scenario "浏览层级结构"
  - Command: `pnpm --dir likec4 exec vitest run packages/diagram/src/xirang/architectureView.spec.ts packages/diagram/src/overlays/element-details/SpecsTab.spec.tsx --no-isolate`
  - Expect: Architecture 与 Contract 的 Change-derived visual tests 全部通过

- [x] C9 验证整体实现门禁
  - Verifies: `elements/view-presentation.md` / Requirement "不改变 View 语义依据" / Scenario "切换呈现方法"
  - Command: `pnpm test && pnpm lint && pnpm build && pnpm xirang validate --change "refine-realization-and-views" --json`
  - Expect: 完整测试、lint、build 与 combined change validation 全部通过
