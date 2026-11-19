---
entity: element-declaration
identity: change-sync
kind: capability-specification
parent: change-closure
title: Change Sync
definition: Change Sync 是交付归档内部将四分区 Semantic Delta 应用于正式模型的能力。它编译完整目标、验证并只写实际变化的模型单元，在本次调用内与封存共同回滚；它不提供独立 CLI 入口，也不管理 Quality 记录。
---

## Specification

### Section: Target compiler 清空 Contract 时保留 Element Declaration

当一个 Formal Element 的全部 Sections 均通过 change-local `REMOVED Sections` 被显式删除，且 target 中没有剩余、ADDED 或 MODIFIED Section 时，Target Semantic Model compiler SHALL 只清除该 Element 单元正文中的 Contract，保留同一单元中的 Element Declaration（identity、kind、parent、title、definition 不变）。

对于 contract policy 为 `optional` 的 Element Kind，序列化后 Element 单元 SHALL 只含 Declaration（declaration-only 单元）；对于 contract policy 为 `required` 的 Element Kind，Target Semantic Model validation SHALL 因 `MISSING_REQUIRED_CONTRACT` 失败。

只有 change-local 显式声明 `REMOVED` Element Declaration Entry，且删除后 containment 与 relationships 等依赖校验通过时（Element 的 Contract 随宿主单元一并删除），atomic writer SHALL 才允许删除整个 Element 单元。

- **全部 Sections 被删除（optional kind）**

  - formal Element 的 Kind contract policy 为 `optional`
  - change 对其全部 Sections 声明精确 REMOVED operation
  - target 没有新增或修改 Section
  - compiler SHALL 保留该 Element 的 Declaration 与稳定 identity
  - SHALL 序列化为只含 frontmatter Declaration 的 declaration-only 单元（正文不含 `## Specification`）

- **全部 Sections 被删除（required kind）**

  - formal Element 的 Kind contract policy 为 `required`
  - target 中该 Element 没有任何 Section
  - Target Semantic Model validation SHALL 返回 `MISSING_REQUIRED_CONTRACT` ERROR
  - sync SHALL 失败且不写入该清空后的 target 状态

- **显式删除 Element Declaration 且依赖校验通过**

  - change-local 对某 Element 声明显式 `REMOVED` Element Declaration Entry
  - 删除后无 surviving descendants、relationships 引用该 identity（Contract 随单元一并删除）
  - atomic writer SHALL 删除整个 Element 单元（Declaration 与 Contract 一并移除）

- **显式删除 Element Declaration 但存在未处理依赖**

  - change-local 声明 `REMOVED` Element Declaration Entry 但该 Element 仍有 surviving children 或 relationships
  - validation SHALL 返回全部 unresolved dependencies
  - MUST NOT 级联删除该 Element 单元

- **删除不完整**

  - formal Element 仍有剩余 Section
  - compiler SHALL 保留该 Contract 正文
  - SHALL NOT 因 Section 数量减少而推断 whole-Contract 或 whole-Element removal

- **删除存在未处理依赖**

  - removed element 仍有 surviving descendants、relationships 或其他 references
  - SHALL 返回所有 unresolved dependencies
  - MUST NOT cascade delete

- **严格 removal**

  - removed element 仍有 surviving descendants 或 relationships
  - SHALL 阻止 sync
  - MUST NOT cascade delete

### Section: Scope and Non-goals

同步 SHALL 仅作为默认及 quick 交付的内部操作，不单独选择 Change，不提供独立命令；不执行测试、不改绑测试或 Review、不改写 Quality 记录。

### Section: Business Logic

同步 SHALL 从同一正式模型快照解析四分区 operation，物化完整目标、构建 identity 索引与差异、联合校验 syntax、identity、contract policy、引用及目标完整性，写入前复核正式模型指纹。只写有差异的单元；不同实体类型的同名 identity 分开路由。未提及的分区不变，无 operation 不写。合法且目标已完全体现在正式模型（包括 REMOVED 已不存在）时无需重写；不能用 identity 相同掩盖内容冲突。

按完整 Section target 与 normalized identity 查找应用 ADDED/MODIFIED/REMOVED，不把冲突 ADDED 当修改；MODIFIED 不保留目标未包含的 Acceptance Case。拒绝 RENAMED，引导移除旧项并新增。按方向和 kind 识别 Relationship，仅允许新增或移除并检查端点。创建 Contract 时保留投影的语言策略、规范标题、关键词、identity 与代码记号，不向无关 Section 注入内容。

### Section: Edge Cases and Exception Handling

同步 SHALL 在正式基线变化、目标路径冲突、存在悬空引用、实际 Delta 无正式模型、空 operation block、非法记法或联合校验失败时阻止交付，指出语义单元与路径，不部分写入。没有声明操作和 Section 操作的 Element 单元仅可作为与 Formal 声明相同的导航占位，不得借此声明变更；只读变更校验与交付使用同一检查。Delta 的 Section 标题必须非空，不得附加与标题以空格分隔的 Markdown 闭合井号，以免将排版误作 identity。Section 操作正文必须归属于有效 Section，不得将非空的游离正文静默丢弃。不同平台均基于原路径组件准备与恢复模型单元。在同一次调用内，写入及其后的封存若失败，撤销已写部分，恢复原模型文件及其权限，保留预先存在的模型目录；成功时可由目标重建索引。仅输出真实警告和错误，JSON 模式输出结构化诊断。

### Section: Key Acceptance Cases

目标一致性与写入边界 SHALL 可从正式模型及活动目录检查。

#### Acceptance Case: 旧版已同步

旧版已应用 ADDED 单元、目标内容相同而 Change 仍活动：通过其他交付门禁后只归档，不重写正式文件。若同一新增 identity 内容不同则报告冲突，不封存。

#### Acceptance Case: 基线被改写

准备后正式模型指纹变化：拒绝所有写入，保留当前模型及活动 Change，提示重新校验。

#### Acceptance Case: 路径碰撞

同名 Element 与 Kind 目标路径不同时分别保留；若两个实体实际映射到同一路径则写入前报出两者及路径。
