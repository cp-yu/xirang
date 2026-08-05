## Context

第三方项目使用息壤时，Agent 上下文只含息壤框架信息（skill），没有任何项目 Semantic Model 信息。现有 `arch query/search/impact` 都要求先知道 identity 或查询词，Agent 冷启动盲区无法获得项目模型总览；`arch impact <root> --depth 10` 虽能带出全部元素但强制含 Contract（本模型约 1MB），不适合一次性注入。

likec4 端已支持视图级层级树导出（`@likec4/generators` 的 `buildViewTree` + text/markdown/json 三序列化），但那是浏览器 SPA 的 view 级能力，与 CLI 是两套独立构建（`build.js` 先 tsc 编译 `src/` 再 `pnpm --dir likec4 build`，CLI 不 import likec4 模块，只经 `runner.ts` spawn 外部 CLI）。

## Goals / Non-Goals

**Goals:**
- 新增 `xirang arch snapshot`：一次性输出整个 Semantic Model 骨架（Element Declarations + Relationships + Metamodel Kinds），不含 Contract。
- 三格式 text（box-drawing 树，默认）/ markdown / json，格式对齐 likec4 tree 导出约定，保持工具链一致。
- 在共享 `XIRANG_SHARED_CONTEXT` fragment 指引 Agent workflow 启动时先运行 snapshot 获取模型总览。

**Non-Goals:**
- 不把 Contract 纳入 snapshot（Contract 保持 `arch query --contract` 按需点查）。
- 不 import likec4 模块（包边界约束）；snapshot 树构建由 CLI 自实现。
- 不修改 likec4 端视图级树导出。
- 不改变现有 arch query/search/impact/validate 行为。
- 不做常驻注入文件（snapshot 是"需要时调用"的命令，不是固定物化到 context 的文件）。

## Decisions

### 1. 命令形态：`xirang arch snapshot`，新增独立命令

作为 `deterministic-operations` 下 arch 命令族的一员注册（`src/commands/arch/index.ts`），语义是"给我全部模型骨架"，区别于 impact 的"围绕某 focus 的上下文投影"。不扩展 impact（语义混杂）。

### 2. 输出内容与格式

- **元素树**：全部 Element Declaration，嵌套（缩进 box-drawing `└──/├──`）隐含 parent，每行 `identity (kind) | definition`。kind 恒显示；title 不显示；definition 恒显示；parent 由缩进隐含；children 按 identity 自然序排序。
- **关系清单**：全部 Relationships（不按 focus 裁剪），按 kind 分组，`source --> target` 分号分隔。
- **Metamodel 速览**：Element Kinds（identity + contract 策略 + 定义正文）+ Relationship Kinds（identity + 定义正文，如有）。
- **三格式**：`--format text`（默认）/ `markdown` / `json`。文本与 markdown 为同一树结构的不同序列化；json 输出结构化 `{elements, relations, metamodel, statistics}`。

### 3. 实现位置与复用

- 新文件 `src/commands/arch/snapshot.ts`：纯函数 `buildModelTree()`（从 `SemanticModel` 的 parent/children 构建）+ 三序列化 + `formatArchitectureSnapshotText/Markdown` + 命令入口。
- 复用 `readValidArchitecture()`（`src/commands/arch/reader.ts`）读取模型，错误语义沿用（`Semantic Model unavailable` / 校验 ERROR 非零退出）。
- 排序用 `compareNatural`（likec4 已用；CLI 侧如无现成实现则用稳定字典序，保持确定性）。
- 不引入 likec4 依赖。

### 4. Skill 接入：修改 `XIRANG_SHARED_CONTEXT` fragment

在 `src/core/templates/fragments/xirang-fragments.ts` 的 `XIRANG_SHARED_CONTEXT` 中，于 `xirang arch query` 指引前插入一条：先运行 `xirang arch snapshot` 注入完整模型骨架（全部 Declarations、Relationships 与 Metamodel Kinds，不含 Contract），再用 `arch query` 点查细节与 Contract。该 fragment 被 explore/propose/apply/snack/reviewer/optimizer 六个 workflow 复用，随 `xirang update` 物化到各 skill。

## Risks / Trade-offs

- **体积随模型线性增长**：本模型约 56KB，超大项目可能超 200KB。可接受——snapshot 是按需调用非常驻，且 Contract 永不进入快照，点查才是大体积路径。
- **CLI 与 likec4 树实现格式逻辑重复**：包边界所致，接受；保持格式约定一致（box-drawing/markdown/json）。
- **排序确定性**：json/文本集合顺序必须稳定可重复，采用稳定排序（identity 字典序），测试断言锁定。
- **Windows 路径**：读取模型与输出均用 Node.js path utilities，不做路径字符串拼接（遵守项目跨平台约束）。
