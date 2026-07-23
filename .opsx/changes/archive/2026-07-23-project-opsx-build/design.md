## Context

当前 bootstrap 同时维护 `.opsx/bootstrap/`、phase schema、evidence/domain-map YAML、CLI-generated Candidate、review.md 与 post-promote backfill；semantic migration 又维护 `.opsx/migration-candidate` 和独立 promotion transaction。两条路径都在程序侧降低 Agent 的语义自由度，并形成 Specs + LikeC4 之外的影子 source。

本设计复用已确认的 Design Summary：`opsx setup` 负责创建可用的最小 formal skeleton；`opsx-build` 负责 Agent 探索和完整 Semantic Model authoring；`opsx candidate` 只提供单一 workspace、只读 validation、digest freshness、history 和原子 promotion。

仓库中 active `add-semantic-change-diff` change 正在引入 identity-level Target Semantic Model compiler、removal dialect 与 immutable snapshot writer。本 change 需要删除 architecture elements、relations 和整个 Spec modules，因此实现与最终 validation 必须在该 compiler 可用后进行，不能继续使用当前 additive delta merger。

## Goals / Non-Goals

**Goals:**

- 以 `opsx setup` 替换 `opsx init`，同时保留 minimal formal Architecture + Specs skeleton。
- 以固定 `opsx-build` skill 替换 architecture-only bootstrap workflow。
- 用单一 `.opsx/candidate/` 表达一次 Project Build 的用户要求、Architecture 与 Specs。
- 让 Agent 自由选择探索顺序、证据、subagents 和语义边界；CLI 不生成语义内容。
- 以只读、跨平台 deterministic validation 生成覆盖 `build.md` 与 Candidate 的 `reviewDigest`。
- 只在用户确认的 digest 仍新鲜时，完整备份并原子替换 formal Semantic Model。
- 删除 bootstrap、backfill、migration、legacy compatibility 与多套 promotion engine。

**Non-Goals:**

- 不让 CLI 判断项目语义是否“完整发现”。
- 不规定 evidence packet、扫描目录、文件数量、subagent 角色或数量。
- 不生成或持久化 `review.md`。
- 不提供自动 formatter、silent normalization 或 implicit ownership mapping。
- 不支持多个并行 active Candidates。
- 不提供直接 restore command、history retention config 或自动 history cleanup。
- 不改变 Explore → Propose → Apply → Verify → Sync → Archive change lifecycle。

## Decisions

### 1. Setup 与 Build 分离

`opsx setup` 是 project/tool setup command。它创建 `.opsx/config.yaml`、durable directories、references、minimal formal LikeC4 modules、empty Specs directory，并为用户选择的工具生成固定 workflows 和 internal subagents。旧 `opsx init` 与 hidden `experimental` alias 直接删除，不保留 compatibility warning 或转发。

`opsx-build` 是 Agent workflow。它不由 CLI 扫描器替代，也不把当前 code、documentation 或 formal OPSX 自动认定为 source of truth。

替代方案是让 setup 不创建 formal skeleton。该方案会使未运行 Build 的项目缺少可用 OPSX source，与确认的产品边界冲突，因此拒绝。

### 2. Build 先确认输入，再初始化 Candidate

Skill 先检查 setup 与 active Candidate，然后询问探索范围：整个项目、代码与测试、文档与当前 OPSX、自定义范围。用户通过自然语言声明 source-of-truth 约束；未声明时，冲突 evidence 不具有自动裁决权。

只要当前 formal OPSX 存在，Skill 展示概览并询问：基于当前 OPSX 构建、重新构建 OPSX、使用指定内容作为起点。CLI lowering 使用互斥 init options：

```text
opsx candidate init --from current
opsx candidate init --from clean
opsx candidate init --from-path <path>
```

Skill 不替用户选择。存在 active Candidate 时必须询问 resume 或 restart；restart 经用户确认后删除旧 active workspace，不写入 build history。

### 3. 单一 Candidate workspace

Canonical workspace 为：

```text
.opsx/candidate/
├── candidate.yaml
├── build.md
├── architecture/
│   ├── specification.c4
│   ├── model.c4
│   ├── relations.c4
│   └── views.c4
└── specs/
    └── <spec-id>/spec.md
```

`candidate.yaml` 由 CLI 在 init 时一次性写入 schema version、createdAt、baseline kind 和 canonical baseline reference。它不保存 evidence、semantic decisions、validation result 或 digest。

`build.md` 由 Agent 编写，仅保存用户原始要求、探索范围、source-of-truth 指令和 confirmed decisions。它是 temporary compilation scaffolding，不得权威定义 element、Spec、Requirement 或 relation，也不会 promotion 到 formal source。

Architecture 与 Specs 由 Agent 直接编写。`candidate init` 只创建或复制 skeleton，不推断 kinds、elements、relations、Spec ownership 或 Requirements。

### 4. Project Build 的证据优先级

