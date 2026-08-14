## Context

`semantic-browser` 的 36 条 requirement 混合了两类语义：面向用户的浏览编排（三维控制、focus/breadcrumb、导出、视口适配）与经 Xirang 改造的 LikeC4 的机制语义（base model 生成与缓存、runtime projection、diff overlay、Contract 投递）。结构目标已在 Explore 阶段通过 Definition Framing 确认并持久化（`explorationId: 20260814T054809Z-088fa4bc`），本 design 记录将 framing 编译为 Semantic Delta 的迁移决策。本 change 是纯模型重构：零代码改动，浏览器可观察行为不变。

## Goals / Non-Goals

**Goals:**
- 结构：`web` 取代 `semantic-browser`，3 个修改 child 各承接一处机制语义，Definition 边界与 framing payload 一致。
- Contract 迁移：36 条 requirement 全部有归属，行为语义不变（只改宿主与主语措辞）。
- 文案一致性：`.xirang/model/` 内 "Semantic Browser" 全部替换为 "Web"，无旧 identity 名称残留。

**Non-Goals:**
- 不改变浏览器任何可观察行为（含 diff 渲染、导出、导航）。
- 不改动 `visual-presentation`、`semantic-model`、`cli` 上既有 LikeC4 相关 requirement 的行为语义（仅文案替换）。
- 不动 `.xirang/history/` 与 `.xirang/changes/archive/` 的不可变历史。

## Decisions

1. **结构按 framing payload 原样编译**。`web`（parent `interaction-surfaces`）+ 3 child 的 Declaration 与 `supports-presentation` 端点迁移直接来自 framing，不重新应用 decomposition。
2. **requirement 归属映射**（语义能力维度，非目录维度）：

   | 目标 | 整体迁移 | 拆分承接 | 合计 |
   |---|---|---|---|
   | `web` | 16 | 3（Change 组合 / Candidate View 派生 / Change 生命周期收敛） | 19 |
   | `xirang-projection-service` | 8 | 1（Change 生命周期服务端重建信号） | 9 |
   | `xirang-diff-overlay` | 1 | 2（diff 视觉表达 / Candidate diff-only 呈现） | 3 |
   | `xirang-contract-delivery` | 7 | 1（Contract source 热更新的 manifest 部分） | 8 |

3. **4 条拆分 + 1 处合并**：
   - "呈现 Change 目标与差异" → `web#呈现 Change 目标与差异`（三维组合、三种 Mode、不建独立 View source；场景：三个 Mode）+ `xirang-diff-overlay#呈现语义差异视觉表达`（outline/徽标/关系边/面板计数的全部视觉编码；场景：四态节点、关系边、计数徽章、无 diff 默认）。
   - "呈现 Candidate 目标与差异" → `web#呈现 Candidate 目标与差异`（两个 View 的派生与入口；场景：浏览 active Candidate、Candidate invalid）+ `xirang-diff-overlay#固定呈现 Candidate diff-only 差异`（固定 diff-only；场景：审查 Candidate diff）。
   - "活动 Change 生命周期变化时收敛状态" → `web#活动 Change 生命周期变化时收敛状态`（Browser 状态收敛；场景：被归档、目录被移除）+ `xirang-projection-service#检测活动 Change 生命周期变化并重建 manifest`（服务端重建信号；场景：缺少 filename 的 watcher 事件）。
   - "Contract source 热更新" → `xirang-contract-delivery#Contract source 热更新`（manifest 重建与 Contract requests 失效、未打开 Contract 语义；场景：打开的 Contract 被修改、source 无效）。其服务端投影部分（重建基础 cache、失效旧 projection requests）与既有 `xirang-projection-service#原子刷新基础 LikeC4 缓存` 完全重合，**合并入该 requirement，不单设重复 requirement**——迁移前后语义并集不变。
4. **主语措辞机械替换**：迁移后 requirement 正文中 "Semantic Browser" → "Web"，其余措辞与全部 Scenario 原文保留，保证行为语义等价。
5. **标题改名用 REMOVED+ADDED**：`cli#配置 Semantic Browser 监听地址` → `cli#配置 Web 监听地址`；`interaction-surfaces#由 CLI 与 Semantic Browser 组成` → `interaction-surfaces#由 CLI 与 Web 组成`。其余 MODIFIED requirement 标题不变（标题不含旧名）。
6. **文案迁移范围**：8 个 Element 的 Definition/Contract 中约 12 处 "Semantic Browser" 替换为 "Web"（`interaction-surfaces`、`cli`、`model-view`、`derived-views`、`collaboration-structure`、`authored-views`、`internal-agents`、`visual-presentation`），"普通 Semantic Browser" 特化为 "普通 Web 界面"。

## Risks / Trade-offs

- [拆分导致语义丢失] → 拆分采用"原文分句搬运"，design 映射表逐条对照，验证时按并集核对；合并处语义由既有 requirement 覆盖。
- [文案替换漏点或误伤] → 机械全局替换限定在受影响 requirement 内，最终以 grep 残留检查 + `xirang validate` 收口。
- [浏览器行为回归] → 零代码改动；作为 One-time Verification 跑既有 Vitest 冒烟确认无回归。

## Migration Plan

无运行时迁移。Semantic Delta 经 `xirang sync` 原子应用到 `.xirang/model/`；sync 前 `xirang arch validate --change` 与 `xirang validate --change` 必须零 ERROR。代码与测试文件零改动。

## Open Questions

无。
