## Context

OPSX v1 将 domain/capability 语义、模糊关系和 capability→path 缓存拆成三个 YAML 文件。`contains` 同时编码双向归属，`depends_on` 混合调用、消费与时序，`relates_to` 无可执行含义；code-map 则与 CodeGraph、ACE、LSP 和 `rg` 的实时检索职责重叠。现有 bootstrap refresh 又以旧 formal OPSX 与 code-map 为推导输入，使历史误差持续累积。

本变更同时影响 OPSX schema、init/query/sync/validate、bootstrap/refresh、schema templates、workflow/subagent 生成和 active docs。实现必须保持 TypeScript/ESM、Commander.js、Zod、YAML 与现有跨平台路径合同，不引入 CodeGraph 生产依赖。

## Goals / Non-Goals

**Goals:**
- 将 OPSX 升级为只有 project 与 relations 两个正式文件的 v2 语义模型。
- 以六种精确交互机制 relation 支撑可解释的 capability change propagation。
- 用一个声明式 Registry 同时驱动 runtime validation、模板、reference、prompt summary 与 authoring help。
- 让 bootstrap/refresh 从当前证据完整重建模型，并让 sweeper 组合 OPSX、spec 与可选 CodeGraph 证据。
- 以明确失败取代 v1 compatibility alias、模糊关系和静默猜测。

**Non-Goals:**
- 不提供 v1→v2 relation 自动分类器。
- 不增加 `generates`、weight、confidence 或 change-specific impact metadata。
- 不把 CodeGraph 设为依赖，不解析 `.codegraph/codegraph.db`，不复制其图数据到 OPSX。
- 不新增独立 impact-analysis CLI，也不把 authoring help 扩展到非 OPSX artifacts。
- 不改写 archive history。

## Decisions

### 1. OPSX v2 使用两文件模型

`project.opsx.yaml` 保存 project、domains 与 capabilities；`project.opsx.relations.yaml` 保存精确语义边。删除 code-map 常量、schema、bundle 字段、CLI filter/output、delta merge、validation、bootstrap candidate、sync 与所有 agent guidance。代码定位由 CodeGraph 优先、ACE/`rg`/`read` fallback 的实时证据路径承担。

选择该方案而不是将路径内联进 `project.opsx.yaml`，因为路径是代码索引数据而非稳定架构事实；迁移位置只会保留重复事实源。

### 2. Registry 是 relation 单一权威

新增无 I/O 的静态 `RelationDefinitionRegistry`，每项包含 token、endpoint kinds、direction、meaning、`useWhen`、`doNotUseWhen`、propagation hint、`notePolicy` 与合法 example。Registry 仅包含稳定架构语义，不包含项目数据、代码路径、置信度或某次 change action。

Registry 派生 relation TypeScript union、Zod enum、endpoint validator、bootstrap schema、模板说明、canonical Markdown reference、workflow summary、authoring help text/JSON 和参数化测试。生成制品按显式文件名常量追踪，并由 deterministic consistency test 阻止手工漂移。

### 3. 六种 relation 使用单向 canonical storage

- `belongs_to`: capability → domain；每个 capability 恰有一条；禁止 `note`。
- `invokes`: caller capability → callee capability。
- `consumes`: consumer capability → provider capability。
- `precedes`: earlier capability → later capability。
- `constrains`: constraint owner capability → constrained capability。
- `validates`: validator capability → subject capability。

反向关系由 query 派生，不双向持久化。其他五种 relation 的 `note` 可选且最多 200 字符；它只解释非显而易见的交互条件，不得承载路径、symbol 清单或替代 relation type。

删除 `contains`、`depends_on`、`relates_to`、`implemented_by`、`verified_by`，不接受 alias。无法精确分类的旧边进入 review gap 或删除，不能降级成通用边。

### 4. 解析与全图验证分层

Zod 只校验 object shape、Registry token 和 `note` 类型/长度。`RelationValidator` 在完整 graph 上校验 endpoint existence/kind、唯一 ownership、self-loop、duplicate、dangling relation 与 cycle；`precedes` cycle 为错误，其他 cycle 作为诊断。

同一 validator 作用于 formal read、opsx-delta dry-run、bootstrap candidate、refresh candidate 与 sync 后 bundle，避免各 surface 重复语义。

### 5. Query 返回有向语义关系而非代码映射

单节点 query 保留 `node` 与 incoming/outgoing `relations`；批量/depth query 保留 seeds、nodes、relations、missing。删除 `codeMap` 与 `--code-map`。遍历和 sweeper guidance 按 relation 类型解释路径：`belongs_to` 只补上下文，其他边保留方向与完整路径，不把无向邻居直接声明为受影响组件。

不在本变更引入新的 impact CLI；sweeper 可以基于 query 的结构化关系与 Registry propagation hint 做分析。

