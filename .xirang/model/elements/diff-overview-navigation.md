---
entity: element-declaration
identity: diff-overview-navigation
kind: browser-specification
parent: xirang-diff-overlay
title: 差异概览与导航
definition: 差异概览与导航是 Xirang Diff Overlay 中帮助用户理解变化规模并找到变化对象的审阅能力。它独立建模以统一实体分类计数与变化对象索引，包含首页和面板共享计数、列表分组筛选、对象定位和详情入口；不决定差异投影来源、画布操作标记或文本比对。
---

## Specification

### Section: Scope and Non-goals

差异概览与导航 SHALL 提供实体分类汇总与变化对象索引，并在当前 Model、View 与 mode 的边界内支持定位和打开详情；不修改差异条目、View 声明或 Presentation Mode。

### Section: Business Logic

差异概览与导航 SHALL 按以下分类和定位机制组织变化对象。

#### 分类汇总

差异面板 SHALL 将 diff entries 按 Elements、Relationships、Sections、Metamodel、Views 分别统计 ADDED、MODIFIED 与 REMOVED 数量，并仅显示非零操作计数。Elements SHALL 只包含 Element Declaration，Metamodel SHALL 只包含 Element Kind 与 Relationship Kind，Views SHALL 只包含 Authored View；Acceptance Cases 与其他内部子项 SHALL 不单独计数。面板与首页卡片 SHALL 共享该口径，未变化上下文 SHALL 不计入。

#### 变化对象列表与定位

差异面板 SHALL 按 ADDED、MODIFIED、REMOVED 分组列出变化 Elements 与 Relationships。Element 列表 SHALL 将 Declaration entries 与 Section entries 的宿主按 identity 合并；只有 Sections 变化的宿主 SHALL 作为 Contract 变化列出，不能据此增加 Declaration 计数。条目 SHALL 显示可读名称、稳定 identity 与操作，Element 同时显示父 identity 和非零 Section 数量，Relationship 显示 source、kind、target。Element 列表默认展开，Relationship 列表默认折叠；长列表 SHALL 在面板内滚动。总条目数超过 8 时 SHALL 提供不区分大小写的文本筛选，匹配 Element 的名称、identity、父 identity 或 Relationship 的三元组及端点名称。

点击 Element 条目 SHALL 在节点已投影时居中并临时高亮；未投影且其父属于当前 View 选择边界时，SHALL 先将 focus 切换到该父，再待 projection 应用后定位。定位 SHALL 按已展开面板的遮挡区域计算可用画布，并受最小、最大 zoom 约束。系统 SHALL NOT 为定位而擅自扩大 View 边界或切换 mode。点击 Relationship 条目 SHALL 优先定位 source，source 无法定位时尝试 target。独立详情按钮 SHALL 打开对应 Element 或 Relationship 的详情。

窄于或等于 48em 的视口 SHALL 默认折叠整个差异面板，并提供展开开关。

### Section: Edge Cases and Exception Handling

目标在当前 mode 隐藏、父不可用或超出当前 View 边界时 SHALL 显示原因；新 projection 未能呈现待定位节点时 SHALL 报告定位失败。

目标无法定位时 SHALL 保持当前 View 边界与 mode。没有变化对象时 SHALL 不呈现空的变化列表，零计数分类 SHALL 不显示。

### Section: Key Acceptance Cases

系统 SHALL 通过以下验收案例验证本 Contract 的承诺。

#### Acceptance Case: 区分语义实体与宿主节点

- diff 含一个 ADDED Element Declaration、两个 ADDED Sections、一个 ADDED Element Kind 和一个 MODIFIED Authored View
- 分类计数分别为 Elements `+1`、Sections `+2`、Metamodel `+1`、Views `~1`
- Sections 不重复计入 Elements

#### Acceptance Case: 定位未在当前层呈现的节点

- 用户点击列表中一个父 Element 属于当前 View 边界的变化节点，该节点尚未投影
- Browser focus 切换到其父，待节点出现后在可用画布区域居中并高亮
- 当前 Model、View Selection 与 mode 保持不变

#### Acceptance Case: 目标在当前模式隐藏

- 一个 REMOVED Element 不在 complete-with-diff 的目标投影中，其父已为当前 focus
- 用户点击该条目时收到当前模式隐藏目标的说明
- Browser 不切换至 diff-only

#### Acceptance Case: 仅有 Section 变化

- 一个宿主 Element 有两个 MODIFIED Sections，无 Declaration entry
- 列表只出现该宿主一行，标明 Contract 变化及两个 Sections，并可打开详情

#### Acceptance Case: 窄屏展开与筛选

- 窄屏打开一个有 9 条变化对象的非 baseline Model
- 面板默认折叠，展开后可使用筛选；匹配结果按操作分组显示
