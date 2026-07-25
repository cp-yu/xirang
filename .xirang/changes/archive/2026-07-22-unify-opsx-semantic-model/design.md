## Context

当前 OPSX 将 LikeC4 graph 与 Markdown Specs 分别解释为 architecture source 和 behavior source。运行时 reader 只识别 `domain` 与 `capability`，以 nesting 推导 ownership；Spec frontmatter 使用 `capabilities: []`，LikeC4 element 又保存 `metadata.specs`，形成两份不完整且可能冲突的映射。`project.c4` 虽存在于图中，但当前 query/parser 不识别该 element，无法承担 Agent 的整体入口。

本设计复用已确认的 Design Summary：OPSX Semantic Model 是唯一权威语义，由 LikeC4 graph modules 与 element-owned Markdown Specs 共同持久化。Agent 直接读取这些文件并执行类似 compiler 的结构化翻译；系统不引入公开或持久化 IR。CLI 为查询和验证构造的临时解析对象只是实现细节，不形成第二个语义层。

## Goals / Non-Goals

**Goals:**

- 建立通用、任意深度、single-parent 的 element hierarchy，并使 nesting 明确表示 abstraction/refinement。
- 使用稳定 `elementId` 将语义 identity 与可变 LikeC4 FQN 分离。
- 由 Metamodel 声明 element kind contract policy、可选 nesting constraints 与 relationship endpoint constraints。
- 使用 singular Spec `element` binding 构建唯一派生 registry，并以此驱动 validation、query、list 与 browser。
- 保持 LikeC4 为当前 graph syntax，同时通过显式 language version 建立可控 OPSX dialect 演进边界。
- 保持现有 workflow stages 和 artifacts；graph delta 与 contract deltas 共同构成一个 Semantic Delta，并在 sync 时原子 reconcile。
- 提供旧 profile 到新版本的显式迁移机制，遇到无法唯一确定的 element/Spec binding 时停止并报告 review gaps。

**Non-Goals:**

- 不在本 change 中迁移当前仓库全部 121 个 architecture elements、123 个 formal Specs 或重新设计它们的 abstraction hierarchy。
- 不引入独立编译器进程、持久化 AST/IR、数据库或外部图运行时。
- 不改变 `Explore → Propose → Apply → Verify → Sync → Archive` 的阶段顺序和 human authorization boundary。
- 不让 source paths、imports、calls 或 symbols 成为 OPSX Semantic Model 的权威事实。
- 不承诺未来 OPSX DSL 永久兼容 upstream LikeC4；本版本只提供显式、可迁移的 version boundary。

## Decisions

### 1. 一个持久化 Semantic Model，而非运行时 IR

`.opsx/architecture/**/*.c4` 与 `.opsx/specs/**/*.md` 是同一个 OPSX Semantic Model 的 source modules。Agent 和 CLI 均从这些文件读取语义；`OPSX Semantic Model` 不再与 `Durable Semantic Source` 区分，也不引入名为 IR 的产品概念。

备选方案是建立独立 canonical JSON IR。该方案会创造新的 source/derived 边界，并与 Agent 直接读取 human-readable source 的目标冲突，因此拒绝。

### 2. LikeC4 profile v1 与受控 dialect extension

新模型在 graph syntax 上继续使用项目内 `opsx-likec4`。由于 upstream LikeC4 specification 不能表达 `contractPolicy`、唯一 root 和可选 parent/child constraints，v1 在 `specification` 中增加最小 OPSX annotation block；这是第一个有实际语义依据的 versioned dialect extension，而不是另建 DSL。

目标表达形态：

```likec4
opsx {
  languageVersion '1'
}

specification {
  element project {
    opsx {
      root true
      contract required
    }
  }

  element capability {
    opsx {
      contract required
    }
  }

  element actor {
    opsx {
      contract optional
      parents [project]
    }
  }

  relationship produces {
    opsx {
      sourceKinds [capability]
      targetKinds [data, event, artifact]
    }
  }
}
```

`parents`、`children`、`sourceKinds` 与 `targetKinds` 缺失时默认开放。生成文件中的 OPSX keys 由显式常量清单维护，不使用文本 pattern 推断。缺失 `languageVersion` 的现有 LikeC4 model 作为 legacy profile 读取；不会静默重写。

