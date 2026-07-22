### Task 1: 建立 versioned Metamodel 与通用 element reader

**Goal**: 扩展项目内 `opsx-likec4` 与 OPSX reader，使其读取 versioned Metamodel、任意 element kinds、稳定 identity 和任意深度 refinement hierarchy。

**Files**:
- Modify: `likec4/packages/language-server/src/`
- Modify: `likec4/packages/core/src/`
- Create: `src/utils/semantic-model.ts`
- Modify: `src/utils/likec4-parser.ts`
- Modify: `src/utils/likec4-reader.ts`
- Modify: `src/utils/architecture-reader.ts`
- Modify: `src/utils/architecture-validator.ts`
- Modify: `src/cli/index.ts`
- Delete: `src/commands/opsx.ts`
- Modify: `src/utils/semantic-checks/`
- Test: `likec4/packages/language-server/src/__tests__/`
- Delete: `test/commands/opsx.test.ts`
- Test: `test/unit/utils/likec4-reader.test.ts`
- Test: `test/unit/utils/architecture-validator.test.ts`
- Test: `test/integration/arch-command.test.ts`

**Requirements**:
- 增加显式 language version 与最小 `opsx` Metamodel annotation parsing，未声明 version 时保持 legacy read path。
- 使用 LikeC4 model API 枚举任意 kind 与完整 nesting，移除 domain/capability regex 作为新版 source parser。
- 对新版 elements 强制唯一 `elementId`、非空 summary、唯一 Project Root、single-parent 与 acyclic containment。
- 默认开放 nesting，并仅执行 Metamodel 显式声明的 parent/child constraints。
- 保持 Agent 直接消费持久化 files 的产品语义，不引入公开或持久化 IR。

#### Checks

- [x] C1 验证 Metamodel 与默认开放 nesting
  - Verifies: `specs/opsx-semantic-model/spec.md` / Requirement "Metamodel SHALL 定义可编译 element vocabulary" / Scenario "默认开放 nesting" / Scenario "显式 constraint 生效"
  - Command: `pnpm --dir likec4 exec vitest run packages/language-server/src/__tests__/specification.spec.ts packages/language-server/src/__tests__/model.spec.ts && pnpm exec vitest run test/unit/utils/likec4-reader.test.ts`
  - Expect: versioned annotations、自定义 kinds 与任意深度 nesting tests 通过

- [x] C2 验证 Project Root、stable identity 与 containment
  - Verifies: `specs/opsx-semantic-model/spec.md` / Requirement "Project Root SHALL 是唯一最高抽象" / Scenario "唯一 Project Root" / Scenario "Root 缺失或重复"
  - Verifies: `specs/opsx-semantic-model/spec.md` / Requirement "Element identity SHALL 与 containment path 分离" / Scenario "Element 移动保持 identity" / Scenario "重复 elementId 被拒绝"
  - Verifies: `specs/opsx-semantic-model/spec.md` / Requirement "Containment SHALL 表达 abstraction refinement" / Scenario "多层 refinement 合法"
  - Command: `pnpm exec vitest run test/unit/utils/architecture-validator.test.ts test/integration/arch-command.test.ts`
  - Expect: root、identity、move 与 cycle regression tests 通过

- [x] C3 验证 legacy 与 v1 version boundary
  - Verifies: `specs/opsx-semantic-model/spec.md` / Requirement "Language version SHALL 控制 dialect 演进" / Scenario "新版 source 选择 v1 semantics" / Scenario "Legacy source 保持可读"
  - Command: `pnpm exec vitest run test/unit/utils/likec4-reader.test.ts test/integration/validate-command.test.ts`
  - Expect: legacy fixtures 继续可读，v1 fixtures 使用新版 validator 且无 silent rewrite

### Task 2: 建立 singular Spec binding 与 contract completeness

**Goal**: 将 Spec ownership 收敛为 frontmatter singular `element`，并以一个派生 registry 驱动 list、validation 和 contractPolicy checks。

**Files**:
- Modify: `src/core/parsers/spec-frontmatter.ts`
- Modify: `src/core/spec-registry.ts`
- Modify: `src/core/list.ts`
- Modify: `src/core/validation/validator.ts`
- Modify: `src/core/backfill-specs.ts`
- Modify: `src/core/specs-apply.ts`
- Test: `test/core/parsers/spec-frontmatter.test.ts`
- Test: `test/core/spec-registry.test.ts`
- Test: `test/core/list.test.ts`
- Test: `test/core/validation.cross-check.test.ts`
- Test: `test/core/specs-apply.test.ts`

