## Context

Explore 当前由一个只读 Agent workflow 完成全部意图澄清与设计确认，只把结果收成不持久化的 Design Summary。该边界无法在长对话、上下文恢复或结构决策反复修订时保留已确认的 Element identity、Kind、parent 与 Relationship 目标。Propose 因而缺少可确定消费的结构来源。

本设计在 Explore 内增加由用户选择进入的 Definition Framing 推荐阶段，并将 Design Exploration 明确为不依赖 Definition Framing 的基本设计过程。用户选择先处理结构定义时，由受 `xirang framing` 管理的 Change Structural Definition 保存最新确认结果，并为后续 Design Exploration 提供结构依据。Semantic Model、项目实现、generated Agent surfaces 与除 Change Structural Definition 外的 active Change artifacts 仍不由 Explore 修改。

前置 Change `replace-element-summary-with-definition` 已完成。本 Change 的 Element Declaration Delta 已迁移到 `definition`，不兼容旧 `summary` 字段。

## Goals / Non-Goals

**Goals:**

- 让 Definition Framing 可持久化 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships 的完整确认目标。
- 保持 Design Summary 不持久化，并使 Design Exploration 在有无 Change Structural Definition 时都能完成；结构修订显式触发依赖设计复核。
- 提供 identity-addressed、跨平台、fail-closed 的 `xirang framing` lifecycle 与稳定 JSON contract。
- 用 Semantic Model fingerprint 和 normalized relevant 基准快照区分 unrelated drift 与 relevant drift。
- Change Structural Definition 已形成时，让 Propose 确定性验证 Delta coverage，冻结 `change-structural-definition.md` 形成历史后再删除隐藏源。
- 通过生成源投影 Xirang-owned Definition Framing reference，避免 generated skill 与外部用户级 skill 耦合。

**Non-Goals:**

- 不把 Change Structural Definition 提升为 Semantic Delta 或第二规范来源。
- 不持久化 Element Contracts、Authored Views、Design Summary、开放问题、revision history 或 readiness 状态。
- 不引入并发写协议、content fingerprint、editor、后台清理或过期机制。
- 不修改 Semantic Browser UI，也不改变 Sync、Archive、Apply 或 Verify 的目标语义。
- 不兼容 `summary` 与 `definition` 双字段；只使用已落地的 `definition`。

## Decisions

### 1. Explore 支持可选 Definition Framing

`design-exploration` 是 Explore 的基本设计过程，直接基于 Semantic Model 与项目证据即可完成。用户选择先处理结构定义时，Explore 先进入 `definition-framing`，确认结构 identity、边界、Kind、hierarchy 与 Relationships，再由 `design-exploration` 将已确认结构作为设计依据。Change Structural Definition 发生更新后，Agent 必须重新检查依赖设计，而不是静默保留旧结论。

没有为不持久化的 Design Summary 新增 Element。它没有稳定 identity、持久存储或独立 lifecycle，继续由 `design-exploration` 与 `propose` Contracts 表达。

`explore#形成 Conversation-only Design Summary` 被新的 `explore#形成不持久化的 Design Summary` 取代。现有 Delta 应用规则先追加 ADDED Requirements、再移除旧 Requirement，因此后续 `不形成完整 Change` 与 `澄清 Element Definition 影响` 的 position 会前移一位；这是本次 Requirement 替换的已确认目标顺序，不是未声明的行为修改。

### 2. 单文件保存完整当前目标

文件位于 `.xirang/changes/.explore-<slug>-<explorationId>.md`。slug 是可变展示名；`explorationId` 使用 `<UTC timestamp>-<8 lowercase hex>` 并作为不可变 identity。`create` 只在第一批结构内容获得明确的持久化确认后创建非空文件；`update` 每次接收完整 payload，不执行隐式 merge。

用户 payload 包含 optional `informativeHierarchyPreview` 以及 `elementKinds`、`relationshipKinds`、`elements`、`relationships`。默认条目是完整目标态；仅删除使用 `operation: REMOVED`。`ADDED`、`MODIFIED` 或 no-op 由 CLI 对照 baseline 推导。constraint 字段缺失表示开放，显式空数组表示禁止全部。

CLI 管理 `entity`、`explorationId`、`semanticModelFingerprint` 与末尾 normalized 基准快照。payload 的用户顺序被保留；基准快照和 semantic comparison 使用确定性集合顺序。

### 3. 保存相关 Semantic Model 基准快照

`semanticModelFingerprint` 复用 `semanticTreeFingerprint(readSemanticTree(projectRoot))`，只作为全局快速检测。文件末尾在固定分隔符后保存 CLI-owned normalized snapshot，并标记 `COPIED SEMANTIC MODEL CONTEXT - DO NOT MODIFY`。

snapshot 闭包包括全部目标与 REMOVED identities/triples、parents、ancestor chain、relationship endpoints、所用 Kinds 及 Kind constraints 引用。每项保存 `exists: true` 与规范化值，或 `exists: false`。Contracts、Views、source paths、空白和键顺序不进入 snapshot。

fingerprint 相同为 `fresh`；全局变化但 relevant snapshot 相同为 `unrelated-drift`；相关规范化语义变化为 `relevant-drift`。`show/status` 始终可读，`validate/consume` 在 relevant drift 时阻塞，新的完整持久化确认后由 `update` 捕获当前基准快照。

### 4. 结构校验与设计影响分离

framing validation 构造结构目标并检查 schema、identity、duplicates、hierarchy cycle、parent resolution、root、Kind constraints、Relationship endpoints 与 removal consistency。它不要求 Definition Framing 提前编写 Contracts 或 Views。

