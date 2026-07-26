## Context

当前 `xirang-impact-sweeper` 是 generated internal subagent。它接收 free-form `concept`，由 Agent 自行调用 Architecture CLI、读取 Contracts、搜索代码、提取近义术语并生成分类报告。该结构产生于 Semantic Model 只有扁平 Contracts 的阶段；当前 LikeC4 graph 已提供 stable `elementId`、任意深度 refinement、typed Relationships 与 singular Element Contract binding。

本变更跨越 CLI、Semantic Model、Explore workflow 与 generated artifact cleanup，但不改变代码证据工具、Change/Semantic Delta 或 Reviewer/Optimizer 验证流程。

## Goals / Non-Goals

**Goals:**

- 提供 `arch search` 与 `arch impact` 两个可测试、只读、Formal-only 的确定性 CLI 操作。
- 让 Explore 通过 Architecture 导航建立项目认知、选择 focus Elements，并自行完成影响判断。
- 返回 Element Declaration、refinement、Relationships 与完整 Element Contracts 的统一语义切片。
- 退役 Sweeper、专用 terminology/reporting capabilities 及其受管 artifacts。
- 保持 Commander runtime introspection、跨平台路径与 generated artifact ownership 约束。

**Non-Goals:**

- CLI 不搜索 `src/`、symbols、imports、calls 或 Git evidence。
- CLI 不读取 active Change、Semantic Delta 或 Expected Semantic Model。
- CLI 不执行同义词推断、embedding、LLM semantic search 或影响分类。
- 不新增 code↔element durable binding。
- 不为旧 Sweeper 提供兼容命令或兼容 Agent。

## Decisions

### 1. 使用两个独立 CLI capabilities

`arch search` 负责从未知术语定位候选 Elements；`arch impact` 负责从已确认的 stable identities 投影语义上下文。两者不并入 `arch query`，避免把 exact lookup、文本检索和 impact graph traversal 混成一个参数膨胀的命令。

实现入口位于 `src/commands/arch/search.ts` 与 `src/commands/arch/impact.ts`，并通过现有 `src/commands/arch/index.ts` 注册。两者直接复用 `readLikeC4Architecture()` 与 `buildSpecRegistry()`，不引入新的模型解析层或外部依赖。

### 2. `arch search` 使用字段加权的确定性检索

检索字段依次为 `elementId`、FQN、title、summary、owned Spec ID、Purpose 与 Requirement headings。排序优先级固定为 exact `elementId`、exact FQN、exact title、title substring、summary substring、Spec ID/Purpose、Requirement heading；同级按 stable `elementId` 排序。

每个结果保留全部 match evidence。`--limit` 只在完整排序后截断结果。无匹配返回成功和空数组。CLI 不进行同义词或 semantic similarity 推断；Explore 根据 Project Root、domain context 与返回候选调整查询词。

### 3. `arch impact` 使用 focus Elements 与 bounded graph traversal

命令仅接受一个或多个 stable `elementId`，canonical user term 为 focus Elements，JSON 字段为 `focusElements`，内部变量为 `focusElementIds`。不接受 FQN、free-form concept、`--change` 或 `--code`。

Relationship depth 默认 `2`。遍历对 incoming/outgoing 双向展开，读取 Metamodel 已声明的所有 Relationship kinds；输出始终保存 canonical `source`、`kind`、`target`，并在 path step 上标记相对 traversal direction。完整 depth-bounded Relationship subgraph 全量返回。

每个 focus Element 到 related Element 只返回一条 canonical shortest path。等长候选按 path steps 的 `source`、`kind`、`target` 字典序选择。该策略避免组合爆炸；未被选作 canonical path 的 edges 仍保留在完整 `relations` 子图中。

### 4. refinement 与 Relationships 分离

focus Element 到 Project Root 的 ancestor chain 始终完整返回；focus descendants 按 `--depth` 展开。Containment 不消耗 Relationship hop，也不进入 `relationPaths`。该分离防止 nesting 被误解释为 impact propagation。

### 5. 完整返回 Element Contracts

所有返回 Elements 通过 Spec Registry 的 singular owner binding 定位 zero-or-more formal Specs，并读取完整 Markdown 原文。输出同时包含 `specId`、`elementId`、跨平台构造的 project-relative path 与 `content`。不创建第二套 Contract AST。