**Requirements**:
- Parser 返回 `{ element: string | null }` 并对 malformed YAML、array owner 与 legacy ownership syntax 提供可诊断结果。
- Registry 提供 `elementToSpecs`、`specToElement`、orphan 和 uncovered-required-element queries。
- `opsx list --specs --json` 输出 singular `element` 或 null，移除 capabilities projection。
- Validator 联合 Target Semantic Model 检查 owner existence、one-owner cardinality 和 required/optional contractPolicy。
- 所有 Spec paths 使用 Node.js path API，并在 POSIX 与 Windows 下保持同一 Spec ID projection。

#### Checks

- [x] C4 验证 frontmatter 与 one-to-many registry
  - Verifies: `specs/spec-frontmatter/spec.md` / Requirement "解析 spec 文件的 YAML frontmatter" / Scenario "正常 frontmatter 解析" / Scenario "多 owner 字段被拒绝" / Scenario "畸形 YAML"
  - Verifies: `specs/spec-registry/spec.md` / Requirement "运行时构建 cap↔spec 双向映射" / Scenario "构建 one-to-many mapping" / Scenario "Spec 缺失 binding"
  - Command: `pnpm exec vitest run test/core/parsers/spec-frontmatter.test.ts test/core/spec-registry.test.ts`
  - Expect: 一个 element 可拥有多个 Specs，每个 Spec 只有一个 owner，malformed input 不被静默吞掉

- [x] C5 验证 list projection 与 contract completeness
  - Verifies: `specs/cli-list/spec.md` / Requirement "JSON output format for specs" / Scenario "JSON output includes element and requirements" / Scenario "Missing fields use deterministic empty values"
  - Verifies: `specs/validate-spec-section-type-cross-check/spec.md` / Requirement "缺失 frontmatter 的 warning" / Scenario "Required element coverage" / Scenario "Optional element coverage"
  - Command: `pnpm exec vitest run test/core/list.test.ts test/core/validation.cross-check.test.ts`
  - Expect: JSON 不再包含 capabilities，required gaps 为 ERROR，optional no-Spec 合法

- [x] C6 验证跨平台 Spec 扫描
  - Verifies: `specs/spec-registry/spec.md` / Requirement "Registry 扫描使用跨平台路径" / Scenario "Windows 路径处理"
  - Command: `pnpm exec vitest run test/core/spec-registry.test.ts test/core/parsers/spec-frontmatter.test.ts`
  - Evidence: Windows path fixtures 与 POSIX fixtures 产生相同 mappings

### Task 3: 统一 element query 与 contract browser

**Goal**: 让 CLI 与 Web browser 使用 stable `elementId`、Refinement Overview 和派生 Spec registry 呈现同一个 OPSX Semantic Model。

**Files**:
- Modify: `src/commands/arch/query.ts`
- Modify: `src/core/view.ts`
- Modify: `likec4/packages/likec4/src/`
- Modify: `likec4/packages/likec4-spa/src/`
- Modify: `likec4/packages/diagram/src/`
- Modify: `likec4/packages/vite-plugin/src/opsx/opsx-spec-handler.ts`
- Modify: `likec4/packages/vite-plugin/src/plugin.ts`
- Modify: `test/fixtures/spec-browser/.opsx/architecture/model.c4`
- Modify: `test/fixtures/spec-browser/.opsx/specs/`
- Test: `test/integration/arch-command.test.ts`
- Test: `test/core/view.test.ts`
- Test: `test/e2e/spec-browser.spec.ts`
- Test: `test/cli-e2e/opsx-query.test.ts`
- Test: `likec4/packages/likec4-spa/src/`
- Test: `likec4/packages/vite-plugin/src/opsx/opsx-spec-handler.spec.ts`

**Requirements**:
- `opsx arch query` 接受 stable elementId 或 FQN，并 canonicalize output 为 elementId。
- Query 返回 parent、children、depth、summary、Refinement Overview、owned Specs 与 semantic relationships。
- Browser 通过 elementId 与 registry 授权 Spec，不再读取 `metadata.specs`。
- 多 Specs 按 Spec ID 确定性排序，切换 element 时清理旧异步 state。
- 保留现有 realpath containment、Markdown sanitization、responsive UI 与 on-demand loading。

