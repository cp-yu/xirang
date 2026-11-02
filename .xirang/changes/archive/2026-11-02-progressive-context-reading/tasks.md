### Task 1: 收敛 Design Record 默认回执

**Goal**: 让 record 命令按职责返回轻量回执，同时保持 record payload、baseline drift 和版本冲突语义完整。

**Files**:
- Modify: `src/commands/record.ts`
- Modify: `src/core/record/workspace.ts`
- Modify: `test/commands/record-json.test.ts`
- Modify: `test/commands/record.test.ts`
- Modify: `test/integration/record-workflow.test.ts`

**Sections**:
- `elements/design-record-operations.md` / Section "提供稳定 Record JSON Contract"：list/create/rename 返回索引或操作回执；show 返回完整 payload 但排除 baseline；status/validate/update 不返回完整 document。
- `elements/design-record-operations.md` / Section "管理统一确认记录生命周期"：baseline 继续持久化并用于 drift 检查，普通返回值不暴露 baseline。
- `elements/design-record-operations.md` / Section "按部分更新记录"：update 保留差异、summary、sourceVersion 与 stale-version fail-closed 行为。

#### Checks

- [x] C1 验证 record 回执最小投影与 baseline 保持
  - Verifies: `elements/design-record-operations.md` / Section "提供稳定 Record JSON Contract"、"管理统一确认记录生命周期"、"按部分更新记录"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/record-json.test.ts test/commands/record.test.ts`
  - Expect: list/create/rename 不返回 payload 或 baseline；show 仍完整返回 design payload 但没有 baseline；status/validate/update 返回收敛结果；baseline drift 与 stale sourceVersion 门禁保持通过。

### Task 2: 实现 arch 发现投影与显式展开

**Goal**: 让模型发现命令默认导航化，并通过显式展开或 identity query 恢复完整所需语义。

**Files**:
- Modify: `src/commands/arch/`
- Modify: `test/commands/arch-search.test.ts`
- Modify: `test/commands/arch-outline.test.ts`
- Modify: `test/commands/arch-impact.test.ts`
- Modify: `test/commands/arch-query.test.ts`
- Modify: `test/commands/arch-snapshot.test.ts`
- Modify: `test/integration/arch-command.test.ts`
- Modify: `test/core/model/business-specification.test.ts`

**Sections**:
- `elements/arch-search.md` / Section "arch search SHALL 返回可解释的统一结果"：默认候选投影有限，显式 query 提供完整语义。
- `elements/arch-outline.md` / Sections "arch outline SHALL 投影完整模型结构"、"arch outline SHALL 按深度加载 Element Definition"：默认完整 hierarchy，Definitions、Relationships 与 Metamodel 显式展开。
- `elements/arch-impact.md` / Sections "arch impact SHALL 投影 canonical shortest paths"、"arch impact SHALL 共享统一输出投影"：默认局部摘要，canonical path 和完整关系子图显式展开。
- `elements/deterministic-operations.md` / Section "完整处理 Element Definition"：任何显式完整读取均不摘要、截断或改写。

#### Checks

- [x] C1 验证 arch search 候选结果默认轻量
  - Verifies: `elements/arch-search.md` / Section "arch search SHALL 返回可解释的统一结果"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/arch-search.test.ts`
  - Expect: 默认 JSON 有稳定候选身份、匹配字段和有限 evidence，不携带完整 Definition 或 Contract；limit 只截断最终排序结果。

- [x] C2 验证 outline 默认导航与显式展开
  - Verifies: `elements/arch-outline.md` / Section "arch outline SHALL 投影完整模型结构"、"arch outline SHALL 按深度加载 Element Definition"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/arch-outline.test.ts test/commands/arch-snapshot.test.ts`
  - Expect: 默认 outline 返回全部 hierarchy 且省略 Definitions、Relationships 与 Metamodel；显式选项可恢复完整对应内容；snapshot 仍返回完整 Declarations、Relationships、Metamodel 且不含 Contract。

- [x] C3 验证 impact 摘要与完整关系展开
  - Verifies: `elements/arch-impact.md` / Section "arch impact SHALL 投影 canonical shortest paths"、"arch impact SHALL 共享统一输出投影"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/arch-impact.test.ts test/integration/arch-command.test.ts`
  - Expect: 默认结果返回必要关系摘要而省略 canonical paths；显式展开返回确定性完整关系子图与最短路径，且均不包含完整 Element 语义。

- [x] C4 验证显式 query 的完整语义不变
  - Verifies: `elements/deterministic-operations.md` / Section "完整处理 Element Definition"
  - Test action: modify
  - Command: `pnpm exec vitest run test/commands/arch-query.test.ts test/commands/arch-snapshot.test.ts`
  - Expect: 显式 identity query 返回完整 Declaration，`--contract` 返回完整 Contract；输出无摘要、截断或非显式 identity 的额外语义。

### Task 3: 同步 Explore 与 Propose 渐进读取规则

**Goal**: 让 Explore、Propose、共享模板和受管生成面采用一致的上下文复用、局部补读与恢复门禁。

**Files**:
- Modify: `src/core/templates/workflows/explore.ts`
- Modify: `src/core/templates/workflows/propose.ts`
- Modify: `src/core/templates/workflows/optimizer.ts`
- Modify: `src/core/templates/fragments/xirang-fragments.ts`
- Modify: `test/core/templates/explore-template.test.ts`
- Modify: `test/core/templates/propose-template.test.ts`
- Modify: `test/core/templates/design-record-reference.test.ts`
- Modify: `test/core/templates/skill-templates-parity.test.ts`
- Modify: `.pi/skills/`
- Modify: `.pi/agents/`
- Modify: `.xirang/references/`
- Modify: `test/core/templates/apply-change.test.ts`
- Modify: `test/core/templates/fragments/xirang-fragments.test.ts`
- Modify: `test/core/templates/optimizer-template.test.ts`
- Modify: `test/core/templates/reviewer-template.test.ts`

