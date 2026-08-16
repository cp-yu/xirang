---
entity: element-declaration
identity: xirang-projection-service
kind: element
parent: web
title: Xirang Projection Service
definition: Xirang Projection Service 是 Web 对 LikeC4 的服务端投影改造：将受管 Semantic Model、active Candidate 与活动 Change 的语义内容确定性转换为原生 LikeC4 base model，并经官方 parser、validator、compute-view 与 Graphviz layout 生产 runtime projection。它独立建模以隔离投影机制与差异呈现、Contract 投递及浏览编排的边界；包含 base model 生成与原子缓存发布、runtime manifest 与 fingerprint 失效、当前层 Relationship 聚合与 Xirang→LikeC4 内容映射，不包含语义差异的视觉表达与 Element Contract 的按需投递。
---

## Requirements

### Requirement: 保持 LikeC4 投影有效

Web SHALL 关闭 `implicitViews`，将受管语义内容降为原生 LikeC4 model 内容并由官方 parser 与 validator 建立 base model，再让每个 runtime semantic projection 完整经过官方 compute-view 与 Graphviz layout；降级与投影 SHALL 省略 LikeC4 无法表示的 self 与 ancestor-chain Relationships，同时保持 siblings、跨子树关系及 source 中的原始 Relationships 不变。

#### Scenario: 生成 runtime projection

- **WHEN** 服务端从 Model、Authored selection、Change target 或 Candidate 生成当前可见投影
- **THEN** 该投影在已 parse 与 validate 的 base model 上经官方 compute-view 与 Graphviz layout 生成唯一 layouted result
- **AND** Browser 不再通过固定网格或中心曲线重建最终 `DiagramView`

#### Scenario: LikeC4 无法表达 source Relationship

- **WHEN** source 包含 self 或 ancestor-chain Relationship
- **THEN** LikeC4 projection 确定性省略该 edge
- **AND** Semantic Model、Candidate 或 Change source 保留原始三元组

### Requirement: 分层呈现 Element Definition

Web SHALL 在 Semantic Model、Candidate View、Candidate Diff View 与 Change-derived View 的 Xirang→LikeC4 投影中将完整 Element Definition 映射为 LikeC4 `description`，并将只供 Browser 紧凑展示的确定性 excerpt 映射为 LikeC4 `summary`；该 excerpt SHALL NOT 进入 Semantic Model、Candidate、Semantic Delta、CLI 输出、diff 或 fingerprint。

#### Scenario: 查看图节点与 Element 详情

- **WHEN** Browser 呈现一个具有多段 Definition 的 Semantic Model、Candidate 或 Change target Element
- **THEN** 图节点和 Browser 搜索使用 excerpt，Element Details 使用完整 Definition

### Requirement: 确定性派生 Definition Excerpt

Definition excerpt SHALL 对 trim 后文本取空行前第一段，将段内换行与连续空白折叠为单空格，并按 Unicode code points 限制为 25 个；超限时 SHALL 截断并追加 `...`，且 SHALL NOT 使用 LLM 或持久化结果。

#### Scenario: Definition 超过显示上限

- **WHEN** 第一段规范化后超过 25 Unicode code points
- **THEN** Browser summary 包含前 25 个 code points 和 `...`，description 保持完整原文

#### Scenario: Definition 不超过显示上限

- **WHEN** 第一段规范化后不超过 25 Unicode code points
- **THEN** Browser summary 原样使用该规范化段落且不追加省略号

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

### Requirement: 使用分区 Runtime Manifest

Web runtime manifest SHALL 使用 `version: 4`，分别表达 `model`、`authoredViews`、`changes` 以及可选的 `candidate` 与 `candidateDiff`；Browser SHALL NOT 将 Model、Authored View、Candidate、Candidate Diff 与 Change-derived projection 合并为同一 source 列表，旧 manifest version SHALL NOT 被静默解释为 version 4。

#### Scenario: 构建普通 Browser 状态

- **WHEN** Browser 加载 version 4 manifest
- **THEN** View Selection 从 `model` 与 `authoredViews` 建立
- **AND** Change Selection 从 `changes` 建立
- **AND** Change-derived projection 不作为独立 source entry

#### Scenario: Candidate 可用

- **WHEN** active Candidate 存在
- **THEN** manifest 包含独立 `candidate` 与 `candidateDiff`
- **AND** 它们不进入普通 Browser 的 View Selection 或 Change Selection

#### Scenario: 读取旧 manifest

- **WHEN** Browser 收到非 version 4 manifest
- **THEN** Browser 返回明确协议错误
- **AND** SHALL NOT 猜测或迁移字段含义

### Requirement: 服务端计算 Runtime Projection

