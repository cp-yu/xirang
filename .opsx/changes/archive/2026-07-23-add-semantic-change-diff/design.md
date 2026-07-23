## Context

当前 change-local Specs 已使用 Requirement-level delta，但仍支持 `RENAMED Requirements` 与可写回的 Scenario labels。Architecture delta 则被当作 additive LikeC4 module：`extend` 只能表达有限增量，无法可靠表达属性删除、element/relationship/Metamodel 删除或完整 target replacement。`opsx validate`、sync、Scenario labels 与 `opsx view` 各自重复读取 change，尚无统一的 Formal → Target 编译结果。

本设计复用已确认的 Design Summary，将 Specs 与 Architecture 统一为 identity-level operations，并把细粒度 Scenario/property diff 留给派生 Diff IR。CLI、generated report 与 Web 只做该 IR 的 projections。

## Goals / Non-Goals

**Goals:**

- 以一个 immutable Formal snapshot 将 change 编译为完整 Target Semantic Model。
- 统一 Requirement、element、relationship 与 Metamodel kind 的 `ADDED`、`MODIFIED`、`REMOVED` semantics。
- 为 Agent 和用户提供一致的 validate preview、CLI text/JSON diff、`effective-change.md` 与 Web diff。
- 支持 Architecture 严格非级联删除、element replacement review hint 与删除影响分析。
- 保证 sync 在 fingerprint freshness gate 后原子写入 graph 与 contract modules。
- 删除 Scenario labels 与 `RENAMED Requirements` 的生成、解析和兼容路径。

**Non-Goals:**

- 不将 generated Diff IR 或 `effective-change.md` 提升为第三个 semantic source。
- 不在 `architecture-delta.c4` 表达颜色、shape、opacity、layout 或 persisted change-review views。
- 不为 relationship 或 Metamodel 增加 `replace` hint。
- 不自动迁移 descendants、relationships、Spec bindings 或其他引用。
- 不引入第二套 Architecture graph renderer，也不把多个 active changes 合并为一个 workspace。

## Decisions

### 1. 使用统一 Change Compiler

新增共享 compiler，输入为 project root、selected active change 与 immutable Formal snapshot，输出：

```ts
interface CompiledChange {
  formalFingerprint: string
  changeFingerprint: string
  target: TargetSemanticModel | null
  diff: ChangeDiff
  diagnostics: Diagnostic[]
  valid: boolean
}
```

compiler 按固定顺序解析 contract operations 与 Architecture operations、materialize target、执行完整 validation、派生 Diff IR。`validate`、`diff`、sync、archive 与 `view` 必须调用该共享入口，不得各自重建 operation semantics。

替代方案是分别保留 Specs diff、Architecture merger 与 Scenario labels。该方案会产生不同 identity、计数与 diagnostics，无法保证 CLI/Web 一致，因此拒绝。

### 1.1 与当前 Formal Architecture 粒度对齐

当前 Formal Architecture 已将旧 command-level 与 implementation-level elements 收敛为聚合 capability。Semantic Diff Engine 的职责归入 `project.root/domain.architecture/cap.architecture.semantic-model` 与 `project.root/domain.change_workflow/cap.change.semantic-delta`；diff、validate、sync、archive 归入 `project.root/domain.cli/cap.cli.change-operations`；plan-remove 归入 `project.root/domain.cli/cap.cli.architecture-navigation`；Web change review 归入 `project.root/domain.presentation/cap.presentation.semantic-browser`。

本 change 不重新引入 `architecture.delta_merger`、`cli.diff`、`presentation.change_review` 等旧粒度 elements。Scenario labels 的移除通过修改聚合 CLI capability 与行为合同表达，因为当前 Formal Model 不存在独立 `cli.scenario_labels` element。这样保留当前 abstraction/refinement hierarchy，同时不改变 compiler、CLI 或 Web 的目标行为。

### 2. Durable operations 只位于稳定 identity

Specs 的 operation identity 是 Requirement title。`MODIFIED Requirement` 是完整 target block；formal 中未出现在该 block 的 Scenario 不进入 target。Scenario operations 由 before/after 比较派生。

Architecture delta 使用顶层 `ADDED`、`MODIFIED`、`REMOVED` sections。独立 identities 为 element、relationship、Metamodel element kind 与 Metamodel relationship kind。Property operations 由比较派生，不进入 source。

