### Task 1: 接通 Target compiler 与 whole-Spec removal

**Goal**: 在 `add-semantic-change-diff` 的共享 Target Semantic Model compiler 上实现显式空 contract module 删除，并使本 change 的 identity-level architecture removal 可编译。

**Files**:
- Modify: `src/core/change-compiler.ts`
- Modify: `src/core/specs-apply.ts`
- Modify: `src/core/change-sync.ts`
- Modify: `src/core/validation/validator.ts`
- Test: `test/core/change-compiler.test.ts`
- Test: `test/core/specs-apply.test.ts`

**Requirements**:
- `add-semantic-change-diff` 的 parser/compiler 必须先可用，不得建立第二套 target compiler。
- 全部 Requirements 被显式 REMOVED 时删除整个 Spec module。
- 剩余 Requirement 存在时不得推断 whole-Spec removal。
- Spec deletion、Architecture deletion 与 formal writes 必须进入同一 transaction。
- Target validation 必须在写入前检查 required-contract closure。

#### Checks

- [x] C1 验证 shared compiler prerequisite
  - Verifies: `specs/semantic-delta-application/spec.md` / Requirement "Target compiler SHALL 删除显式清空的 Spec module" / Scenario "全部 Requirements 被删除"
  - Command: `test -f src/core/change-compiler.ts && pnpm vitest run test/core/change-compiler.test.ts`
  - Expect: 使用 shared Target compiler，且 identity-level Architecture operations 可 materialize

- [x] C2 验证 whole-Spec removal
  - Verifies: `specs/semantic-delta-application/spec.md` / Requirement "Target compiler SHALL 删除显式清空的 Spec module" / Scenario "全部 Requirements 被删除", Scenario "删除不完整", Scenario "Removed Spec 仍被引用"
  - Command: `pnpm vitest run test/core/change-compiler.test.ts test/core/specs-apply.test.ts`
  - Expect: 显式清空模块被删除，部分删除保留模块，closure failure 零写入

### Task 2: 将 project init surface 切换为 setup

**Goal**: 用 `opsx setup` 完整替换 `opsx init` 与 hidden alias，同时保留 minimal formal skeleton、配置和工具生成职责。

**Files**:
- Create: `src/core/setup.ts`
- Delete: `src/core/init.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/core/update.ts`
- Test: `test/core/setup.test.ts`
- Delete: `test/core/init.test.ts`

**Requirements**:
- `opsx setup` 创建或保留 durable core 与 minimal formal skeleton。
- `opsx init` 与 `opsx experimental` 不得注册或转发。
- Setup 保留 interactive/non-interactive 工具选择和 project config 行为。
- Existing formal Architecture 与 Specs 不得被 setup 覆盖。
- 所有 paths 使用 Node.js path APIs。

#### Checks

- [x] C3 验证首次 setup 与 skeleton
  - Verifies: `specs/cli-init/spec.md` / Requirement "OPSX Setup SHALL 创建可用的 formal skeleton" / Scenario "新项目 setup"
  - Command: `pnpm vitest run test/core/setup.test.ts`
  - Expect: 新项目得到 config、formal Architecture modules、empty Specs 与 managed surfaces

- [x] C4 验证 existing source preservation
  - Verifies: `specs/init-opsx-skeleton/spec.md` / Requirement "Setup SHALL 生成 formal Semantic Model skeleton" / Scenario "Existing source preservation"
  - Command: `pnpm vitest run test/core/setup.test.ts`
  - Expect: setup 不覆盖 existing Architecture、Specs 或用户配置

- [x] C5 验证旧 init aliases 已删除
  - Verifies: `specs/cli-init/spec.md` / REMOVED Requirement "Experimental Command Alias"
  - Command: `node bin/opsx.js --help | rg -q '\bsetup\b' && ! node bin/opsx.js --help | rg -q '\binit\b|\bexperimental\b'`
  - Expect: help 只暴露 setup，不暴露 init 或 experimental

### Task 3: 实现 Candidate init 与 status workspace

**Goal**: 新增单一 `.opsx/candidate/` workspace，支持 current、clean、specified 起点和只读 status。

**Files**:
- Create: `src/commands/candidate.ts`
- Create: `src/core/candidate/workspace.ts`
- Modify: `src/cli/index.ts`
- Test: `test/commands/candidate-init.test.ts`
- Test: `test/commands/candidate-status.test.ts`

