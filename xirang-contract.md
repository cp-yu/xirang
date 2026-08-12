# 息壤（Xirang）契约

本文件规定 Semantic Model 与 Semantic Delta 的规范性存储形态、记法与保证。语义对象自身的定义见 `xirang-definition.md`；当两者冲突时，语义以 `xirang-definition.md` 为准。

## 规范对象结构

```text
Semantic Model
├── Metamodel
│   ├── Element Kind
│   └── Relationship Kind
├── Hierarchical Elements
│   └── Element
│       ├── Element Declaration
│       └── Element Contract
├── Relationships
│   └── Relationship
└── Views
    └── Authored View
```

Derived Views 由模型或 Change 确定性推导，不持久化，也不作为 Semantic Delta 的作用对象。

## 存储结构

Semantic Model 完整持久化于 `.xirang/model/`；Semantic Delta 持久化于 `.xirang/changes/<change>/`，Candidate Semantic Model 持久化于 `.xirang/candidate/`。三者采用同构的四类分区。

```text
.xirang/model/
├── metamodel/
├── elements/
├── relationships/
└── views/

.xirang/candidate/
├── metamodel/
├── elements/
├── relationships/
└── views/

.xirang/changes/<change>/
├── metamodel/
├── elements/
├── relationships/
├── views/
├── proposal.md
├── design.md
└── tasks.md
```

Candidate 与 Semantic Model 使用相同的分区、单元形态与字段。Promotion 时以 Candidate 整体替换 `.xirang/model/`；Candidate 中不存在的单元不再保留。

目录与文件名仅为组织约定。它们不表达 identity、层级位置、entity type 或任何其他模型语义；改变文件位置或名称不改变模型。加载时建立 `identity → source module` 索引，据此定位条目所在的存储单元。

默认命名约定如下。它不具规范性，仅用于使生成与人工编写的组织方式一致；偏离它不影响模型。

```text
elements/<element identity>.md
metamodel/<kind identity>.md
views/<view identity>.md
relationships/<relationship kind identity>.yaml
```

Delta 侧在 `.xirang/changes/<change>/` 的对应分区使用相同命名。

## 单元形态

存储单元是可被独立重写的最小文件边界。

| 分区 | 单元 | 形态 |
|---|---|---|
| `elements/` | 一个 Element | Markdown：frontmatter 承载 Element Declaration，正文承载 Element Contract |
| `metamodel/` | 一个 Element Kind 或 Relationship Kind | Markdown：frontmatter 承载约束，正文承载该 Kind 所有实例共享的语义 |
| `views/` | 一个 Authored View | Markdown：frontmatter 承载 View Definition |
| `relationships/` | 条目列表 | 结构化列表，文件仅为容器 |

除 `relationships/` 外，每个单元承载一个实体。`relationships/` 是唯一例外：一个文件承载任意多条 Relationship，每个条目自带完整 identity，因此分组方式是纯组织约定，改变分组不改变记法。默认按 Relationship Kind 分组，使文件集合与 Metamodel 声明的 Relationship Kinds 一致，且不随 Element 增删而变动。

### 字段

| entity type | 字段 |
|---|---|
| `element-declaration` | `identity`、`kind`、`parent`、`title`、`summary` |
| `element-kind` | `identity`、`contract`，可选 `root`、`parents`、`children` |
| `relationship-kind` | `identity`，可选 `sourceKinds`、`targetKinds` |
| `authored-view` | `identity`、`include`，可选 `exclude`、`of`、`title`、`autoLayout` |
| Relationship 条目 | `source`、`kind`、`target` |

`parent` 为 null 时表示 Project Root。`include` 取值为 `'*'` 或 element identity 列表；`exclude` 为 element identity 列表，其整棵后代子树从视图选择中剪除，优先级高于 `include`；`of` 为单个 element identity。

Relationship 的 identity 即其全部内容，不含任何其他字段。

Element Contract 以 `## Requirements` 组织，其下每个 `### Requirement: <name>` 是一个规范性语义条目，Requirement 之下以 `#### Scenario: <name>` 表达场景。`elements/` 单元的正文只包含该段；Element 的描述性文字由 Declaration 的 `summary` 承载，不得重复写入 Contract。正文出现 `## Requirements` 以外的内容时校验报错。Requirement 的 identity 由宿主 Element 的 identity 与 `<name>` 共同确定：在 Delta 中宿主已由所在单元确定，因此只书写 `<name>`；需要全局寻址时书写为 `<element identity>#<name>`。

### identity 约束

identity 使用 `[A-Za-z0-9._-]+`，不得包含路径分隔符或其他文件系统保留字符。Element Kind 与 Relationship Kind 的 identity 在 Metamodel 内全局唯一。

identity 不应编码 parent 路径或层级位置。位置会随模型演进改变而 identity 不变，内嵌位置的 identity 会逐渐失真。这是编写指引，不可程序化校验。

## entity 自声明