### 3. Project Root 与通用 elements

v1 model 必须恰有一个 `root true` Project Root Element。该 root 拥有 project-level summary、intent、success criteria、scope 与 global invariants。其他 concrete kinds 不由 OPSX Core 写死；`domain`、`capability`、`actor`、`data`、`event` 等由项目 Metamodel 定义。

每个 element 必须包含全局唯一 `metadata.elementId` 与非空 `summary`。FQN 只表示当前 source navigation path。移动 element 改变 FQN，不改变 `elementId`、Spec binding 或历史 identity。旧 `capabilityId` 仅在 legacy reader/migrator 中保留，v1 source 不接受它作为 canonical identity。

### 4. Containment 表示 abstraction/refinement

每个非 root element 恰好有一个 parent，containment graph 必须无环。Parent 是 child 的高层 abstraction，child refinement parent；`belongs_to`、`refines` 与 `abstracts` 均由 nesting 推导，不写入 relation collection。

Parent 的 authored `summary` 与 Specs 只定义本层整体 intent、guarantees、cross-child invariants 和 decomposition rationale。Children list、contract coverage 与摘要列表由 query/view 确定性生成 Refinement Overview，禁止复制成另一份 source。

备选方案是继续将 nesting 固定为 domain ownership。该方案无法支持 arbitrary-depth intent decomposition，因此拒绝。

### 5. Typed Element Contracts 与 singular binding

Metamodel 对每种 element kind 声明 `contract required|optional`。Required element 必须在目标完整模型中拥有至少一个 Spec；optional element 可拥有零个。每个 Spec frontmatter 使用一个 canonical 字段：

```yaml
---
element: payment.authorize
---
```

一个 element 可对应多个 Specs；每个 Spec 恰好对应一个 element。`contractType` 从 element kind 推导，不重复存储。当前 `capabilities: []`、`metadata.specs`、`capToSpecs` 与 `specToCaps` 退役；registry 改为 `elementToSpecs` 与 `specToElement`。文件路径通过 `path.join()`/`path.resolve()` 处理，Spec ID 继续由 `.opsx/specs/<spec-id>/spec.md` 目录定位。

为保持 source 单一，browser authorization、`opsx list --specs --json`、validator 与 Agent guidance 均消费同一派生 registry，不维护第二套 element-side index。

### 6. Semantic relationships 与 first-class information elements

Containment 之外的协作继续使用 typed directed relationships。v1 保留 `invokes`、`consumes`、`precedes`、`constrains`、`validates`，增加 `produces`；删除 persisted `belongs_to`。关系 endpoint constraints 由 Metamodel 可选声明，缺失时默认开放。

具有实现意义的 data、event、artifact 与 contract 作为 elements 建模，可拥有稳定 `elementId` 与 typed Specs。`producer -[produces]-> information` 与 `consumer -[consumes]-> information` 保存语法主语方向；Data Flow View 可组合展示，但不得反转或复制 source edges。

### 7. Query、validation 与 view 使用统一解析协议

通用 reader 必须枚举任意 LikeC4 element kind、完整 FQN、parent、children、summary、metadata 与 relations，禁止以 domain/capability regex 构造模型。`opsx arch query` 接受 `elementId` 或当前 FQN，canonical output 使用 `elementId`，并可返回 parent、children、Refinement Overview、owned Specs 与 semantic relations。

Validator 分层执行：

1. language version 与 Metamodel syntax；
2. 唯一 Project Root、elementId uniqueness、single-parent 与 cycle；
3. 可选 parent/child 和 relation endpoint constraints；
4. Spec singular binding、element existence 与 one-owner cardinality；
5. required contract completeness；
6. relation duplicate、自环、dangling endpoint 与 `precedes` cycle。

Warnings 不得掩盖 source completeness errors。`opsx view` 通过 registry 授权 Spec path，继续执行 realpath containment、Markdown 安全渲染和按需加载。

### 8. Semantic Delta 保持现有 artifact surface

