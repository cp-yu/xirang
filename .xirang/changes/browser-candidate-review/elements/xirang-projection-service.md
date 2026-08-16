---
entity: element-declaration
identity: xirang-projection-service
kind: element
parent: web
title: Xirang Projection Service
definition: Xirang Projection Service 是 Web 对 LikeC4 的服务端投影改造：将受管 Semantic Model、active Candidate 与活动 Change 的语义内容确定性转换为原生 LikeC4 base model，并经官方 parser、validator、compute-view 与 Graphviz layout 生产 runtime projection。它独立建模以隔离投影机制与差异呈现、Contract 投递及浏览编排的边界；包含 base model 生成与原子缓存发布、runtime manifest 与 fingerprint 失效、当前层 Relationship 聚合与 Xirang→LikeC4 内容映射，不包含语义差异的视觉表达与 Element Contract 的按需投递。
---

## MODIFIED Requirements

### Requirement: 聚合当前层 Relationships

Web SHALL 将每个深层 Relationship 的 endpoints 映射到当前层最深的可见 Element；仅当两个 endpoints 均可映射且映射结果不同时形成 visual edge。映射到相同可见 source/target 的多个 Relationships SHALL 合并为单条 visual edge：该 edge 保留 LikeC4 布局的多关系聚合 label 与全部关系三元组，系统 SHALL NOT 为每个 Relationship 渲染几何重叠的独立 edges；每个 source Relationship 仍保留独立详情三元组、Kind 语义与 diff state，A→B 与 B→A SHALL NOT 合并。携带单条 Relationship 的 edge SHALL 保留该 Relationship Kind 的 presentation。

#### Scenario: 展开后 endpoint 下移

- **WHEN** 一个 Relationship endpoint 的 ancestor 被就地展开且该 endpoint 随之可见
- **THEN** edge 连接该 endpoint 本身而不再连接其 ancestor container

#### Scenario: 存在 reciprocal Relationships

- **WHEN** source 同时包含 A→B 与 B→A
- **THEN** Graphviz 为两个方向产生可视觉区分的独立 edges 与箭头
- **AND** 任一 edge 可独立选择并打开对应详情

#### Scenario: 同向 Relationships 合并呈现

- **WHEN** 多个 Relationships 映射到相同可见 source/target
- **THEN** Browser 将它们合并为单条 visual edge，且不为每个 Relationship 渲染几何重叠的独立 edges
- **AND** 该 edge 保留 LikeC4 布局的多关系聚合 label 与全部关系三元组
- **AND** 用户悬停或选择该 edge 时，各 Relationship 的详情与 diff operation 分别呈现

#### Scenario: 查看投影边的关系详情

- **WHEN** 用户悬停投影视图中的关系边
- **THEN** 关系详情按 Xirang 关系三元组（`source|kind|target`）与 relationship-kind 语义呈现
- **AND** 呈现不依赖 LikeC4 relation id 在浏览器模型中的查找
