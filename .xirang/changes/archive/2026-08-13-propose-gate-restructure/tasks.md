### Task 1: CLI 确定性校验下沉

**Goal**: 将任务计划结构校验接入 `xirang validate --change` 门禁，并新增文件冲突与依赖顺序两项检测。

**Files**:
- Modify: `src/core/parsers/task-structure.ts`
- Modify: `src/commands/validate.ts`
- Test: `test/core/parsers/task-structure.test.ts`
- Test: `test/commands/validate.test.ts`

**Requirements**:
- 多个 task 对同一路径声明互斥的 Create、Modify 或 Delete 时标记报错
- Task N 的 Files 声明 Modify 或 Delete 后序 Task M 声明 Create 的路径时标记依赖顺序报错
- `xirang validate --change --json` 输出包含任务结构报错
- 报错包含文件路径与结构位置
- 端到端验证使用含冲突 tasks.md 的 fixture change，验证后删除 fixture

#### Checks

- [x] C1 验证文件冲突检测
  - Verifies: `elements/validation-commands.md` / Requirement "任务计划文件冲突检测" / Scenario "检测到互斥文件声明"
  - Command: `pnpm vitest run test/core/parsers/task-structure.test.ts`
  - Expect: 文件冲突检测测试先 RED 后 GREEN

- [x] C2 验证依赖顺序检测
  - Verifies: `elements/validation-commands.md` / Requirement "任务依赖顺序检测" / Scenario "检测到前序 task 依赖后序 task 产出"
  - Command: `pnpm vitest run test/core/parsers/task-structure.test.ts`
  - Expect: 依赖顺序检测测试先 RED 后 GREEN

- [x] C3 验证 validate 门禁接线
  - Verifies: `elements/validation-commands.md` / Requirement "任务计划文件冲突检测" / Scenario "检测到互斥文件声明"
  - Command: `pnpm build && node bin/xirang.js validate --change "<fixture>" --json`
  - Expect: 输出包含任务结构报错条目且带文件路径定位

- [x] C4 验证锚点匹配
  - Verifies: `elements/validation-commands.md` / Requirement "Check 锚点与 Scenario 标题匹配" / Scenario "检测到锚点不匹配"
  - Command: `pnpm vitest run test/core/parsers/task-structure.test.ts`
  - Expect: 锚点缺失/不匹配检测与标题含 Scenario 一词的解析测试通过

### Task 2: apply 流程移除 Pre-flight

**Goal**: 从 apply 流程删除 Pre-flight 步骤，后续步骤连续编号并同步 references 重命名。

**Files**:
- Delete: `.xirang/references/xirang-apply-step-2-preflight-scan.md`
- Delete: `.xirang/references/xirang-apply-step-3-branch-isolation.md`
- Create: `.xirang/references/xirang-apply-step-2-branch-isolation.md`
- Delete: `.xirang/references/xirang-apply-step-3-worktree-isolation.md`
- Create: `.xirang/references/xirang-apply-step-2-worktree-isolation.md`
- Delete: `.xirang/references/xirang-apply-step-3-current-branch.md`
- Create: `.xirang/references/xirang-apply-step-2-current-branch.md`
- Delete: `.xirang/references/xirang-apply-step-4-phase1-verification.md`
- Create: `.xirang/references/xirang-apply-step-3-phase1-verification.md`
- Delete: `.xirang/references/xirang-apply-step-5-phase2-optimization.md`
- Create: `.xirang/references/xirang-apply-step-4-phase2-optimization.md`
- Delete: `.xirang/references/xirang-apply-step-6-phase3-seal.md`
- Create: `.xirang/references/xirang-apply-step-5-phase3-seal.md`
- Delete: `.xirang/references/xirang-apply-step-7-output.md`
- Create: `.xirang/references/xirang-apply-step-6-output.md`
- Modify: `src/core/templates/workflows/apply-change.ts`
- Modify: `.xirang/references/xirang-apply-step-1-preparation.md`
- Create: `.xirang/changes/propose-gate-restructure/elements/task-decomposition.md`
- Test: `test/core/templates/apply-change.test.ts`
- Test: `test/core/workflow-installation.test.ts`

**Requirements**:
- 流程模板移除 Pre-flight 步骤，步骤 1–6 连续编号
- Step 1 中指向 Step 3 的交叉引用更新为 Step 2
- references 与生成面不残留 Pre-flight 引用

