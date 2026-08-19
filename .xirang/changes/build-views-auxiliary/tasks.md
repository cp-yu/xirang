### Task 1: Build 完成门禁去掉 Authored Views 必写层

**Goal**: 更新 `semantic-model-build` 对应的 build skill 投影与测试，使规范性模型完成后即可审查与 promote，Authored Views 不再是必写完成层。

**Files**:
- Modify: `src/core/templates/workflows/build.ts`
- Modify: `.pi/skills/xirang-build/`
- Test: `test/core/templates/build.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`

**Requirements**:
- BFS 编写层止于 Relationships；Authored Views 不是必写完成层
- Decision Gate 不再因未决 View 选择阻塞编写
- 审查不得因无 authored view 或正式 view 未保留而 FAIL
- 四分区目录仍存在；`views/` 可为无单元
- 不改 `UNRESOLVED_VIEW_REFERENCE` 与 `candidate init`

#### Checks

- [ ] C1 Decision Gate 与 BFS 不再把 Authored Views 列为必写完成层
  - Verifies: `elements/semantic-model-build.md` / Requirement "在编写前通过 Modeling Decision Gate" / Scenario "未决 View 选择不阻塞编写"
  - Verifies: `elements/semantic-model-build.md` / Requirement "按 BFS 语义层编写 Candidate" / Scenario "跳过 Authored Views"
  - Command: `pnpm exec vitest run test/core/templates/build.test.ts`
  - Expect: 断言不再要求 Decision Gate / BFS 序列以 Authored Views 作必写完成层；空 views 可进入审查；测试通过

- [ ] C2 审查清单不因缺 view 失败
  - Verifies: `elements/semantic-model-build.md` / Requirement "确定性校验后执行独立语义审查" / Scenario "无 Authored View 不构成审查失败"
  - Verifies: `elements/semantic-model-build.md` / Requirement "只以阻塞语义问题拒绝审查" / Scenario "正式 view 未保留"
  - Command: `pnpm exec vitest run test/core/templates/build.test.ts`
  - Expect: skill 明确审查不得因缺少 Authored View 或未保留正式 view 判 FAIL；测试通过

- [ ] C3 四分区目录仍写入且 views 可为空
  - Verifies: `elements/semantic-model-build.md` / Requirement "产出完整 Candidate" / Scenario "Candidate 可供审查"
  - Verifies: `elements/semantic-model-build.md` / Requirement "产出完整 Candidate" / Scenario "Candidate 按四分区编写"
  - Command: `pnpm exec vitest run test/core/templates/build.test.ts`
  - Expect: skill 仍要求 `.xirang/candidate/{metamodel,elements,relationships,views}/`；`views/` MAY 无 Authored View 单元；测试通过

- [ ] C4 引用完整性保持
  - Preserves: `.xirang/model/elements/authored-views.md` / Requirement "声明选择范围" / Scenario "exclude 包含未知 identity"
  - Command: `pnpm exec vitest run test/core/model/validator.test.ts`
  - Expect: `UNRESOLVED_VIEW_REFERENCE` 仍为 ERROR；空 `views` 仍通过

- [ ] C5 skill 投影与校验
  - Verifies: `elements/semantic-model-build.md` / Requirement "按 BFS 语义层编写 Candidate" / Scenario "跳过 Authored Views"
  - Command: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts && xirang update --force && xirang validate --change build-views-auxiliary --json`
  - Expect: parity hash 更新；`xirang-build` skill 已同步；change validate 成功
