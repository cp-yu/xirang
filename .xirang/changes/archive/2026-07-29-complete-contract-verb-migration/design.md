## Context

Semantic Model 已将 Element Contract 作为 Element 规范行为的唯一表达，Change 也已由四分区 Semantic Delta compiler 驱动。实现层仍存在三套已经失配的表面：无生产调用的 legacy main-spec parser/schema/validator，重复且 deprecated 的 `xirang change` command group，以及实际加载 Contract 却继续公开 Spec 命名的 Semantic Browser API。它们共同扩大兼容面，并让当前用户文档、CLI JSON 与代码符号无法准确表达同一语义对象。

本 Change 是一次 clean break。现有使用旧 CLI flags、noun-first command group、Browser loader exports、HTTP endpoint 或 test selectors 的调用方必须同步迁移；不提供 forwarding alias。实现必须继续支持 macOS、Linux 与 Windows，文件系统路径使用 Node.js `path` API，URL endpoint 使用现有 HTTP routing 机制。

## Goals / Non-Goals

**Goals:**

- 删除 legacy main-spec parser、schema、validation stack 及仅验证该链路的测试。
- 让顶层 `show`、`list` 与 `validate` 完整承接有效能力，并删除 `xirang change` group。
- 将公开 CLI、内部 discovery/completion/task reference 和 Xirang-specific Browser API 统一为 Element Contract 术语。
- 保持 compiler-derived Change JSON、Contract 内容、Browser variants、diff、abort 与错误语义不变。
- 以持续测试覆盖目标接口，并用一次性 residual scan 证明旧表面已清除。

**Non-Goals:**

- 不删除或迁移 `.xirang/specs/**/spec.md` 历史意图数据。
- 不修改 LikeC4 自身合法的 `Specification` 领域术语。
- 不重命名 `spec-driven` schema identity、artifact schema keys 或 archive artifacts。
- 不改变 Semantic Model、Semantic Delta compiler、Element Contract Markdown 语法或 Browser visual behavior。
- 不引入新依赖、兼容 aliases 或新的通用抽象层。

## Decisions

1. 删除 legacy parser stack，而不将其改名为 Contract parser。`src/core/model/parser.ts` 与 `Validator.validateElementContract()` 已承担当前规范职责；保留 `MarkdownParser`、`SpecSchema` 或 `validateSpec*()` 只会形成第二语义来源。仍被 Formal Model 与 task verification 使用的 requirement block/text helpers 保留，并删除或改写其 main-spec 注释。

2. 删除整个 `ChangeCommand` 与 `.command('change')` registration。`ShowCommand` 直接调用现有 Change compiler；`ListCommand` 共享一次 Formal Semantic Model 读取并编译活动 Changes。相比 forwarding group，此方案避免继续维护重复 options、diagnostics 与交互分支。`xirang new change` 属于顶层 `new` group，不受本次删除影响。

3. 保持顶层 list JSON envelope 为 `{ changes: [...] }`。每项沿用 `name`、task、time、status 与 freshness fields，并增加 compiler-derived `title` 和 `deltaCount`；`deltaCount` 取实体级 `compiled.diff.summary.total`。`--long` 文本模式展示 title、Delta 数量与 task 状态，不引入旧 `ChangeCommand.list()` 的第二套 JSON shape。

4. 公开 Contract terminology 采用 clean break：`--contracts`、`--type contract` 与 JSON `type: "contract"` 是唯一 forms。同步重命名 discovery、completion、interactive choice、task reference local symbols 和 user-facing diagnostics；不使用兼容 union 或 hidden aliases 接受 `spec`。

5. Semantic Browser 对 Xirang-specific API 做协议级原子迁移。diagram context/provider/hooks、Contract tab/controller/state、SPA HTTP loader、Vite handler/error、`/__xirang/contract` endpoint、public exports 与 `data-xirang-contract*` selectors 在同一 Change 中更新。Formal/Change variant manifest 和 `XirangContractContent` 数据结构保持不变，避免把纯命名迁移扩大成 runtime redesign。

6. 当前文档和 package metadata 使用 Semantic Model 与 Element Contract 术语。明确标记为 historical record 的文档、archive artifacts、LikeC4 generic `Specification` 与 workflow schema tokens 保持原样。清理采用受控文件和 symbol 列表，不用全局 Spec→Contract 文本替换。

7. 测试先迁移公开 contract，再删除旧实现。CLI tests 先锁定 root help、unknown `xirang change`、list envelope/long output、show compiler JSON 与 Contract validation；Browser tests 先锁定新 exports、endpoint、404、abort、variant refresh 和 selectors。随后删除 legacy parser/schema tests，并保留 Formal Model parser/validator 回归覆盖。

8. 文件重命名和路径构造继续使用仓库既有模块边界与 Node.js `path` API；测试中的文件系统期望使用 `path.join()`。HTTP route 是 URL protocol token，不通过文件系统 path 拼接。generated `lib/` 只由现有 build 生成，不手工编辑。

## Risks / Trade-offs

- [Risk] 旧 CLI 脚本和 Browser consumers 会立即失效 → 在 tests、help、当前文档和 package exports 中一次性发布新 contract，并明确不提供 aliases。
- [Risk] `list` 编译每个活动 Change 会增加 I/O → 共享一次 Formal Semantic Model 读取，并复用现有 compiler，不增加第二缓存层。
- [Risk] 广泛术语清理可能误改 LikeC4 或历史语义 → 只迁移 Xirang-specific 显式清单，并让 residual scan 对 historical、archive、schema token 和 LikeC4 `Specification` 使用 allowlist。
- [Risk] 删除 source-spec normalization tests 后历史 `.xirang/specs/` 不再获得该覆盖 → 将这些文件明确视为未迁移历史数据，后续通过独立 Change 做数据迁移与覆盖验证。
- [Risk] Browser route、loader 和 provider 未同步会造成 runtime 断链 → 在 diagram、SPA、Vite plugin 与 E2E 四层建立同一 `/__xirang/contract` contract 测试。
- [Risk] CodeGraph 当前含旧 LikeC4 索引 → Apply 和 Review 以当前源码、TypeScript build、tests 与 `rg` 结果为证据，不以旧索引判断完成。

## Migration Plan

1. 先以 failing tests 定义 verb-first CLI、Contract discriminator 和 Browser Contract protocol。
2. 迁移 CLI consumers 与 Browser producer/consumer chain，再删除 deprecated group 和 legacy parser stack。
3. 更新当前文档、metadata、completion 与 tests，并执行受控 residual scans。
4. 运行 root 与 LikeC4 的 lint、build、typecheck、unit tests、Browser E2E 和 Xirang validations。失败时回退本 Change 的实现提交；不需要数据回滚，因为本次不修改 Semantic Model 数据或历史 specs。

## Open Questions

None
