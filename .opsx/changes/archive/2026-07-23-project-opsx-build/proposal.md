## Why

现有 bootstrap 将 Agent 的探索和语义判断锁进 mode、granularity、scan/map、domain-map、backfill 与第二套 migration lifecycle，导致 Architecture 与 Specs 不能作为一个 Candidate 同时构建和审查。OPSX 需要一个以用户要求为最高约束、由 Agent 自由探索项目并构建完整 Semantic Model、由 CLI 只负责确定性校验和原子提升的统一 Project Build。

## What Changes

- **BREAKING**：将 `opsx init` 重命名为 `opsx setup`，彻底删除旧命令与 hidden alias；setup 继续创建最小 formal Semantic Model skeleton 并安装固定 Agent workflows。
- **BREAKING**：以 `opsx-build` 取代 `opsx-bootstrap-arch`，删除五阶段 bootstrap、mode、granularity、evidence/domain-map、review.md、backfill 与 refresh lifecycle。
- 新增单一 `.opsx/candidate/` workspace，以及 `opsx candidate init|status|validate|promote` 程序化命令面。
- Agent 在 `build.md` 保存用户要求和已确认 decisions，自由选择项目证据并同时编写完整 Architecture + Specs；subagents 仅为可选探索加速器。
- Candidate validation 保持只读，检查 Semantic Closure 与 canonical representation，并为 `build.md` 和完整 Candidate 生成 `reviewDigest`；promotion 只接受用户确认且仍新鲜的 digest。
- promotion 将旧 formal Architecture + Specs 备份到 `.opsx/history/`，再原子替换完整 Semantic Model；history 永不作为 runtime fallback，也不自动清理。
- **BREAKING**：删除整个 `opsx migrate` command family、migration capability、legacy compatibility subtree、独立 migration candidate 与 promotion engine。
- 旧 `.opsx/bootstrap*` 和 `.opsx/migration-candidate/` workspace 在 setup/update 时移入 `.opsx/history/legacy-*`，不继续参与运行时。

## Source Impact

### Behavior Source

#### New Specs

- `opsx-build`: 定义 Project Build Agent 的探索范围询问、用户要求优先、构建起点选择、统一 Candidate authoring、冲突升级、可选 subagents 与用户确认流程。
- `cli-candidate`: 定义单一 Candidate workspace、init/status/validate/promote、只读确定性校验、`reviewDigest`、history snapshot、完整替换与失败隔离。

#### Modified Specs

