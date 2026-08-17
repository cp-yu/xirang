## Why

Edera 等大型 Candidate 的部分 focus/expanded adhoc projection 会触发 Graphviz 边路由退化，布局输出缺少个别 edge 的 spline 几何。此前投影解析器将缺少几何视为不可恢复错误，导致整个 projection 请求以 `failed on parsing view adhoc edge ...` 失败，页面上所有节点都无法呈现。

## What Changes

当 Graphviz 布局输出中某条 edge 没有 Bezier 几何时，服务端记录 warning 并跳过该 edge，其余 nodes 与 edges 继续构成 projection；系统不伪造该 edge 的路径。整体 projection 请求不再因单条无几何 edge 失败。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `xirang-projection-service`: 布局退化边由整体失败改为记录 warning 并跳过

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- `likec4/packages/layouts/src/graphviz/GraphvizParser.ts`：`parseEdgePoints` 返回可空值，无几何 edge 降级跳过
- `likec4/packages/layouts/src/graphviz/GraphvizParser.spec.ts`：新增缺失 `_draw_` 与无 Bezier 几何的回归测试
- 运行时行为：`POST /__xirang/projection` 不再因单条 edge 无几何返回错误
