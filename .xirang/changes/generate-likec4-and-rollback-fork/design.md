## 输入契约

生成器的输入是 C1 定义的 IR，直接引用 `.xirang/changes/rebuild-semantic-model-kernel/design.md` 共享命名节，不另行命名：

```ts
import type {
  SemanticModel, ModelElement, ElementDeclaration,
  ElementKind, RelationshipKind, Relationship, AuthoredView,
} from '../model/types.js';
```

生成器**只消费 IR**，不接触 `.xirang/model/` 文件系统。这与 C1 的 `validator.ts` 边界一致，使生成可在 Delta 应用后的内存模型上直接执行，无需先落盘。

## 方向区分

C1 的 `serializer.ts` 与本 Change 的 `generator.ts` 方向相反，命名必须不冲突：

| 模块 | 方向 | 目标 | 是否权威 |
|---|---|---|---|
| `src/core/model/serializer.ts` | IR → 四分区 Markdown/YAML | `.xirang/model/` | 是，持久源 |
| `src/core/likec4/generator.ts` | IR → 嵌套 `.c4` | `.xirang/.cache-likec4/` | 否，可丢弃产物 |

因此生成器导出 `generateLikeC4`，不复用 `serialize*` 前缀。

## 模块布局

```text
src/core/likec4/
├── paths.ts          .xirang/.cache-likec4/ 常量与文件名
├── local-names.ts    identity → 局部名派生与冲突消解
└── generator.ts      IR → 嵌套 .c4 文本
```

### 函数签名

```ts
// paths.ts
export const LIKEC4_CACHE_DIR_NAME = '.cache-likec4';
export function likec4CacheDir(projectRoot: string): string;

// local-names.ts
export interface LocalNames {
  /** identity → 该次生成内的局部名 */
  nameOf(identity: string): string;
  /** identity → 从 root 起算的点分路径，供关系端点引用 */
  pathOf(identity: string): string;
}
export function deriveLocalNames(elements: readonly ModelElement[]): LocalNames;

// generator.ts —— 确定性：相同 IR 逐字节相同输出
export function generateLikeC4(model: SemanticModel): Map<string, string>;
```

`generateLikeC4` 返回 `Map<相对文件名, 内容>`，由调用方（C3）落盘到 `likec4CacheDir()`。生成器本身不做 I/O——这使它可纯函数测试，且从结构上无法回写持久源，满足 `xirang-contract.md:132`。

### 产物文件划分

```text
.xirang/.cache-likec4/
├── specification.c4    element / relationship kind 声明
├── model.c4            嵌套 element 树
├── relations.c4        关系边
└── views.c4            Authored View
```

沿用现有 `src/core/templates/architecture-skeleton.ts:15-20` 的四文件划分。产物是整体重生成的可丢弃缓存，文件划分无语义，不需要与 `.xirang/model/` 的四分区对应。

## 局部名派生

LikeC4 的 element 名必须是合法 `Id`，而 identity 允许 `.` 与 `-`（`xirang-contract.md:97`），两者不兼容。派生规则：

1. 取 identity 最后一段（按 `.` 切分）作为基名——`cap.architecture.likec4-reader` → `likec4-reader`。
2. 非法字符替换为 `_`；首字符非字母或 `_` 时前置 `_`。
3. 同一 parent 下若基名重复，按 identity 字节序追加 `_2`、`_3` 消解。
4. `pathOf` 由 parent 链的 `nameOf` 用 `.` 连接。

第 3 条是必须的：identity 全局唯一，但截取末段后可能在同一 parent 下碰撞（例如 `a.reader` 与 `b.reader` 同为某 domain 的子元素）。冲突消解只需在单次生成内成立，不要求跨版本稳定（`xirang-contract.md:132`），因此按字节序而非插入序，保证确定性。

