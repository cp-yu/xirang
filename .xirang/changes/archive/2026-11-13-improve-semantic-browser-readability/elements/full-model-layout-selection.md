---
operation: "ADDED"
entity: "element-declaration"
identity: "full-model-layout-selection"
kind: "browser-specification"
parent: "visual-presentation"
title: "Full Model 布局择优"
definition: "Full Model 布局择优是 Visual Presentation 中在原生 LikeC4 与 Graphviz 管线内选择 Full Model 空间组织的能力。它独立建模以维护兄弟单元折行的适用范围、几何安全和收益门槛，包含候选生成、比较与普通布局回退；不定义 Authored View 布局、运行时 focus 或 View identity。"
---

## ADDED Sections

### Section: Scope and Non-goals

Full Model 布局择优 SHALL 只作用于 Semantic Model、Candidate 与活动 Change 的 Full Model runtime projections，在原生 Graphviz 候选之间选择；不通过手工 geometry 或 spline 替换结果。

### Section: Business Logic

Full Model 布局择优 SHALL 仅为 Full Model 的 Semantic Model、Candidate 与活动 Change runtime projections 启用兄弟单元折行择优；Authored projections、dynamic 与 deployment views SHALL 保留既有布局行为。系统 SHALL 在各 compound cluster 及 root 内按直接子单元的实际节点尺寸、容器间距与标题空间递归估算包围尺寸，选择估算宽高比最接近 1.6 的列数，并通过同一容器内相邻行之间的 invisible edges 约束 Graphviz；这些约束边 SHALL NOT 成为可见或语义 Relationships。

每次择优 SHALL 分别计算折行与普通布局，并仅在折行布局同时满足以下条件时采用：

1. 本次 Graphviz 调用没有错误或 pathplan、triangulation 类 routing 告警；恢复成功的重试错误亦视为失败。
2. 输出 edge 数不少于输入，每条输出 edge 至少有两个路径点；每个子节点均在父 compound bbox 内，允许 1px 坐标取整容差。
3. 按 `min(1600 / width, 1000 / height)` 计算的 fit zoom 至少为普通布局的 1.05 倍。
4. 全部 edges 路径点折线长度之和不超过普通布局的 1.5 倍。

普通布局 SHALL 每次择优只计算一次。

含 compound endpoint edges 的两个候选 SHALL 均跳过 `unflatten`；其他 Element View 候选 SHALL 保留既有 `unflatten`，判定只依据 layout 前的 endpoint 拓扑。

### Section: Edge Cases and Exception Handling

任一安全条件失败时 SHALL 记录含 view identity 与原因的 warning 并使用普通布局；收益或边长条件不满足时 SHALL 使用普通布局并记录 debug 原因。若普通布局本身失败，SHALL 沿用既有结构化错误与 retry 行为。

### Section: Key Acceptance Cases

系统 SHALL 通过以下验收案例验证本 Contract 的承诺。

#### Acceptance Case: 折行改善全图可读性

- 折行安全检查通过，fit zoom 从 0.14 升至 0.18，边长为普通布局的 0.8 倍
- Browser 使用折行布局，输出中不包含 invisible 约束边

#### Acceptance Case: 达到择优边界

- 折行安全检查通过，fit zoom 恰为普通布局的 1.05 倍，边长恰为 1.5 倍
- Browser 使用折行布局

#### Acceptance Case: 折行收益不足或路由不安全

- fit zoom 提升不足 5%、边长超出 1.5 倍、Graphviz routing 告警、丢边、路径点不足或子节点越界中的任一条件成立
- Browser 使用普通布局；安全失败产生 warning，正常择优淘汰产生 debug
- 带 compound endpoint edges 的两个候选均不执行 `unflatten`

#### Acceptance Case: 普通布局失败

- **GIVEN** 折行被淘汰且普通布局也无法完成
- **WHEN** Browser 请求该 projection
- **THEN** 显示既有结构化错误与 retry，不生成替代 renderer