Change 继续使用 `architecture-delta.c4` 与 `specs/**/*.md`。前者是 graph module delta，后者是 contract module deltas；二者逻辑上共同形成 Semantic Delta。Proposal 可以继续以 Behavior Source/Architecture Source 作为兼容 scaffold heading，但 workflow prose 必须说明它们只是同一模型的两个 module scopes，不是两套 source。

Sync 先在临时 workspace 构造目标完整文件集合并执行联合 validation；只有 graph、bindings 与 contracts 全部有效时才原子替换 formal files。任何失败均回滚全部 graph 与 Spec 写入。Archive 只检查已 sync 状态并封存，不改变 formal semantics。

### 9. 两阶段迁移

本 change 实现 versioned reader、validator、migrator 与新项目 skeleton。Legacy model 缺失 language version 时保持可读，修改仍使用 legacy rules；用户必须显式运行 migration 才能生成 v1 candidate。

Migrator 执行：

1. 读取 legacy LikeC4 elements、`capabilityId`、nesting、`metadata.specs` 与 Spec `capabilities`；
2. 只接受能够唯一确定的 element identity 和 Spec owner；
3. 将歧义、多 owner、orphan Spec、missing element 和不完整 hierarchy 输出为 review gaps；
4. 在任何 gap 未解决时禁止 promotion；
5. 生成完整 candidate，验证通过并经 human authorization 后原子 promotion。

当前仓库 self-model 的全量 migration 属于后续 `migrate-opsx-project-semantic-model` change。本 change 不使用 catch-all element 或文件名推断补齐 123 个 Specs 的 owner。

### 10. Test Maintenance

当前以 domain/capability、ownership、`capabilityId`、`metadata.specs` 与 `capabilities: []` 为目标状态的单元和集成测试需要更新；legacy migration fixtures 可保留并明确标记 legacy version。权威 persistent suites 为根目录 `test/` 与 vendored `likec4/packages/**` 中受 OPSX dialect extension 影响的 parser/browser tests。

需要新增或更新：任意深度 element parser、stable identity move、root/containment validation、optional constraints、singular binding registry、required contract completeness、produces endpoints、query refinement、browser authorization、atomic sync rollback、legacy candidate migration、POSIX/Windows path cases和 workflow template consistency。

## Risks / Trade-offs

- [首次修改 vendored LikeC4 grammar 扩大维护面] → 将 extension 限制在 versioned `opsx` annotation block，保留 upstream-compatible model/relationship/view syntax，并用集中常量和 parser fixtures 锁定。
- [统一模型改动横跨 CLI、sync、browser 与 Agent templates] → 按 reader/validator、binding registry、delta/sync、presentation/workflows 的顺序实施，每阶段保持 focused tests。
- [legacy 与 v1 双读路径增加临时复杂度] → 只提供 read/explicit migrate，不允许 silent write migration；self-model 迁移完成后另行评估删除 legacy path。
- [Spec owner 自动迁移可能伪造 human intent] → 仅迁移唯一映射，任何歧义形成 review gap 并阻塞 promotion。
- [稳定 elementId 与 FQN 双标识可能被混用] → 所有 public output 和 bindings canonicalize 为 `elementId`，FQN 仅用于 source navigation，并增加 move regression tests。
- [跨平台扫描和原子写行为不一致] → 所有路径使用 Node.js `path` API，临时目录与 rename/rollback 在 Windows CI 和 POSIX CI 中验证。

## Migration Plan

1. 增加 v1 dialect annotations 与通用 element reader，保持 legacy model read path。
2. 实现 Metamodel、identity、containment、relations 与 contract validation。
3. 将 frontmatter、registry、list/query/view 切换到 singular `element` binding。
4. 将 delta validator/merger 与 sync 改为联合、原子 Semantic Delta reconciliation。
5. 更新 init、bootstrap、migration、workflow templates、references 与 docs。
6. 运行根项目和 vendored LikeC4 的 unit/integration/e2e tests，并在 Windows CI 验证路径行为。
7. 本 change sync 后保留当前 self-model 的 legacy version；后续 change 通过 reviewed migration 完成其 hierarchy 与 bindings。

回滚时恢复 legacy reader/validator 作为 active default，并保持现有 `.c4` 与 Specs 原样；由于 migration 必须显式 promotion，本 change 不应自动重写用户 formal models。

## Open Questions

None.
