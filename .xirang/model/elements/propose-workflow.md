---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
---

## Specification

### Section: Propose 创建完整 change 制品

系统 SHALL 提供 propose workflow，在不实施代码的前提下创建或更新 change，并生成 `proposal.md`、delta Contracts、`design.md`、`tasks.md` 与架构变化所需的结构目标制品。Workflow SHALL 在 semantic readiness 通过或用户明确 override 后才创建新 change，并 SHALL 将 graph 与 contract impacts 解释为同一 Semantic Model 的 module scopes。

- **创建新 change**

  - 用户明确要求创建 new change
  - semantic readiness 已通过或用户已明确 override
  - 派生 change ID 不存在
  - workflow SHALL 执行 `xirang new change`
  - SHALL 按 artifact dependency order 生成 apply 所需制品

- **Readiness 未通过时不创建 change**

  - semantic readiness 不完整且用户未 override
  - SHALL 报告缺失项并停止
  - SHALL NOT 创建 change directory

- **更新 existing change**

  - 用户明确要求更新 existing change
  - SHALL 原地更新
  - SHALL 合并现有 artifacts、当前输入、Design Summary、formal model 与 implementation evidence 判断 readiness

- **Workflow stage 边界**

  - 生成 propose skill
  - 声明 PROPOSE 只写目标 Change 制品，禁止修改 implementation 或正式模型
  - 允许通过 CLI 维护共享设计记录，pending 可主动维护，accepted、excluded 及确认内容的实质修改须用户允许；允许 record coverage 记录覆盖结果，并在版本、覆盖、结构及校验门禁通过后 record consume。除此之外不得任意写入 Change 目录外文件，不将记录权限视为正式实现权限

- **New change ID 冲突**

  - 用户要求 new change 且 ID 已存在
  - SHALL 停止并要求另一个 ID
  - SHALL NOT 覆盖或自动改名

- **Identity 不明确且 ID 已存在**

  - 用户意图未明确区分 update existing change 或 create new change
  - 派生 ID 已存在
  - SHALL 一次询问用户选择
  - non-interactive mode SHALL fail fast

- **等价 artifact 结果**

  - 用户调用 propose
  - change directory 与 planning artifact set SHALL 完整创建

### Section: Propose smart routing

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`，忠实文档化已确认设计。它 MAY 在既定范围内自主处理细枝末节、组织案例和目标及修正表达或推导错误，不得自主大量扩写实质设计；新发现的重大决策点 SHALL 先说明选项与推荐，再一次一问等待用户确认。小范围内容与方案调整可在 Propose 内交互确认并维护记录；需要重新设计实验判断可行性或大幅重做设计时返回 Explore；完成披露不能代替决策前确认。没有 Summary 时 SHALL 依据 problem、impact scope、approach、verification method 与未决 Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

- **复用 Design Summary**
  - conversation 包含已确认的 Design Summary
  - Propose 说明正在复用，向 proposal、Delta、design 与 tasks 分发适用的确认内容
  - SHALL NOT 重新执行字符数或 detail score 判断

- **Semantic readiness 不完整**
  - 任一 readiness 项缺失或 Source decision 未决
  - Propose 在对话中列出具体缺口；孤立决策可就地询问，大幅设计工作建议 Explore
  - readiness 通过或被明确 override 前 SHALL NOT 创建 change 或写入制品
  - 新决策确认前 SHALL NOT 将依赖它的内容写成确定方案

- **用户显式 override**
  - Propose 已报告 readiness 缺口且用户明确要求直接生成
  - Propose 接受 override 但 SHALL NOT 猜测影响 behavior 或 architecture 的关键决策；必要确认无法取得时报告阻碍

- **无 Summary 的最低就绪条件**
  - problem、impact scope、approach 与 verification method 均明确且不存在影响 Source 的未决决策
  - Propose 说明就绪并继续，不因涉及多个 subsystem 就强制返回 Explore

- **测试安排分发**
  - 已确认测试策略含过时测试原因或一次性验证
  - 过时原因写入 design；tasks 只记录对应目标与要验证的结果，包括删除后的缺失结果，不预定测试文件、动作或一次性命令
  - Apply 在实施时判断具体测试更新、删除与一次性验证，不制造多余持久测试

- **Routing decision 不污染 artifacts**
  - Propose 报告 readiness、缺失项或 override
  - 这些运行过程信息 SHALL 只保留在对话，不写入 Change 制品

### Section: Proposal 分离 behavior 与 architecture source impact

Proposal SHALL 保留 canonical `## Source Impact` 兼容结构，并分别声明 behavior source scope 与 architecture source scope。两部分 SHALL 明确属于同一个 Semantic Model；Element 的 Contract 由该 Element 的稳定 identity 定位（Section 全局寻址为 `<element identity>#<Section name>`），不存在独立 Spec ID 或 Contract 绑定 registry。