frontmatter 承载的条目以 `entity` 字段显式声明自身的 entity type：

```markdown
---
entity: element-declaration
identity: cap.architecture.likec4-reader
kind: capability
parent: domain.architecture
title: LikeC4 Reader
summary: 读取 Semantic Model source modules
---
```

Relationship 条目由所在的 `relationships` 列表标识，Requirement 条目由 `### Requirement:` 标题标识，两者无需额外字段。

分区不参与 entity type 判定。条目出现在与其 entity type 不匹配的分区时，加载仍按其自身声明解析，并报告组织约定不符。

## 引用规则

持久源中一律以 identity 引用语义对象：`parent` 引用 Element identity，Relationship 的 `source` 与 `target` 引用 Element identity，`parents`、`children`、`sourceKinds`、`targetKinds` 引用 Kind identity，`of`、`include` 与 `exclude` 引用 Element identity。

FQN、语法位置与派生局部名不进入持久源。因此单元之间不存在位置引用，任一实体的改名、移动或重新分组都不要求改写其他单元。

## LikeC4 边界

LikeC4 不参与持久化。`.c4` 是由 Semantic Model 生成的产物，用于渲染与校验，每次整体重新生成。

生成产物落于 `.xirang/.cache-likec4/`，不纳入版本控制，不得写入 `.xirang/model/`。

生成期为元素派生的局部名与嵌套结构仅在单次生成结果内有效，只需保证该次生成内无冲突，不要求跨版本稳定，也不得回写持久源。

## Semantic Delta 记法

Delta 单元使用与 Model 单元相同的字段结构，额外携带 `operation` 字段：

```markdown
---
operation: MODIFIED
entity: element-declaration
identity: cap.architecture.likec4-reader
kind: capability
parent: domain.architecture
title: LikeC4 Reader
summary: 读取 Semantic Model source modules 并构建 identity 索引
---
```

```yaml
relationships:
  - operation: ADDED
    source: cap.architecture.delta-merger
    kind: invokes
    target: cap.architecture.likec4-reader
```

「携带完整目标内容」是 per-entry 规则。一个文件可以承载多个属于不同 entity type 的 Entry，各自在自身粒度上完整。`elements/` 下的一个 Delta 单元同时承载：frontmatter 中的一条 Element Declaration Entry，以及正文中零到多条 Requirement Entry。仅修改 Contract 时 frontmatter 不声明 `operation`，只用于定位；仅修改 Declaration 时正文为空。

正文中的 Requirement Entry 以修改语分节表达，`## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements` 分节头为其下所有 Requirement 提供修改语。它与 `operation` 字段是同一 Entry 概念在两种介质下的语法因式分解。

| 分区 | ADDED | MODIFIED | REMOVED |
|---|---|---|---|
| `elements/` Element Declaration | ✓ | ✓ | ✓ |
| `elements/` Requirement | ✓ | ✓ | ✓ |
| `metamodel/` | ✓ | ✓ | ✓ |
| `views/` | ✓ | ✓ | ✓ |
| `relationships/` | ✓ | — | ✓ |

Relationship 不支持 MODIFIED：其 identity 即全部内容，不存在可在 identity 不变的前提下改变的内容。

## Sync 保证

将 Semantic Delta 应用于 Semantic Model 时：

- **最小重写**：只重写 Semantic Delta 实际影响的存储单元，其余单元保持不变。单元之间只以 identity 互引，因此级联重写不会发生。`relationships/` 因采用列表容器，重写粒度为条目所在文件。
- **确定性序列化**：序列化是当前 IR 的确定性函数，相同 IR 必须产出逐字节相同的输出。`relationships/` 的条目按 `source`、`kind`、`target` 依次排序；frontmatter 按固定键顺序输出。缺少这一条，最小重写在列表容器上不成立。
- **全或无**：任一环节失败时完整回滚到应用前状态。

序列化器的往返正确性（`parse(serialize(ir))` 与 `ir` 相等）是测试层属性，由属性测试覆盖转义、多行文本、空集合与缺省字段等边界，不作为运行期断言。

## 语义差异判定

判定两个模型状态是否存在语义差异时，先规范化不具权威顺序的维度，再逐字段比较。

规范化后比较，顺序不构成差异：

- Elements、Relationships、Kinds、Authored Views 各自的集合
- `parents`、`children`、`sourceKinds`、`targetKinds`、`include`、`exclude` 等以集合为语义的列表字段

保留顺序并参与比较：

- 一个 Element Contract 内 Requirement 的先后
- 一个 Requirement 内 Scenario 的先后

划分依据是是否存在权威顺序：跨单元集合的顺序由文件遍历产生，不具权威性；单元内顺序由作者在同一份文档中直接写定，属于其表述语义。

散文内容逐字比较，仅规范化行尾与文件末尾空白。派生字段、文件路径与文件名不参与比较。

差异输出以 entity type 与 identity 为键，不携带存储分区信息。分区是组织约定，改变分组不得影响差异输出。