#### Checks

- [x] C7 验证 query identity 与 refinement output
  - Verifies: `specs/arch-query-command/spec.md` / Requirement "arch query 命令 SHALL 查询 LikeC4 element 详情" / Scenario "通过稳定 elementId 查询" / Scenario "通过 FQN 查询"
  - Verifies: `specs/arch-query-command/spec.md` / Requirement "arch query SHALL 支持 --depth 选项" / Scenario "深度查询包含 refinement" / Scenario "Element 移动后仍可查询"
  - Command: `pnpm exec vitest run test/integration/arch-command.test.ts`
  - Expect: query 输出 canonical elementId，并保留当前 FQN 与 deterministic hierarchy

- [x] C8 验证 registry-backed Spec browser
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "条件式 Specs 标签页显示" / Scenario "Element 有 Specs" / Scenario "Element 无 Spec binding"
  - Verifies: `specs/spec-content-browser/spec.md` / Requirement "按需安全读取 Spec 文件" / Scenario "Registry 授权校验" / Scenario "路径安全"
  - Command: `pnpm run likec4:build && pnpm run build && pnpm run test:e2e`
  - Expect: desktop/mobile browser 只展示 registry 授权 Specs，unsafe paths 被拒绝且元素切换无 stale content

### Task 4: 原子 reconcile Semantic Delta

**Goal**: 将 graph delta 与 contract deltas 联合 prepare、validate、commit 或 rollback，同时保持现有 sync/archive stages。

**Files**:
- Modify: `src/validation/architecture-delta-validator.ts`
- Modify: `src/utils/architecture-delta-merger.ts`
- Modify: `src/core/change-sync.ts`
- Modify: `src/commands/sync.ts`
- Modify: `src/core/archive.ts`
- Modify: `src/commands/validate.ts`
- Test: `test/unit/utils/architecture-delta-merger.test.ts`
- Test: `test/integration/sync-workflow.test.ts`
- Test: `test/commands/sync.test.ts`
- Test: `test/core/archive.test.ts`
- Test: `test/integration/archive-workflow.test.ts`

**Requirements**:
- Graph delta 支持 versioned generic elements、Metamodel annotations、stable identities 与 semantic relationships。
- Combined validation 在 formal graph 加 change-local graph/Specs 上检查 bindings 与 contracts。
- Sync 只根据实际 graph/contract operations 判断 pending state，不用空 delta 文件表示 no-op。
- Prepared sync 在 temporary workspace 写入并验证完整目标文件树，随后原子提交。
- 任一 failure 回滚 graph 与 Specs；archive 只封存已 sync delta，不修改 formal semantics。

#### Checks

- [x] C9 验证 generic graph delta 与 combined validation
  - Verifies: `specs/architecture-delta-artifact/spec.md` / Requirement "Delta 文件 SHALL 使用 LikeC4 extend 语法" / Scenario "扩展任意 existing element" / Scenario "添加 semantic relationship"
  - Verifies: `specs/architecture-delta-artifact/spec.md` / Requirement "Delta 验证 SHALL 检查 extend 目标存在" / Scenario "Spec target 只存在于同一 delta"
  - Command: `pnpm exec vitest run test/unit/utils/architecture-delta-merger.test.ts test/integration/validate-command.test.ts`
  - Expect: target-only element binding 合法，missing targets 和 invalid constraints 失败

- [x] C10 验证原子 sync 与 rollback
  - Verifies: `specs/cli-sync/spec.md` / Requirement "Semantic Delta SHALL 原子提升" / Scenario "Graph 与 contract 联合成功" / Scenario "Contract failure 回滚 graph" / Scenario "Windows 原子 sync"
  - Verifies: `specs/archive-sync-workflow/spec.md` / Requirement "sync SHALL 合并 architecture-delta.c4" / Scenario "合并失败回滚"
  - Command: `pnpm exec vitest run test/integration/sync-workflow.test.ts test/commands/sync.test.ts test/core/archive.test.ts test/integration/archive-workflow.test.ts`
  - Expect: success 同时更新 modules，任何 prepared/write failure 保持 formal tree byte-equivalent

### Task 5: 更新 init、bootstrap 与显式 migration

**Goal**: 新项目生成 v1 Semantic Model skeleton，brownfield bootstrap 和 legacy migration 生成可审阅 candidate，不猜测 element/Spec bindings。