- **Contract scope 使用 Element identity**

  - Element Contract behavior 或 guarantee 变化
  - Behavior Source SHALL 使用受影响 Element 的稳定 identity
  - change-local delta SHALL 只为这些 Elements 在 change `elements/` 分区创建或修改对应单元

- **Graph scope 使用 elementId**

  - Metamodel、element、containment、definition、relationship 或 view 变化
  - Architecture Source SHALL 使用稳定 identity 或明确的新 element identity
  - exact graph operations SHALL 定义在四分区 Semantic Delta 中

- **Source module 不变化**

  - 某 module scope 确认不变
  - 对应 section SHALL 写 `None`
  - unresolved impact MUST NOT 表示为 `None`

- **Proposal 分离 source impact**

  - Agent 获取 proposal definition
  - Behavior Source SHALL 使用 Element 稳定 identity
  - Architecture Source SHALL 使用 stable element identities

- **Optional contract 缺失不创建 Spec**

  - optional element 没有 Contract
  - propose MUST NOT 仅凭该状态创建 Contract 单元
  - required element 缺失 contract SHALL 作为 source completeness gap 处理

### Section: Propose 在架构 delta 前 reconcile architecture scope

Contracts 与 `design.md` 完成后，propose SHALL 重新读取 proposal graph scope、design decisions、formal Semantic Model 与 implementation evidence，再生成结构目标。Workflow SHALL 在完整 Target Semantic Model 上联合检查 Element Declarations、Relationships 与 Element Contracts。

- **Design 改变 graph scope**

  - design 记录的用户确认使 graph impact 与 proposal 初稿不同；写入 design 本身不构成确认
  - SHALL 更新 proposal Architecture Source
  - exact target graph SHALL 写入 Semantic Delta

- **无 graph change**

  - Architecture Source 为 `None`
  - SHALL 省略结构目标
  - SHALL NOT 从 contract change 发明 graph operations

- **指导生成 Semantic Delta**

  - change 影响 Architecture semantics
  - skill SHALL 指导在对应分区创建顶层 ADDED、MODIFIED、REMOVED sections
  - SHALL 要求 MODIFIED entity 使用完整 target payload

- **Binding 指向同一 delta 新 element**

  - Contract 的宿主 Element 只存在于同一 delta 中新增
  - propose SHALL 在 Target Semantic Model 上联合验证
  - MUST NOT 将其误报为 formal model missing element

- **Graph no-op**

  - Architecture Source 为 None
  - SHALL 省略 `metamodel/`、`relationships/` 与 `views/` delta 单元
  - SHALL NOT 创建空 model 单元

### Section: Propose 状态输出保持收敛

Propose SHALL 默认只在 readiness、blocker 与 final summary 节点输出流程状态；用户要求交互模式时 SHALL 在按机制展示草稿的审阅节点与用户讨论，而不逐制品播报进度。需要用户决定时 SHALL 一次询问一个问题。

- **Readiness 状态**
  - Propose 完成 semantic readiness 判断
  - SHALL 报告 Design Summary reuse、readiness 或具体 gap

- **最终总结**
  - Propose 完成 artifacts、validation 与 report generation
  - SHALL 汇总 artifacts、errors/warnings、effective diff review 与 ready-for-apply 状态
  - SHALL 区分沿用的确认、合理推导细节及依据和位置、Propose 内新确认决策与未决事项；无补充或新决策时明确说明
  - SHALL 区分实际 CLI 结果、Agent 语义检查与证据缺口，不以制品数量或引用合法代替实际覆盖，不另建补充台账
  - 影响目标或方案的未决决策 SHALL 阻塞 ready-for-apply

- **Blocker 状态**
  - identity、source decision、validation 或 effective diff 阻塞流程
  - SHALL 报告必要 blocker，需用户决定时一次问一个问题

### Section: 仅在 Propose 形成结构目标时应用拆分指导

Propose Workflow SHALL 在需要形成尚未确认的新增或重组 hierarchy 时消费 normalized decomposition；对已经确认的记录或 Summary 结构决策 SHALL 忠实编译而不重新裁决。精简记录的存在不表示全部结构都已确认；尚未决部分仍须指导和用户确认。Contract-only 变化不因默认方法制造 Architecture Source。