现有 `src/utils/architecture-delta-merger.ts:159-177` 的 `buildFqns` 已做类似派生，但它优先复用 `element.fqn` 字段（`:170`）——该字段已被 C1 从 IR 移除，且 `.replace(/[^A-Za-z0-9_-]/g, '_')`（`:174`）不处理同 parent 碰撞。本 Change 重写而非复用。

## 生成内容

### specification.c4

```likec4
specification {
  element capability
  element domain
  relationship invokes
}
```

只输出 kind 名。`root`/`contract`/`parents`/`children`/`sourceKinds`/`targetKinds` **一律不输出**——它们由 `metamodel/` 单元的 frontmatter 承载（`xirang-contract.md:83-85`），且 LikeC4 无原生记法表达。这是删除 fork 语法扩展的直接依据。

对比现有 `architecture-delta-merger.ts:202-217`：`:202` 输出 `xirang { languageVersion }`，`:210` 与 `:217` 在 kind 有约束时输出 `{ xirang { ... } }`。三处全部不保留。

### model.c4

```likec4
model {
  project_root = project 'Root' 'Project intent' {
    metadata {
      elementId 'project.root'
    }
    architecture = domain 'Architecture' 'Architecture intent' {
      metadata {
        elementId 'domain.architecture'
      }
    }
  }
}
```

`parent` 为 null 的元素为根，按 `parent` 递归嵌套。`metadata { elementId }` 必须保留——它是产物侧回溯 identity 的唯一依据，`src/utils/likec4-reader.ts:86` 的 `fqn → identity` 映射依赖它，`ElementDetailsCard.tsx:132` 亦以 `stableElementId` 取 Contract。

Element Contract 正文**不进入 `.c4`**。LikeC4 无 Requirement 记法，Contract 由 diagram 侧经 identity 直接取（C5）。

### relations.c4

```likec4
model {
  project_root.architecture -[invokes]-> project_root.cli
}
```

端点用 `pathOf`。无 `description`——IR 已移除该字段（C1 design 的 `Relationship` 定义）。

### views.c4

```likec4
views {
  view index {
    title 'Xirang Architecture'
    include *
    autoLayout TopBottom
  }
  view refinement of project_root {
    include *
  }
}
```

`of` 与 `include` 的 element identity 经 `pathOf` 转为 LikeC4 引用。`include: '*'` 直出 `include *`；identity 列表逐项转换。

## 确定性

生成是 IR 的确定性函数：相同 IR 必须产出逐字节相同输出。这与 `xirang-contract.md:177` 对 serializer 的要求同源——虽然产物可丢弃，但非确定性会使「整体重生成」在无语义变化时产生 diff，干扰 C3 的缓存与 watcher 判断。

排序规则：

- 同一 parent 下的兄弟元素按 identity 字节序
- kind 声明按 identity 字节序
- 关系按 `source`、`kind`、`target` 依次字节序
- View 按 identity 字节序

排序一律用字节序比较，不用 `localeCompare`——现有 `architecture-delta-merger.ts:203` 使用 `localeCompare`，跨 locale 结果不稳定，本 Change 不沿用。

## fork 回退

### 删除范围

| 位置 | 内容 |
|---|---|
| `like-c4.langium:13` | `xirang+=XirangLanguageBlock \|` |
| `like-c4.langium:35-38` | `XirangLanguageBlock` |
| `like-c4.langium:40-43` | `XirangElementAnnotation` |
| `like-c4.langium:45-48` | `XirangElementAnnotationProperty` |
| `like-c4.langium:50-53` | `XirangRelationshipAnnotation` |
| `like-c4.langium:55-56` | `XirangRelationshipAnnotationProperty` |
| `like-c4.langium:58-59` | `XirangKindArray` |
| `like-c4.langium:80` | `xirang=XirangElementAnnotation?` |
| `like-c4.langium:112` | `xirang=XirangRelationshipAnnotation?` |

### 生成物重生成

