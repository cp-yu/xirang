## Context

运行时 projection 的 Graphviz layout 阶段在大型 Candidate 的 adhoc 组合下会输出缺少 spline 几何的 edge（hpcc-js-wasm Graphviz 的 pathplan 退化，日志出现 `triangulation failed`）。原解析器把每条 Graphviz edge 的 Bezier 几何视为必需，缺几何即抛错，使整个 projection 请求失败。代码已实现为降级跳过。[INFERRED FROM CODE]

## Goals / Non-Goals

**Goals:**

- 让缺少边几何的 projection 仍然成功返回其余 nodes 与 edges
- 保留可诊断的 warning，便于识别 Graphviz 路由退化

**Non-Goals:**

- 不修复 Graphviz wasm 的 pathplan 退化本身
- 不为退化边合成直线路径
- 不改变正常边几何的解析结果

## Decisions

1. **跳过退化边而非合成几何**：合成端点直线会穿过容器边界，伪造语义上不存在的路径；跳过与既有“edge 不在 Graphviz 输出中则跳过”的降级行为一致。
2. **warning 而非静默**：warning 携带 view 与 edge id，使 Graphviz 退化可诊断。
3. **保留正常路径的既有校验**：`hasAtLeast` 收窄保证 points 仍满足 `NonEmptyArray` 契约，正常 edge 行为不变。

## Risks / Trade-offs

- [退化边不再渲染] → 该 edge 及其关系详情在该 projection 中不可见；但完整失败会使全部内容不可见，降级损失更小，且 warning 保留 edge id 供排查。
- [重复 warning] → 同一退化组合在缓存未命中时会重复记录；projection cache 对相同请求去重，不会无限刷屏。
