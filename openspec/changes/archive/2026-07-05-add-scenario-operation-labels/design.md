## Context

Requirement operation 现在由 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements`、`## RENAMED Requirements` 外层 section 表达；section 不进入 `RequirementBlock.raw`，因此不会污染 formal specs。Scenario label 位于 `RequirementBlock.raw` 内，必须在 sync、idempotency、validation 中显式处理。

## Goals / Non-Goals

**Goals:**
- 支持唯一语法 `#### Scenario: [ADDED|MODIFIED|REMOVED] <title>`。
- 让 `[ADDED]` / `[MODIFIED]` 在 sync/archive 后清洗为普通 scenario。
- 让 `[REMOVED]` scenario 在 change-local spec 中完整呈现，但 sync/archive 后不写入 formal spec。
- 让 change validation 和 formal spec validation 都理解 labels 边界。
- 让 task Verifies 使用 label-free scenario title，避免把 metadata 当作 title。

**Non-Goals:**
- 不新增 `## ADDED Scenarios` 等独立 patch section。
- 不实现只写局部 scenario patch 的 merge engine。
- 不引入 Markdown AST 或新依赖。
- 不支持多种 label 写法。

## Decisions

### 复用现有 line-based parser

在 `src/core/parsers/requirement-blocks.ts` 增加窄函数：`parseScenarioOperationLabel()`、`stripScenarioOperationLabel()`、`normalizeScenarioOperationLabelsForSync()`。函数只识别以 `#### Scenario:` 开头且 title 起始处为 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` 的标题。

Alternatives considered:
- Markdown AST：更通用，但为固定标题语法引入过度复杂度。
- 多语法兼容：降低用户出错成本，但扩大 parser 和 validation 面。

### sync 前清洗 `RequirementBlock.raw`

`buildUpdatedSpec()` 在把 `ADDED` / `MODIFIED` blocks 写入 `nameToBlock` 前先调用 shared normalizer。`[ADDED]` / `[MODIFIED]` 只去除 label；`[REMOVED]` 删除从该 scenario header 到下一个 `#### Scenario:`、下一个 `### Requirement:` 或 block 结束的内容。

`isDeltaSpecAlreadyApplied()` 对 change block 和 main block 都使用同一 normalizer 后再比较，避免 repeated sync 因 label 差异误判 pending。

Alternatives considered:
- 只在 write 阶段清洗：会留下 idempotency 误判。
- 在 parse 阶段丢弃 labels：会让 reviewer 和 validation 失去 change-local review metadata。

### validation 区分 change-local 与 formal specs

`validateChangeDeltaSpecs()` 允许合法 scenario labels，并执行：unknown label、malformed label、`[REMOVED]` 出现在 `## ADDED Requirements`、surviving scenario count 为 0 的 ERROR。Surviving scenario 指 unlabeled、`[ADDED]`、`[MODIFIED]` scenarios；`[REMOVED]` 不计入。

`validateSpecContent()` 对 formal specs 禁止所有 scenario operation labels，发现即 ERROR。

Alternatives considered:
- 把 formal spec labels 作为 WARNING：会允许污染进入发布规约。
- 不限制 `[REMOVED]` 位置：新 requirement 中展示 removed scenario 语义不清。

### task Verifies 使用 label-free title

`task-structure` 的 change-local spec scenario 索引应按 label-free title 建立。Tasks 仍引用 `Scenario "<title>"`，不写 `Scenario "[MODIFIED] <title>"`。

## Risks / Trade-offs

- [Risk] label 位于 raw block 内，遗漏清洗会污染 formal specs → Mitigation: sync/idempotency 共享 normalizer，formal spec validation 禁止 labels。
- [Risk] `[REMOVED]` 不是纯提示，存在删除行为 → Mitigation: specs 和 tests 明确验证 omit whole scenario block。
- [Risk] change spec 仍需完整 requirement block，不能减少所有 token → Mitigation: 本变更只解决 review 定位和 safe sync，不引入 scenario patch grammar。
- [Risk] regex 解析可能误判极端 Markdown → Mitigation: 只沿用现有 `#### Scenario:` 结构约束，不解析任意 Markdown。
