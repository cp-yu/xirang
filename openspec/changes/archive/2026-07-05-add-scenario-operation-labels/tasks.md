### Task 1: Scenario label normalizer

**Goal**: 添加 scenario operation labels 的共享解析与 sync-normalization 函数。

**Files**:
- Modify: `src/core/parsers/requirement-blocks.ts`
- Test: `test/core/parsers/requirement-blocks.test.ts`

**Requirements**:
- 仅支持 `#### Scenario: [ADDED|MODIFIED|REMOVED] <title>`。
- 清洗 `[ADDED]` 和 `[MODIFIED]` labels，不改变 scenario body。
- sync normalization 时整体省略 `[REMOVED]` scenario block。
- unlabeled scenario 和 body 中包含类似 label 的文本保持不变。

#### Checks

- [x] C1 校验 scenario label normalization 正确
  - Verifies: `specs/specs-sync-skill/spec.md` / Requirement "Delta Reconciliation Logic" / Scenario "MODIFIED requirements"
  - Command: `pnpm test -- test/core/parsers/requirement-blocks.test.ts`
  - Expect: parser 测试覆盖 strip、omit、unchanged 和 body-text 情况。

### Task 2: Sync 与幂等性集成

**Goal**: 确保 sync/archive 写入干净的 formal specs，且重复 sync 使用 normalized 内容比较。

**Files**:
- Modify: `src/core/specs-apply.ts`
- Modify: `src/core/change-sync.ts`
- Test: `test/core/specs-apply.test.ts`
- Test: `test/commands/sync.test.ts`

**Requirements**:
- 写入 formal specs 前对 ADDED 和 MODIFIED requirement blocks 做 normalization。
- `isDeltaSpecAlreadyApplied()` 比较使用同一 normalization。
- 保留已有 requirement-level operation 顺序和 removal-only 行为。
- 不将 scenario operation labels 写入 `openspec/specs/**/spec.md`。

#### Checks

- [x] C2 校验 sync 清洗并省略 scenario labels
  - Verifies: `specs/cli-sync/spec.md` / Requirement "Sync-created specs SHALL use runtime projection" / Scenario "Scenario operation labels 不进入 formal specs"
  - Command: `pnpm test -- test/core/specs-apply.test.ts test/commands/sync.test.ts`
  - Expect: sync 测试验证 `[ADDED]` 和 `[MODIFIED]` labels 被清洗，`[REMOVED]` scenario block 被省略。

- [x] C3 校验重复 sync 保持幂等
  - Verifies: `specs/cli-sync/spec.md` / Requirement "幂等性" / Scenario "重复执行产生相同结果"
  - Command: `pnpm test -- test/core/specs-apply.test.ts test/commands/sync.test.ts`
  - Expect: 重复 sync 不报告 pending 或不重新创建被省略的 scenario blocks。

### Task 3: Validation 与 task 引用语义

**Goal**: 对 change specs 中的 scenario operation labels 进行校验，拒绝 formal specs 中的 labels，并通过 clean scenario title 匹配 task 引用。

**Files**:
- Modify: `src/core/validation/validator.ts`
- Modify: `src/core/parsers/task-structure.ts`
- Test: `test/core/validation.test.ts`
- Test: `test/core/validation.cross-check.test.ts`
- Test: `test/core/parsers/task-structure.test.ts`

**Requirements**:
- Change validation 接受已知 labels，拒绝未知或非法 labels。
- `[REMOVED]` scenario 仅允许在 `## MODIFIED Requirements` 下出现。
- ADDED 和 MODIFIED requirement 必须至少有一个 surviving scenario。
- Formal spec validation 拒绝所有 scenario operation labels。
- Task `Verifies:` 使用 label-free scenario title 匹配。

#### Checks

- [x] C4 校验 change-local label validation
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Scenario operation label 校验" / Scenario "合法 scenario labels 通过 change validation"
  - Command: `pnpm test -- test/core/validation.test.ts test/core/validation.cross-check.test.ts`
  - Expect: 合法 labels 通过；未知/非法 labels 失败；`[REMOVED]` 位置非法失败；surviving scenario count 被强制执行。

- [x] C5 校验 formal specs 拒绝 labels
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Formal spec scenario label 清洁度" / Scenario "Formal spec 含 ADDED label 报错"
  - Command: `pnpm test -- test/core/validation.test.ts`
  - Expect: formal specs 包含 `[ADDED]`、`[MODIFIED]` 或 `[REMOVED]` scenario headings 时 validation 失败。

- [x] C6 校验 task 引用使用 clean scenario title
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Task Verifies scenario label 归一化" / Scenario "Verifies 通过 clean title 匹配 labeled scenario"
  - Command: `pnpm test -- test/core/parsers/task-structure.test.ts`
  - Expect: `Verifies:` 匹配 labeled change-local scenarios 时不含 label 文本。

### Task 4: Workflow guidance 与 generated-surface 检查

**Goal**: 教会 propose/snack/spec instructions 何时输出 scenario operation labels，并保持 labels 为 change-local。

**Files**:
- Modify: `schemas/spec-driven/schema.yaml`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/snack.ts`
- Modify: `src/core/templates/fragments/opsx-fragments.ts`
- Test: `test/core/templates/propose-template.test.ts`
- Test: `test/core/templates/snack-template.test.ts`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`

**Requirements**:
- 在 specs instructions 中记录唯一合法 label 语法。
- 指示 agents 仅标记受影响的 scenarios，unchanged scenarios 保持 unlabeled。
- 说明 labels 是 change-local metadata，formal specs 不得包含。
- 保持 post-propose validation 与下游 change validation 一致。

#### Checks

- [x] C7 校验 propose 和 specs instructions 提及 label 边界
  - Verifies: `specs/propose-workflow/spec.md` / Requirement "Propose applies spec content boundary" / Scenario "Scenario labels 保持 change-local"
  - Command: `pnpm test -- test/core/templates/propose-template.test.ts test/core/artifact-graph/instruction-loader.test.ts`
  - Expect: 生成的 instructions 包含 exact label 语法和 change-local-only 边界。

- [x] C8 校验 snack 输出 scenario label guidance
  - Verifies: `specs/snack-skill/spec.md` / Requirement "Specs 中层推断生成" / Scenario "生成前读取 specs 模板"
  - Command: `pnpm test -- test/core/templates/snack-template.test.ts`
  - Expect: snack instructions 告知 agents 何时使用 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` scenario headings。

- [x] C9 校验当前 formal specs 不含 scenario labels
  - Verifies: `specs/cli-validate/spec.md` / Requirement "Formal spec scenario label 清洁度" / Scenario "Clean formal scenario 通过清洁度校验"
  - Command: `! rg --line-number 'Scenario: \[(ADDED|MODIFIED|REMOVED)\]' openspec/specs`
  - Expect: 一次性仓库检查确认 formal specs 中不存在 scenario operation labels。