**Requirements**:
- Init options 互斥且必须显式选择起点。
- Candidate 创建必须原子完成，失败不留下半成品。
- Active Candidate 不得被静默覆盖。
- `candidate.yaml` 只包含 lifecycle metadata。
- Status 不修改 Candidate、formal source 或 history。

#### Checks

- [x] C6 验证三种 Candidate 起点
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate initialization SHALL 创建一个隔离 workspace" / Scenario "初始化 clean Candidate", Scenario "初始化 current Candidate", Scenario "Windows Candidate path"
  - Command: `pnpm vitest run test/commands/candidate-init.test.ts`
  - Expect: clean/current/specified 初始化均生成 canonical workspace，formal source 保持不变

- [x] C7 验证 active Candidate 保护
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate initialization SHALL 创建一个隔离 workspace" / Scenario "Active Candidate 已存在"
  - Command: `pnpm vitest run test/commands/candidate-init.test.ts`
  - Expect: 重复 init fail-fast，不覆盖 active Candidate

- [x] C8 验证 status 只读
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate status SHALL 只读报告状态" / Scenario "Candidate 存在", Scenario "Candidate 不存在"
  - Command: `pnpm vitest run test/commands/candidate-status.test.ts`
  - Expect: text/JSON status 准确且所有被观察文件 bytes 不变

### Task 4: 实现 Candidate canonical validation 与 reviewDigest

**Goal**: 复用 Semantic Model validators，增加 canonical representation、symlink 与 deterministic SHA-256 digest validation，且保证 validate 零写入。

**Files**:
- Create: `src/core/candidate/validator.ts`
- Create: `src/core/candidate/digest.ts`
- Modify: `src/commands/candidate.ts`
- Modify: `src/core/validation/validator.ts`
- Test: `test/commands/candidate-validate.test.ts`
- Test: `test/core/candidate-digest.test.ts`

**Requirements**:
- 验证 Project Root、identity、containment、contracts、Specs 与 relations closure。
- 验证 UTF-8、NFC、LF、final newline、trailing whitespace、ordering 与 canonical paths。
- Candidate 中禁止 symlink。
- Digest 覆盖 `build.md` 与完整 Candidate source，但排除 metadata/output/history。
- Validate 不得写入任何文件。

#### Checks

- [x] C9 验证 Semantic Closure
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate validation SHALL 确定性且只读" / Scenario "Valid Candidate 生成 review digest"
  - Command: `pnpm vitest run test/commands/candidate-validate.test.ts`
  - Expect: root、identity、contract、ownership 与 relation gaps 返回 location-aware diagnostics

- [x] C10 验证 canonical representation 拒绝策略
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate validation SHALL 确定性且只读" / Scenario "Non-canonical Candidate 被拒绝"
  - Command: `pnpm vitest run test/commands/candidate-validate.test.ts test/core/candidate-digest.test.ts`
  - Expect: Unicode、newline、sorting、frontmatter、path 与 symlink violations 被拒绝且不自动修复

- [x] C11 验证 digest 稳定与 validate 零写入
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate validation SHALL 确定性且只读" / Scenario "Validate 不修改文件"
  - Command: `pnpm vitest run test/core/candidate-digest.test.ts test/commands/candidate-validate.test.ts`
  - Expect: 相同 bytes 在各平台得到相同 digest，成功或失败后所有 source bytes 不变

### Task 5: 实现 digest-confirmed promotion 与 history transaction

**Goal**: 在 immutable Candidate snapshot 上重新验证 digest，完整备份 previous formal source，并以 rollback-capable transaction 替换 Architecture + Specs。

**Files**:
- Create: `src/core/candidate/promotion.ts`
- Create: `src/core/candidate/history.ts`
- Modify: `src/commands/candidate.ts`
- Modify: `src/core/change-sync.ts`
- Test: `test/commands/candidate-promote.test.ts`
- Test: `test/core/candidate-history.test.ts`

**Requirements**:
- Promotion 前重新 validate 并核对 supplied digest。
- History entry 包含 `build.md`、`promotion.yaml` 和 complete previous formal source。
- Formal target 使用完整 directory replacement，删除 stale files。
- 任一步失败恢复 previous formal source并保留 Candidate。
- History 永不作为 runtime fallback，也不自动清理。

#### Checks