**Sections**:
- `elements/explore.md` / Sections "识别语义影响面"、"按确认即记录使用 Design Record"：按问题渐进读取，复用有效记录版本，并在恢复门禁时重建完整依据。
- `elements/explore-role.md` / Section "按需读取并恢复当前语义"：Explore 工作身份不猜测未读取语义，按需扩展 identity 范围。
- `elements/propose.md` / Section "处理已确认设计记录"：复用 sourceVersion、局部读取，并在入口、恢复与收尾完整校验。
- `elements/propose-role.md` / Section "复用有效上下文并按需补读"：Propose 工作身份按当前任务读取并确定性恢复。
- `elements/workflow-templates.md` / Sections "统一 CLI 查询接口"、"统一加载协议与优雅降级"、"Agent 认知缺口 SHALL 触发确定性语义重载"、"以行为门禁组织形成提示词"：共享入口、生成面与恢复规则一致。

#### Checks

- [x] C1 验证 Explore 与 Propose 的渐进读取门禁
  - Verifies: `elements/explore.md` / Section "识别语义影响面"、"按确认即记录使用 Design Record"；`elements/propose.md` / Section "处理已确认设计记录"；`elements/workflow-templates.md` / Section "以行为门禁组织形成提示词"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/explore-template.test.ts test/core/templates/propose-template.test.ts test/core/templates/design-record-reference.test.ts`
  - Expect: 源模板要求入口/恢复/收尾门禁、局部 entry 读取、sourceVersion 复用、相关 drift 后恢复、完整语义不得猜测；普通讨论不重复完整读取。

- [x] C2 验证共享语义读取规则与生成面一致
  - Verifies: `elements/explore-role.md` / Section "按需读取并恢复当前语义"；`elements/propose-role.md` / Section "复用有效上下文并按需补读"；`elements/workflow-templates.md` / Section "统一 CLI 查询接口"、"统一加载协议与优雅降级"、"Agent 认知缺口 SHALL 触发确定性语义重载"
  - Test action: modify
  - Command: `pnpm exec vitest run test/core/templates/skill-templates-parity.test.ts test/core/templates/semantic-model-consistency.test.ts`
  - Expect: 共享使用方与生成 skills/references 同步；Build 等共享使用方不被误设为 Change-only，完整显式 query 和全局恢复能力仍可达。

- [x] C3 执行一次性完整回归与 CLI 投影检查
  - Verifies: `elements/deterministic-operations.md` / Section "对模型和 Change 提供结构化操作"；`elements/design-record-operations.md` / Section "提供稳定 Record JSON Contract"；`elements/workflow-templates.md` / Section "以行为门禁组织形成提示词"
  - Test action: one-time
  - Command: `pnpm build && pnpm test && pnpm lint`
  - Evidence: `pnpm build` passed; `pnpm test` passed (163 files / 2391 tests); `pnpm lint` passed. Focused record/status and shared-context tests passed (2 files / 39 tests); after the final recovery-gate predicate changes, the two owning template files passed again (2 files / 36 tests), and the full test/lint suite passed (163 files / 2391 tests). Representative CLI outputs parsed as valid complete JSON: search 4,159 B; default/expanded outline 33,291/49,669 B; default/`--paths` impact 2,510/10,055 B; query/`--contract` 716/7,296 B. Search excerpt text is capped at 160 source characters plus edge ellipses. Windows runner execution is excluded from this Change's completion gate by user direction; the existing Windows workflow was not altered.
  - Expect: build、测试与 lint 通过；默认投影未因超范围输出而截断，显式展开恢复所需完整信息；不以固定 token 节省阈值作为通过条件。

## Required Corrections

- **RESOLVED** Task 3 C3: User excluded Windows runner execution from this Change's completion gate. Linux build/test/lint and representative CLI projection checks passed; the existing Windows workflow remains unchanged.
- **RESOLVED** Task 2 C2: Outline Declaration identity/content are unchanged; navigation-first behavior is specified as Section changes only, consistent with Architecture Source declaring no structural changes. The obsolete host frontmatter edit was removed.
- **RESOLVED** Task 2 C3: The target Arch Impact Contract now separates internal depth-bounded traversal from default identity/summary output and explicit `--paths` relationship records.
- **RESOLVED** Task 3 C1: Design Record reference tests cover required command routes, selective entries, sourceVersion reuse, recovery event tokens, post-update diff/summary, and ordinary-discussion repetition boundaries without asserting full prose sentences.
- **RESOLVED** Task 3 C2: `src/core/templates/workflows/optimizer.ts` is declared in Task 3 Files; its generated self-read reference and focused test cover explicit `--paths` relationship expansion.
- **RESOLVED** Task 1 C1: `record status` now returns `summary: summarizeRecord(payload)` while tests assert the summary and continue to reject `document` and `baseline` from status/validate results.
- **RESOLVED** Task 3 C1: shared-context tests assert the five bounded-reading safeguards (question-before-expansion, symbol/test-owner-first minimal reads, bounded independent concurrency, nested-output limits, and truncation recovery) without locking full prose.
- **RESOLVED** Task 3 C1: Explore/Propose tests verify CLI routes/order without exact explanatory prose; their shared-context predicate normalizes Markdown whitespace and exercises equivalent wording, negated safeguards, and required recovery/reuse decisions against the actual instructions.