Skill 使用固定优先级：当前用户明确要求；用户明确指定的 source of truth；当前 formal OPSX；其余项目证据。用户未指定裁决规则且 evidence 冲突会改变 target behavior 或 architecture 时，Agent 必须询问用户。

Code、tests、documentation、configuration、Git history 和现有 OPSX 均可作为 evidence。实现存在、测试通过或文档完整都不能单独取得 source-of-truth 地位。

Subagents 只作为可选探索加速器。Skill 不声明 mandatory reviewer，不固定 subagent roles/count，也不得因工具缺少 subagent 能力而中止 Build。

### 5. Candidate CLI 是独立 capability

新增 stable element `project.root/domain.cli/cap.cli.candidate`，拥有四个命令：

- `init`：原子创建单一 workspace，并执行用户确认的 baseline copy。
- `status`：只读报告 workspace、baseline、文件 inventory、history 数量/占用与 validation readiness。
- `validate`：只读执行 canonical representation、Semantic Closure 与 digest 计算。
- `promote --digest <reviewDigest>`：重新读取、重新验证、核对 digest、备份和原子替换。

Candidate CLI 与 `cli.architecture-navigation` 分离。Navigation 保持 query/export/view 等读取职责；Candidate CLI 是高风险 source promotion boundary。

### 6. Validate 对整个 Candidate 只读

`opsx candidate validate` 不修改 `candidate.yaml`、`build.md`、Architecture、Specs、formal source 或 history。结果只输出到 stdout；`--json` 输出 structured diagnostics、inventory、formal diff summary 与 `reviewDigest`。不创建 digest file 或 validation cache。

Semantic Closure 包括：唯一 Project Root；stable elementId、kind、summary、single parent、reachability 和 containment acyclicity；kind contract policy；required contract coverage；singular Spec ownership；Requirement/Scenario structure；relation type、endpoint、direction、duplicates、constraints 与 `precedes` cycle；禁止 persisted `belongs_to/refines/abstracts`。

Programmatic validation 不声称发现项目全部语义。该不可判定责任由 Agent 的探索、用户约束与 conflict questions承担。

### 7. Canonical representation 与 reviewDigest

Candidate 必须使用固定 Architecture file set；Spec path 为 `specs/<ascii-kebab-id>/spec.md`；workspace 不允许 symlink。所有文本必须是 UTF-8 without BOM、Unicode NFC、LF、一个 final newline、无 trailing whitespace。

Metamodel kinds、siblings、relations、views、frontmatter keys 和 digest file paths 使用显式 bytewise comparator，不使用 locale-dependent `localeCompare`。Frontmatter 的 `element` 为首个 key。CLI 只报告文件、位置、违反规则与期望顺序，不自动修复。

`reviewDigest` 使用 SHA-256，输入按 POSIX relative path bytewise 排序，包含：

```text
build.md
architecture/specification.c4
architecture/model.c4
architecture/relations.c4
architecture/views.c4
specs/<spec-id>/spec.md
```

每个 entry 以 UTF-8 path length、path bytes、content length、content bytes 编码，避免串联歧义。`candidate.yaml`、timestamps、validation output、history 和 digest 自身排除。

### 8. Agent 直接完成用户 review

CLI 不生成 `review.md`。Agent 将 Project Root、Metamodel、element hierarchy、Spec partition/ownership、relations、confirmed decisions、formal-to-candidate diff 和 `reviewDigest` 直接呈现给用户。

用户确认当前版本后，Agent 才调用 `opsx candidate promote --digest <reviewDigest>`。CLI 重新读取同一 workspace并重新 validate；任一字节变化都会产生 digest mismatch 并拒绝写入。

### 9. Promotion 使用完整目录 transaction

Promotion 在 `.opsx` 同一 filesystem 内创建 transaction staging。固定顺序为：读取 immutable Candidate snapshot；validate；核对 digest；构建完整 formal target；再次确认 formal preimage；创建 history entry；将 current formal directories 移入 transaction backup；将 staged target directories swap 到 `.opsx/architecture` 与 `.opsx/specs`；运行 post-write validation；写入 promotion manifest；删除 active Candidate。

任一步失败必须恢复 current formal Architecture + Specs，删除不完整 history entry，并保留 Candidate。不能逐文件 merge，因为 Candidate 中缺失的旧 modules/Specs 必须从 target 消失。

该 transaction 必须复用 Target Semantic Model compiler 和 shared atomic writer primitives；不得保留 bootstrap、migration 和 candidate 三套 writer。

### 10. History 是 durable audit evidence

成功 promotion 写入：

```text
.opsx/history/builds/<utc-timestamp>-<digest-prefix>/
├── build.md
├── promotion.yaml
└── previous/
    ├── architecture/
    └── specs/
```

目录以 exclusive create 避免 collision。`promotion.yaml` 包含 schema version、full reviewDigest、promotedAt、previous formal fingerprint 和 relative backup paths；不包含绝对 platform-specific paths。