- [x] C12 验证 digest freshness gate
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate promotion SHALL 要求当前 confirmed digest" / Scenario "Digest 仍然有效", Scenario "用户确认后 Candidate 发生变化", Scenario "Revalidation 失败"
  - Command: `pnpm vitest run test/commands/candidate-promote.test.ts`
  - Expect: 只有 supplied digest 与 fresh valid snapshot 匹配时进入 transaction

- [x] C13 验证 history 与完整替换
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate promotion SHALL 保留 history 并原子替换 formal source" / Scenario "Promotion 成功", Scenario "History 保留"
  - Command: `pnpm vitest run test/commands/candidate-promote.test.ts test/core/candidate-history.test.ts`
  - Expect: previous source 完整归档，formal trees 精确等于 Candidate，stale files 被删除

- [x] C14 验证 promotion rollback
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate promotion SHALL 保留 history 并原子替换 formal source" / Scenario "Backup 无法完成", Scenario "Replacement 期间 promotion 失败"
  - Command: `pnpm vitest run test/commands/candidate-promote.test.ts`
  - Expect: backup、swap、post-validation 任一 failure 后 formal bytes 恢复且 Candidate 保留

### Task 6: 生成 opsx-build 并收敛 Agent workflow surfaces

**Goal**: 以确认的 Agent flow 重写 workflow template 和 manifest，安装 `opsx-build`，删除 `opsx-bootstrap-arch`，并保持 subagents 可选。

**Files**:
- Create: `src/core/templates/workflows/build.ts`
- Delete: `src/core/templates/workflows/bootstrap-arch.ts`
- Modify: `src/core/templates/manifest/registry.ts`
- Modify: `src/core/templates/index.ts`
- Modify: `src/core/shared/artifact-sync.ts`
- Test: `test/core/templates/build.test.ts`
- Test: `test/core/templates/manifest/registry.test.ts`

**Requirements**:
- Skill 先询问探索范围和 Candidate 起点，再调用 Candidate init。
- 用户明确要求优先，未解决的语义冲突必须询问。
- Skill 同时编写 Architecture + Specs，并循环消费只读 validation diagnostics。
- Subagents 仅可选，不固定角色、数量或 evidence schema。
- Manifest 固定六个 workflows，并显式清理旧 managed skill。

#### Checks

- [x] C15 验证 Project Build Agent flow
  - Verifies: `specs/opsx-build/spec.md` / Requirement "Project Build SHALL 建立经过授权的 Candidate 范围" / Scenario "用户选择探索范围", Scenario "证据冲突会改变目标语义"
  - Command: `pnpm vitest run test/core/templates/build.test.ts`
  - Expect: skill 包含用户约束、起点询问、冲突升级，不包含固定 scan/map 或 source priority

- [x] C16 验证统一 Candidate 与可选 subagents
  - Verifies: `specs/opsx-build/spec.md` / Requirement "Project Build SHALL 保持探索和 review 由 Agent 驱动" / Scenario "可选 subagent 加速探索", Scenario "用户授权 Candidate 版本"
  - Command: `pnpm vitest run test/core/templates/build.test.ts`
  - Expect: skill 同时 author Architecture/Specs，直接呈现 digest，且无 mandatory reviewer/subagent role

- [x] C17 验证固定 workflow manifest
  - Verifies: `specs/ai-workflow-templates/spec.md` / Requirement "固定工作流模板集合" / Scenario "Registry 包含 Project Build"
  - Command: `pnpm vitest run test/core/templates/manifest/registry.test.ts test/core/templates/build.test.ts`
  - Expect: manifest 恰好包含 propose/explore/apply/archive/build/snack，旧 bootstrap skill 被删除

### Task 7: 删除 bootstrap、migration 与旧 workspace runtime

**Goal**: 删除旧 command families、schema、candidate generators、backfill 和 migration engines，并将 retired workspaces 显式归档到 history。

**Files**:
- Delete: `src/commands/bootstrap.ts`
- Delete: `src/utils/bootstrap-utils.ts`
- Delete: `src/core/backfill-specs.ts`
- Delete: `src/commands/migrate/`
- Delete: `src/migration/`
- Delete: `schemas/bootstrap/`
- Modify: `src/cli/index.ts`
- Modify: `src/core/setup.ts`
- Modify: `src/core/update.ts`
- Test: `test/core/legacy-cleanup.test.ts`