- **无记录时形成结构 Delta**

  - 设计要求新增或重组结构且不存在记录
  - 使用配置指导确认目标结构，再编译对应 Delta。

- **已确认记录优先**

  - 记录结构部分已确认部分 identity、parent 或 Kind，但仍有未决结构
  - 保持已确认决策；仅对未决部分使用指导并请求用户确认，不能跳过全部结构设计或静默重做旧决策。

- **Architecture Source 为 None**

  - Change 只改变 Contracts 或 implementation scaffolding
  - 不调用拆分 skill，不从默认方法发明结构变化。

- **拆分指导不可用时阻塞 Formation**

  - 必须形成结构但方法不明确或 skill 不可用
  - 停止相关结构写入并询问用户，不猜测默认方法或实现目录作为目标。

### Section: Propose 按 TDD 闭环划分 Tasks

Propose 生成 `tasks.md` 时 SHALL 按用户能审阅的目标行为而非代码文件、组件或规范条目数量组织任务；每个目标 SHALL 说明需要验证的行为、边界和预期可观察结果，并指向相应 Contract，而不复制完整规范或提前选择测试边界、动作、文件与命令。相关提示词、受管生成面及实现由 Apply 在同一目标下形成可验证闭环。Propose SHALL 对照已确认来源、目标 Contract 和任务目标/验证方向检查语义覆盖，不能仅核对引用存在；缺少目标行为时先修正 Contract。只有用户指定的实施次序 SHALL 排列为任务先后并在 design 或 proposal 至少一处说明；普通技术依赖由 Apply 在现场判断。

- **跨组件目标**
  - 多个实现面交付同一行为
  - Propose SHALL 作为同一目标与验证方向呈现，不按文件类型拆分

- **边界与例外**
  - 目标 Contract 含适用条件、例外或时序
  - Propose SHALL 确认任务的验证方向包含相应可观察结果，不为每个 Acceptance Case 机械建立 Check

- **用户指定先后次序**
  - 用户要求 A 完成后才能推进 B
  - tasks SHALL 把 A 放在 B 前，design 或 proposal 至少一处说明依据；业务时序或数据状态约束 SHALL 由 Delta Contract 表达

- **就绪复核**
  - 目标语义已确定，Propose 准备声明可实施
  - SHALL 检查每个待实现目标有可理解的任务与验证方向，未规定普通任务必须预先达成独立 GREEN 或列出全部实际依赖

### Section: Propose 使用制品定义先行写作

每个 artifact 写入前，workflow SHALL 读取 resolved definition，按 content boundaries 路由语义，再执行 artifact instruction 与 template。Delta Contracts SHALL 只包含 target-state 的 Sections 与 Acceptance Cases；Acceptance Case SHALL 描述特定条件下的可观察行为，SHALL NOT 规定实现结构、文档排版、说明性措辞、标题顺序或测试拆分，除非该精确表示本身就是可观察契约；完成 artifacts 后 SHALL 使用统一 change compiler 审阅 effective changes。

- **Acceptance Case operations 通过 diff 审阅**

  - Agent 已完成 delta Contracts、design、结构目标与 combined validation
  - SHALL 审阅 validate concise preview
  - 非预期 operation SHALL 阻塞 ready-for-apply 并要求修正 source

- **Sections 按 Behavior Source 生成**

  - propose 创建 change-local Contracts
  - SHALL 只消费 proposal Behavior Source 中的 Element identities
  - SHALL 读取 Formal Contract 的 exact Section titles 后 author delta

- **Specs boundary 不重复定义**

  - workflow 生成 Contracts
  - SHALL 依赖 `xirang instructions specs --change "<name>" --json` 返回的 definition（Element-owned Contract delta authoring 指导）
  - SHALL NOT 在 workflow template 维护竞争的 behavior boundary

- **Acceptance Case 写行为而非排版**

  - Propose 编写或修改 Acceptance Case
  - Acceptance Case SHALL 描述条件与可观察结果
  - SHALL NOT 把生成文档标题、段落顺序或完整例句当作行为，除非该精确 token 本身是对外协议

### Section: 按复杂度组织交互审阅

Workflow SHALL 默认引导 Propose 在材料决策齐备时连续编写完整 Change 后集中审阅；只有用户明确要求交互推进时 SHALL 按一项机制或一组相关 Elements 的实际草稿及其目标、验证方向分段审阅，反馈后继续。简单变更可只有一组，不按 Element 数量或 artifact 写作顺序机械停顿。两种模式下，新发现的重大缺口都 SHALL 及时提出并等待裁决，批量模式不授予 Agent 猜测未确认决策的权力。