- `cli-init`: 将公共 setup surface 从 `opsx init` 重命名为 `opsx setup`，保留 formal skeleton 与工具配置职责，并安装 `opsx-build`。
- `init-opsx-skeleton`: 将 skeleton generation 与成功引导切换到 `opsx setup` 和 `opsx-build`。
- `init-project-structure`: 将最小 formal Semantic Model skeleton 的创建入口改为 `opsx setup`。
- `cli-update`: 更新 setup 恢复指引、固定 workflow 集与旧 `opsx-bootstrap-arch` 清理行为。
- `internal-subagent-generation`: 将 setup 集成入口改名，并明确 Project Build 不依赖 internal subagent availability。
- `legacy-cleanup`: 检测并将退役 bootstrap/migration workspaces 与 managed surfaces 归档到 `.opsx/history/legacy-*`。
- `ai-workflow-templates`: 以 `build` 替换 `bootstrap-arch` workflow，并删除 bootstrap phase instruction contract。
- `template-artifact-pipeline`: 更新 canonical workflow manifest 与 setup/update 共享生成入口。
- `snack-workflow-manifest`: 保持六个 workflow，但以 `opsx-build` 替换 `opsx-bootstrap-arch`。
- `agent-command-slugs`: 移除 bootstrap/migration command artifact 语义与 stale mapped artifact 引用。
- `artifact-file-definitions`: 用 `build.md`、Candidate Architecture/Specs、CLI metadata、formal bundle 与 history 的独立文件定义替换 bootstrap phase projection。
- `instruction-loader`: 删除 `.opsx/bootstrap/` schema workspace state 分支。
- `schema-resolution`: 删除内置 `bootstrap` schema，仅保留 change workflow 所需 schema binding。
- `opsx-framework-identity`: 使用 `opsx setup`，加入 `.opsx/candidate/` 与 `.opsx/history/`，移除 bootstrap/migration active paths。
- `opsx-conventions`: 将 Candidate、history 与 `opsx candidate` resource namespace 纳入项目结构和 CLI conventions。
- `project-contract`: 将统一 Candidate、digest-confirmed human authorization、history 与无 migration boundary 写入 Project Contract。
- `opsx-semantic-model`: 定义 validated Candidate 对 Architecture + Specs 的完整替换，并用 Project Build 取代显式 migration 写入路径。
- `semantic-delta-application`: 当 target Spec 的全部 Requirements 被显式移除时，原子 target compiler SHALL 删除该空 contract module，使退役 Specs 可被完整移除。
- `cli-completion`: 生成 `setup` 与 `candidate` 子命令 completion，并移除 `init`、`bootstrap`、`migrate`。
- `cli-command-reference-consistency`: active surfaces 统一使用 `opsx setup`、`opsx candidate` 与 `opsx-build`，不得保留旧入口。
- `telemetry`: 命令示例与 subcommand identity 使用 `setup` 和 `candidate:*`，不再记录退役命令。
- `bootstrap`: 删除五阶段 bootstrap 的全部 Requirements。
- `bootstrap-init-ux`: 删除 mode、granularity、restart 与 scan transition Requirements。
- `bootstrap-baseline`: 删除 raw/specs/formal baseline mode Requirements。
- `bootstrap-domain-map-state`: 删除 domain-map 状态、gate 与 spec_groups Requirements。
- `bootstrap-backfill-specs`: 删除 ownership backfill 与 mapping command Requirements。
- `bootstrap-refresh-mode`: 删除 refresh 专用 lifecycle Requirements。
- `bootstrap-surface-exposure`: 删除动态 bootstrap workflow exposure Requirements。
- `opsx-bootstrap-architecture`: 删除旧 skill identity 与 architecture-only candidate Requirements。
- `migrate-opsx-to-likec4`: 删除整个 migration command contract。
- `semantic-model-migration`: 删除独立 migration candidate、validation 与 promotion contract。

### Architecture Source

#### Added LikeC4 Elements

- `project.root/domain.cli/cap.cli.candidate`: 提供 Semantic Model Candidate 的初始化、状态、验证、digest gate、history 与原子 promotion CLI 边界。

#### Modified LikeC4 Elements

- `project.root/domain.architecture/cap.architecture.bootstrap`: 保留 stable identity，将显示职责改为 Project OPSX Build，负责 Agent 驱动的完整 Semantic Model 构建。
- `project.root/domain.cli/cap.cli.project-setup`: 将公共入口改为 setup，并继续创建最小 formal skeleton 与 generated Agent surfaces。
- `project.root/domain.framework/cap.framework.identity`: 将 single active Candidate 与 durable history 纳入唯一 `.opsx` workspace 边界。

#### Removed LikeC4 Elements

- `project.root/domain.migration`: Project Build 已覆盖更广的 project-to-OPSX 构建，不再保留独立 migration domain。
- `project.root/domain.migration/cap.migration.semantic-model-reconciliation`: 删除第二套 candidate/promotion capability。
- `project.root/domain.opsx_element`: 删除 legacy OPSX compatibility domain。
- `project.root/domain.opsx_element/compat.opsx.legacy-bundle`: 删除 legacy runtime/migration input capability。

#### Architecture Relations

- Project OPSX Build 调用 Candidate CLI；Candidate CLI 调用 Semantic Contract Validation 与 Versioned Semantic Model promotion。
- 删除 Architecture Bootstrap 对五阶段 Artifact Workflow Compilation 的依赖。
- 删除 migration capability 的全部 validation、semantic-model 与 legacy-bundle relations。

## Impact

- 影响 Commander command tree、setup/update、workflow manifest、skill generation、completion、telemetry 与 active command references。
- 影响 bootstrap schema、instruction loader、candidate validation、Spec registry、LikeC4 validation、digest、atomic writer 与 rollback。
- 删除 bootstrap、backfill、migration CLI/runtime/schema/docs/tests，并归档旧 managed workspace。
- 新增 `.opsx/candidate/` 与 `.opsx/history/`，需要 Windows、macOS、Linux 的 path、symlink、Unicode、atomic rename 与 crash recovery 覆盖。
- Architecture removal 与 whole-Spec removal 依赖 identity-level Target Semantic Model compiler；实施顺序需与 active `add-semantic-change-diff` change 协调。
