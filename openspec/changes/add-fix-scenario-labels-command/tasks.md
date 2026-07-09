### Task 1: 实现 scenario label 分析与补全核心

**Goal**: 提供可复用的 scenario label preview/write 逻辑，供 CLI command 与 sync 共用。

**Files**:
- Create: `src/core/scenario-labels.ts`
- Modify: `src/core/parsers/requirement-blocks.ts`
- Test: `test/core/scenario-labels.test.ts`

**Requirements**:
- 为 MODIFIED requirements 对比 main spec 与 change-local scenarios
- 支持 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` 建议与写回
- 保持无变化 scenario 无标签
- 保证重复写回幂等

#### Checks

- [x] C1 Verify changed/new/unchanged scenario derivation
  - Verifies: `specs/cli-fix-scenario-labels/spec.md` / Requirement "Scenario label derivation" / Scenario "Changed scenario receives MODIFIED label", Scenario "New scenario receives ADDED label", Scenario "Unchanged scenario remains unlabeled"
  - Command: `pnpm test -- test/core/scenario-labels.test.ts`
  - Expect: derivation tests pass

- [x] C2 Verify removed scenario insertion and idempotency
  - Verifies: `specs/cli-fix-scenario-labels/spec.md` / Requirement "Scenario label derivation" / Scenario "Removed scenario block is inserted", Scenario "Existing labels are normalized without duplication"
  - Command: `pnpm test -- test/core/scenario-labels.test.ts`
  - Expect: removed scenario is inserted once with original body preserved

### Task 2: 新增 fix-scenario-labels CLI 命令

**Goal**: 暴露 `openspec fix-scenario-labels` preview/write/json 命令。

**Files**:
- Create: `src/commands/fix-scenario-labels.ts`
- Modify: `src/cli/index.ts`
- Test: `test/commands/fix-scenario-labels.test.ts`

**Requirements**:
- 支持 `--preview`、`--write`、`--json`
- preview 输出可读表格且不写文件
- write 只更新需要 label 变化的 change-local specs
- missing change 确定性失败

#### Checks

- [x] C3 Verify preview and JSON output
  - Verifies: `specs/cli-fix-scenario-labels/spec.md` / Requirement "Scenario label fix command" / Scenario "Preview reports suggested scenario labels", Scenario "JSON preview is machine-readable"
  - Command: `pnpm test -- test/commands/fix-scenario-labels.test.ts`
  - Expect: preview contains suggested rows and JSON includes structured suggestions

- [x] C4 Verify write and missing-change behavior
  - Verifies: `specs/cli-fix-scenario-labels/spec.md` / Requirement "Scenario label fix command" / Scenario "Write applies suggested labels", Scenario "Missing change fails deterministically", Scenario "Command is idempotent"
  - Command: `pnpm test -- test/commands/fix-scenario-labels.test.ts`
  - Expect: write updates expected files, missing change fails, repeated write has no additional changes

### Task 3: 调整 validate 与 sync 集成

**Goal**: validate 保持只读且允许 MODIFIED 下无标签 scenarios；sync 前自动补全 labels 并保持 formal spec 输出正确。

**Files**:
- Modify: `src/core/validation/validator.ts`
- Modify: `src/core/change-sync.ts`
- Modify: `src/core/specs-apply.ts`
- Test: `test/core/validation.test.ts`
- Test: `test/commands/sync.test.ts`

**Requirements**:
- validate 不因 MODIFIED scenario 无标签报错
- validate 继续拒绝 unknown/malformed labels 与 ADDED section 下非法 labels
- sync 前自动应用 label 补全
- sync 去除 `[ADDED]`/`[MODIFIED]` 并省略 `[REMOVED]` block
- repeated sync 幂等

#### Checks

- [x] C5 Verify validation boundary
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Scenario operation label 校验" / Scenario "MODIFIED requirement 下无标签 scenario 通过校验", Scenario "未知 label 报错", Scenario "非法 label 位置报错"
  - Command: `pnpm test -- test/core/validation.test.ts`
  - Expect: validation accepts unlabeled MODIFIED scenarios and still rejects invalid labels

- [x] C6 Verify sync auto-label handling
  - Verifies: `specs/cli-sync/spec.md` / Requirement "同步执行" / Scenario "sync 前自动处理 scenario labels"
  - Command: `pnpm test -- test/commands/sync.test.ts`
  - Expect: sync writes labels before building formal specs

- [x] C7 Verify sync output and idempotency
  - Verifies: `specs/cli-sync/spec.md` / Requirement "幂等性" / Scenario "removed scenario block 不触发重复 pending", Scenario "自动 scenario labels 不破坏 sync 幂等性"
  - Command: `pnpm test -- test/commands/sync.test.ts`
  - Expect: formal spec omits removed scenario and repeated sync produces no new changes

### Task 4: 更新 workflow 与 artifact 指引

**Goal**: 将 prompt 文案收敛到自动处理一句话，避免 agent 手工判断 scenario labels。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Modify: `schemas/spec-driven/schema.yaml`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`
- Test: `test/core/templates/skill-templates-parity.test.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`

**Requirements**:
- propose guidance 使用确认后的自动处理文案
- snack guidance 使用确认后的自动处理文案
- specs artifact instruction 使用确认后的自动处理文案
- 移除要求 agent 手工列出 scenario label 判定的提示

#### Checks

- [x] C8 Verify propose/snack prompt wording
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose applies spec content boundary" / Scenario "Propose guidance delegates scenario labels to CLI"
  - Verifies: `specs/snack-skill/spec.md` / Requirement "Specs 中层推断生成" / Scenario "Scenario labels 由 CLI 自动处理"
  - Command: `pnpm test -- test/core/templates/propose-template.test.ts test/core/templates/snack-template.test.ts test/core/templates/skill-templates-parity.test.ts`
  - Expect: generated workflow skills contain the final automatic-label wording

- [x] C9 Verify specs artifact instruction wording
  - Verifies: `specs/specs-sync-skill/spec.md` / Requirement "Delta Reconciliation Logic" / Scenario "自动 labels 在 sync 前可供 review"
  - Command: `pnpm test -- test/core/artifact-graph/instruction-loader.test.ts`
  - Expect: specs instructions contain the final automatic-label wording and no manual scenario label decision table

### Task 5: 全量验证 change artifacts 与相关测试

**Goal**: 确认新增命令、验证、sync 与模板行为作为整体通过。

**Files**:
- Test: `openspec/changes/add-fix-scenario-labels-command/`

**Requirements**:
- OpenSpec change validation passes
- Targeted test suites pass
- CLI command surface is registered

#### Checks

- [x] C10 Verify OpenSpec artifacts
  - Verifies: `specs/cli-fix-scenario-labels/spec.md` / Requirement "Scenario label fix command" / Scenario "Command is idempotent"
  - Command: `openspec validate --change "add-fix-scenario-labels-command" --json`
  - Expect: change validation reports valid=true

- [x] C11 Verify targeted test suite
  - Verifies: `specs/cli-sync/spec.md` / Requirement "同步执行" / Scenario "sync 前自动处理 scenario labels"
  - Command: `pnpm test -- test/core/scenario-labels.test.ts test/commands/fix-scenario-labels.test.ts test/core/validation.test.ts test/commands/sync.test.ts test/core/templates/propose-template.test.ts test/core/templates/snack-template.test.ts test/core/templates/skill-templates-parity.test.ts test/core/artifact-graph/instruction-loader.test.ts`
  - Expect: all targeted tests pass
