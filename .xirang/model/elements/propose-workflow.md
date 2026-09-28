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
  - 仅在记录覆盖与校验通过后，允许 CLI-managed framing consume 完成明确来源的交接及受控清理，不允许任意 change 目录外写入

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

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`。没有 summary 时，SHALL 依据 problem、impact scope、approach、verification method 与未决 Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

- **复用 Design Summary**

  - conversation 包含已确认的 `Design Summary`
  - propose SHALL 说明正在复用该 summary
  - SHALL 将其中的 architecture、testing、risk 与 trade-off decisions 路由到对应 artifacts
  - SHALL NOT 重新执行字符数或 detail score 判断

- **Semantic readiness 不完整**

  - 任一 readiness 项缺失或 source decision 未决
  - propose SHALL 在对话中列出具体缺口并建议 Explore
  - SHALL 停止 artifact generation
  - SHALL NOT 创建 change 或写入 routing decision

- **用户显式 override**

  - propose 已报告 readiness 缺口且用户明确要求直接生成
  - propose SHALL 接受 override 并继续
  - override SHALL NOT 授权 Agent 猜测影响 behavior 或 architecture 的关键决策

- **Semantic readiness 完整**

  - conversation 不包含已确认的 Design Summary
  - problem、impact scope、approach 与 verification method 均明确
  - 不存在会改变 Behavior Source 或 Architecture Source 的未决决策
  - propose SHALL 说明 readiness 已满足并继续 artifact generation

- **多 subsystem scope**

  - 请求涉及多个 subsystem
  - propose SHALL 将其作为 impact scope 证据
  - 只有无法形成单一一致 change scope 时才 SHALL 报告 readiness 缺口
  - MUST NOT 仅凭 subsystem 数量强制 Explore

- **Test Maintenance 分发**

  - Testing Strategy 包含过时测试信息
  - 过时原因 SHALL 进入 `design.md`
  - 具体更新或删除操作 SHALL 进入 `tasks.md`

- **One-time Verification 分发**

  - Testing Strategy 包含 `One-time Verification`
  - 项目 SHALL 生成 evidence-only Check 且 SHALL NOT 创建 persistent test file
  - absence assertion SHALL 锚定 REMOVED Section

- **Routing decision 不污染 artifacts**

  - propose 报告 readiness、缺失项或用户 override
  - 这些运行过程信息 SHALL 仅保留在对话中
  - SHALL NOT 写入 `proposal.md` comment 或其他 change artifacts

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

  - design 确认 graph impact 与 proposal 初稿不同
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

Propose SHALL 只在 readiness、blocker 与 final summary 节点输出状态；需要用户决定时一次询问一个问题。

- **Readiness 状态**

  - propose 完成 semantic readiness 判断
  - SHALL 报告 Design Summary reuse、readiness 或具体 gap

- **最终总结**

  - propose 完成 artifacts、validation 与 report generation
  - SHALL 汇总 artifacts、errors/warnings、effective diff review 与 ready-for-apply 状态

- **Blocker 状态**

  - identity、source decision、validation 或 effective diff 阻塞流程
  - SHALL 报告最小必要 blocker
  - 需要用户决定时 SHALL 一次询问一个问题

### Section: 仅在 Propose 形成结构目标时应用拆分指导

Propose Workflow SHALL 在需要形成尚未确认的新增或重组 hierarchy 时消费 normalized decomposition；对已经确认的记录或 Summary 结构决策 SHALL 忠实编译而不重新裁决。精简记录的存在不表示全部结构都已确认；尚未决部分仍须指导和用户确认。Contract-only 变化不因默认方法制造 Architecture Source。

- **无 framing 时形成结构 Delta**

  - 设计要求新增或重组结构且不存在记录
  - 使用配置指导确认目标结构，再编译对应 Delta。

- **已确认记录优先**

  - 记录已确认部分 identity、parent 或 Kind，但仍有未决结构
  - 保持已确认决策；仅对未决部分使用指导并请求用户确认，不能跳过全部结构设计或静默重做旧决策。

- **Architecture Source 为 None**

  - Change 只改变 Contracts 或 implementation scaffolding
  - 不调用拆分 skill，不从默认方法发明结构变化。

- **拆分指导不可用时阻塞 Formation**

  - 必须形成结构但方法不明确或 skill 不可用
  - 停止相关结构写入并询问用户，不猜测默认方法或实现目录作为目标。

### Section: Propose 按 TDD 闭环划分 Tasks

Propose 生成 `tasks.md` 时 SHALL 以可独立实现与验证的完整闭环划分 task 边界，SHALL NOT 按 component、module、directory、file type、Section 数量或 Acceptance Case 数量机械拆分；SHALL 按共享测试品质判断每个 Check 的语义价值，将同一可观察行为与同一失败原因的 Acceptance Case 归入一个 Check；声明 ready-for-apply 前 SHALL 交叉检查所有 task 边界与 Check 价值，并 reconcile 违反独立验证或制造低价值持久化测试的划分。 Tasks SHALL 以具体实施事项与完整 Contract 引用承接规范目标，不能把记录摘要直接当成完整行为定义；相关 prompt 与受管生成面须归入所属行为闭环。ready-for-apply 前 SHALL 执行记录到语义及语义到实施/Checks 的语义覆盖检查，不能只验证引用存在。

- **按行为闭环而非组件划分**

  - 多个组件共同交付一个行为
  - Propose SHALL 将它们放入同一 task

- **Section 数量不构成拆分理由**

  - 一个 task 的 Sections 超过上限
  - Propose SHALL 合并细节或将验证细节下沉到 Checks
  - SHALL NOT 仅因数量拆分 task

- **Acceptance Case 数量不构成拆分理由**

  - 一个 Section 含多个描述同一行为与同一失败原因的 Acceptance Case
  - Propose SHALL 将它们编译进同一个 Check
  - SHALL NOT 为每个 Acceptance Case 各创建一个 persistent test Check

- **Propose 必须判断 Check 价值**

  - Propose 编译 `tasks.md` Checks
  - SHALL 应用共享测试品质：优先 reuse 或 modify 已有测试，只在现有测试无法保护该行为时 add
  - SHALL 把不值得持久化的证据编译为 one-time Check
  - SHALL NOT 以「不得判断 Check 是否语义足够」为由保留机械测试

- **新增边界必须指向独特缺陷**

  - Propose 为同一行为增加额外边界 Check 或测试
  - SHALL 写明该边界能捕获、已有测试捕获不到的合理缺陷
  - 无法指出独特缺陷时 SHALL 不创建该 Check

- **ready-for-apply 前边界自检**

  - Propose 准备声明 Change ready-for-apply
  - SHALL 交叉检查 Goals、Files、Sections 与 Checks
  - 发现 task 依赖后续 task、Check 按 Acceptance Case 1:1 机械拆分或假防护测试时 SHALL reconcile 后再声明

- **确认细节贯穿执行安排**

  - 用户确认的条件、例外与时序已经写入 Contract
  - 任务安排其实现与检查并引用该 Contract，不复制规范文本；缺少安排时不声明 ready-for-apply。

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
