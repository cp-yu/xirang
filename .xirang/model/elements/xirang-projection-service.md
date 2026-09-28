---
entity: element-declaration
identity: xirang-projection-service
kind: element
parent: web
title: Xirang Projection Service
definition: Xirang Projection Service 是 Web 对 LikeC4 的服务端投影改造：将受管 Semantic Model、active Candidate 与活动 Change 的语义内容确定性转换为原生 LikeC4 base model，并经官方 parser、validator、compute-view 与 Graphviz layout 生产 runtime projection。它独立建模以隔离投影机制与差异呈现、Contract 投递及浏览编排的边界；包含 base model 生成与原子缓存发布、runtime manifest 与 fingerprint 失效、当前层 Relationship 聚合与 Xirang→LikeC4 内容映射，不包含语义差异的视觉表达与 Element Contract 的按需投递。
---

## Specification

### Section: 保持 LikeC4 投影有效

Web SHALL 关闭 `implicitViews`，将受管语义内容降为原生 LikeC4 model 内容并由官方 parser 与 validator 建立 base model，再让每个 runtime semantic projection 完整经过官方 compute-view 与 Graphviz layout；降级与投影 SHALL 省略 LikeC4 无法表示的 self 与 ancestor-chain Relationships，同时保持 siblings、跨子树关系及 source 中的原始 Relationships 不变。当 Graphviz 布局输出缺少某条 edge 的 spline 几何（无 `_draw_`、无 Bezier draw op 或路径点不足）时，投影 SHALL 记录 warning 并跳过该 edge，其余 nodes 与 edges SHALL 继续构成 projection，SHALL NOT 使整个 projection 请求失败，且 SHALL NOT 伪造穿过容器的直线路径。

- **生成 runtime projection**

  - 服务端从 Model、Authored selection、Change target 或 Candidate 生成当前可见投影
  - 该投影在已 parse 与 validate 的 base model 上经官方 compute-view 与 Graphviz layout 生成唯一 layouted result
  - Browser 不再通过固定网格或中心曲线重建最终 `DiagramView`

- **LikeC4 无法表达 source Relationship**

  - source 包含 self 或 ancestor-chain Relationship
  - LikeC4 projection 确定性省略该 edge
  - Semantic Model、Candidate 或 Change source 保留原始三元组

- **Graphviz 未产出边几何时降级**

  - Graphviz 布局输出中某条 edge 缺少 spline 几何（无 `_draw_`、无 Bezier draw op 或路径点不足）
  - 服务端记录 warning 并跳过该 edge
  - 其余 nodes 与 edges 继续构成 projection，请求成功返回
  - 系统 SHALL NOT 伪造穿过容器的直线路径

### Section: 分层呈现 Element Definition

Web SHALL 在被浏览 Model 实例（Semantic Model、active Candidate 或活动 Change 的 Expected Semantic Model）的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Candidate、Semantic Delta、CLI 输出、diff 或 fingerprint。

- **查看图节点与 Element 详情**

  - Browser 呈现一个具有多段 Definition 的被浏览 Model 实例中的 Element
  - 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition

### Section: 确定性派生 Definition Excerpt

Definition excerpt SHALL 对 trim 后文本取空行前第一段，将段内换行与连续空白折叠为单空格，并按 Unicode code points 限制为 25 个；超限时 SHALL 截断并追加 `...`，且 SHALL NOT 使用 LLM 或持久化结果。

- **Definition 超过显示上限**

  - 第一段规范化后超过 25 Unicode code points
  - Browser summary 包含前 25 个 code points 和 `...`，description 保持完整原文

- **Definition 不超过显示上限**

  - 第一段规范化后不超过 25 Unicode code points
  - Browser summary 原样使用该规范化段落且不追加省略号

### Section: 聚合当前层 Relationships