**Files**:
- Modify: `src/core/init.ts`
- Modify: `src/core/templates/architecture-skeleton.ts`
- Modify: `src/core/templates/workflows/bootstrap-arch.ts`
- Modify: `src/utils/bootstrap-utils.ts`
- Modify: `src/commands/bootstrap.ts`
- Modify: `src/core/relations/renderers.ts`
- Modify: `schemas/bootstrap/schema.yaml`
- Modify: `schemas/bootstrap/templates/`
- Create: `src/migration/semantic-model-migrator.ts`
- Modify: `src/migration/generators/`
- Modify: `src/migration/converters/`
- Modify: `src/commands/migrate/`
- Test: `test/core/init.test.ts`
- Test: `test/core/templates/bootstrap-arch.test.ts`
- Test: `test/utils/bootstrap-utils.test.ts`
- Test: `test/utils/bootstrap-utils.pbt.contract.test.ts`
- Test: `test/commands/bootstrap.test.ts`
- Test: `test/cli-e2e/`
- Test: `test/core/artifact-graph/instruction-loader.test.ts`
- Test: `test/core/relations/renderers.test.ts`
- Test: `test/integration/migrate-command.test.ts`
- Test: `test/unit/migration/`

**Requirements**:
- Init 使用显式生成文件清单创建 Project Root、versioned Metamodel、relations、views 与 Specs directory。
- Bootstrap candidate 使用 arbitrary-depth refinement 和 singular element bindings，ambiguity 形成 review gap。
- Migrator 只转换唯一 legacy mappings，并输出 source/target version、resolved mappings 与 gaps。
- Promotion 要求无 gaps、完整 validation 与 human authorization，并原子写入。
- 当前仓库 self-model migration 不在本 task 中执行，也不使用 catch-all owner。

#### Checks

- [x] C11 验证新版 init 与 bootstrap candidate
  - Verifies: `specs/init-project-structure/spec.md` / Requirement "init SHALL 生成 LikeC4 架构目录" / Scenario "初始化 Semantic Model 结构" / Scenario "Project Root 模板内容" / Scenario "跨平台路径处理"
  - Verifies: `specs/opsx-bootstrap-architecture/spec.md` / Requirement "Bootstrap SHALL 输出 LikeC4 候选模型" / Scenario "候选模型表达 refinement" / Scenario "Spec binding 必须唯一"
  - Command: `pnpm exec vitest run test/core/init.test.ts test/core/templates/bootstrap-arch.test.ts test/utils/bootstrap-utils.test.ts`
  - Expect: generated files 由显式清单跟踪，v1 skeleton 有唯一 root，ambiguous binding 阻塞 promotion

- [x] C12 验证显式 migration 与 review gaps
  - Verifies: `specs/semantic-model-migration/spec.md` / Requirement "Migration SHALL 只接受确定的 identity 与 binding" / Scenario "唯一 mapping 自动迁移" / Scenario "多 owner 或 orphan 形成 review gap"
  - Verifies: `specs/semantic-model-migration/spec.md` / Requirement "Migration promotion SHALL 由完整验证和 human authorization 门禁" / Scenario "未解决 gap 阻塞 promotion" / Scenario "授权后原子 promotion"
  - Command: `pnpm exec vitest run test/integration/migrate-command.test.ts test/unit/migration/`
  - Expect: deterministic candidate 可 promotion，ambiguous fixtures 不修改 formal model

### Task 6: 统一 Agent workflows、references、docs 与跨平台质量门禁

**Goal**: 让全部生成 surfaces 使用 OPSX Semantic Model canonical terminology，并完成 root、vendored LikeC4、browser 与 Windows CI 验证。

**Files**:
- Modify: `src/core/templates/fragments/opsx-fragments.ts`
- Modify: `src/core/templates/workflows/`
- Modify: `src/commands/help.ts`
- Modify: `src/core/relations/renderers.ts`
- Create: `src/core/relations/active-registry.ts`
- Modify: `.opsx/references/likec4-authoring.md`
- Modify: `docs/`
- Modify: `README.md`
- Modify: `.github/workflows/test-windows.yml`
- Modify: `.opsx/references/`
- Modify: `.opsx/references/opsx-relation-authoring.md`
- Modify: `.pi/skills/`
- Modify: `.pi/agents/`
- Test: `test/core/templates/`
- Test: `test/core/relations/registry.test.ts`
- Test: `test/core/relations/renderers.test.ts`
- Test: `test/commands/help.test.ts`
- Test: `test/skills/`
- Test: `test/e2e/spec-browser.spec.ts`