### 6. 模板采用 Registry 生成的分层投影

完整 reference 展示六种定义、endpoint matrix、选择树、note policy、合法/非法示例；`domain-map.md` 与 `opsx-delta.yaml` 包含紧凑就地说明；workflow prompt 使用更短 summary。所有文本来自同一 Registry renderer，tracked templates/reference 是生成制品并接受一致性测试。

### 7. `openspec help authoring` 提供文件级帮助

显式 dispatcher 支持：

```text
openspec help authoring
openspec help authoring project.opsx.yaml
openspec help authoring project.opsx.relations.yaml
openspec help authoring opsx-delta.yaml
```

`--json` 返回稳定结构。非 `authoring` 参数继续解析 Commander command path；无参数输出 root help。首版 authoring topic 由显式文件名 registry 注册，未知文件以非零退出并列出合法 topic。路径展示使用 canonical POSIX artifact 名，文件系统访问仍使用 Node.js `path` API，Windows 行为与其他平台一致。

### 8. Bootstrap/refresh 完整重建

Bootstrap scan 从当前 source、package/build metadata 与 formal specs 收集证据；CodeGraph 可用时提供 call/import/symbol 证据，不可用时使用 ACE/`rg`/`read`。Map 阶段将代码事实提升为 capability relations，但不得把每条 import 机械转为 relation；不确定项进入 review gap。

Refresh 不再依赖 git anchor、changed-path mapping、旧 code-map 或 partial merge。它从当前证据完整重建 candidate，旧 formal OPSX 仅参与 review diff；promote 在 review 通过后整体替换两个 formal 文件。工作区 history 仍保留，输入不变时 candidate 必须幂等。

### 9. Sweeper 输出语义影响而非文件清单

Sweeper 先映射 seed capabilities，再读取 OPSX relation paths 与 cap→spec contracts，最后用 CodeGraph 或 fallback 检索验证代码事实。报告使用 `mustChange`、`mustVerify`、`contextual`、`unknown`、`architectureDrift`、`questions`；每条影响包含 relation path、reason 与 evidence。Relation 只指定检查方向，不能单独证明 `mustChange`。

CodeGraph 检测和调用保留在 agent guidance，不进入 OpenSpec npm/runtime；不可用只产生 evidence gap，不阻塞分析。

## Risks / Trade-offs

- [v1 项目与旧 workspace 立即失效] → 使用 `schema_version: 2` 明确失败并引导重新 bootstrap/refresh，不做错误率高的自动 relation 分类。
- [删除 capability→path 快捷映射] → 使用 capability id/intent/spec 与 CodeGraph/ACE/`rg` 联合定位；无法唯一映射时报告 `unknown`。
- [六种 relation 仍可能重叠] → Registry 提供 `useWhen`/`doNotUseWhen` 与选择树；允许同一 endpoint pair 上存在不同独立事实。
- [完整 refresh 比增量 refresh 慢] → 优先正确性与幂等；CodeGraph 仅作为可选加速证据，不恢复旧模型继承。
- [生成 surface 数量增加] → Registry 保持静态且小；renderer 确定性生成，tracked output consistency test 阻止漂移。
- [Commander help dispatcher 回归] → 非 authoring topic 委托现有 command lookup，并对 root、嵌套 command、未知 topic 和 shell completion 做回归测试。
- [`note` 退化为垃圾桶] → 200 字符上限、`belongs_to` 禁止、模板反例与 review 质量规则共同约束。
- [CodeGraph CLI/MCP 演进或缺失] → 不绑定其 npm/SQLite/API schema；agent 失败后正常回退 ACE/`rg`/`read`。

## Migration Plan

迁移假设：`cap.ai.template-artifact-pipeline` 归属 `dom.ai-integration`，因为其实现与 intent 均属于受管 AI artifact 生成管线；`cap.sync.evidence-refresh` 归属 `dom.verify`，因为其实现维护 verify evidence freshness，sync 仅是调用入口。旧关系中无法由当前 intent、spec 或代码证据确认机制的边删除，不以通用 relation 保留。

1. 以测试先行建立 Registry、renderer、v2 schemas 与 validator。
2. 切换 OPSX read/write/query/delta/validate 为两文件 v2，并删除 code-map runtime surface。
3. 更新 init、authoring help、templates、reference、workflow/subagent guidance。
4. 重构 bootstrap/refresh 与 sweeper，再更新 snack 和 shared context。
5. 将本项目 formal OPSX、runtime、authoring surfaces 与 docs 迁移到 v2；main specs 保持由 change-local delta 在 archive linking 时同步，避免 active ADDED/REMOVED cross-check 与已同步 main spec 自冲突；archive history 保持不变。
6. 运行完整测试、lint、build、Windows CI 与 `openspec validate --all`。若部署失败，回滚整个 breaking change commit；不支持在同一版本混用 v1/v2。