`MODIFIED element` body 必须完整声明 `kind`、`parent`、`title`、`summary` 与目标 metadata。`parent` 可修改；`kind` 只能作为 baseline assertion。修改 `kind` 或 `elementId` 使用 `REMOVED + ADDED`。

Relationship identity 固定为 `(source elementId, relationship kind, target elementId)`。同一 tuple 禁止平行关系；endpoint 或 kind 修改使用 `REMOVED + ADDED`。Metamodel kind 同样使用完整 target constraints。

替代方案是递归 property/Scenario operations 或 flat atomic ledger。前者把 review metadata 变成复杂 source grammar；后者形成第二套 durable IR，因此拒绝。

### 3. Architecture delta 是 OPSX dialect，不是可直接 union 的 LikeC4 module

canonical shape 为：

```c4
architectureDelta {
  replace element 'old.id' with 'new.id'

  ADDED {
    element 'new.id' {
      kind 'capability'
      parent 'domain.id'
      title 'New Element'
      summary 'Target summary'
      metadata { status 'active' }
    }
  }

  MODIFIED {
    element 'existing.id' {
      kind 'capability'
      parent 'new.parent'
      title 'Existing Element'
      summary 'Complete target summary'
      metadata { status 'active' }
    }
  }

  REMOVED {
    element 'old.id'
  }
}
```

Dialect parser 先生成 typed operation IR，再由 target materializer 修改内存模型。sync writer 必须把 target 编译回干净 formal LikeC4 modules，不能把 negative operations 作为长期 additive module 保存。

`architecture-delta.c4` 缺失表示已确认 graph no-op。存在的文件必须至少有一个真实 operation；空 section、空 model 或只有 `replace` hint 均无效。

### 4. `replace` 是可解析但非语义的 element review hint

`replace element 'old' with 'new'` 只允许 element → element，且必须关联恰好一个 `REMOVED old` 与一个 `ADDED new`。一个 operation 最多参与一个 hint。移除 hint 后，Target Semantic Model 与 semantic operation counts 必须不变。

hint 不重写 children、relationships、bindings 或 references。其唯一作用是让 text/Web projection 把两个 operations 关联为 structural replacement。

### 5. 严格非级联删除与 impact planning

删除 element 不得静默删除 descendants、incident relationships、Spec bindings 或其他语义引用。target validation 在仍有引用时失败。

`opsx arch plan-remove <element-id-or-fqn> [--change <name>] [--json]` 复用 compiler 与 registry。带 `--change` 时，先应用 selected change，再将依赖分为 `Handled` 与 `Unresolved`。发现 unresolved dependency 是有效分析结果并返回 0；解析失败或 identity 不存在才返回非零。

### 6. Diff IR 是唯一 runtime presentation model

`ChangeDiff` 保存 schema version、change、valid、formal/change fingerprints、summary、entries 与 diagnostics。每个 entry 包含 scope、kind、identity、operation、可选 declared operation、before、after、children 与 replacement association。

Requirement、element、relationship 与 Metamodel kind entries 对应 durable operations；Scenario/property entries 由 Formal/Target 比较生成。行级与词组级 diff 在 renderer 内按需计算，不预先持久化，避免 IR 绑定某个 UI algorithm。

`validate --json` 只投影 valid、diagnostics、summary 与 concise entries；`diff --json` 输出完整 IR。

### 7. `effective-change.md` 是确定性 generated review artifact

`opsx diff --change <name>` 默认只读。`--write` 使用显式生成文件名常量，在 `path.join(changeDir, 'effective-change.md')` 原子写入 deterministic Markdown。

报告包含 fingerprints、validation status、summary、完整 Specs/Architecture text diff 与 diagnostics；按 canonical identity 排序，不写 `generatedAt`。相同 inputs 必须产生字节一致内容。无效 change 仍写失败报告，防止保留过期成功报告。

validate 与 sync 不读取该文件。缺失或 stale 只提示。archive 在最终 validation 通过后自动重建报告，再移动 change directory。

### 8. Scenario labels 与 `RENAMED Requirements` 直接 breaking removal