`src/generated/{ast.ts,grammar.ts,module.ts}` 与 `src/generated-lib/icons.ts` 一律经脚本重生成，**绝不手改**。`generated/ast.ts` 现有 93 处 Xirang 引用，`generated/grammar.ts` 是单行序列化 JSON，手改必然与 `.langium` 失配（勘察 R4）。

必须用 `pnpm generate` 而非裸 `langium generate`：`package.json:131` 的 `pregenerate` 会清空整个 `src/generated`（含 `module.ts`），`package.json:134` 的 `generate` 串联 `langium generate && tsx scripts/generate-icons.ts`，后者重建 `src/generated-lib/icons.ts`（`scripts/generate-icons.ts:68-69`）。只跑 `langium generate` 会留下缺失文件。

### 测试修复

| 文件 | 改法 | 依据 |
|---|---|---|
| `__tests__/specification.spec.ts:5-34` | 删整个 `'OPSX v1 annotations'` 用例 | 整例基于 xirang 块，无可保留断言 |
| `__tests__/model.spec.ts:276-297` | 删首行 `xirang { languageVersion '1' }` 与四处 `{ xirang { ... } }`，kind 声明退化为 `element project` 等 | 该例验证的「任意深度嵌套 + `metadata { elementId }`」与 xirang 语法无关，且正是产物形态，必须保留 |
| `lsp/CompletionProvider.spec.ts:34` | 从 entry 级期望数组移除 `'xirang'` | 顶层关键字不再存在 |
| `lsp/CompletionProvider.spec.ts:63` | 从 element body 级期望数组移除 `'xirang'` | 挂载点删除后不再补全 |

`model.spec.ts` 的改造是本次唯一需要保留语义的测试改动：它证明产物形态（嵌套 + elementId metadata）在回退后仍被 LikeC4 接受，是生成器与 fork 的接缝证据。

## 风险

**R1 局部名碰撞消解不确定**。同 parent 下基名重复时，若按插入序而非字节序追加后缀，相同 IR 会因遍历顺序不同产出不同名字，破坏确定性。

缓解：`deriveLocalNames` 先按 identity 字节序排序再分配，属性测试验证同一 IR 连续两次生成字节相同，并构造同 parent 同末段的碰撞夹具。

**R2 生成物被 LikeC4 拒绝**。派生名可能撞上 LikeC4 保留字（`model`、`specification`、`views`、`element`、`extend` 等），或嵌套结构违反 LikeC4 约束。

缓解：以真实 `likec4 validate` 校验生成产物——`src/commands/arch/runner.ts:6` 的 `runLikeC4` 是既有进程边界，可直接复用。构造含保留字末段的 identity 夹具（如 `x.model`）验证转义。

**R3 回退遗漏挂载点**。`.langium` 删规则但漏删 `:80` 或 `:112` 的可选字段引用，`langium generate` 会因未定义规则报错——这是好的失败，会立即暴露。反之若漏删规则本体而删了挂载点，规则变成不可达但生成仍成功，遗留死语法。

缓解：回退后以 `rg Xirang likec4/packages/language-server/src` 断言零命中（排除测试注释），并跑 `pnpm typecheck` 确认 `generated/ast.ts` 无残留类型。

**R4 fork 包测试跨包依赖**。language-server 测试可能依赖已构建的 `@likec4/core` 等 workspace 包，回退后单跑该包测试可能因构建产物过期而失败，与本次改动无关。

缓解：若出现非 Xirang 相关失败，先确认基线——回退前先跑一次该包测试记录既有失败集，只对比新增失败。

**回滚条件**：若 `pnpm generate` 后 language-server 出现无法在两轮内定位的非 Xirang 失败，则 `git checkout` 恢复 `.langium` 与 `src/generated/`、`src/generated-lib/`，保留生成器改动（生成器不输出 xirang 块本身不依赖回退），fork 回退推迟到 C3 之后单独执行。生成器与回退可分离，因为生成器不输出 xirang 块只会让 fork 的语法扩展变成未使用，不会报错。
