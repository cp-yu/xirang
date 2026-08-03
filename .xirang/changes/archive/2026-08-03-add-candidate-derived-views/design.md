## Context

当前 `xirang view` 通过 `src/core/view.ts` 生成正式 Semantic Model 的 LikeC4 source，并通过 runtime manifest 向 Semantic Browser 提供 Model View 与 active Change-derived Views。Candidate 已有 `validateCandidateSnapshot`、Semantic Model parser、Formal comparison 和 review digest，但这些结果尚未进入 View runtime。

本 Change 同时跨越 Candidate core、View runtime、LikeC4 Xirang overlay、Contract loader、Vite plugin、SPA/Diagram UI 与 desktop/mobile E2E。目标是让 active Candidate 在 promotion 前可视化浏览，并将完整 Candidate 预览与 Candidate diff 审查分成两个 Derived View。

## Goals / Non-Goals

**Goals:**

- 增加唯一的 `candidate` source，对应 `Candidate View`，只呈现 active Candidate 的完整目标 Semantic Model。
- 增加唯一的 `candidate-diff` source，对应 `Candidate Diff View`，固定呈现 Semantic Model → Candidate 的 diff-only 结果。
- Candidate invalid 时保留 source、diagnostics 和可解析 architecture，不使用 stale snapshot。
- 让 Candidate Contract、Element details、focus 回退、刷新和 selector 与当前 source 保持一致且 source 隔离。
- 通过一次 Candidate snapshot 同时生成两个 source，避免重复读取和解析。

**Non-Goals:**

- 不替换普通 Authored View selector 为 Candidate 的 Authored Views。
- 不在 Candidate View 中显示 diff，不在 Candidate Diff View 中提供 Full context 切换。
- 不修改 Candidate source、Formal Semantic Model、review digest、promotion 或 Change Closure 行为。
- 不新增 CLI `--candidate` 入口，不启动第二个 LikeC4 project，不把 Candidate 伪装成 Change。
- 不新增依赖。

## Decisions

### 1. 使用两个一等 runtime sources

manifest 升级为 `version: 3`，保留现有 `semanticModel` 与 `changes`，增加可选的 `candidate` 与 `candidateDiff` 字段。字段存在表示 active Candidate 存在；没有 active Candidate 时不生成这两个字段。source identity 固定为 `candidate` 和 `candidate-diff`，selector 顺序固定为 Model、Candidate、Candidate Diff、Changes。

Candidate source 的 `architecture`、`contracts` 和 `partitionFingerprints` 全部来自 Candidate；Candidate Diff source 复用同一 Candidate target，并附加 Formal → Candidate 的 projected diff。两个 source 的 `valid` 与 diagnostics 绑定同一个 Candidate validation snapshot。

将 Candidate 放入 `changes` 会把 Candidate 错误表达成 Change，并污染 Change-derived View、Contract source 和诊断语义；生成第二个 LikeC4 project 则会重复 project、布局和 Contract source 管理，因此均不采用。

### 2. 复用 Candidate snapshot 与现有 Xirang overlay

View runtime 为 Candidate 增加一个只读 runtime builder：一次调用 `validateCandidateSnapshot`，保留解析得到的 Candidate model、validation result 和 Formal comparison，再分别调用 `projectBrowserArchitecture`、`projectContracts` 与 `projectBrowserDiff`。

Candidate View 使用 `materializeXirangArchitectureView` 的 `full` mode；Candidate Diff View 使用 `diff` mode。正式 LikeC4 source 仍由当前 Semantic Model 生成，Candidate 中不存在于正式模型的 Element 使用现有 identity overlay 和确定性 grid fallback，不回写 LikeC4 cache 或 Semantic Model。

Candidate View 中没有基础 LikeC4 model node 的 Candidate Element 也必须能打开 Properties、Contracts 和可用的 Candidate details；Details 不得仅依赖 ADDED diff entry 才识别 Candidate Element。Candidate Authored Views 保留在 runtime architecture 数据中，但本次不替换普通 LikeC4 View selector。

### 3. invalid Candidate 仍可浏览但不使用 stale state

