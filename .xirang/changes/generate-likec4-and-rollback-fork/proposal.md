## Why

契约已确定 LikeC4 不参与持久化：`.c4` 是由 Semantic Model 生成的产物，用于渲染与校验，每次整体重新生成（`xirang-contract.md:126-132`）。当前方向相反——`src/utils/likec4-reader.ts:112` 从 `.xirang/architecture/**/*.c4` 读取模型，`.c4` 是唯一持久源。C1 已建立 `src/core/model/` 作为新持久源的读写层，但缺少反向的生成能力，`.xirang/model/` 中的 IR 无法交付 LikeC4 渲染与校验。

同时 vendored fork 的 `.langium` 含六条 Xirang 语法规则与三个挂载点，用于容忍 `.c4` 中的 `xirang {}` 块。这些块承载的 `root`/`contract`/`parents`/`children`/`sourceKinds`/`targetKinds` 在目标态由 `metamodel/` 单元的 frontmatter 承载（`xirang-contract.md:83-85`），`.c4` 无需再表达。勘察确认这些语法规则**没有任何运行时消费者**——主流程的 `src/utils/likec4-parser.ts:90-98` 用 `replaceRangesWithWhitespace` 把 xirang 块整体涂白后才交给 LikeC4，语义由主仓库自己的正则解析器读取。因此回退的唯一硬前置是生成产物不再包含 xirang 块。

两件事必须同一个 Change 完成：生成器若保留 xirang 输出，回退后 `xirang view` 会语法报错；反之若先回退而生成器未就位，则无任何产物可校验。

## What Changes

- 新增 `src/core/likec4/` 生成器：读 C1 的 `SemanticModel` IR，按 `parent` 重建嵌套结构，输出嵌套 `.c4` 到 `.xirang/.cache-likec4/`。
- 局部名由 identity 确定性派生，仅需单次生成内无冲突，不要求跨版本稳定（`xirang-contract.md:130`）。
- 生成器**不输出 `xirang {}` 块**，Metamodel 只输出 LikeC4 原生的 `element <kind>` 与 `relationship <kind>` 声明。
- 生成器**不回写持久源**：只写 `.xirang/.cache-likec4/`，不触碰 `.xirang/model/`（`xirang-contract.md:128`）。
- **BREAKING** 删除 fork `.langium` 的 `XirangLanguageBlock`、`XirangElementAnnotation`、`XirangElementAnnotationProperty`、`XirangRelationshipAnnotation`、`XirangRelationshipAnnotationProperty`、`XirangKindArray` 及三个挂载点（`:13`、`:80`、`:112`），经 `langium generate` 重生成 `src/generated/`。
- 修复受影响的三个 fork 测试，使 language-server 包内部测试恢复绿。
- `.gitignore` 加入 `.xirang/.cache-likec4/`。

## 目标语义依据

本 Change 不产生新的目标语义，全部依据既有定义与契约：

| 依据 | 位置 |
|---|---|
| LikeC4 不参与持久化，`.c4` 为整体重生成产物 | `xirang-contract.md:126-128` |
| 生成产物落 `.xirang/.cache-likec4/`，不纳入版本控制，不得写入 `.xirang/model/` | `xirang-contract.md:130` |
| 派生局部名只需单次生成内无冲突，不要求跨版本稳定，不得回写持久源 | `xirang-contract.md:132` |
| Metamodel 约束由 `metamodel/` 单元 frontmatter 承载 | `xirang-contract.md:83-85` |
| identity 是引用语义对象的唯一依据，语法位置不构成 identity | `xirang-definition.md:77` |
| 输入 IR 类型与模块路径 | `.xirang/changes/rebuild-semantic-model-kernel/design.md` 共享命名节 |

因本次不做 sync，不创建 `architecture-delta.c4` 与 `specs/`；目标语义由 `xirang-definition.md` 与 `xirang-contract.md` 承载。

## Impact

**新增**

- `src/core/likec4/generator.ts` — IR → 嵌套 `.c4` 文本
- `src/core/likec4/local-names.ts` — identity → 局部名派生与冲突消解
- `src/core/likec4/paths.ts` — `.xirang/.cache-likec4/` 路径常量与解析

**修改**

- `likec4/packages/language-server/src/like-c4.langium` — 删六条规则与三个挂载点
- `likec4/packages/language-server/src/generated/{ast.ts,grammar.ts,module.ts}` — `langium generate` 重生成，不手改
- `likec4/packages/language-server/src/generated-lib/icons.ts` — `pregenerate` 清空 `src/generated` 后由 `pnpm generate` 一并重生成
- `likec4/packages/language-server/src/__tests__/specification.spec.ts:5-34` — 删 `'OPSX v1 annotations'` 用例
- `likec4/packages/language-server/src/__tests__/model.spec.ts:276-297` — 去 xirang 块，保留任意深度嵌套与 `metadata { elementId }` 断言
- `likec4/packages/language-server/src/lsp/CompletionProvider.spec.ts:34,63` — 移除两处 `'xirang'` 期望项
- `.gitignore` — 加 `.xirang/.cache-likec4/`

**不属于本 Change**

- CLI 命令面改造、`src/core/view.ts:39` 的源目录接线（C3）
- 旧栈删除：`src/utils/architecture-delta-merger.ts:202-217` 的 xirang 输出、`src/utils/likec4-reader.ts`、`src/utils/likec4-parser.ts`（C3）
- diagram 的 Xirang UI 与 `architectureView.ts:140` 的 fqn 对齐改造（C5）

**中间态**

按已接受前提，本 Change 完成后项目整体可以构建不通：旧序列化器 `architecture-delta-merger.ts:202` 仍输出 `xirang { languageVersion }`，而 fork 已不再接受该语法，`xirang view` 在 C3 删除旧栈前不可用。全量测试恢复绿由 C3 承担。本 Change 只保证 `src/core/likec4/` 新增测试与 language-server 包内部测试为绿。

**残留风险**

- `.xirang/model/` 当前无数据（C1 残留依赖），本 Change 全部测试使用内存 IR 夹具，不读取仓库现有 `.xirang/architecture/`。
- fork 与 upstream 的 `.langium` 差异未逐项核对（勘察 R5），回退只处理已确认的 Xirang 相关部分。
