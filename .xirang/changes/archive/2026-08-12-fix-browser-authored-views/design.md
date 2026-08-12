## Context

Semantic Browser 的投影链路由两个独立的 LikeC4 模型实例驱动：服务端投影经 `fromSources` 从内存虚拟文档（`virtual:/workspace/...`）计算，SPA 的 `likec4model` 来自插件主项目 `fromWorkspace` 的磁盘文档。关系 id 为 `stringHash(docUri ::: astPath ::: source ::: target)`，docUri 参与哈希，因此同一关系在两个实例中 id 不同，投影边的关系 id 在前端模型中永远无法解析。

此前 Authored View 整体不可用：切换视图时 DiagramUI 把全模型根作为 actor 初始 focus，focus 镜像 effect 对视图外 focus 反复 dispatch 而被 clamp 拒绝，形成无限渲染循环并饿死投影请求，Authored View 一直回退渲染 Model View 内容；breadcrumb 被 `selected.id === 'model'` 门控；投影边 hover 触发的关系 popover 对单关系边报错、对多关系边静默失效。

## Goals / Non-Goals

**Goals:**
- 恢复模型承诺的 Authored View 行为：声明边界内渲染、视图根 focus、breadcrumb、就地展开
- 让投影边的关系详情走 Xirang 关系元数据解析，消除跨模型实例 id 不一致的影响
- 支持空分区以 VCS 占位文件（`.gitkeep`）存在，不破坏解析

**Non-Goals:**
- 不统一服务端投影与 SPA 的 LikeC4 模型实例（架构级改造，影响面过大）
- 不修改 LikeC4 上游的关系 id 方案
- 不改变多关系边因合成 id 不触发 stock popover 的既有静默行为

## Decisions

- **focus 镜像守卫（`mirrorActorFocus` 纯函数 + `focusableIdentities`）**：actor focus 不在当前 View 选择边界内时不再镜像回 controller，杜绝 clamp 拒绝导致的无限循环与投影饥饿。备选：统一模型实例，影响面过大被否。
- **Authored View 初始 focus = 视图根（`roots[0]`）**：切换视图时不再把全模型根注入 actor，使 focus 镜像与 breadcrumb 从一致的视图根出发。
- **breadcrumb 扩展至 Authored View 且路径在视图边界截断**：门控从 `selected.id === 'model'` 改为 `selected.source === 'semantic-model'`（覆盖 Model 与 Authored），祖先遍历在视图选择闭包外停止，避免显示视图外不可导航的祖先按钮。
- **投影服务端 Authored View 分支支持 `expanded`**：与 Model 分支一致地生成 `children` selector，使就地展开在 Authored View 内生效。
- **Relationship popover 走 `xirangRelations` 元数据**：投影边由服务端附加 `source|kind|target` 三元组元数据；popover 从 `selected.architecture` 解析元素标题与 relationship-kind 语义，直接/嵌套分组按边端点 `elementId` 判定。stock 路径保留给非投影边。备选：改写边 relations 使其匹配前端模型，无法获得前端模型 id，被否。
- **解析器跳过分区内点文件**：`readModelTree` 与 candidate `readSnapshot` 跳过以 `.` 开头的条目，使 `.gitkeep`/`.DS_Store` 等 VCS 与系统占位不进入语义解析。fixture candidate 以 `.gitkeep` 补齐 `views/` 分区（四分区校验要求目录存在）。

## Risks / Trade-offs

- [单关系投影边 hover 仍打开 stock popover（现已正常解析），多关系边因 `:xirang:` 合成 id 找不到视图边而静默不弹出] → 属既有静默行为且 Xirang 自身边详情 Modal 已覆盖详情查看，不在本次范围
- [`browse relationships` 按钮对投影边打开的是 likec4 磁盘模型视图的详情面板，仍不可用] → 既有行为，Xirang 边点击详情不受影响
- [跳过点文件可能掩盖误放入分区的点文件名内容] → 点文件非模型内容，收益（支持 VCS 占位）大于风险
- [Authored View 根为多根时以 `roots[0]` 作初始 focus 的呈现] → 与 controller `architectureRoot` 口径一致，多根场景回退到空 focus 的 children 投影

## Migration Plan

- 代码已实现并全量验证：likec4 单元 142 例、根仓库单元 125 例、Playwright e2e 39/39（桌面 + 移动端）
- 无数据迁移；回滚即还原本变更涉及的源码与 fixture 文件
