### Task 1: 重构 scenario-labels CLI surface

**Goal**: 删除 `fix-scenario-labels` 入口，提供 `openspec scenario-labels` 作为唯一公开命令。

**Files**:
- Delete: `src/commands/fix-scenario-labels.ts`
- Create: `src/commands/scenario-labels.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/core/scenario-labels.ts`
- Test: `test/commands/scenario-labels.test.ts`
- Test: `test/core/scenario-labels.test.ts`

**Requirements**:
- 命令名 SHALL 为 `scenario-labels`，不保留 `fix-scenario-labels` alias。
- Core API SHALL 使用 apply/preview 命名表达显式标注语义。
- Preview 和 write 输出 SHALL 保持现有 JSON/table 信息结构。
- Missing change、idempotent write、stale label normalization 行为 SHALL 保持。

#### Checks

- [x] C1 Verify scenario-labels preview/write command
  - Verifies: `specs/cli-scenario-labels/spec.md` / Requirement "Scenario label fix command" / Scenario "Preview reports suggested scenario labels", Scenario "JSON preview is machine-readable", Scenario "Write applies suggested labels", Scenario "Missing change fails deterministically", Scenario "Command is idempotent"
  - Command: `pnpm test -- test/commands/scenario-labels.test.ts`
  - Expect: 新 `scenario-labels` command tests pass，且旧 `fix-scenario-labels` 不作为测试入口使用

- [x] C2 Verify core scenario label derivation API
  - Verifies: `specs/cli-scenario-labels/spec.md` / Requirement "Scenario label derivation" / Scenario "Unchanged scenario remains unlabeled", Scenario "Changed scenario receives MODIFIED label", Scenario "New scenario receives ADDED label", Scenario "Removed scenario block is inserted", Scenario "Existing labels are normalized without duplication"
  - Command: `pnpm test -- test/core/scenario-labels.test.ts`
  - Expect: core derivation tests pass with `applyScenarioLabelsForChange` / `previewScenarioLabelsForChange`

### Task 2: 移除 sync 的 scenario label 写回副作用

**Goal**: 让 sync 只消费并清洗已有 labels，不生成或写回 change-local labels。

**Files**:
- Modify: `src/core/change-sync.ts`
- Test: `test/commands/sync.test.ts`
- Test: `test/core/specs-apply.test.ts`

**Requirements**:
- `prepareChangeSync()` SHALL NOT call scenario label write logic。
- Sync SHALL allow unlabeled `## MODIFIED Requirements` scenarios。
- Sync SHALL continue stripping `[ADDED]` / `[MODIFIED]` and omitting `[REMOVED]` when labels already exist。
- Sync SHALL NOT report label-only change-local files as synced files。

#### Checks

- [x] C3 Verify sync does not write scenario labels
  - Verifies: `specs/cli-sync/spec.md` / Requirement "同步执行" / Scenario "sync 不写入 scenario labels"
  - Command: `pnpm test -- test/commands/sync.test.ts`
  - Expect: sync tests prove change-local spec content is unchanged when only scenario labels would be added

- [x] C4 Verify unlabeled and labeled sync semantics
  - Verifies: `specs/cli-sync/spec.md` / Requirement "幂等性" / Scenario "unlabeled scenario differences 不阻塞 sync", Scenario "labeled scenario 不触发重复 pending", Scenario "removed scenario block 不触发重复 pending"
  - Command: `pnpm test -- test/commands/sync.test.ts test/core/specs-apply.test.ts`
  - Expect: sync remains idempotent for unlabeled deltas and normalized labeled deltas

### Task 3: 更新 workflow guidance 和 schema instructions

**Goal**: 让 propose/snack/specs guidance 表达 validate 后显式运行 `openspec scenario-labels`，不再表达自动处理或 fix 语义。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`

**Requirements**:
- Specs instruction SHALL not ask agents to author scenario labels before validation。
- Propose SHALL run validation first, then instruct `openspec scenario-labels "<name>" --write` without second validate。
- Snack SHALL run validation first, then instruct `openspec scenario-labels "<name>" --write` without second validate。
- Generated guidance SHALL not contain old automatic-after-validation sentence。

#### Checks

- [x] C5 Verify propose guidance order
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Post-propose staged validation guidance" / Scenario "Propose runs scenario-labels after validation"
  - Command: `pnpm test -- test/core/templates/propose-template.test.ts`
  - Expect: propose template contains staged validation before `openspec scenario-labels "<name>" --write` and states no second validate is needed

- [x] C6 Verify snack guidance order
  - Verifies: `specs/snack-skill/spec.md` / Requirement "生成后 validate 自检" / Scenario "validate 后生成 scenario labels"
  - Command: `pnpm test -- test/core/templates/snack-template.test.ts`
  - Expect: snack template validates, optionally repairs once, then runs `openspec scenario-labels "<name>" --write`

- [x] C7 Verify schema instruction terminology
  - Verifies: `specs/snack-skill/spec.md` / Requirement "Specs 中层推断生成" / Scenario "Scenario labels 由显式 CLI 操作生成"
  - Command: `pnpm test -- test/core/artifact-graph/instruction-loader.test.ts`
  - Expect: generated specs instructions mention explicit `openspec scenario-labels` operation and do not mention automatic handling after validation

### Task 4: 更新 OPSX 和全局命令引用

**Goal**: 让 OPSX graph、文档和代码引用只保留 `scenario-labels` 新语义。

**Files**:
- Modify: `openspec/project.opsx.yaml`
- Modify: `openspec/project.opsx.relations.yaml`
- Modify: `openspec/specs/cli-scenario-labels/spec.md`
- Modify: `openspec/specs/cli-sync/spec.md`
- Modify: `openspec/specs/cli-validate/spec.md`
- Modify: `openspec/specs/propose-workflow/spec.md`
- Modify: `openspec/specs/snack-skill/spec.md`
- Modify: `openspec/specs/specs-sync-skill/spec.md`

**Requirements**:
- OPSX SHALL replace `cap.cli.fix-scenario-labels` with `cap.cli.scenario-labels`。
- Active specs and generated surfaces SHALL not reference `fix-scenario-labels`。
- Active guidance SHALL not say scenario labels are automatically handled by validation or sync。
- Archive-only historical references MAY remain outside active verification scope。

#### Checks

- [x] C8 Verify active references use scenario-labels only
  - Verifies: `specs/cli-scenario-labels/spec.md` / Requirement "Scenario label fix command" / Scenario "Preview reports suggested scenario labels"
  - Command: `rg -n "fix-scenario-labels|fixScenarioLabels|automatically handled by the OpenSpec CLI after validation" src test schemas openspec/specs openspec/project.opsx.yaml openspec/project.opsx.relations.yaml`
  - Expect: command exits with no matches in active files

- [x] C9 Verify OPSX delta validates
  - Verifies: `specs/specs-sync-skill/spec.md` / Requirement "Delta Reconciliation Logic" / Scenario "未标注 scenarios 仍可合入"
  - Command: `openspec validate --change refactor-scenario-labels --artifacts opsx-delta --json`
  - Expect: opsx-delta validation passes
