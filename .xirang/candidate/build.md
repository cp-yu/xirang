# Candidate Build: 息壤（Xirang）Semantic Model 全量重建

## 授权范围

本次 Build 从 clean Candidate 全量重建本项目 Xirang Semantic Model。主要可写范围是 `.xirang/candidate/` 四个分区与临时 scaffolding；因 Metamodel 与 CLI 内置约束（`PERSPECTIVE_KIND` JSON 相等校验）耦合，kind 体系调整同步修改 `src/core/templates/model-skeleton.ts`、`src/core/setup.ts` 与 `test/core/setup.test.ts`。不修改正式 `.xirang/model/`、`.xirang/specs/`、`.xirang/architecture/`、generated skills 或其他项目文件。不提交、不暂存、不运行 promotion。

## 权威顺序

1. 本次用户要求（用户已确认的语义裁决，见下）
2. `xirang-definition.md`
3. 当前项目定义/约束（`xirang-contract.md`、`CLAUDE.md`、适用的 `AGENTS.md`）
4. current legacy specs（并以首个 specs commit `295f2dbb` 检查历史缺漏）
5. 当前 `.xirang/model/`、`.xirang/architecture/`、代码、测试证据（只用于确认 stale/current，不把实现结构自动建模为语义）

`CLAUDE.md` 的独立 Xirang 产品定位（与 @fission-ai/openspec 无关）与「修改生成程序而非生成制品」裁决参与了本 Candidate 的生成：所有 legacy OPSX 身份、`.c4` 持久化、Spec 存储与 slash-command 语义均被排除或按当前 Xirang surface 迁移，生成面语义以生成源为权威。

## 用户已确认的语义裁决

- 从 clean 重建，不从当前模型做增量修补。
- `xirang-definition.md` 中所有编号概念构成主干 Elements。
- 未编号的「语义对象 / 推进过程 / 协作结构」在模型中建模为 Perspective Elements，表达分解角度（2026-08-01 第二轮裁决）。
- Candidate `views/` 为真实空目录；不得创建 `definition-*` Authored Views。
- legacy spec 对应新模型 Contract 语料：仍适用的 Requirements/Scenarios 必须恢复，过时语义要迁移或排除并有证据。
- **层级自由化（2026-08-01 第二轮裁决）**：层级只表达抽象→细化，Element Kind 不限制层级位置；移除 `perspective` 的 parents/children 白名单。
- **移除 domain/capability（2026-08-01 第二轮裁决）**：Element Kinds 精简为 `project` / `perspective` / `element`，不保留 domain/capability，避免回归。
- **顶层结构（2026-08-01 第二轮裁决）**：顶层为 `semantic-object`（语义对象）与 `realization`（perspective）；`realization` 再分为 `process-dimension`（推进过程）与 `collaboration-dimension`（协作结构）；`framework-identity` 归 `semantic-object`，`delivery-validation` 归 `process-dimension`。
- **枝叶补充（2026-08-01 第二轮裁决）**：以 `xirang-definition.md` 为基础补充定义明确命名的子概念（element-kind、relationship-kind、proposal/design/tasks 文档、checkpoint、candidate、Definition Framing 四步），并纳入 legacy specs 仍在实现中的细节。

## 建模规则