Web SHALL 由服务端根据 View Selection、可选 Change Selection、Presentation Mode、focus、expanded set 与 expected model fingerprint 确定当前可见 projection，并通过官方 LikeC4 compute-view 与 Graphviz layout 返回 layouted projection；该 projection SHALL 基于已由官方 parser 与 validator 建立的 base model，服务端 SHALL NOT 为单次 request 重复 parse 或 validate 同一 base model；Browser SHALL NOT 在已 layout 的 view 上自行计算最终节点 geometry 或 Relationship spline。

#### Scenario: 请求有效 projection

- **WHEN** Controller 提交与当前模型 fingerprint 一致的 projection descriptor
- **THEN** 服务端以官方 include/exclude predicates 在已 parse 且已 validate 的 base model 上计算该 projection
- **AND** 返回 projection key、layouted `DiagramView` 与 diagnostics
- **AND** 该 view 的 geometry 与 routing 来自 LikeC4/Graphviz 官方管线

#### Scenario: 请求使用旧 fingerprint

- **WHEN** request 的 expected model fingerprint 已不是当前有效版本
- **THEN** 服务端拒绝该 request 并返回结构化 stale diagnostic
- **AND** Controller 丢弃旧响应后使用当前 fingerprint 重试

#### Scenario: 新交互替代旧请求

- **WHEN** 用户在前一 projection request 完成前改变 View、Change、Mode、focus 或 expanded set
- **THEN** Controller 取消或忽略旧 request
- **AND** 旧结果不得覆盖当前 Browser state

### Requirement: 原子刷新基础 LikeC4 缓存

Web 服务端 SHALL 在受管 Semantic Model、Authored View、Relationship、Metamodel、Contract、Candidate 或活动 Change source 变化时合并连续事件，依据显式生成文件清单完整重建基础 `.cache-likec4` 内容，并在临时目录校验成功后以保留 live 目录身份的方式原子发布：每个生成文件先写入 live 目录内的同目录临时文件再 rename 覆盖，SHALL NOT 整体 rename 或删除被监听的 live 目录；发布后失效旧 fingerprint 对应的 runtime projections。发布失败时 SHALL 从 last-known-good 备份恢复 live 内容、发布结构化 diagnostics，并在源修复后自动重试；恢复也失败时 SHALL 保留备份目录并报告包含发布与恢复错误的复合失败。

#### Scenario: 模型变化后刷新 Browser

- **WHEN** 一个受管模型 source 发生变化且完整缓存重建成功
- **THEN** 服务端原子替换基础缓存、重建 manifest、失效旧 projections 并发送一次 HMR 更新
- **AND** Browser 无需重启即可呈现新模型

#### Scenario: 发布保持被监听目录稳定

- **WHEN** 服务端在递归 watcher 监听 live 目录期间重建基础缓存
- **THEN** 发布以 live 目录内逐文件临时文件 rename 完成，SHALL NOT 整体 rename 或删除被监听目录
- **AND** watcher 不因 backup 目录被清理而报未处理错误

#### Scenario: 重建失败

- **WHEN** 新 source 无法解析、验证或生成完整 LikeC4 cache
- **THEN** 当前 last-known-good cache 保持可用
- **AND** Browser 显示结构化 diagnostics，且不读取半成品

#### Scenario: 跨平台处理缓存路径

- **WHEN** watcher 在 Windows、macOS 或 Linux 返回 source path
- **THEN** 服务端使用 Node.js path API 与 normalized project-relative key 定位显式缓存依赖
- **AND** 不假设路径分隔符或通过模糊 pattern 删除生成文件

### Requirement: Candidate source 按输入刷新

Web SHALL 以 source identity、partition fingerprint 与 model fingerprint 区分 Candidate runtime data；Candidate source 变化 SHALL 刷新 Candidate 与 Candidate Diff，Semantic Model 变化 SHALL 在基础缓存原子替换成功后刷新 Model、Candidate、Candidate Diff 与活动 Change 数据，并失效旧 runtime projections。

#### Scenario: Candidate 修改后刷新

- **WHEN** `.xirang/candidate/` 下任一受管 Candidate file 发生变化
- **THEN** Browser 刷新独立 Candidate 与 Candidate Diff data
- **AND** 普通 Browser 的 View 与 Change selections 保持不变

#### Scenario: Semantic Model 修改后刷新

- **WHEN** `.xirang/model/` 下任一受管 Semantic Model file 发生变化
- **THEN** Browser 在完整缓存重建成功后发布新 manifest 与 fingerprint
- **AND** 旧 projection response 不得覆盖新状态

### Requirement: 检测活动 Change 生命周期变化并重建 manifest

Web 服务端 SHALL 将活动 Change 目录自身事件、`changes/archive` 侧事件以及缺少 filename 的 watcher 事件视为重建 manifest 的信号，使该 Change 不再出现在 Change Selection。

#### Scenario: 缺少 filename 的 watcher 事件

- **WHEN** watcher 返回缺少 filename 的事件或 `changes/archive` 侧事件
- **THEN** 服务端触发一次完整重建，使活动 Change 列表与磁盘当前状态一致