删除 command registration、core writer、parser normalization、sync cleanup、task-anchor normalization、Schema instructions 与 workflow calls。不提供读取兼容或 migration layer。任何 change-local Scenario heading 上的 `[ADDED]`、`[MODIFIED]`、`[REMOVED]` 都产生 location-aware ERROR。

Requirement rename 使用 old Requirement 的 `REMOVED` 与 new Requirement 的 `ADDED`。Scenario rename因缺少 stable Scenario ID 也自然显示为 remove + add。

### 9. Web change views 是 runtime model variants

`opsx view` selector 保留 `Current / Formal Architecture` 默认项，并按 deterministic change ID 排序加入所有 active changes；archive entries 永不出现。Specs-only active change 也显示。

每个 selected change 独立运行 `Formal + change`，产生 transient target graph 与 Diff IR。Architecture 使用现有 LikeC4/React Flow renderer 做单图 overlay；`Diff only` 保留 changed elements/relationships、relationship endpoints、ancestor containers 与必要上下文。上下文不计入 diff counts。

Specs 与 Architecture diagnostics 分区处理；一侧失败不阻塞另一侧。Active change index、Specs diff 与 Architecture diff/layout 使用分离的进程内 caches。watcher 通过规范化 project-relative paths 做定向失效并发送 HMR，不使用 path separator 假设。

### 10. Sync 与 archive 使用 snapshot/fingerprint transaction

共享流程为：读取 immutable Formal snapshot；解析 operations；materialize target；完整 validation；生成 diff；复核 formal fingerprint；最后原子写入。

sync 只写 formal Specs 与干净 LikeC4 modules，不修改 change-local source 或 review artifact。任一 validation、stale fingerprint 或 filesystem write failure 必须回滚全部 graph/contract writes。

archive 不消费 report 作为 source；它在 validation 与 sync gate 通过后重建最终报告并封存 change。

### 11. 自举与迁移顺序

该 change 本身使用新 dialect 修改当前聚合 capability，并以行为合同删除 Scenario labels command；当前 validator 仍只能接受 additive LikeC4 module。这是预期的 source compiler bootstrap boundary，不能用旧 `extend` 静默弱化目标语义。

实施时先以 unit fixtures 驱动新 parser/materializer/diff engine，再接通 change validation；随后使用新 compiler 验证已绑定当前 stable element identities 的 `architecture-delta.c4` 与 change-local Specs，最后切换 sync writer、CLI/Web 与 workflow surfaces。切换提交完成前不得 sync 本 change。

不保留 dual grammar compatibility。回滚时回退整个 compiler/grammar/workflow change，而不是留下部分 compatibility branches。

### 12. 跨平台文件与 watcher 边界

所有 change/report/formal paths 使用 Node.js `path.join`、`path.resolve`、`path.relative` 与 `realpath`。生成文件按明确文件名常量跟踪，不使用 pattern 猜测 generated artifacts。临时目录、atomic rename fallback、realpath containment 与 watcher path normalization 必须在 Windows、macOS、Linux 测试。

## Risks / Trade-offs

- [当前 CLI 无法验证本 change 使用的新 delta dialect] → 任务先实现 parser/compiler bootstrap，并在接通 combined validation 后以新 CLI 完成最终 gate；propose 阶段明确披露该预期 blocker。
- [完整 target aggregate 的 omission semantics 可能被误写] → Schema 明确定义每类 aggregate 的 owned fields，并通过 declared/effective preview 强制 Agent 审阅。
- [Scenario identity 依赖 exact title] → 当前 rename 显示 remove + add；不在本 change 发明 Scenario ID。
- [Formal writer 可能产生非必要格式 churn] → 按现有 module ownership 定位最小 source module，使用结构化 AST/formatter，测试未变化模块字节稳定。
- [大型 active change 的 graph layout 成本] → Specs 与 graph caches 分离，按 fingerprints 缓存 transient target 与 layout，文件变化定向失效。
- [partial diagnostics 可能被误认为整体有效] → IR 与所有 projections 始终显示整体 `valid`，无效结果返回非零，分区内容只作为诊断辅助。
- [breaking removal 使旧 active changes 失效] → 明确报出 source location，由 Agent 删除 labels 或将 rename 改写为 `REMOVED + ADDED`；不引入隐式迁移。