History 永不作为 runtime fallback，不自动删除。status 可报告 count 和 disk usage。无法完成完整 history backup 时 promotion 失败。恢复通过新的 Project Build 选择 history entry 作为指定起点，仍经过 validate、digest confirmation 与 promotion。

### 11. 旧 managed workspace 只归档一次

Setup/update 使用显式 retired path list：`.opsx/bootstrap/`、`.opsx/bootstrap-history/`、`.opsx/migration-candidate/`。发现时先展示并确认；确认后整体移动到 `.opsx/history/legacy-<utc-timestamp>/`，写入 manifest 记录原 relative path，再清除旧 active paths。不得通过 glob 或名称相似度推断删除范围。

归档后的 legacy files 只用于审计，不被 Candidate、formal reader、query、validation 或 view 消费。

### 12. 删除 bootstrap schema 与 migration family

删除 `schemas/bootstrap/`、bootstrap schema ID、phase state resolution、`opsx bootstrap` command tree、backfill engine 和 `.opsx/bootstrap*` runtime。`opsx-build` 直接消费 Candidate contract，不新增 `candidate instructions` 或 Candidate artifact schema。

删除整个 `opsx migrate` command family、migration candidate、migration promotion、migration architecture element 与 legacy compatibility subtree。Legacy files 或外部模型只能作为 Build 的指定起点或 evidence，不存在 runtime parser fallback 或自动 migration。

### 13. 固定 Workflow Manifest 收敛

固定六个 workflows 保持 `propose`、`explore`、`apply`、`archive`、`build`、`snack`。Build manifest 的 skill name 和 directory 均为 `opsx-build`。Setup/update 使用共享 ArtifactSyncEngine 写入新 skill，并通过显式 managed name list 删除 `opsx-bootstrap-arch`。Build 不生成 slash command artifact。

所有 active docs、help、completion、telemetry、generated skills、references、errors 和 active Specs 只使用 `opsx setup`、`opsx candidate ...` 与 `opsx-build`。Archive history 不作默认清理。

### 14. Whole-Spec removal 由 Target compiler 明确处理

本 change 会移除旧 bootstrap 与 migration Specs 的全部 Requirements。Target compiler 在一个 formal Spec 的全部 Requirements 被显式 REMOVED、且没有 surviving/ADDED/MODIFIED Requirement 时，将该 Spec module 从 Target Semantic Model 省略并在 atomic write 中删除目录。该行为不是隐式空文件 cleanup；只有完整显式 removals 才触发。

这样旧 Specs 不会成为空 contract，也不会继续绑定被删除的 migration element。该 lowering 依赖 `add-semantic-change-diff` 的 immutable Target compiler，必须在其落地后接通。

### 15. Architecture identity 与关系

保留 `project.root/domain.architecture/cap.architecture.bootstrap` stable identity，仅将 title/summary 改为 Project OPSX Build。新增 `project.root/domain.cli/cap.cli.candidate`。删除 migration domain/capability 与 legacy compatibility domain/element。

Target relations 为：Project Build `invokes` Candidate CLI；Candidate CLI `invokes` Semantic Contract Validation；Candidate CLI `invokes` Versioned Semantic Model。删除 bootstrap→Artifact Workflow Compilation 与所有 migration incident relations。

## Risks / Trade-offs

- [当前 CLI 不支持 identity-level Architecture removal/update] → 本 change 的 architecture delta 使用 active `add-semantic-change-diff` 定义的 target-state dialect；该 upstream compiler 未落地前 combined validation 是预期 blocker，不能退回 additive shadow delta。
- [当前 Specs sync 不支持 whole-module removal] → 在 shared Target compiler 中只对“全部 Requirements 已显式 REMOVED”的模块实施删除，并用 target validation 防止未知 ownership 或空 required contract。
- [严格 canonical validation 增加 Agent 修正轮次] → 提供精确 location-aware diagnostics，不增加 autoformatter 或 semantic generator。
- [Agent 可能遗漏不可程序判断的业务语义] → Skill 强制探索范围、用户要求优先、具体冲突询问和 promotion 前完整 presentation；CLI 不伪造 completeness 证明。
- [validate 与 promote 之间发生 TOCTOU] → promotion 从新 snapshot 重跑 validation 和 SHA-256 digest，并在写入前复核 formal preimage。
- [完整 directory swap 可能在中断时损坏 formal source] → 所有 staging/rename 位于同一 filesystem，transaction 持有 previous directories，post-write failure 触发 rollback。
- [breaking surface 很大] → Commander、completion、telemetry、manifest、generated files、docs、schemas、tests 和 stale reference audit 必须在同一切换批次完成；不保留 dual routing。
- [build.md 被误作第三语义源] → 文件定义限制其只记录要求和 decisions；formal reader 和 promotion target 永不读取它作为 graph/contract module。
- [History 无界增长] → 永不自动删除以避免证据丢失；status 只报告占用，由用户手动清理。
