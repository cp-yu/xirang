## Context

[INFERRED FROM CODE] Semantic Browser 通过完整 Semantic Model 生成 `.xirang/.cache-likec4/`，再启动嵌入式 LikeC4。现有缓存只有空的 authored `views.c4`，LikeC4 因而只生成包含根 Element 的默认 `index`；此外，LikeC4 拒绝端点位于同一 ancestor chain 的关系。WSL 中未指定监听地址时，服务可能只绑定 IPv6 loopback，Windows 的 `localhost` 转发无法访问。

## Goals / Non-Goals

**Goals:**

- 复用 LikeC4 原生 implicit views 实现 Element 层级下钻。
- 保留 Authored Views，并让同一 Element 的 Authored scoped View 优先于 implicit view。
- 只在 LikeC4 投影边界省略其无法表达的关系，不修改 Xirang IR 或正式 Semantic Model。
- 将用户提供的监听地址从 `xirang view` 透传到 LikeC4。

**Non-Goals:**

- 不持久化 Derived Views，也不创建 Derived View Semantic Delta Entry。
- 不删除正式 Semantic Model 中的 self 或 ancestor-chain relationships。
- 不修改 LikeC4 前端或重新实现 scoped view 导航。
- 不默认将浏览服务暴露到全部网络接口。

## Decisions

1. **通过生成项目配置启用 LikeC4 implicit views**
   - 生成器以固定常量输出 `likec4.config.json`，项目名为 `xirang` 并启用 `implicitViews`。
   - 采用 LikeC4 原生派生逻辑，因为它已经提供 scoped views、`navigateTo` 和 Authored scoped View 优先规则。
   - 不采用在 `views.c4` 中物化每个 derived view 的方案，避免把生成期视图混入 Authored Views。

2. **在 LikeC4 渲染边界过滤不可表示关系**
   - 依据 Element Declaration 的显式 `parent` 链判断 ancestor/descendant，不依据 identity、FQN 或文件路径前缀推断层级。
   - 仅省略 self 与 ancestor-chain endpoints；siblings 和跨子树关系继续输出。
   - 输入 Semantic Model 保持不变，过滤结果只影响缓存中的 `relations.c4`。

3. **显式透传监听地址**
   - `xirang view` 新增可选 `--listen <address>`，经 `ViewCommand` 传给 LikeC4 `--listen`。
   - 默认值保持未指定，避免无意扩大网络暴露；Windows/WSL 用户可显式使用 `0.0.0.0`。
   - 直接运行 `likec4 start` 不会刷新 Xirang 缓存，因此受支持入口仍是 `xirang view`。

## Risks / Trade-offs

- [Risk] LikeC4 implicit view 的 ID 属于生成期表示，不是稳定 Semantic Model identity → Mitigation: 只依赖导航行为，不将 ID 写回正式模型或 Delta。
- [Risk] 过滤关系会使 LikeC4 图少于正式模型 → Mitigation: 过滤仅限 LikeC4 明确拒绝的端点组合，正式 IR、查询与验证仍保留全部关系。
- [Risk] `--listen 0.0.0.0` 会向可达网络接口开放服务 → Mitigation: 参数保持显式可选，默认不改变 LikeC4 的本地监听策略。
- [Risk] 旧缓存仍可能缺少项目配置 → Mitigation: `xirang view` 启动前重新生成完整缓存；不把直接启动 LikeC4 作为受支持工作流。
