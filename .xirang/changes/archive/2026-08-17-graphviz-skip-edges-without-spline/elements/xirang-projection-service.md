---
entity: element-declaration
identity: xirang-projection-service
kind: element
parent: web
title: Xirang Projection Service
definition: Xirang Projection Service 是 Web 对 LikeC4 的服务端投影改造：将受管 Semantic Model、active Candidate 与活动 Change 的语义内容确定性转换为原生 LikeC4 base model，并经官方 parser、validator、compute-view 与 Graphviz layout 生产 runtime projection。它独立建模以隔离投影机制与差异呈现、Contract 投递及浏览编排的边界；包含 base model 生成与原子缓存发布、runtime manifest 与 fingerprint 失效、当前层 Relationship 聚合与 Xirang→LikeC4 内容映射，不包含语义差异的视觉表达与 Element Contract 的按需投递。
---

## MODIFIED Requirements

### Requirement: 保持 LikeC4 投影有效

Web SHALL 关闭 `implicitViews`，将受管语义内容降为原生 LikeC4 model 内容并由官方 parser 与 validator 建立 base model，再让每个 runtime semantic projection 完整经过官方 compute-view 与 Graphviz layout；降级与投影 SHALL 省略 LikeC4 无法表示的 self 与 ancestor-chain Relationships，同时保持 siblings、跨子树关系及 source 中的原始 Relationships 不变。当 Graphviz 布局输出缺少某条 edge 的 spline 几何（无 `_draw_`、无 Bezier draw op 或路径点不足）时，投影 SHALL 记录 warning 并跳过该 edge，其余 nodes 与 edges SHALL 继续构成 projection，SHALL NOT 使整个 projection 请求失败，且 SHALL NOT 伪造穿过容器的直线路径。

#### Scenario: 生成 runtime projection

- **WHEN** 服务端从 Model、Authored selection、Change target 或 Candidate 生成当前可见投影
- **THEN** 该投影在已 parse 与 validate 的 base model 上经官方 compute-view 与 Graphviz layout 生成唯一 layouted result
- **AND** Browser 不再通过固定网格或中心曲线重建最终 `DiagramView`

#### Scenario: LikeC4 无法表达 source Relationship

- **WHEN** source 包含 self 或 ancestor-chain Relationship
- **THEN** LikeC4 projection 确定性省略该 edge
- **AND** Semantic Model、Candidate 或 Change source 保留原始三元组

#### Scenario: Graphviz 未产出边几何时降级

- **WHEN** Graphviz 布局输出中某条 edge 缺少 spline 几何（无 `_draw_`、无 Bezier draw op 或路径点不足）
- **THEN** 服务端记录 warning 并跳过该 edge
- **AND** 其余 nodes 与 edges 继续构成 projection，请求成功返回
- **AND** 系统 SHALL NOT 伪造穿过容器的直线路径