Web SHALL 将每个深层 Relationship 的 endpoints 映射到当前层最深的可见 Element；仅当两个 endpoints 均可映射且映射结果不同时形成 visual edge。映射到相同可见 source/target 的多个 Relationships SHALL 合并为单条 visual edge：该 edge 保留 LikeC4 布局的多关系聚合 label 与全部关系三元组，系统 SHALL NOT 为每个 Relationship 渲染几何重叠的独立 edges；每个 source Relationship 仍保留独立详情三元组、Kind 语义与 diff state，A→B 与 B→A SHALL NOT 合并。携带单条 Relationship 的 edge SHALL 保留该 Relationship Kind 的 presentation。

- **展开后 endpoint 下移**

  - 一个 Relationship endpoint 的 ancestor 被就地展开且该 endpoint 随之可见
  - edge 连接该 endpoint 本身而不再连接其 ancestor container

- **存在 reciprocal Relationships**

  - source 同时包含 A→B 与 B→A
  - Graphviz 为两个方向产生可视觉区分的独立 edges 与箭头
  - 任一 edge 可独立选择并打开对应详情

- **同向 Relationships 合并呈现**

  - 多个 Relationships 映射到相同可见 source/target
  - Browser 将它们合并为单条 visual edge，且不为每个 Relationship 渲染几何重叠的独立 edges
  - 该 edge 保留 LikeC4 布局的多关系聚合 label 与全部关系三元组
  - 用户悬停或选择该 edge 时，各 Relationship 的详情与 diff operation 分别呈现

- **查看投影边的关系详情**

  - 用户悬停投影视图中的关系边
  - 关系详情按 Xirang 关系三元组（`source|kind|target`）与 relationship-kind 语义呈现
  - 呈现不依赖 LikeC4 relation id 在浏览器模型中的查找

### Section: 使用分区 Runtime Manifest

Web runtime manifest SHALL 使用 `version: 5`，分别表达 `model`、`authoredViews`、`changes` 以及可选的 `candidate`；`candidate` source 结构 SHALL 与 Change source 对齐，携带 `diff`、`architecture`、`diffArchitecture`、`likec4Sources`、`diffLikec4Sources` 等字段；`candidate` 与每个 change source SHALL 各自携带对其 target Model 实例解析的 `authoredViews` 结果（selection、roots、virtualRoot），供 View Selection 过滤与投影使用；manifest SHALL NOT 包含独立的 `candidateDiff` 字段；旧 manifest version SHALL NOT 被静默解释为 version 5。

- **构建普通 Browser 状态**

  - Browser 加载 version 5 manifest
  - View Selection 从 `model` 与当前 Model source 携带的解析结果建立
  - Model Selection 从 `changes` 与可选的 `candidate` 建立

- **Candidate 可用**

  - active Candidate 存在
  - manifest 包含独立 `candidate` 字段，结构与 Change source 对齐
  - 其 `authoredViews` 为对该 Candidate target 实例的解析结果

- **读取旧 manifest**

  - Browser 收到非 version 5 manifest
  - Browser 返回明确协议错误
  - SHALL NOT 猜测或迁移字段含义

### Section: 服务端计算 Runtime Projection

Web SHALL 由服务端根据 View Selection、Model Selection、Presentation Mode、focus、expanded set 与 expected model fingerprint 确定当前可见 projection；服务端 SHALL 按 `model` 值路由 source（baseline 路由到 `manifest.model`，Candidate 路由到 `manifest.candidate`，活动 Change 路由到 `manifest.changes[<identity>]`），SHALL NOT 依赖 Change Selection 的 reserved identifier；Authored View 投影 SHALL 使用该 source 携带的实例级解析边界生成 predicates；该 projection SHALL 基于已由官方 parser 与 validator 建立的 base model，服务端 SHALL NOT 为单次 request 重复 parse 或 validate 同一 base model。

