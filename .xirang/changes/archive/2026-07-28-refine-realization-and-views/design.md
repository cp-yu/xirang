## Context

Realization 当前把过程与协作组成并列为 children；Views 当前只表达 Authored 与 Derived 的形成方式，没有独立表达语义如何传达给用户。实现还暴露独立 `xirang diff` command，并将其 Markdown 输出写入 Change；Archive 在 Sync 后重新编译该 Change 时，Formal 已等于 Expected Model，因而会用零差异结果覆盖原有审阅内容。

Semantic Browser 已从同一 Change compiler 取得 Expected Semantic Model、差异 entries 与 diagnostics；`xirang validate --change` 也已提供只读文本预览和 JSON summary。持久化报告与独立 Diff command 因此不再承担不可替代的职责。

## Goals / Non-Goals

**Goals:**

- 让 Realization 的同层 children 使用一致分解维度。
- 将 View Composition 与 View Presentation 建模为两个正交维度。
- 删除独立 Diff CLI 与持久化报告，同时保留 Validate 和 Browser 的派生差异能力。
- 让 Archive 只执行门禁与目录移动，不生产或修改呈现结果。
- 保持 Change-derived Views 可确定性重建且不成为 durable artifact。

**Non-Goals:**

- 不删除内部模型比较与差异 IR。
- 不改变 `xirang view` 的 Change selector、Full context、Diff only 或 Contract diff 行为。
- 不改变 `xirang validate --change` 的只读差异预览。
- 不改写历史 Archive 中已有报告。
- 不新增兼容命令、迁移报告或第二套差异计算。

## Decisions

### Realization 使用过程与协作两个分组

新增 `realization-process` 与 `collaboration-structure`。前者包含 `semantic-model-build` 和 `change-realization`，后者包含 `participants` 和 `interaction-surfaces`。这只调整 refinement hierarchy，不转移各 Element Contract 的职责。

### Views 使用组成与呈现两个正交维度

新增 `view-composition` 与 `view-presentation`。Authored Views 与 Derived Views 归入组成维度；Visual Presentation 与 Text Presentation 归入呈现维度。同一个 View 的组成方式唯一，但可同时采用多种呈现方法。

替代方案是把 Visual/Text 作为 Change-derived Views 的 children。该方案错误地把呈现媒介限定到一种 View 类型，无法表达 Authored View 的视觉或文本呈现，因此拒绝。

### Interaction Surfaces 通过关系支持呈现方法

新增 `supports-presentation`，由 Interaction Surface 指向其支持的 View Presentation。当前只声明 `cli -> text-presentation` 与 `semantic-browser -> visual-presentation`。该关系不表示排他归属，也不改变 View Composition。

### 删除独立 Diff CLI 与持久化报告

删除 `xirang diff` command registration、command implementation 和 `renderEffectiveChange()`。不提供 alias 或 deprecation shim。`xirang validate --change` 继续使用共享 compiler 输出只读 text/JSON preview；`xirang view` 继续消费同一运行时差异数据生成交互式 Change-derived View。

内部 `ChangeDiff` 类型、模型比较和 `renderChangeDiff()` 继续作为实现机制存在。它们不进入项目定义，不持久化，也不成为新的 Interaction Surface。

### Derived Views 不形成 durable artifact

Derived Views 只由 Semantic Model 或 Change 确定性生成。LikeC4 cache、Browser manifest 等可重建运行表示可以存在，但不得成为 Semantic Model 或 Change 的持久化组成。Propose 与 Snack 不再生成 `effective-change.md`，Schema instructions 也不再要求 `diff --write`。

### Archive 原样移动 Change

Archive 保留现有 verify、sync、validation 与 task gates；门禁通过后直接移动 active Change directory。Archive 不创建、重算、校验或覆盖任何 View 呈现结果。已有 legacy 文件随目录原样移动，缺少这类文件不阻塞归档。

替代方案是在 Sync 前由 Archive 生成报告。该方案重新引入没有消费方的 durable projection，并使手动提前 Sync 的路径仍无法重建原始 baseline，因此拒绝。

### 历史内容不迁移

已有 Archive 中的 `effective-change.md` 是历史记录，即使内容曾被旧流程覆盖，也不由本 Change 批量删除或重写。实现只停止未来生成，并更新受管 workflow surfaces。

## Risks / Trade-offs

- [Risk] 外部脚本仍调用 `xirang diff` → 这是已确认的 breaking removal；CLI 返回 unknown command，不保留双路径。
- [Risk] Browser 当前不会完整展开 Metamodel Kind 与 Authored View entries → `xirang validate --change` 继续提供文本与 JSON 预览，后续交互增强使用独立 Change。
- [Risk] 删除报告后历史审阅缺少单独 Markdown 快照 → Semantic Delta 与 Change Plan 仍随 Archive 保存，当前产品不再承诺额外派生产物。
- [Risk] 生成后的 Skills 与 source templates 漂移 → 修改 source templates 后通过既有 parity/integration tests 刷新并验证受管 Skills。

## Migration Plan

1. 先以测试固定 `validate --change` 预览、`view` 运行时差异与 Archive 原样移动行为。
2. 删除 Diff command 与 Markdown renderer，并移除 Archive report generation。
3. 移除 Schema、Propose、Snack 及生成 Skills 中的报告步骤。
4. 运行 targeted tests、完整测试、lint、build 与 Change validation。

回滚时恢复 command、renderer、Archive generation 与 workflow references 的同一版本；不修改历史 Archive 内容。

## Open Questions

None
