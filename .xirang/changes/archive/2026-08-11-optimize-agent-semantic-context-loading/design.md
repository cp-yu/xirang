## Context

当前 `arch snapshot` 一次输出全部 Element Definition，`arch query` 同时承担单点语义读取、refinement 展开和 Relationship 遍历，`arch impact` 又重复返回完整 Element 对象与 Contracts。Agent workflow 因而在模型总览、影响发现和完整语义读取之间重复加载同一内容；上下文压缩后也没有明确的重新加载协议。

该变更横跨 arch commands、项目配置与 generated workflows，但不改变 Semantic Model 存储记法、Metamodel 或 Contract 结构。现有 `configure-semantic-decomposition` Change 与本变更可并行形成；本变更不依赖其尚未同步的新 Elements。

## Goals / Non-Goals

**Goals:**

- 建立无状态、确定性的 `outline -> impact -> query` Agent 语义加载协议。
- 保持完整模型结构和影响导航能力，同时消除非显式 Definition/Contract 展开。
- 让 Agent 在整体或局部语义不清、上下文压缩或疑似遗忘时重新调用 CLI。
- 通过项目配置控制 outline 中 Element Definition 的加载深度，并在 CLI config projection 中暴露有效值。

**Non-Goals:**

- 不实现 CLI 或 Agent session cache、fingerprint、增量 impact 或 `known-identities`。
- 不改变 `arch search`、Semantic Model source layout、Authored Views 或 Browser projection。
- 不移除 `arch snapshot`，也不提供旧 `query --relations/--depth` 兼容模式。

## Decisions

### 使用无状态三段式协议

`arch outline` 负责恢复整体结构认知，`arch impact` 负责发现相关 identities 和路径，`arch query` 负责读取显式 identities 的完整 Declaration/Contract。每次命令直接读取当前 Formal Semantic Model；同一模型与参数产生相同结果。

拒绝隐式 cache 与增量调用状态，因为它们会让输出依赖调用历史并增加失效治理。拒绝保留单命令自动展开全部相关语义的兼容模式，因为该模式正是重复输出的来源。

### Outline 完整覆盖结构但局部加载 Definition

`arch outline` 返回全部 Elements 的 identity、kind、title、parent、children 与 hierarchy depth，全部 persisted Relationships，以及完整 Element Kind/Relationship Kind declarations 和 Kind definition body。它不返回 Authored Views 或 Element Contracts。

每个 Element 使用 `definitionState: loaded|unloaded` 表达 Definition 是否存在于 projection。配置深度内返回完整 `definition`；更深节点省略该字段，不生成摘要或截断文本。Project Root depth 为 `0`。

配置采用：

```yaml
architecture:
  outline:
    elementDefinitionDepth: 2
```

`xirang arch outline --definition-depth <n>` 只覆盖本次调用。命令沿用 snapshot 的 `--format text|markdown|json` 表面和底层确定性排序/树构建能力，但拥有独立 result schema，避免通过字符串裁剪 snapshot。

### Impact 只投影 identity 与结构

保留现有多 focus、完整 ancestor chain、depth-bounded descendants、双向 Relationship traversal 和 canonical shortest path 算法。`focusElements` 与 `elements` 改为稳定 identity arrays；`refinementContext` 使用 `elementId`；Relationships 与 path steps 保留 canonical `source/kind/target` 和 traversal。

删除 Definition、Contract、Requirement、Scenario、children 和嵌套完整 Element。每次返回完整相关 identity 集合，不实现增量模式。

### Query 只读取显式请求对象

命令签名改为 `xirang arch query <element-ids...> [--contract] [--json]`。输入只接受稳定 identities，去重并稳定排序；任一 identity 无效时整个请求失败。输出按 identity keyed map 返回完整 `identity`、`kind`、`title`、`definition`、`parent`、contract policy 与 `hasContract`。

`--contract` 只为显式请求对象附加完整 Requirements/Scenarios。删除 `children`、`refinement`、`relatedElements`、`--relations` 与 `--depth`。`parent` 保留，因为它是 Element Declaration 的规范字段，而不是派生导航结果。

### 配置值与恢复规则分离投影

项目配置 schema、functional defaults、setup/update migration、resilient parser 和 normalized projection统一增加 `architecture.outline.elementDefinitionDepth`。缺失时有效默认值为 `2`；非法配置输出 warning 并回退有效默认值，显式非法 CLI 参数直接失败。

`xirang config project --json` 和 Agent-facing `configProjection.prompt.fragments` 显示有效数值。静态 `XIRANG_SHARED_CONTEXT` 承载恢复协议，config projection 只承载值，避免重复规则正文。

共享提示规定：整体模型认知不清或疑似遗忘时重新运行 `arch outline`；具体 Element Definition/Contract 不清时重新运行批量 `arch query`；禁止根据 identity、title、旧摘要、残余上下文或实现代码猜测。Explore 使用 `search -> impact -> query -> implementation evidence`。Propose、Apply、Optimizer 与 task recovery 中所有旧 query navigation 调用同步迁移。

### 复用内部构建逻辑但保持 public schema 独立

Outline 与 snapshot 可以共享 children index、hierarchy depth、stable sorting 和 Metamodel projection helpers；query 与 impact 可以共享 stable identity validation。不得通过互相调用 public formatter 或后处理 JSON 文本实现职责迁移。

所有路径继续使用现有 Node.js path APIs；本变更不引入平台专属路径或新依赖。

## Risks / Trade-offs

- [Risk] 删除 query options 会破坏现有 generated workflow 与用户脚本 → 同一 Change 更新全部生成源、CLI integration tests 与明确的 unknown-option 错误断言。
- [Risk] 多命令协议增加一次调用次数 → batch query 和 identity-only impact 显著降低单次 payload，并保留完整可达能力。
- [Risk] Outline 配置默认值在磁盘、runtime 与 projection 间不一致 → 使用单一 functional default，并覆盖 materialization、migration、parser、normalized projection 和 command resolution 测试。
- [Risk] Definition depth 判定出现 off-by-one → 固定 Root=`0`，持久化测试覆盖 0/1/2 与显式 override。
- [Risk] 共享 fragment 更新遗漏 workflow-specific 旧调用 → 对生成源和 generated artifacts 增加不存在 `query --relations/--depth` 的测试。
- [Risk] 当前 worktree 的其他 Semantic Browser 改动干扰实现验证 → 实现和测试只触碰声明文件，验证命令按定向 suite 执行并保留现有用户改动。

## Migration Plan

1. 先以测试固定新 command schemas、配置默认值和 prompt protocol。
2. 实现 outline projection 与配置解析，再收缩 impact/query projections。
3. 更新共享及 workflow-specific prompt 生成源并刷新 generated artifacts。
4. 运行 arch、project config、template、CLI integration tests 和 typecheck。
5. 在当前项目模型上一次性比较输出字节数，并确认 impact 无 Contract/Definition、query 无非显式对象。

旧 `arch query --relations/--depth` 不提供兼容期；调用方在同一发布中迁移到 `arch impact` 后批量 `arch query`。回滚时整体回退 command schemas、配置和提示生成源，不做数据迁移。

## Open Questions

None