- **请求有效 projection**

  - Controller 提交与当前模型 fingerprint 一致的 projection descriptor
  - 服务端以官方 include/exclude predicates 在已 parse 且已 validate 的 base model 上计算该 projection
  - 返回 projection key、layouted DiagramView 与 diagnostics

- **model 路由**

  - projection request 的 `model` 分别为 baseline、`candidate` 或某活动 Change
  - 服务端分别路由到 `manifest.model`、`manifest.candidate` 或 `manifest.changes[<identity>]`
  - 三态 Mode 逻辑对非 baseline Model 完全一致

- **请求使用旧 fingerprint**

  - request 的 expected model fingerprint 已不是当前有效版本
  - 服务端拒绝该 request 并返回结构化 stale diagnostic

### Section: 原子刷新基础 LikeC4 缓存

Web 服务端 SHALL 在受管 Semantic Model、Authored View、Relationship、Metamodel、Contract、Candidate 或活动 Change source 变化时合并连续事件，依据显式生成文件清单完整重建基础 `.cache-likec4` 内容，并在临时目录校验成功后以保留 live 目录身份的方式原子发布：每个生成文件先写入 live 目录内的同目录临时文件再 rename 覆盖，SHALL NOT 整体 rename 或删除被监听的 live 目录；发布后失效旧 fingerprint 对应的 runtime projections。发布失败时 SHALL 从 last-known-good 备份恢复 live 内容、发布结构化 diagnostics，并在源修复后自动重试；恢复也失败时 SHALL 保留备份目录并报告包含发布与恢复错误的复合失败。

- **模型变化后刷新 Browser**

  - 一个受管模型 source 发生变化且完整缓存重建成功
  - 服务端原子替换基础缓存、重建 manifest、失效旧 projections 并发送一次 HMR 更新
  - Browser 无需重启即可呈现新模型

- **发布保持被监听目录稳定**

  - 服务端在递归 watcher 监听 live 目录期间重建基础缓存
  - 发布以 live 目录内逐文件临时文件 rename 完成，SHALL NOT 整体 rename 或删除被监听目录
  - watcher 不因 backup 目录被清理而报未处理错误

- **重建失败**

  - 新 source 无法解析、验证或生成完整 LikeC4 cache
  - 当前 last-known-good cache 保持可用
  - Browser 显示结构化 diagnostics，且不读取半成品

- **跨平台处理缓存路径**

  - watcher 在 Windows、macOS 或 Linux 返回 source path
  - 服务端使用 Node.js path API 与 normalized project-relative key 定位显式缓存依赖
  - 不假设路径分隔符或通过模糊 pattern 删除生成文件

### Section: Candidate source 按输入刷新

Web SHALL 以 source identity、partition fingerprint 与 model fingerprint 区分 Candidate runtime data；Candidate source 变化 SHALL 只刷新 `manifest.candidate`，Semantic Model 变化 SHALL 在基础缓存原子替换成功后刷新 Model、Candidate 与活动 Change 数据，并失效旧 runtime projections。

- **Candidate 修改后刷新**

  - `.xirang/candidate/` 下任一受管 Candidate file 发生变化
  - Browser 刷新 `manifest.candidate`
  - 普通 Browser 的 View 与 Change selections 保持不变

- **Semantic Model 修改后刷新**

  - `.xirang/model/` 下任一受管 Semantic Model file 发生变化
  - Browser 在完整缓存重建成功后发布新 manifest 与 fingerprint
  - 旧 projection response 不得覆盖新状态

### Section: 检测活动 Change 生命周期变化并重建 manifest

Web 服务端 SHALL 将活动 Change 目录自身事件、`changes/archive` 侧事件以及缺少 filename 的 watcher 事件视为重建 manifest 的信号，使该 Change 不再出现在 Model Selection 的 change 值中。

- **缺少 filename 的 watcher 事件**

  - watcher 返回缺少 filename 的事件或 `changes/archive` 侧事件
  - 服务端触发一次完整重建，使活动 Change 列表与磁盘当前状态一致