1. **Metamodel**：Element Kinds 为 project/perspective/element（2026-08-01 裁决移除 domain/capability）；project root required/root true；perspective 无 parents/children 白名单（层级由抽象→细化决定）；保留 8 个 Relationship Kinds（constrains/consumes/invokes/precedes/produces/responsible-for/supports-presentation/validates）。`metamodel/perspective.md` 与 `src/core/templates/model-skeleton.ts` 的 `PERSPECTIVE_KIND` 必须 JSON 相等（validator 强校验，故源码同步修改）。
2. **主干**：63 个编号概念与 parent 严格按 `xirang-definition.md` 树（分析 §2.1 表）。顶层为 `semantic-object`（perspective）与 `realization`（perspective）；`realization` 下为 `process-dimension` 与 `collaboration-dimension`；`semantic-model`、`change`、`framework-identity` 挂 `semantic-object`；`semantic-model-build`、`change-realization`、`delivery-validation` 挂 `process-dimension`；`participants`、`interaction-surfaces` 挂 `collaboration-dimension`。
3. **legacy specs 映射**：按分析 §4 处置。同一旧 owner 或明确同义重复的 specs 合入同一 Element Contract；每个原 Requirement/Scenario 必须被保留（经证据化术语迁移）或因退役行为明确排除。
4. **排除**：5 个 stale specs（cli-diff、cli-change、cli-spec、spec-registry、spec-frontmatter）；首次版本 first-only 的 5 个 Sweeper specs 不恢复（已由 arch-search/arch-impact 替代）。
5. **placement**：`telemetry` 挂 `cli`；`framework-identity` 挂 `semantic-object`；`delivery-validation` 挂 `process-dimension`。保留扁平稳定 identities，不编码 parent 路径。
6. **Relationships**：沿用 50 条已确认 relationships（identity 为 source-kind-target，parent 变化不影响关系身份），新增元素（semantic-object/process-dimension/collaboration-dimension 等）由层级表达组织，不额外造关系。先确认所有 endpoints 存在。不从代码调用自动添加关系。
7. **views/**：真实空目录，不含单元。显示分组由后续 skill Text Presentation 完成。

## 非显然证据选择

- **同 owner/同义 specs 合并**：`cap.*` 同 owner 的 specs（如 cli-sync/archive-sync-workflow/specs-sync-skill/semantic-delta-application/sync-evidence-refresh → change-sync；opsx-verify-skill/verify-prompt-orchestration 逐行几乎相同 → verify-orchestration）合入同一 Element Contract，避免机械按文件造 Element，也不为凑数过度合并不同概念。
- **stale 命令/spec 路径排除**：`xirang diff`/`change`/`spec` 命令组与 `list --specs` 模式、`architecture-delta.c4`、`.xirang/specs/*/spec.md`、`.opsx`/OPSX/LikeC4 持久化路径均不再建模为当前语义；对应行为迁移到四分区 Semantic Model/Semantic Delta、`validate --change`、`validate --contracts` 与 stable identity 语义。
- **Metamodel/perspective 由 CLI 内置约束保留**：`metamodel/perspective.md` 必须与 `src/core/templates/model-skeleton.ts` 的 `PERSPECTIVE_KIND` 完全一致（validator 以 JSON 相等校验）；`project` kind 保持 `contract: required`、`root: true`，使 project.root 必须携带 Contract。

## 明确排除项（实现事实）

- 不创建 `.xirang/candidate/legacy-spec-coverage.json`（违反四分区/临时 scaffolding 边界）；111 specs 覆盖核对仅在 handoff 中报告。
- 不运行 promotion，不修改正式模型。
- 不复活已删除命令或兼容层；不把 LikeC4 呈现/记法层（`.c4`、FQN、DSL）当作规范性语义。

## 实现漂移备注（Implementation Drift）

以下 surface 的当前源码/测试仍支持 Candidate 已排除的退役行为。这些不是目标权威：显式用户裁决与 `xirang-definition.md` 的 Closure 顺序（先 Sync 后 Archive）和 Scenario 校验规则优先于当前 legacy 实现；需在模型提升后以独立代码 Change 修正源码/测试。

- **Archive `--no-sync` bypass**：`src/cli/index.ts:197` 仍注册 `--no-sync`；`src/core/archive.ts:240,251` 与生成模板 `src/core/templates/workflows/archive-change.ts:164,167,187` 仍描述 archive 内 Sync 与 bypass；`test/core/archive.test.ts:327-331` 仍演练 pending delta 下成功归档。Candidate 语义（`change-archive` Sync Gate）要求 Sync 为已完成前置、pending delta 无条件阻塞 archive、不存在 `--no-sync` 通道；mapping 中 no-sync 行保留 retired-with-current-source 证据。
- **Apply preflight Scenario label stripping**：`src/core/templates/workflows/apply-change.ts:40` 与 `test/core/templates/apply-change.test.ts:209-212` 仍指导去除 Scenario operation label 后匹配 label-free title。Candidate 语义（`validation-commands` 与 `preflight-scan`）要求任何 Change/Formal source 的 operation-labeled Scenario heading 一律被拒绝，Verifies 仅以 exact canonical 标题匹配；该 stripping 行为属 legacy 实现证据，需模型提升后代码 Change。