CLI 将 required Contract、受影响 Contract、Authored View reference 等范围外后果作为 `impacts` 返回。structural validation 可以为 valid，同时携带 impacts；Design Exploration 必须处理这些输入，Propose 在形成完整 Change 时重新计算。

### 5. CLI 使用统一 Agent-facing contract

command group 包含 `create/list/show/status/validate/update/rename/consume/discard`。所有 commands 支持 `--json`，stdout 只输出一个 `version/command/status/result/diagnostics/error` envelope。`status` 取 `ok|invalid|error`；`ok` exit 0，其余 exit 1。diagnostics 复用 `ERROR|WARNING|INFO`，error codes 保持稳定，managed paths 使用 project-relative POSIX 表示。

read-only commands 不需要授权。create/update 使用明确的持久化确认，rename 使用 Rename Confirmation，discard 使用 Discard Confirmation，consume 使用明确的 Propose 或 standalone consume 授权。CLI 只执行确定性操作，不解释自然语言授权。

### 6. Managed path fail closed

create 只接受合法 kebab-case slug；其余 lifecycle 使用合法 exploration identity，consume 额外接受合法 change name。managed output path 全部由 CLI 内部生成，不接受任意输出路径。

CLI 对 canonical project root 下的 `.xirang`、`changes`、managed source、Change target 与 frozen destination 使用 `lstat` 类型检查。managed file、input file、changes root、target Change directory 与 frozen destination 不跟随 symlink；非 regular file/directory、duplicate exploration identity、filename/frontmatter mismatch、rename collision 和 containment failure 均返回稳定 error。路径构造使用 Node.js `path` API，JSON path 单独转换为 POSIX。

create/update 在同目录写临时文件后 rename，避免进程失败留下部分文件；这不引入并发控制或 transaction journal。

### 7. Propose consume 使用 coverage 与幂等清理

Propose 先生成并验证完整 Change，再运行 `framing consume`。coverage 对四类目标逐项检查：baseline absent 对应 ADDED，baseline different 对应 MODIFIED，baseline equal 不要求 Delta，REMOVED baseline present 对应 REMOVED，REMOVED baseline absent 不要求 Delta。

consume 将源文件原样冻结为 `.xirang/changes/<changeName>/change-structural-definition.md`。源存在且副本不存在时复制再删除；两者存在且字节相同时视为可恢复清理；内容不同时返回 `PROVENANCE_CONFLICT`。任何 drift、Change validation 或 coverage failure 都保留隐藏源。冻结副本只记录 Change Formation 历史，不参与后续语义解析、validation、sync 或 Change Closure。

### 8. Existing Change discovery 保持目录边界

普通 Change discovery、selectors、bulk validation、sync、archive 与 viewer 继续只接受非隐藏 Change directories。`.explore-*.md` 是 framing 专用 direct-child regular file。既有 commands 的显式 change name 继续经过 kebab-case 和 directory validation，不能把隐藏文件当作 Change。

### 9. Definition Framing reference 由生成源托管

新增的 Xirang-owned shared reference 基于 `problem-framing` 的因果分析、MECE decomposition 与 BFS confirmation，但只负责结构定义、明确的持久化确认和完整 payload maintenance。现有 Superpowers reference 继续负责 Explore hard gate、context exploration、一次一问、方案比较、section confirmation 与 Design Summary handoff。

Explore/Propose skills 和 shared reference 只通过 template/generation program 修改；generated `.pi/skills` artifacts 不直接编辑。reference 使用显式 managed file list 投影，不以 filename pattern 猜测删除目标。

### 10. 测试按风险分层

持久测试覆盖 parser/render round-trip、REMOVED rules、baseline closure、drift、structural validation、impacts、filesystem lifecycle、JSON envelopes、path/symlink、consume coverage、discovery isolation、template projection 和 temp-workspace end-to-end。现有 Vitest、fast-check、filesystem injection 与 SetupCommand fixtures 足够，不增加 dependency。

一次性完成门禁为 targeted Vitest、`pnpm test`、`pnpm lint`、`pnpm build`、`pnpm audit:identity`、`pnpm test:postinstall`、`pnpm test:pack-install`，并在 OS temp workspace 中执行 built CLI JSON smoke flow。浏览器 E2E、LikeC4 全量测试和 benchmark 不属于本 Change 的完成门禁。

## Risks / Trade-offs

- [Structural Definition 被误当成规范来源] → Contracts 明确 provenance-only，consume coverage 只负责降低检查，Semantic Delta 始终是唯一规范依据。
- [Agent 忘记先前结构] → update 必须提交并确认完整 payload；Change Structural Definition 已形成时，恢复和 Design Exploration 前必须读取完整 `show` 结果。
- [global fingerprint 因无关格式变化失效] → fingerprint 变化本身不阻塞，只有 normalized relevant context 变化才阻塞。
- [baseline closure 漏掉依赖] → 使用闭包 fixtures 与 property tests，Propose/consume 每次重新计算。
- [optional preview 过期] → preview 明确非规范，完整 update 时同步更新或删除，`parent` 始终是唯一 hierarchy 来源。
- [missing constraint 与空数组混淆] → parser、renderer 和 round-trip tests 固定两种不同语义。
- [consume 中断] → copy-then-delete 幂等状态允许恢复，相异副本 fail closed。
- [隐藏文件泄漏到 Change lifecycle] → hidden filename、regular-file type 与所有 discovery regression tests 共同隔离。
- [无 readiness 状态导致恢复不确定] → CLI 只恢复已确认结构，不声明完整度；Agent 必须向用户询问而不猜测。
- [跨平台 symlink 能力不同] → containment 与 path normalization tests 全平台运行；symlink filesystem cases 在平台允许创建 symlink 时执行并在 Windows CI 验证。