**Requirements**:
- 所有 workflow/shared fragments 使用唯一 OPSX Semantic Model、Project Root、elementId、refinement、Element Contract 与 Semantic Delta 术语。
- Explore/Propose/Apply/Snack/Reviewer/Optimizer 保持现有 stage 和 authorization boundaries。
- Generated guidance 不再要求 `capabilityId`、`metadata.specs`、`capabilities: []` 或 nesting-as-ownership。
- Docs 说明 Agent 直接消费持久化 model files，不宣称真实 compiler process 或持久化 IR。
- Windows CI 覆盖 path-sensitive registry、migration、sync 与 browser server tests。

#### Checks

- [x] C13 验证 generated workflow 一致性
  - Verifies: `specs/compilation-philosophy-fragment/spec.md` / Requirement "OPSX Philosophy 片段定义" / Scenario "片段定义统一 OPSX Semantic Model" / Scenario "片段定义 completeness 与 Agent compiler 类比"
  - Verifies: `specs/opsx-shared-context/spec.md` / Requirement "Fragment 一致性" / Scenario "Templates 使用同一 fragment"
  - Verifies: `specs/opsx-impact-sweeper-architecture/spec.md` / Requirement "Impact sweeper SHALL 使用 LikeC4 导航架构" / Scenario "报告使用 stable elementIds"
  - Command: `pnpm exec vitest run test/core/templates/ test/skills/`
  - Expect: generated surfaces 使用同一 canonical vocabulary，旧双源和 ownership guidance 无 active matches

- [x] C14 验证全项目 build、tests 与 Windows workflow
  - Verifies: `specs/spec-registry/spec.md` / Requirement "Registry 扫描使用跨平台路径" / Scenario "Windows 路径处理"
  - Verifies: `specs/semantic-model-migration/spec.md` / Requirement "Migration paths SHALL 跨平台且可审计" / Scenario "Windows candidate path"
  - Command: `pnpm run lint && pnpm run likec4:typecheck && pnpm run likec4:test && pnpm run likec4:build && pnpm run build && pnpm test && pnpm run test:e2e`
  - Evidence: `.github/workflows/test-windows.yml` 运行 path-sensitive focused tests 与 root build/test gate
  - Expect: POSIX 与 Windows gates 全部通过，未执行当前仓库 self-model 的自动 migration

## Remediation

- [x] [code_fix] CRITICAL Relation 全图语义验证：v1 validation 未拒绝 duplicate relation、self-loop 与 persisted `belongs_to` / `refines` / `abstracts`。
  - Next: 实现共享 relation validator，并覆盖 formal、delta、migration candidate 与 sync target regression tests。
- [x] [code_fix] CRITICAL Bootstrap SHALL 输出 LikeC4 候选模型：bootstrap candidate 仍固定为 domain/capability 两层与对应 ID schema。
  - Next: 将 bootstrap evidence、parent mapping 与 candidate renderer 泛化为 project-defined arbitrary-depth element kinds，并增加多层非 domain/capability promotion fixture。
- [x] [code_fix] CRITICAL Migration promotion SHALL 由完整验证和 human authorization 门禁：migration 将 unresolved contract policies 默认为 optional，且未检查 required-contract completeness。
  - Next: 保留或显式报告 contractPolicy review gaps，生成 required Project Contract，并在 promotion 前运行完整 target validation。
- [x] [code_fix] CRITICAL OPSX v2 文件模型：legacy YAML 仍可通过 active runtime navigation fallback 与 `opsx query` registration 访问。
  - Next: 移除 runtime YAML fallback 与 legacy query registration，或将其收敛为显式 migration-only compatibility surface。
- [x] [artifact_fix] CRITICAL OPSX Philosophy 片段定义：checked-in generated skills/agents 仍包含 retired dual-source 与 capability metadata guidance。
  - Next: 通过受管生成流程刷新全部 active tool surfaces，并增加 repository-wide generated-surface consistency assertions。
- [x] [artifact_fix] CRITICAL Task 3 Files attribution：`likec4/packages/vite-plugin/src/opsx/opsx-spec-handler.ts` 及 tests 未列入 declared Files。
  - Next: 将 vite-plugin Spec registry/path authorization 实现与 tests 补充到 Task 3 Files/Checks attribution。