命令返回 `statistics`，包括 focus Elements、Elements、Relationships、Contracts 与 Contract bytes 数量。结果不静默截断；调用方通过 `--depth` 控制范围。

### 6. 失败语义保持可信

unknown focus Element、无效 Relationship endpoint、required Contract 缺失、ownership conflict 或 Contract 读取失败均使 `arch impact` 非零退出。Optional Contract 缺失、无 Relationships 或无 related Elements 是正常结果。`arch search` 无匹配同样正常返回。

JSON 与 human-readable 输出由同一结果对象投影，禁止维护两套分析逻辑。命令只读 Formal Semantic Model，不生成 cache、report 或其他文件。

### 7. Explore 直接编排语义与代码证据

Explore 对新概念先调用 `xirang arch search <query> --json`，阅读候选及 Architecture context 后选择 focus Elements，再调用 `xirang arch impact <elementIds...> --depth 2 --json`。实现证据继续通过 CodeGraph、ACE、`rg`、`read` 等独立代码工具获取；`mustChange`、`mustVerify`、`contextual`、`unknown` 与 architecture drift 判断由 Explore Agent 完成。

专用 `termMappings`、`terminologyObservations` 和四态解释协议全部删除。普通术语歧义仍服从 Explore 一次一问纪律，但依据 Architecture 搜索结果而非 Sweeper 报告。

### 8. 退役 generated Sweeper artifacts

`INTERNAL_SUBAGENT_TEMPLATES` 显式收敛为 `xirang-reviewer` 与 `xirang-optimizer`。删除 Sweeper template、report types 与专属 reference templates。Setup/update 不再生成 Sweeper。

受管 cleanup 使用显式常量列出 `xirang-impact-sweeper` 与 legacy `opsx-impact-sweeper`，并列出三个退役 reference 文件。删除前必须使用现有 generated ownership/header 机制确认文件受 Xirang 管理；不得使用 glob、regex 或仅文件名推断并删除用户文件。

Generated `.pi`、`.claude`、`.opencode` 与 `.codex` artifacts 通过生成程序和同步管线更新，不直接手工编辑。

### 9. Completion 与 telemetry 沿用现有反射机制

两个命令注册到 Commander tree 后由 runtime introspection 自动进入所有 shell completion。`POSITIONAL_TYPE_MAP` 显式增加 `arch.search` 与 `arch.impact`；防漏测试继续保证所有 positional commands 有类型映射。

Telemetry 只记录 command path，不记录 search query 或 focus Element IDs。

### 10. Test Maintenance

删除只验证旧 Sweeper prompt/report type 的测试：

- `test/core/templates/impact-sweeper-template.test.ts`
- `test/types/sweeper.test.ts`

更新 Explore、subagent generation、sync engine、workflow installation 与 semantic-model consistency tests。新增持久化 CLI tests，覆盖 search ranking、空结果、双向 traversal、cycles、canonical path、refinement、完整 Contracts、失败语义、read-only 与跨平台 path 行为。

权威套件为 `pnpm test`，并执行 `pnpm lint` 与 `pnpm build`。Windows path 行为通过使用 `path.join()` 的测试 fixture 和现有跨平台 CI 验证。

One-time verification 在构建后的本项目 CLI 上运行 search/impact，并确认无 Change、代码证据、Agent 分类或工作区写入。

## Risks / Trade-offs

- [完整 Contracts 使输出较大] → 默认 depth `2`、允许调用方收窄，并返回统计信息但不静默截断。
- [确定性文本搜索遗漏同义词] → Explore 浏览 Architecture 后调整查询，不把模糊语义重新引入 CLI。
- [密集图产生大量等长路径] → 返回完整 Relationship subgraph，但每对 Elements 只选择一条 canonical shortest path。
- [无效 Formal Model 产生误导结果] → 对结构、binding 和 required Contract 错误执行非零失败，不返回伪完整 partial result。
- [历史 artifacts 被误删] → 仅通过显式受管名称和 ownership/header 校验删除，禁止 pattern-based cleanup。
- [Explore 把 adjacency 当成结论] → workflow 明确 CLI 只提供 semantic context，Agent 必须结合意图与独立代码证据判断。