#### Checks

- [x] C1 验证 apply 流程无 Pre-flight
  - Verifies: `elements/post-propose-validation.md` / Requirement "计划一致性复核" / Scenario "复核不再由 Apply 承担"
  - Command: `grep -rn "Pre-flight\|preflight" src/core/templates/workflows/apply-change.ts || true`
  - Expect: 无匹配输出

- [x] C2 验证步骤重排与 references 一致
  - Verifies: `elements/post-propose-validation.md` / Requirement "计划一致性复核" / Scenario "复核不再由 Apply 承担"
  - Command: `pnpm vitest run test/core/templates/apply-change.test.ts`
  - Expect: 模板测试通过且 references 目录无步骤编号缺口

### Task 3: propose 流程加入一致性验证门禁

**Goal**: propose 流程在收尾加入计划一致性复核与确定性校验门禁，语义矛盾自行修正、仅意图不对齐时询问。

**Files**:
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Test: `test/core/templates/propose-template.test.ts`

**Requirements**:
- 流程在 combined validation 前执行计划一致性复核，矛盾自行修正，仅意图不对齐时呈现给用户
- 确定性校验作为最终制品上的收尾门禁，报错阻塞 Apply 就绪声明
- propose 模板测试断言收尾门禁指引存在

#### Checks

- [x] C1 验证语义复核指引
  - Verifies: `elements/post-propose-validation.md` / Requirement "计划一致性复核" / Scenario "检测到矛盾时自行修正"
  - Command: `pnpm vitest run test/core/templates/propose-template.test.ts`
  - Expect: 模板测试通过且生成文本包含计划一致性复核与自行修正指引

- [x] C2 验证收尾确定性门禁
  - Verifies: `elements/post-propose-validation.md` / Requirement "收尾确定性校验门禁" / Scenario "报错阻塞 Apply 就绪声明"
  - Command: `pnpm vitest run test/core/templates/propose-template.test.ts`
  - Expect: 收尾门禁以确定性校验为最终步骤的断言先 RED 后 GREEN

### Task 4: 术语统一为制品定义先行写作

**Goal**: 消除 `definition-first authoring` 术语歧义，src 模板与生成面统一使用制品定义先行写作。

**Files**:
- Modify: `src/core/artifact-graph/instruction-loader.ts`
- Modify: `.pi/skills/`
- Test: `test/core/templates/skill-templates-parity.test.ts`

**Requirements**:
- src 模板与注释中的 definition-first 术语替换为制品定义先行写作
- 生成面 skills 不残留 definition-first 术语
- `.xirang/changes/` 内 REMOVED 引用与待 Sync 的 formal source 不在扫描范围
- 再生成 `.pi/skills/` 并同步更新 parity 测试中所有受 Task 2/3 影响的生成哈希
- 生成面验证覆盖 Task 2/3 的模板变更：apply skill 无 Pre-flight、propose skill 含门禁指引

#### Checks

- [x] C1 验证 src 术语替换
  - Verifies: `elements/change-artifacts.md` / Requirement "制品定义先行写作" / Scenario "文本输出按制品定义先行顺序展示"
  - Command: `grep -rn "definition-first" src/ || true`
  - Expect: 无匹配输出

- [x] C2 验证生成面术语一致
  - Verifies: `elements/workflow-templates.md` / Requirement "Workflow Skills 声明 Internal Subagents 约束" / Scenario "Apply skill 的 instructions 结构"
  - Command: `grep -rn "definition-first" .pi/skills/ .xirang/references/ || true`
  - Expect: 无匹配输出

- [x] C3 验证生成面覆盖模板变更
  - Verifies: `elements/post-propose-validation.md` / Requirement "收尾确定性校验门禁" / Scenario "报错阻塞 Apply 就绪声明"
  - Command: `pnpm vitest run test/core/templates/skill-templates-parity.test.ts && grep -rn "一致性验证门禁\|计划一致性复核" .pi/skills/xirang-propose/SKILL.md | head -5`
  - Expect: parity 测试通过且 propose skill 含门禁指引

- [x] C4 验证 apply skill 无 Pre-flight
  - Verifies: `elements/post-propose-validation.md` / Requirement "计划一致性复核" / Scenario "复核不再由 Apply 承担"
  - Command: `grep -rn "Pre-flight\|preflight" .pi/skills/xirang-apply-change/ || true`
  - Expect: 无匹配输出