- [x] [artifact_fix] CRITICAL Task 3 Files attribution：`likec4/packages/vite-plugin/src/plugin.ts` middleware 变更未列入 declared Files。
  - Next: 将 browser registry middleware 补充到 Task 3 Files/Checks attribution。
- [x] [artifact_fix] CRITICAL Task 5 Files attribution：`src/core/templates/architecture-skeleton.ts` 未列入 declared Files。
  - Next: 将 architecture skeleton generator 与 focused checks 补充到 Task 5 Files attribution。

- [x] [code_fix] CRITICAL Metamodel contract policy：v1 element kind 与 generic bootstrap candidate 仍可将未声明 policy 静默降为 optional。
  - Next: v1 拒绝缺失显式 contractPolicy；bootstrap generic input 携带 policy，未知值形成阻塞 review gap。
- [x] [code_fix] CRITICAL Migration deterministic identity：unresolved legacy capability 仍被 fallback identity 渲染到 candidate。
  - Next: 从 candidate 排除 unresolved/non-unique capabilities，禁止 rejected mapping 调用 fallback ID generator。
- [x] [code_fix] CRITICAL Archive fallback rollback：fallback 安装 destination 后 source cleanup 失败会留下 active 与 archive 双副本。
  - Next: source remove 失败时删除已安装 destination，并增加 injectable rm failure regression。
- [x] [artifact_fix] CRITICAL Task 3 handler test attribution：声明了不存在的 `opsx-spec-handler.test.ts`。
  - Next: 更正为 `likec4/packages/vite-plugin/src/opsx/opsx-spec-handler.spec.ts`。
- [x] [artifact_fix] CRITICAL CLI registration attribution：`src/cli/index.ts` 未归属 legacy runtime query removal。
  - Next: 将其加入 Task 1 Files。
- [x] [artifact_fix] CRITICAL active references attribution：Task 6 未声明已修改的 active reference files。
  - Next: 将 `.opsx/references/` active generated references 纳入 Task 6 Files。
- [x] [artifact_fix] CRITICAL generated surfaces attribution：Task 6 未声明 checked-in `.pi` skills/agents。
  - Next: 将 `.pi/skills/opsx-*`、`.pi/agents/opsx-*` 与 consistency test 纳入 Task 6 Files/Checks。
- [x] [artifact_fix] CRITICAL bootstrap schema attribution：Task 5 未声明 `schemas/bootstrap/` source/templates。
  - Next: 将 schema 与 templates 加入 Task 5 Files。

- [x] [code_fix] CRITICAL canonical bootstrap renderer：`src/core/relations/renderers.ts` 仍生成 retired YAML/domain-capability bootstrap artifacts，导致 full root gate 失败。
  - Next: renderer 复用 checked-in generic v1 bootstrap schema/templates，并更新 parity/instruction tests。
- [x] [code_fix] CRITICAL browser v1 fixture completeness：Spec browser fixture 缺 explicit contractPolicy、Project Root 与完整 v1 validation。
  - Next: 将 fixture 改为可由 `readLikeC4Architecture` 接受的完整 v1 model，并归属 Task 3。
- [x] [code_fix] CRITICAL compiled legacy query residue：未注册的 `src/commands/opsx.ts` 仍被编译发布。
  - Next: 删除 legacy query command implementation/tests，仅保留 explicit migration compatibility APIs。
- [x] [code_fix] CRITICAL active relation authoring vocabulary：Architecture delta help/renderer/reference 仍发布 legacy `belongs_to` 与 domain/capability endpoint registry，缺少 v1 `produces`。
  - Next: active help、renderers、generated relation reference 统一消费 v1 relation vocabulary；legacy registry 仅保留 explicit migration compatibility。
- [x] [code_fix] CRITICAL active bootstrap CLI wording：help、hook warning、mode description 与 status 仍宣传 legacy YAML，和 v1 generic Semantic Model bootstrap 行为矛盾。
  - Next: 更新 active CLI 文案为 v1 Semantic Model/LikeC4 candidate，并增加 help/status regression assertion。
- [x] [artifact_fix] CRITICAL browser fixture Specs attribution：`test/fixtures/spec-browser/.opsx/specs/` 未列入 Task 3 Files。
  - Next: 将 browser fixture Specs 目录加入 Task 3 Files，覆盖 modified/deleted/replacement fixture files。
