## Context

当前 Change 的规范语义来自 `elements/`、`metamodel/`、`relationships/` 与 `views/`，`compileChange()` 已能从当前 Semantic Model 推导 Expected Semantic Model、diff 与 diagnostics。旧 `ChangeParser` 仍把 `proposal.md` 和 change-local `specs/` 组合成另一套 `Change`/`Delta` 模型，导致展示、列表与 validation 内部接口出现两个互相冲突的语义来源。

## Goals / Non-Goals

**Goals:**

- 让 Change JSON 展示和列表计数只消费现有四分区 compiler。
- 删除旧 parser、schema、converter、validation 分支及专属测试和文档。
- 保持文本模式的 proposal 原文展示与现有 task status 行为不变。

**Non-Goals:**

- 不改变 Semantic Delta、compiler 或 semantic diff 的内部语义。
- 不改变 `xirang validate --change` 的既有 JSON envelope。
- 不调整 `xirang change` command group 的迁移策略。

## Decisions

1. `xirang show <change> --json` 调用 `compileChange()`，输出 `id`、`title`、`valid`、`summary`、`entries` 与 `diagnostics`。`entries` 复用 `conciseDiffEntries()`，只暴露 entity kind、稳定 identity 与 operation；不重复定义新的 Change JSON 类型。
2. `summary` 与列表 `deltaCount` 均使用 `compiled.diff.summary`，统计当前 Formal Semantic Model 到 Expected Semantic Model 的有效实体级差异，而不是分区文件数或 Change Plan 条目数。
3. `ChangeCommand.list()` 先调用一次 `readFormalSemanticModel()`，再通过 `compileChange(..., { base })` 编译每个活动 Change，避免重复读取 Formal Model。路径继续使用 Node.js `path` API；本变更不引入平台特定路径处理。
4. 删除 `--deltas-only` 与 `--requirements-only`，因为新 JSON 本身就是精简 Change-derived View，旧 flags 不再对应当前语义。
5. 删除整个 `JsonConverter`。其中 Change conversion 被 compiler 输出替代，spec conversion 没有生产调用者；保留该类只会维持无效兼容层。
6. 删除 `MarkdownParser.parseChange()`、旧 Change schema 与 `Validator.validateChange()`。proposal 是 Change Plan scaffolding，不再被解析为规范 Change 对象。

## Risks / Trade-offs

- [Risk] Change JSON 是 breaking contract，旧脚本将无法读取 `deltas` → 通过 CLI 文档与测试明确新字段，并让 `schemaVersion` 继续由 compiler diff 管理。
- [Risk] 列表需要编译每个活动 Change，成本高于只解析 Markdown → 共享一次 Formal Model 解析，并保持现有并发编译方式。
- [Risk] 无效 Change 仍可能产生部分 diff → `valid` 与 `diagnostics` 始终随 JSON 返回，消费者不得在 `valid: false` 时把 entries 当作有效目标状态。