active Candidate 存在时，无论 validation 是否有效，都生成 `candidate` 与 `candidateDiff` source。若 parser 能建立部分 model，source 携带该 architecture；无法建立目标模型时仅携带 `valid: false`、diagnostics 和 fingerprints 能力范围内的结果。source selector 显示 Invalid 与 diagnostics，Formal Model 和 active Changes 仍可独立浏览。

系统不得缓存或显示上一次有效 Candidate 作为当前 Candidate。Candidate 文件变化后两个 source 都重新从当前 snapshot 构建。

### 4. 统一 Contract source reference

将 `XirangContractLoader.load` 的 Change 专用参数替换为 source identity。HTTP endpoint 使用受控的 `source` query：省略表示 Semantic Model，`change:<name>` 表示 active Change，`candidate` 表示 Candidate View，`candidate-diff` 表示 Candidate Diff View。服务端通过 manifest 的显式 source lookup 读取 Contract，不拼接文件路径；未知 source、路径注入值和 `variant` 均返回明确错误。

runtime source 的 `changeFingerprint` 泛化为 `sourceFingerprint`。`semanticModelFingerprint` 继续表示 Candidate Diff 的比较基线；Candidate source 只携带自身 source fingerprint。

### 5. 刷新边界与 focus

`.xirang/candidate/**` 变化时同时刷新 Candidate 与 Candidate Diff；`.xirang/model/**` 变化时刷新 Model、Candidate、Candidate Diff 和所有 active Changes；单个 `.xirang/changes/<name>/**` 只刷新对应 Change source。source 被删除或当前 focus 不再存在时，沿旧 ancestor chain 回退到最近存在的 Element，否则回退 Project Root。

Candidate Diff View 固定 diff-only。现有 Change-derived View 继续保留 Full context / Diff only 切换；Candidate View 固定完整目标态。

### 6. 保持现有技术栈和跨平台约束

实现使用现有 TypeScript、Node.js、ESM、LikeC4、React、Vite plugin、Vitest 和 Playwright。Candidate、manifest、snapshot 和 Contract endpoint 的路径均使用 `path.join()` 或 `path.resolve()`；不通过字符串拼接构造 filesystem path。Candidate source 与 manifest 的 source identity 使用显式 lookup，不使用宽泛 regex 推断 source 类型。

## Risks / Trade-offs

- [Risk] Candidate parser 只能得到部分模型时画布可能不完整 → 保留 `valid: false` 和 diagnostics；无法形成目标模型时不显示伪造画布，也不回退 stale snapshot。
- [Risk] Candidate 新 Element 没有正式 LikeC4 geometry → 复用现有 identity overlay 和确定性 grid fallback，并通过 desktop/mobile E2E 检查非空和不重叠。
- [Risk] manifest v2 与旧 Contract consumers 不兼容 → 明确升级到 `version: 3`，同步更新 SPA、Vite plugin、loader、tests，不静默兼容旧 schema。
- [Risk] Candidate 与 Formal Model 文件较大 → 两个 source 共享一次 validation snapshot、解析结果、contracts 和 fingerprints。
- [Trade-off] Candidate Authored Views 不进入普通 selector → 保持本 Change 只解决 Candidate Model View 与 Candidate Diff View；Candidate `views` 仍保留在 runtime semantic data 中，后续可单独形成 Change。
- [Risk] source 切换后旧 Contract 或 focus 泄漏 → source revision、selected source identity、AbortController 和 ancestor fallback 必须共同参与刷新测试。

## Migration Plan

1. 先完成 Core runtime 与 Candidate source types，再同步 Diagram、SPA 和 Vite plugin 的 `version: 3` protocol。
2. 更新现有 Model/Change 测试 fixtures，使其明确使用 `version: 3` 和 `sourceFingerprint`。
3. 增加 Candidate valid、invalid、source refresh、Contract isolation 与 desktop/mobile E2E 覆盖。
4. 不需要数据迁移；旧 runtime manifest 直接拒绝，重新启动 `xirang view` 生成 v3 manifest 即可。
5. 回滚时恢复旧 runtime source 协议和现有 Model/Change 代码，不触碰 Candidate、Formal Semantic Model 或 Change artifacts。

## Open Questions

None. Candidate View、Candidate Diff View、invalid behavior、manifest shape、Contract source protocol、Authored View scope 和 verification strategy 已在 Explore 中确认。
