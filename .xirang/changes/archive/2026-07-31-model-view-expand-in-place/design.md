## Context

Model View 的运行时投影由 `materializeXirangArchitectureView` 从完整 Semantic Model 派生，此前只取 focus 与 direct children，并用一个只按子节点数量计算的平铺网格函数确定几何。焦点几何在上一次修正中已改为真正包围 direct children，本次要在此基础上让任意深度的后代能在同一层内可见。

**Perspective shape 收敛只覆盖 shape，不覆盖颜色生效性。** `component` 由 `ComponentTopLeftRect` 以 `offsetX: -20` 画在节点左外侧并走 `.top-left-rect` 独立 stroke；`document` 走 `data-likec4-fill="fill"`，装饰完全在节点边界内。这部分已由 `ElementShape.tsx` 的 `ShapeSvg` 直接读出并写入 Contract。

颜色则存在一处先于本次改动的实现偏离，本次不修：`LikeC4Styles.tsx` 的 `generateBuiltInColorStyles` 只遍历 `$styles.theme.colors`，生成选择器 `[data-likec4-color=<注册调色板名>]`；而 `ElementNodeContainer.tsx` 把 `node.color` 原样写入 `data-likec4-color`，`perspectiveColor()` 产出的裸 hex（如 `#4c7a2a`）匹配不到任何规则，`--likec4-palette-fill` 等变量对 Perspective 节点从未赋值，因此「不同无障碍颜色」在渲染层未真正生效。该要求在收敛前的 Semantic Model 中已存在，本次 Delta 未新增也未消除它。修法应在容器层为非调色板颜色注入 inline CSS 变量兜底，并补充取 computed style 的渲染层断言——现有单测只断言 `perspectiveColor()` 返回值互不相同且对比度达标，e2e 只断言几何与可见性，两层都覆盖不到解析末端。此项留作独立 Change。

## Goals / Non-Goals

**Goals:**

- 在不改变 `model` identity、不新增 Views 的前提下，让当前层可同时呈现任意深度的展开后代
- 让展开状态属于整个 View，下钻与历史导航不重置它
- 保留 focus 下钻，与就地展开并存，由不同交互触发
- 将 Perspective shape 规范收敛到实现，并保留颜色区分作为可辨识性保证

**Non-Goals:**

- 不把展开状态写入 URL 或导航历史
- 不改变 Relationship 聚合以外的投影语义，不改变 LikeC4 生成端
- 不引入新的 Element、Relationship、Kind 或 View

## Decisions

**展开状态放在 View 级全局集合，而非按 focus 层保存。** `expandedNodes: ReadonlySet<string>` 位于 diagram machine 的根 `Context`，`expand.toggle` 与 `expand.set` 在根机器的 `on` 处理，与 `update.nodeData` 同层。这样 focus 变化、breadcrumb 与前进后退天然不触及它，无需额外保存与恢复逻辑。若按 focus 层保存，回退时需要重建历史快照，复杂度高且与「a 展开到 c 后下钻到 b 仍见 c」的预期不符。放在 `ready` 状态的 `on` 中经验证无效，根层级既正确又与现有全局事件一致。

**几何改为自底向上测量、自顶向下放置的两段式递归。** `measure` 递归计算每个可见节点尺寸：叶节点固定 `LEAF_WIDTH × LEAF_HEIGHT`，容器尺寸由其行布局撑开；`place` 按绝对坐标下发位置，容器内容从 `CONTAINER_HEADER` 之下开始。容器尺寸依赖其展开子树深度，因此必须先测量再放置，无法单遍完成。

**展开容器独占整行，叶节点按 `GRID_COLUMNS` 打包。** `packRows` 遇到有行的子节点（即展开容器）时先冲掉当前叶行，再给它单独一行。混排变尺寸节点需要装箱算法，收益低且易产生视觉噪声；独占整行使每层行高由该行最高元素决定，几何可预测。无展开时该算法与旧的按列数计算逐字节等价，`architectureView.spec.ts` 中以 `toEqual` 断言了这一点。

**Relationship endpoint 改为映射到最深可见 Element。** 按可见树前序遍历，每个可见节点把自身在完整模型中的全部后代映射到自己，深层可见节点后写覆盖浅层结果。无展开时等价于旧的「映射到最近可见 child」；展开后关系自然从容器下移到新可见的后代。

**双击下钻、Ctrl+点击展开、Shift+数字按层展开。** 双击经新增的 `xyflow.nodeDoubleClick` 事件与 `nodeDoubleClick` 发射事件传递，`BaseXYFlow` 中原有的 `onNodeDoubleClick={stopPropagation}` 因 `{...props}` 在其后展开而被覆盖。Ctrl 状态由 `xyflow.nodeClick` 携带 `ctrlKey` 传递，避免在 UI 层另设键盘监听。Shift+数字用 `event.code` 匹配 `Digit[0-9]`，因为 US 布局下 Shift+2 的 `event.key` 是 `@`。

**多击序列中的第二次 click 不转发给状态机。** 用原生 `MouseEvent.detail >= 2` 判定。否则双击的第二次 click 会在 focused 状态命中「点击已聚焦节点」分支打开 element details 面板，遮挡后续操作——e2e 首次运行正是因此失败。details 仍可由节点上的显式 Open details 按钮打开。

## Risks / Trade-offs

- [vendored LikeC4 源码改动后 CLI 与浏览器仍加载旧 `dist/`，单测走 sources 条件因而全绿，产生误判] → 任何 `likec4/packages/**/src/` 改动后、取端到端证据前必须执行 `pnpm --dir likec4 build`
- [Perspective 颜色在渲染层未生效，而 Semantic Model 仍要求“不同无障碍颜色”] → 已在 Decisions 记录完整证据链与修法，留作独立 Change；本次 Delta 不就颜色生效性作出新承诺
- [深度展开使单层节点数与画布尺寸增长，可能影响可读性与布局性能] → 展开由用户逐个或按层显式触发，默认集合为空；真实模型 61 elements 全展开的几何已验证无重叠且严格内含
- [单击不再下钻改变既有肌肉记忆，属 BREAKING] → 双击与 Ctrl+点击均为常见树形浏览约定，并提供 Shift+数字批量展开与 Shift+0 快速折叠
- [展开状态不进入 URL，分享链接无法还原展开] → 集合序列化成本与收益不匹配，且 focus 仍可通过导航还原
