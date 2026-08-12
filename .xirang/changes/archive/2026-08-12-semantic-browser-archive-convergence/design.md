## Context

`xirang view` 以递归 `fs.watch` 监听 `.xirang/`，在受管 source 变化时重建运行时 manifest 并刷新基础 LikeC4 缓存 `.cache-likec4`。原有缓存发布把 live 目录整体 rename 为 backup、再把 staging 目录 rename 为 live；被递归 watcher 跟随的 backup 目录随后被删除，Node 22 的 recursive watcher 因此抛出未处理 `ENOENT`，使 `xirang view` 进程退出。同时，活动 Change 被归档时，watcher 只匹配 `changes/<name>/` 前缀路径，漏掉目录自身事件 `changes/<name>`，导致 manifest 未重建、浏览器继续保留已归档 Change。

## Goals / Non-Goals

**Goals:**
- 活动 Change 被归档或移除时，服务端重建 manifest，Browser 收敛到无 Change 的 `complete` 状态并清除残留展开状态。
- 基础缓存发布不中断被监听目录：live 目录身份保持稳定，逐文件原子替换，失败时回滚到 last-known-good。
- 跨平台覆盖 watcher 事件形态：目录自身事件、archive 侧事件、缺少 filename 的事件。

**Non-Goals:**
- 不改变 Change、View、Mode 三维独立状态模型。
- 不改变 projection 的推导语义或 diff 视觉呈现。
- 不处理多 Change 聚合或 Candidate 生命周期（沿用既有行为）。

## Decisions

- **缓存发布改为 live 目录内逐文件原子替换**：先在临时 staging 目录生成并 `validate`，再为每个生成文件在 live 目录内写同目录临时文件、`rename` 覆盖，最后按显式清单删除不再生成的文件；从不整体 rename 或删除被监听的 live 目录。理由：目录整体 swap 会把 recursive watcher 带到一个随后被删除的 backup 目录；逐文件替换只产生单个文件的 add/change 事件，且任何时刻旧文件都存在。备选：目录级 generation 间接层，会改变服务端对外路径布局，过度侵入。
- **发布前建立 last-known-good 备份并在失败时回滚**：发布前把 live 目录完整复制到 `mkdtemp` 的 backup 目录；发布失败时用同一逐文件发布算法从 backup 恢复 live 内容。回滚也失败时保留 backup 目录并抛 `AggregateError`（发布错误 + 回滚错误），而不是静默删除唯一备份。理由：保证"重建失败时保留 last-known-good"的既有承诺不因新机制退化。
- **watcher 事件分类集中为 `watcherRefreshForPath`**：活动 Change 目录自身及后代事件 → 仅重建该 Change 的增量；`changes/archive` 侧事件、缺少 filename 的事件、model 分区与 candidate 事件 → 全量重建。理由：archive 是目录移动，事件形态取决于平台；缺少 filename 的事件无法定位精确路径，全量重建是唯一确定收敛。
- **Controller 收敛与既有 clamp 分离**：新增 `reconcileSemanticBrowserState`，仅在"当前 Change Selection 在新 manifest 中消失"这一转换上清空 expanded set 并回到 `complete`；`clampState` 仍负责普通选择切换时的 focus/expanded 修剪。理由：用户主动清除 Change 不应清空 Model 中仍合法的展开状态，只有 Change 生命周期消失才需要清空来自其 projection 的残留展开。
- **根测试注入发布器故障**：`generateLikeC4Artifacts` 增加可注入 `publisher`，使单测能以确定性故障注入覆盖发布失败与回滚，而不依赖真实文件系统时序。

## Risks / Trade-offs

- [Node 22 以下版本的 recursive `fs.watch` 行为差异] → 事件分类以"缺少 filename 即全量重建"兜底，不依赖具体事件负载。
- [回滚期间 live 目录短暂为中间态] → 逐文件 rename 保证单文件原子；多个文件间的中间代可通过后续刷新自动收敛，且失败路径恢复 last-known-good。
- [发布与回滚同时失败] → 保留备份目录并报告复合失败，避免静默丢失 last-known-good；残留备份可人工清理。
- [`reconcileSemanticBrowserState` 每次 manifest 引用变化都分配新 state] → 有界的一次额外渲染，effect 仅依赖 `manifest`，不会形成 setState 循环。