**Requirements**:
- `opsx bootstrap`、`opsx migrate` 与 bootstrap schema 完整删除。
- 不保留 alias、runtime parser fallback、mapping writeback 或第二套 promotion engine。
- Retired workspace cleanup 使用显式 path list。
- Cleanup 确认前不得移动，拒绝时零改动。
- Legacy history 不参与 formal readers 或 Candidate validation。

#### Checks

- [x] C18 验证 bootstrap lifecycle 删除
  - Verifies: `specs/bootstrap/spec.md` / REMOVED Requirement "Bootstrap docs and workflow templates SHALL describe only the CLI-backed five-phase flow"
  - Command: `! rg -n 'bootstrapInitCommand|opsx bootstrap|BOOTSTRAP_PHASES|evidence.yaml|domain-map' src schemas --glob '*.ts' --glob '*.yaml'`
  - Expect: runtime 与 schema source 不再包含旧 bootstrap lifecycle

- [x] C19 验证 migration family 删除
  - Verifies: `specs/semantic-model-migration/spec.md` / REMOVED Requirement "Semantic Model migration SHALL 显式生成候选模型"
  - Command: `test ! -d src/commands/migrate && test ! -d src/migration && ! node bin/opsx.js --help | rg -q '\bmigrate\b'`
  - Expect: command、runtime、candidate 与 promotion engine 均不存在

- [x] C20 验证 retired workspace archive
  - Verifies: `specs/legacy-cleanup/spec.md` / Requirement "Legacy artifact detection" / Scenario "检测退役 workspace"
  - Command: `pnpm vitest run test/core/legacy-cleanup.test.ts`
  - Expect: 仅显式 retired paths 被完整移动到 history，拒绝 cleanup 时零改动

### Task 8: 更新 completion、telemetry、docs 与跨平台验证

**Goal**: 将所有 active surfaces 切换到 setup/candidate/build，完成 stale reference、package、Windows/macOS/Linux 与 full-suite verification。

**Files**:
- Modify: `src/commands/completion.ts`
- Modify: `src/telemetry/`
- Modify: `docs/`
- Modify: `README.md`
- Modify: `.github/workflows/`
- Create: `scripts/audit-active-command-references.mjs`
- Test: `test/commands/completion.test.ts`
- Test: `test/telemetry/`
- Test: `test/cli-e2e/`

**Requirements**:
- Completion 只暴露 setup 与 candidate subcommands，不暴露 init/bootstrap/migrate。
- Telemetry 不记录 paths、Candidate content、diagnostics 或 digest。
- Active docs/generated surfaces 无 stale command 或 skill references。
- Linux、macOS、Windows 使用相同 digest 与 filesystem semantics。
- Root build、lint、tests、LikeC4 checks 与 package install 全部通过。

#### Checks

- [x] C21 验证 completion 与 telemetry
  - Verifies: `specs/cli-completion/spec.md` / Requirement "Completion Generation" / Scenario "所有 shell 暴露当前 commands", Scenario "Candidate subcommand completion"
  - Command: `pnpm vitest run test/commands/completion.test.ts test/telemetry`
  - Expect: setup/candidate completion 正确，telemetry 仅记录 command path 与 version

- [x] C22 验证 active stale references 清零
  - Verifies: `specs/cli-command-reference-consistency/spec.md` / Requirement "Cleanup verification reports remaining stale references by class" / Scenario "清理后审计"
  - Command: `node scripts/audit-active-command-references.mjs`
  - Expect: active source/docs/generated classes 无 init/bootstrap/migrate/opsx-bootstrap-arch，历史 occurrence 单独报告

- [x] C23 验证跨平台与完整回归
  - Verifies: `specs/cli-candidate/spec.md` / Requirement "Candidate validation SHALL 确定性且只读" / Scenario "Valid Candidate 生成 review digest"
  - Command: `pnpm lint && pnpm build && pnpm test && pnpm --dir likec4 typecheck && pnpm --dir likec4 test && pnpm --dir likec4 build && pnpm test:e2e`
  - Expect: root、LikeC4、browser 与 candidate suites 全部通过，跨平台 CI 维持相同 digest contract

- [x] C24 验证 package 安装后的 surface
  - Verifies: `specs/cli-init/spec.md` / Requirement "OPSX Setup SHALL 安装固定 Agent workflow 集合" / Scenario "安装 Build workflow"
  - Command: `pnpm pack --pack-destination /tmp && pnpm test:postinstall`
  - Expect: 临时安装暴露 `opsx setup`、`opsx candidate` 和 `opsx-build`，不包含 retired surfaces
