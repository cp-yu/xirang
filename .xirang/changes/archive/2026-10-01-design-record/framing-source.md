---
entity: confirmed-design-record
explorationId: 20260929T123857Z-ca0411e2
slug: design-record
semanticModelFingerprint: b95c358ee12981680633f2cedea9d1f315adb688a07a9da705ea3ac9d1fcde73
---
schemaVersion: 2
context: change
relatedIdentities:
  - definition-framing
  - change-structural-definition
  - definition-framing-operations
  - causal-definition
  - identity-boundary-clarification
  - bfs-confirmation
  - explore
  - explore-role
  - design-exploration
  - propose
  - propose-role
  - post-propose-validation
  - semantic-model-build
  - internal-agents
entries:
  - identity: problem-statement
    nature: informative
    content: |
      问题：用户在 Explore 中确认的意图细节无法到达 Change 的 Element。
      基本事实：Agent 上下文长度有限且注意力有限；长会话会压缩并丢失内容；Propose 可能在新会话运行；
      Design Summary 只存在于会话中，能跨过压缩与会话边界的只有记录，因此记录的细致程度是 Propose 还原细节的上限。
      记录的目的：保持用户确认时的具体程度，把意图带到 Propose 编译完成；该防的是 Propose 遗忘，而非 Explore 运行时遗忘。
      根因（提示词问题）：概念与方法按“结构”定义，且无“脱离会话能否独立使用”的标准，细节在写入时被抽象掉；Propose 编译时再抽象一层。
      根因（约束问题）：Propose 覆盖检查只靠 Agent 自觉，无机制拦截跳过；整份替换与全量展示消耗上下文与注意力，防的是错误的风险。
      根因（形式问题）：v2 记录只有自由文本 content，无法表达 Semantic Model 的组件架构与组件关系，CLI 也无法校验。
      证据（goFate jev-situation-recall）：
      - 对话中确认“当前画像 A、C 时，ABC、ACD 可以，AB 不行”；Agent 回复已写出该例，写入的记录只剩“同一或祖先关系”；Delta 验收案例也没有具体标签。
      - Propose 只写了一句“最终覆盖审阅：逐项核对”，没有逐条结果与检查数量，consume 照常通过。
      - Propose 把三个既有元素的 kind 与 parent 按实现关系写错，事后改回：结构无记录只能靠猜。
      - 用户中途要求“只呈现变更，不需要每次完整呈现”，协议仍要求全量展示。
      - 用户两次指出上下文压缩后内容被遗忘。
      历史：07-21 结构草稿；08-05 引入先读全文与 diff；09-25 改为已确认设计记录并保留方法名；09-26 加入记录决策与逐条覆盖检查。
      用户早先可用时的提示词与现在不同，归入提示词问题与约束问题，不另追溯。
  - identity: rename-design-record
    nature: normative
    content: |
      概念名由 Definition Framing 改为 Design Record（设计记录），CLI 命令由 `xirang framing` 改为 `xirang record`。
      改名范围包括语义模型中的 definition-framing、change-structural-definition、definition-framing-operations 及 AGENTS.md 对应段落；
      CLI 命令名、受管目录 `.xirang/framing/`、交接文件 `framing-source.md`、`ChangeStructuralDefinition*` 类型名；
      生成面 `xirang-definition-framing.md` reference 与 explore、propose、build 模板。
      这是 BREAKING 变更，不保留任何兼容别名。
  - identity: record-two-parts
    nature: normative
    content: |
      记录分两部分：`entries` 用自由文本记录细节；`structure` 按 Semantic Model 同形记录架构，
      即 Element Declarations、Relationships、Element Kinds、Relationship Kinds，按语义 identity 定位，不引入第二套 identity。
      CLI 对 structure 对照 Metamodel 与当前模型做确定性校验（如 kind 是否存在、parent 能否解析、Relationship 两端是否存在）。
      Propose 可将 structure 直接编成 Delta 条目，无需从文字再翻译。
      理由：结构在模型中已有固定形状与稳定 identity，适合结构化并由 CLI 校验；细节无固定形状，适合自由文本。
  - identity: entry-free-content
    nature: normative
    content: |
      entries 的条目保持 `identity` + `nature` + 自由 `content`，允许多行，不设 examples、counterexamples、timing 等固定子字段。
  - identity: entry-capture-standard
    nature: normative
    content: |
      条目写入标准的检验方法：Propose 在没有这段会话的情况下，能否据此写出 Contract 与 Acceptance Case 而不用猜。
      必须保留用户确认的条件、数值、例外、时序，以及用来对齐的正例与反例。
      用户给出的例子按原样记录，不改写、不抽象，例如“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行（缺少 C）”。
      讨论过程、被否决方案与推导理由不记录；用户明确要求记录时，以 informative 条目保存。
  - identity: structure-target-state
    nature: normative
    content: |
      structure 记录目标状态：每个对象写用户确认后的样子；删除以 `removed: true` 显式标出。
      记录允许只记一部分，未提及的对象表示尚未确认，不表示删除。
      新增还是修改由 CLI 对照当前模型推导并在结果中报告；记录中不保存 ADDED/MODIFIED/REMOVED 操作。
      Propose 编译时生成带 operation 的 Delta。
  - identity: partial-declaration-revision
    nature: normative
    content: |
      一个 Element Declaration 允许只写已确认的字段（如只确认了 parent 与 kind，definition 未定）。
      后续字段确定时，已确认字段可能需要修改（例：definition 定下后发现 parent 放错）。
      因此 structure 的 diff 细到字段级，把“修改已确认字段”与“补充新字段”分开报告；修改已确认内容须经用户在对话中裁决。
  - identity: partial-update-report
    nature: normative
    content: |-
      记录支持按部分修改：只提交本次新增或修改的内容与显式删除，不要求 Agent 重读并重新提交完整记录。
      写入须携带 --source-version；版本过期则拒绝写入（与 testing-strategy 一致）。
      每次写入后工具报告本次变更与当前记录概况即可，不在对话中原样重新呈现未改动的内容。
      Propose 入口仍读取完整记录。
  - identity: confirmation-implies-record
    nature: normative
    content: |
      用户在对话中确认设计，即视为授权记录这部分内容；Agent 立即写入并报告写了什么、改了什么，用户发现不对再指出修正。
      只写用户明确确认过的内容，不写 Agent 自行推导的内容。
      每次写入后报告本次变更，单独标出修改了已确认内容的条目或字段。
      之后出现冲突时，经用户裁决后再次写入即可。
      原硬规则“确认设计方向不等于授权写文件”对记录写入相应修改；其他文件与制品的写入边界不变。
  - identity: propose-coverage-subagent
    nature: normative
    content: |-
      subagent 只用于 Propose 的覆盖检查，Explore 不使用 subagent（fork 上下文与沿用原上下文无本质区别），Explore 依靠记录方法。
      是否在 Propose 引入 subagent 由消融实验决定：subagent 稳定查出当前 Agent 漏掉的缺陷则引入，否则由当前 Agent 执行检查（更简单）。这是本设计中唯一需要消融的部分。
  - identity: subagent-experiment-plan
    nature: normative
    content: |-
      时机：其他部分全部完成后再做该实验，避免其他部分返工；实验使用 worktree 做版本隔离。
      材料：goFate jev-situation-recall 的 framing-source.md 与 Delta 的副本，不改 goFate。
      标准答案：已知丢失（ABC 例子及对照整理出的其他项，经用户确认）；人为植入缺陷（如 K=32 改为 16、删除 no_event 项、世界切换改为当前轮生效），答案确定。
      两种方式使用同一份检查说明、原子细节拆分、输出格式与门禁：
      - 当前 Agent：在新会话中用副本重跑 Propose 流程，到覆盖检查一步停下，由该 Agent 执行检查（注意力负担与真实情况一致）；
      - subagent：只拿到记录与 Change 目录路径。
      每种方式跑 3 次。指标：检出数/缺陷总数、错判通过次数、误报次数、耗时与 token。
      两种方式都使用 bigmodel/glm-5.3-flash 模型（重跑 Propose 的当前 Agent 与 subagent 相同），使两者只有上下文不同，结果差异可归因于上下文。
  - identity: compile-loss-in-scope
    nature: normative
    content: |
      问题范围包括 Propose 编译环节：目标不只是记录保存用户确认时的例子，还包括 Delta 的 Acceptance Case 保留这些例子。
  - identity: open-items
    nature: informative
    content: |-
      subagent 变体的输入、输出、职责与宿主不支持 subagent 时的回退暂不设计：先做消融实验，再根据结果考虑设计。
      供届时参考：用户认为所有 harness 都已支持 subagent；Xirang 当前只为 claude、codex、opencode、pi 4 个工具生成 subagent 文件（src/core/shared/subagent-generation.ts），其余 21 个集成工具无 agentsDir。
  - identity: remove-structure-methods
    nature: normative
    content: |-
      删除 causal-definition、identity-boundary-clarification、bfs-confirmation 三个 Element。
      结构形成完全由可配置的分解指导负责（其语义精化 guidance 已覆盖 identity 与边界、单维度 MECE、breadth-first 确认），Design Record 只负责记录已确认意图，不是界定结构的方法。
      配套：definition-framing 的 Definition 删除“结构分解是其中适用的活动”，只描述记录职责；AGENTS.md 中 Definition Framing 下的对应层级与“因果定义、identity 与边界澄清、单维度分解和按 BFS 顺序确认”同步移除。
      理由：三者 Contract 仅复述标题、无 Relationship、模板未引用；与分解指导重复，项目更换分解方法时会产生矛盾。
  - identity: propose-detail-preservation
    nature: normative
    content: |-
      写作规则：用户确认的例子须写成 Acceptance Case（原样或等价具体形式），不得抽象为概括性描述（如“一个事件覆盖全部当前标签”）；已确认的数值、时序与例外须写进 Business Logic 或 Edge Cases，不得换成泛化描述。
      检查粒度：覆盖检查先把每条记录拆成原子细节（条件、数值、例子、反例、时序），再逐项给出在 Delta 中的具体位置（Element、Section 或 Acceptance Case）；任一细节找不到位置即计为未覆盖。
      不改 schema，不用 CLI 字符串匹配（例子常需改写为 WHEN/THEN，字符串匹配会误报）。Propose 覆盖 subagent 按此粒度执行检查。
      例：记录“当前画像为 A、C 时，事件 ABC、ACD 可以入选；事件 AB 不行（缺少 C）”应在 Delta 中有对应的具体 Acceptance Case；仅有规则落入 Business Logic 而无此例，计为未覆盖。
  - identity: coverage-gate
    nature: normative
    content: |-
      Propose 覆盖检查的结果按结构化格式交给 CLI 记录；consume 前 CLI 做确定性校验：
      - 每条 normative 条目都有结果；
      - 每条至少拆出一个原子细节；
      - 每个细节要么给出位置（Element identity 加 Section 或 Acceptance Case），要么标为未覆盖；
      - 给出的位置必须在 Change 的 Delta 中真实存在。
      有缺项、有未覆盖或位置不存在时，consume 一律拒绝。CLI 不判断语义是否真的保留，这部分由检查者判断。
      门禁与由谁执行检查无关，当前 Agent 与 subagent 共用同一门禁。
      检查结果与来源快照一起作为形成历史保存在 Change 目录中，便于后续审计（类似 archive）；它不进入 Semantic Model。原规则“不创建永久审计台账”相应修改。
      先例：Apply 的 reviewer 结论经 xirang quality review 记录，seal 时由 CLI 校验。
  - identity: build-shares-record
    nature: normative
    content: |-
      Build 与 Explore 共用全部决策：改名、entries 与 structure 两部分、写入标准、按部分修改、确认设计即视为授权记录、写作规则、原子细节覆盖检查与覆盖门禁。
      差异只在目标：Build 的覆盖检查位置指向 Candidate 的四个分区而非 Change 的 Delta；CLI 校验位置在 Candidate 中真实存在；检查结果随来源快照进入 Build history 作为形成历史。
  - identity: testing-strategy
    nature: normative
    content: |-
      在现有测试上改名与扩展（test/commands/framing*.test.ts、test/core/framing/、test/core/templates/{definition-framing-reference,explore-template,propose-template,build}.test.ts），不新建平行测试。
      持久测试：
      - 记录写入：按部分增改与删除时未提及条目不变；--source-version 过期时拒绝；structure 对 unknown kind、parent 无法解析、Relationship 端点不存在报错；removed: true 生效；新增/修改正确推导；字段级 diff 区分修改已确认字段与补充新字段。
      - 覆盖门禁：缺条目、无原子细节、有未覆盖项、位置不存在时 consume 均拒绝；Change 与 Candidate 两种目标下位置校验正确，检查结果均保存为形成历史。
      - 模板：只锁定失败关闭语义（门禁必须执行、确认即记录、写作规则、原子细节粒度）；旧 framing 文字断言删除或改写。
      一次性验证：xirang update 重刷生成面后跑 build、lint、test；rg 扫描 framing、Definition Framing、ChangeStructuralDefinition、framing-source 残留，除已归档 change 外应为零；最后按既定方案做消融实验。
      不单独做端到端 Explore → Propose 验证：消融实验中当前 Agent 一侧在新会话用副本重跑 Propose，即为一次真实端到端运行。
  - identity: structure-coverage-gate
    nature: normative
    content: |-
      consume 时 CLI 把记录中每个 structure 对象与 Delta（Build 时为 Candidate）按语义 identity 逐字段比对，内容不一致即拒绝；removed: true 的对象必须在 Delta 中为 REMOVED（Build 时在 Candidate 中不存在）。structure 不拆原子细节、不交检查者判断。
      配套保证（Explore 补充，已向用户说明）：entries 的覆盖检查结果绑定记录 sourceVersion 与 Delta（或 Candidate）指纹；检查后二者任一变化，结果失效须重新检查，机制同 xirang quality review 的证据指纹。
<!-- XIRANG:SEMANTIC_MODEL_BASELINE
modelState: present
objects:
  element-kind:element:
    identity: element
    contract: optional
    body: "`element` 标识 Semantic Model 中承载规范性语义的普通 Element。层级位置与细化关系由 parent/children 决定，不因 Element Kind 受限；任何 Element 都可以在任意抽象层级出现。"
  element-kind:perspective:
    identity: perspective
    contract: optional
    nodePresentation:
      shape: document
      color: indigo
      border: solid
    body: "`perspective` 标识从一个独立分解角度组织 descendants 的 Element。Perspective 本身表达该分解角度的概念边界，children 构成该角度下的抽象或进一步 Perspectives；它不是 View，也不以颜色、形状或布局定义语义。Perspective 的层级位置与其 children 的 Element Kind 不受 Metamodel 白名单限制，由抽象与细化关系决定。"
  element-kind:project:
    identity: project
    contract: required
    root: true
    body: The single Project Root of the Semantic Model.
  element:agent:
    declaration:
      identity: agent
      kind: element
      parent: agents
      title: Agent
      definition: Agent 是与用户交互、并端到端编排 Realization 的默认执行身份。它可写入项目与 Change 制品，消费 CLI 的查询与投影，在需要时委托 Internal Agents；不得替代用户作出需明确授权的决策，也不得自行重做 CLI 已提供的确定性操作。
    sections:
      - name: 写入获授权制品
        body: |-
          Agent SHALL 在授权范围内写入项目与 Change 制品。

          - **Apply 获准修改项目**
            - Change 已进入 Implementation
            - Agent 写入实现所需项目文件
        acceptanceCases: []
      - name: 消费 CLI 查询与投影
        body: |-
          Agent SHALL 消费 CLI 提供的查询与投影结果推进编排。

          - **需要模型上下文**
            - Agent 需要确定性模型信息
            - 它使用 CLI 查询结果
        acceptanceCases: []
      - name: 按需委托 Internal Agents
        body: |-
          Agent SHALL 在需要独立判断时委托 Internal Agents。

          - **当前实现需要 Review**
            - Apply 完成一次修改
            - Agent 委托 Reviewer 独立评估
        acceptanceCases: []
      - name: 不替代用户授权
        body: |-
          Agent SHALL NOT 替代用户作出需要明确授权的决策。

          - **Candidate 等待确认**
            - CLI 返回有效 review digest
            - Agent 请求用户确认而不自行 promotion
        acceptanceCases: []
      - name: 不重做确定性操作
        body: |-
          Agent SHALL NOT 自行重做 CLI 已提供的确定性操作。

          - **CLI 提供原子转换**
            - Realization 需要 promotion、sync 或 archive
            - Agent 调用 CLI 而不手工模拟转换
        acceptanceCases: []
  element:agents:
    declaration:
      identity: agents
      kind: element
      parent: participants
      title: Agents
      definition: Agents 是可代表息壤推进 Realization 的执行主体。它们理解 Semantic Model 与项目证据，形成或调和 Change，实现 Change，组织独立评估，并在用户授权下推进模型构建与 Change 收束；Agents 分为 Agent 与 Internal Agents。
    sections:
      - name: 理解语义与项目证据
        body: |-
          Agents SHALL 理解 Semantic Model、Change、用户决策与项目证据，并以其作为推进依据。

          - **判断下一步行动**
            - Agent 接手 Realization
            - 它先读取适用语义与证据
        acceptanceCases: []
      - name: 形成或调和 Change
        body: |-
          Agents SHALL 按适用 Formation Path 形成或调和 Change。

          - **Change 尚未形成**
            - 用户意图或已有实现需要规范化
            - Agent 使用 Intent-first 或 Implementation-first Path
        acceptanceCases: []
      - name: 实现 Change
        body: |-
          Agents SHALL 将已形成 Change 落实到项目。

          - **Change 进入 Implementation**
            - Change 已完成 Formation
            - Agent 依据 Expected Semantic Model 修改项目
        acceptanceCases: []
      - name: 组织独立评估
        body: |-
          Agents SHALL 组织对项目结果的独立评估。

          - **Apply 产生项目状态**
            - 当前实现可供验证
            - Agent 委托适用 Internal Agent 评估
        acceptanceCases: []
      - name: 经授权推进构建与收束
        body: |-
          Agents SHALL 仅在用户授权下推进 Semantic Model Build 与需要授权的 Change 收束事项。

          - **授权尚未获得**
            - 下一状态转换需要用户确认
            - Agent 暂停推进并请求授权
        acceptanceCases: []
      - name: 分为两类协作身份
        body: |-
          Agents SHALL 分为 Agent 与 Internal Agents。

          - **分配执行与判断**
            - Realization 同时需要编排和独立评估
            - 分别由 Agent 与 Internal Agent 承担
        acceptanceCases: []
  element:apply:
    declaration:
      identity: apply
      kind: element
      parent: change-implementation
      title: Apply
      definition: Apply 是 Change Implementation 中落实项目改动的活动。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态，落实 Change 要求的全部项目改动；在 `tasks.md` 存在时按其中的执行与验证安排推进；在 Verify 返回 Required Corrections 或已确认的优化事项时继续完成相应改动。
    sections:
      - name: 以 Expected Semantic Model 为目标
        body: |-
          Apply SHALL 以 Expected Semantic Model 为项目目标状态。

          - **开始 Change Implementation**
            - 当前模型与 Delta 可推导 Expected Model
            - Apply 依据该目标判断实现工作
        acceptanceCases: []
      - name: 落实全部项目改动
        body: |-
          Apply SHALL 结合 Change Plan 与当前项目状态落实 Change 要求的全部项目改动。

          - **Change 含多个影响面**
            - 实现尚未覆盖全部目标语义
            - Apply 继续直到完整落实
        acceptanceCases: []
      - name: 遵循现有 Tasks 安排
        body: |-
          当 `tasks.md` 存在时，Apply SHALL 按其中的执行与验证安排推进。

          - **Change 具有任务清单**
            - Apply 开始执行
            - 工作按适用任务安排推进
        acceptanceCases: []
      - name: 处理 Required Corrections
        body: |-
          Verify 返回 Required Corrections 时，Apply SHALL 完成相应修正。

          - **Review 未通过**
            - 当前状态收到阻塞修正项
            - Apply 修正实现并重新进入 Review
        acceptanceCases: []
      - name: 实现已确认优化事项
        body: |-
          Verify 返回已确认优化事项时，Apply SHALL 完成相应实现。

          - **Optimization 选择事项**
            - 事项返回 Apply
            - Apply 实现后重新进入 Review
        acceptanceCases: []
      - name: 产出可独立评估的项目状态
        body: |-
          Apply SHALL 产出可交由 Verify 独立评估的项目状态。

          - **一轮 Apply 完成**
            - 当前修改已完成
            - 项目状态可供 clean-context Review
        acceptanceCases: []
      - name: 提供可复现证据
        body: |-
          Apply SHALL 为当前项目状态提供可复现证据。

          - **状态交给 Verify**
            - Apply 声明当前实现可评估
            - Verify 可取得证明目标行为的证据
        acceptanceCases: []
  element:apply-role:
    declaration:
      identity: apply-role
      kind: element
      parent: agent
      title: Apply Role
      definition: Apply 是 Agent 落实 Change 所描述项目改动的工作身份。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态修改项目；在存在执行安排时按安排推进，并处理 Verify 返回的 Required Corrections 与已确认优化事项。
    sections:
      - name: 写入项目实现
        body: |-
          Apply Role SHALL 在 Change Implementation 范围内修改项目文件。

          - **Apply 识别待落实改动**
            - 当前状态不符合 Expected Semantic Model
            - Agent 写入实现所需修改
        acceptanceCases: []
      - name: 接收 Verify 返回事项
        body: |-
          Apply Role SHALL 接收 Required Corrections 与已确认优化事项，并再次执行 Apply。

          - **Verify 返回工作**
            - 当前状态需要修正或优化
            - Agent 将事项带回写入活动
        acceptanceCases: []
      - name: 交付状态与证据
        body: |-
          Apply Role SHALL 将 Apply 产出的项目状态与可复现证据交付给 Verify。

          - **一轮写入完成**
            - Agent 完成当前实现工作
            - 它组织独立 Review
        acceptanceCases: []
  element:archive-role:
    declaration:
      identity: archive-role
      kind: element
      parent: agent
      title: Archive Role
      definition: Archive 是 Agent 在验证有效后编排 Change Closure 的工作身份。它确认入口条件已满足，协调 CLI 将 Semantic Delta 应用于 Semantic Model，并保存已完成 Change 及其最终证据、结束 Change 的活动状态；Archive 不重新判定目标语义，也不替代 CLI 的原子状态转换。
    sections:
      - name: 通过 CLI 编排 Closure
        body: |-
          Archive Role SHALL 依据 Change Closure 的阶段规则调用 CLI 提供的 Sync 与 Archive 操作。

          - **Change Closure 可推进**
            - Closure 活动要求执行确定性状态转换
            - Agent 调用对应 CLI 操作
        acceptanceCases: []
      - name: 限定 Closure 制品处理范围
        body: |-
          Archive Role SHALL 在 Change Closure 范围内协调保存已完成 Change 与最终证据。

          - **CLI 需要 Closure 制品输入**
            - Agent 编排归档操作
            - 它只提供该 Change 及其最终证据
        acceptanceCases: []
      - name: 不重新判定目标语义
        body: |-
          Archive Role SHALL NOT 重新判定 Change 的目标语义。

          - **Agent 编排已验证 Change**
            - Closure 消费 Semantic Delta
            - Agent 使用既有目标而不改写意图
        acceptanceCases: []
      - name: 不替代 CLI 原子转换
        body: |-
          Archive Role SHALL NOT 手工重做 CLI 提供的原子状态转换。

          - **Closure 需要改变规范状态**
            - CLI 提供对应确定性操作
            - Agent 使用 CLI 而不直接模拟转换
        acceptanceCases: []
  element:bfs-confirmation:
    declaration:
      identity: bfs-confirmation
      kind: element
      parent: definition-framing
      title: BFS Confirmation
      definition: BFS Confirmation 是 Definition Framing 中按 BFS 顺序确认同层结构的方法步骤。它确保同一层级的结构内容在进入下一层之前全部确认。
    sections:
      - name: BFS 顺序确认同层结构
        body: |-
          Definition Framing SHALL 按 BFS 顺序确认同层结构。

          - **按 BFS 顺序确认**

            - Definition Framing 确认结构层级
            - 按 BFS 顺序确认同层结构
            - 同层结构全部确认后再进入下一层
        acceptanceCases: []
  element:causal-definition:
    declaration:
      identity: causal-definition
      kind: element
      parent: definition-framing
      title: Causal Definition
      definition: Causal Definition 是 Definition Framing 中通过因果定义逐步澄清 Change 结构的方法步骤。它帮助确认 Change 涉及的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships。
    sections:
      - name: 因果定义澄清结构
        body: |-
          Definition Framing SHALL 通过因果定义逐步确认 Change 涉及的 Element Kinds、Relationship Kinds、Element Declarations 与 Relationships。

          - **因果定义推进**

            - Definition Framing 处理 Change 的结构定义
            - 以因果定义方式澄清 Change 涉及的结构内容
        acceptanceCases: []
  element:change:
    declaration:
      identity: change
      kind: element
      parent: semantic-objects
      title: Change
      definition: Change 是承载一次项目演进意图的语义对象，独立建模以使目标变化能够相对于当前 Semantic Model 被形成、实现、验证和收束。它包含规范性的 Semantic Delta 与辅助性的 Change Plan，不包含应用后的稳定 Semantic Model 或负责落实变更的 Realization 过程。
    sections:
      - name: 由 Delta 与 Plan 共同组成
        body: |-
          每个 Change SHALL 包含规范性的 Semantic Delta 与解释意图和路径的 Change Plan；Semantic Delta SHALL 与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

          - **编译 Change**

            - Agent 或 CLI 评估一个活动 Change
            - 系统从当前模型和 Semantic Delta 推导唯一目标状态，并用 Change Plan 辅助执行
        acceptanceCases: []
      - name: 以 Delta 为规范依据
        body: |-
          当 Change Plan 与 Semantic Delta 冲突时，系统 SHALL 以 Semantic Delta 为目标语义依据。

          - **Plan 与 Delta 不一致**

            - Change Plan 描述的目标与 Semantic Delta 不同
            - Agent 与 CLI 以 Semantic Delta 为目标语义且不使用 Plan 覆盖 Delta
        acceptanceCases: []
  element:change-closure:
    declaration:
      identity: change-closure
      kind: element
      parent: change-realization
      title: Change Closure
      definition: Change Closure 是 Change Realization 中将已验证的 Change 收束为项目新稳定状态的阶段。它以 Change Implementation 的有效验证结果为入口，先通过 Sync 将 Semantic Delta 应用于 Semantic Model，使 Expected Semantic Model 成为新的 Semantic Model；再通过 Archive 原样保存已完成的 Change 及其最终证据，并结束 Change 的活动状态。
    sections:
      - name: 仅接受有效验证结果
        body: |-
          Change Closure SHALL 以仍然有效的 Change Implementation 验证结果为入口，SHALL NOT 基于未验证或已过期的项目状态同步或归档。

          - **验证结果不再有效**

            - Closure 无法确认当前项目状态仍由该验证结果覆盖
            - Closure 拒绝推进并要求重新验证
        acceptanceCases: []
      - name: 先同步后归档
        body: |-
          Closure SHALL 先通过 CLI Sync 将 Semantic Delta 原子应用于 Semantic Model，使 Expected Semantic Model 成为新正式模型；再由 Archive 保存已完成 Change 与最终证据并结束活动状态。

          - **完成 Change Closure**

            - Sync 与 Archive 均成功
            - 项目实现和 Semantic Model 进入一致的新稳定状态
        acceptanceCases: []
      - name: 原样归档 Change 制品
        body: |-
          Archive SHALL 在适用门禁通过后原样移动 active Change directory，SHALL NOT 创建、重算、校验或覆盖任何 View presentation artifact。

          - **Change 不含持久化呈现结果**

            - 一个通过归档门禁的 active Change 不含 View presentation artifact
            - Archive 成功移动该 Change 且不创建额外呈现文件

          - **Change 含已有 legacy 文件**

            - 一个通过归档门禁的 active Change 含已有 legacy presentation file
            - Archive 随目录移动该文件并保持其内容字节不变
        acceptanceCases: []
  element:change-formation:
    declaration:
      identity: change-formation
      kind: element
      parent: change-realization
      title: Change Formation
      definition: Change Formation 是 Change Realization 中形成完整 Change 的阶段。它在阶段内完成必要的审查与确认，并产出完整的 Semantic Delta 与 Change Plan；它可以通过 Intent-first Path 或 Implementation-first Path 完成。
    sections:
      - name: 产出完整 Semantic Delta
        body: |-
          Change Formation SHALL 产出完整 Semantic Delta。

          - **目标语义已明确**
            - Formation 完成
            - Delta 完整表达该 Change 的目标语义
        acceptanceCases: []
      - name: 产出适用的完整 Change Plan
        body: |-
          Change Formation SHALL 产出对所选形成路径完整且适用的 Change Plan。

          - **Intent-first Formation**
            - 实现尚未发生
            - Plan 包含意图、决策、执行与验证安排

          - **Implementation-first Formation**
            - 实现已经发生
            - Plan 包含意图与决策说明且不虚构 tasks
        acceptanceCases: []
      - name: 完成 Formation 审查与确认
        body: |-
          Change Formation SHALL 在本阶段内完成必要审查与确认。

          - **Change 存在未决目标语义**
            - 关键语义尚未确认
            - Formation 不得完成
        acceptanceCases: []
      - name: 选择 Formation Path
        body: |-
          Change Formation SHALL 通过 Intent-first Path 或 Implementation-first Path 完成。

          - **选择形成路径**
            - Agent 判断实现是否已经发生
            - 使用与事实相符的 Formation Path
        acceptanceCases: []
      - name: 形成可进入实现的 Change
        body: |-
          Change Formation 完成后，完整 Change SHALL 可进入 Change Implementation。

          - **Formation 出口**
            - Delta、Plan、审查和确认均已完成
            - Change 进入 Change Implementation
        acceptanceCases: []
  element:change-implementation:
    declaration:
      identity: change-implementation
      kind: element
      parent: change-realization
      title: Change Implementation
      definition: Change Implementation 是 Change Realization 中落实 Change 并确认其结果的阶段。Agent 依据 Semantic Model、Semantic Delta 与 Change Plan，将 Change 描述的内容落实到项目，并通过独立评估与可复现证据确认项目结果与 Expected Semantic Model 一致；验证通过后，Change 可进入 Change Closure，本阶段不以 Semantic Delta 更新 Semantic Model，也不关闭 Change。
    sections:
      - name: 实现并独立验证目标状态
        body: |-
          Change Implementation SHALL 由 Apply 依据 Expected Semantic Model 修改项目，并由 Verify 使用独立判断与可复现证据确认完整性、正确性和一致性。

          - **Apply 修改项目**
            - 项目状态在 Verify 后发生任何修改
            - 修改后的状态必须重新接受 Review
        acceptanceCases: []
      - name: 不在本阶段更新正式模型
        body: |-
          Change Implementation SHALL NOT 将 Semantic Delta 应用于正式 Semantic Model，也 SHALL NOT 关闭 Change。

          - **Verify 通过**
            - 最新项目状态通过 Review 且 Optimization 完成
            - Change 获得进入 Closure 的资格但尚未同步或归档
        acceptanceCases: []
  element:change-realization:
    declaration:
      identity: change-realization
      kind: element
      parent: realization-process
      title: Change Realization
      definition: Change Realization 是 Realization 推进过程中落实单次 Change 的过程。它通过 Change Formation 形成完整 Change，通过 Change Implementation 实现并验证，再通过 Change Closure 将经验证的 Semantic Delta 更新到 Semantic Model 并关闭 Change，使项目实现与语义模型进入新的稳定状态。
    sections:
      - name: 按形成、实现、收束推进
        body: |-
          Change Realization SHALL 先完成 Change Formation，再通过 Change Implementation 落实并验证，最后仅以有效验证结果进入 Change Closure。

          - **推进一个 Change**

            - 用户授权新的演进意图
            - Change 依次形成、实现并验证、同步和归档
        acceptanceCases: []
      - name: 保持实现与模型一致
        body: |-
          Change Closure 完成后，项目实现与同步后的 Semantic Model SHALL 共同进入表达同一用户意图的新稳定状态。

          - **Change 完成**

            - Change 被成功关闭
            - 正式模型表达已验证实现所落实的目标语义
        acceptanceCases: []
  element:change-structural-definition:
    declaration:
      identity: change-structural-definition
      kind: element
      parent: definition-framing
      title: 已确认设计记录
      definition: 已确认设计记录是 Definition Framing 形成的精简中间制品，独立承载后续生成需要遵循的用户确认内容。它包含已确认的结构片段、行为细节及用户指定材料，表达一次形成上下文中的当前确认结果；不等同于完整结构目标草稿、Contract、Design Summary 或执行计划。它为 Build 与 Propose 提供形成依据，不独立确定 Expected Semantic Model，也不成为形成完成后的规范语义来源。
    sections:
      - name: 保持稳定身份与最新状态
        body: |-
          记录 SHALL 使用不可变 explorationId、可变 slug 与稳定条目身份，表达当前已确认状态；修订 SHALL 更新相关条目并保留无关条目，不保存相互冲突的累积对话，不要求 revision history 或 readiness 状态。

          - **重命名保留记录身份**

            - 用户重命名记录标题或 slug
            - explorationId 和未变更条目的 identity 不变。

          - **修订保持当前态**

            - 用户授权修订一个已确认条目
            - 保存最新获准内容而非并列保留相互冲突版本。
        acceptanceCases: []
      - name: 保存相关 Semantic Model 基准快照
        body: |-
          记录 SHALL 保存 CLI 计算的来源版本标识及相关上下文基准，以区分捕获时不存在的 formal model、存在且有效的模型及之后上下文变化。相关语义身份仅在已知时显式关联，SHALL NOT 以自然语言猜测完整依赖范围；CLI 比较能确定的上下文变化，其结果不是语义覆盖证明。

          - **首次 Build 无正式模型**

            - 合法 Build 上下文中尚不存在 formal model
            - 基准明确记录缺失状态，允许保存已确认设计。

          - **模型损坏不等于缺失**

            - formal source 存在但解析或校验失败
            - 返回错误，不以不存在的基准继续写入。

          - **上下文变化可见**

            - 记录捕获后关联的模型上下文发生变化
            - 报告变化与可用差异，消费者重查相关结论，不宣称自动判断语义冲突。
        acceptanceCases: []
      - name: 仅作为形成来源与历史记录
        body: |-
          记录 SHALL 为 Build 或 Propose 提供形成依据；目标完成覆盖复核与适用校验后，精确来源快照仅作为形成历史。Candidate 来源可绑定 review digest 并进入 Build history，但 SHALL NOT 提升进 formal partitions；Change 来源 SHALL NOT 参与 Expected Semantic Model、sync 或 Closure 的规范语义计算。

          - **Change 来源完成交接**

            - 完整 Change 覆盖确认内容且通过校验并完成来源消费
            - 快照保留形成历史，目标语义仍仅由 Semantic Model 与 Semantic Delta 决定。

          - **Build 来源保留而不提升**

            - 带来源快照的 Candidate 被确认并成功提升
            - 来源进入 Build history，不进入正式模型四分区。
        acceptanceCases: []
      - name: 保存精简当前确认内容
        body: |-
          已确认设计记录 SHALL 保存一次形成上下文中的精简当前确认内容，可包含结构片段、行为细节及用户指定材料；SHALL NOT 要求完整目标模型、四类结构数组或与所有未来 Contract 一一对应。Build 与 Change 形成 SHALL 共享一种记录模型但使用独立实例。

          - **分别记录 Build 与 Change 设计**

            - Build 与 Explore 分别形成关键确认
            - 使用相同格式的不同记录身份，不互相覆盖或共用一个全局内容记录。

          - **局部确认即可记录**

            - 用户只确认一个行为条件并授权保存
            - 保存该条目，不要求先补全 hierarchy、Kinds 或 Relationships。
        acceptanceCases: []
      - name: 区分确认条目与规范 Delta
        body: |-
          记录 SHALL 使用稳定条目身份表达当前确认内容与其性质，不以 ADDED / MODIFIED / REMOVED 结构目标集替代语义记录；从记录生成目标语义时 SHALL 区分规范确认、设计说明与用户要求保留的材料，不能把后两者自动转换为规范义务。

          - **说明材料不自动规范化**

            - 用户要求保留一个理由或被否决的方案
            - 记录其说明性质，生成时路由到 Plan 或 provenance，不虚构 Contract 承诺。
        acceptanceCases: []
  element:cli:
    declaration:
      identity: cli
      kind: element
      parent: interaction-surfaces
      title: CLI
      definition: CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，管理息壤配置，并在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
    sections:
      - name: 提供一致可复现的操作
        body: |-
          CLI SHALL 管理工作区、项目配置与 Agent 工具集成，并为 Realization 提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化和原子状态转换。

          - **Agent 执行确定性操作**

            - Agent 需要查询、校验、同步、提升或归档
            - CLI 对相同有效输入产生一致结果，并以明确失败语义拒绝无效操作
        acceptanceCases: []
      - name: 保持 Agent 与 CLI 职责分离
        body: |-
          CLI SHALL 负责可确定性复现的操作，SHALL NOT 替代用户授权或 Agent、Reviewer、Optimizer 的语义判断。

          - **操作需要目标语义决策**

            - 输入不足以唯一决定目标层级或行为
            - CLI 报告问题而不创作或规范化语义
        acceptanceCases: []
      - name: 提供 model-driven authoring help
        body: |-
          `xirang help authoring semantic-delta` SHALL 从当前项目 Semantic Model 的 Metamodel 只读投影 Relationship Kinds，SHALL NOT 维护代码内置默认 relationship kinds 或预设 relationship entries。

          - **Relationship Kinds 来自当前 Metamodel**

            - 用户运行 `xirang help authoring semantic-delta`
            - output SHALL 列出当前 `.xirang/model/metamodel/` 声明的全部 Relationship Kinds
            - SHALL NOT 包含当前 Metamodel 未声明的 Kind

          - **同时指导 Relationship 与 Relationship Kind 新增**

            - help 渲染 authoring 指导
            - output SHALL 包含新增 Relationship 的占位语法
            - SHALL 包含新增 Relationship Kind 的占位语法
            - SHALL NOT 输出预设的 Relationship entries 或伪 Element identities

          - **端点约束区分缺失与显式空**

            - Relationship Kind 的 `sourceKinds` 或 `targetKinds` 缺失
            - help SHALL 显示为 unrestricted
            - Relationship Kind 的 `sourceKinds` 或 `targetKinds` 为显式空数组
            - help SHALL 显示为不允许任何 Element Kind
            - 两种语义 SHALL NOT 合并为同一显示

          - **Kind body 原样输出**

            - Relationship Kind 声明了非空 body
            - help SHALL 原样输出该 body
            - SHALL NOT 由 CLI 补写、摘要或改写其语义

          - **缺失或空 Semantic Model 被拒绝**

            - 当前项目缺少 `.xirang/model/` 或该目录存在但无任何 Element Kind 与 Element
            - help SHALL 报告 Semantic Model unavailable 而非显示空 Kind 列表

          - **语义无效 Semantic Model 被拒绝**

            - 当前 Semantic Model 存在 ERROR 级别 semantic diagnostic
            - help SHALL 报告该 diagnostic 而非基于无效模型生成输出

          - **Authoring help JSON 返回 Metamodel 声明**

            - 用户运行 `xirang help authoring semantic-delta --json`
            - stdout SHALL be valid JSON with `file`、`definition`、`relationshipDelta` 和 `relationshipKinds`
            - `relationshipKinds` SHALL 包含当前 Metamodel 声明的 Kind identity、可选 endpoint constraints 与 body
            - SHALL NOT 包含名为 `relations` 的虚构 Relationship entries 属性
        acceptanceCases: []
      - name: 从已安装运行时启动嵌入式 LikeC4
        body: |-
          `xirang view` SHALL 在缺少 LikeC4 workspace 源码的部署安装中从随包发布的 LikeC4 dist 启动嵌入式浏览器服务，且 SHALL NOT 因缺少 workspace 源码或 tsx 而失败；在包含 LikeC4 workspace 源码的开发环境中，CLI SHALL 在任一 CLI runtime 包的源码新于其 dist 产物时以 tsx 从源码运行，否则 SHALL 使用 dist。

          - **生产安装后启动浏览器服务**

            - 用户通过 `scripts/build_and_install.sh` 全局安装 xirang 后运行 `xirang view`
            - CLI 从随包部署的 LikeC4 dist 启动嵌入式浏览器服务
            - 不因缺少 workspace 源码或 tsx 而失败

          - **开发环境 dist 陈旧回退源码**

            - 开发环境中任一 CLI runtime 包的源码新于其 dist 产物
            - CLI 以 tsx 从源码运行
            - 输出重建生产构建的提示

          - **开发环境 dist 同步使用构建产物**

            - 开发环境中所有 CLI runtime 包的 dist 产物均不陈旧
            - CLI 使用 dist 运行
        acceptanceCases: []
      - name: 配置 Web 监听地址
        body: |-
          `xirang view` SHALL 接受可选 `--listen <address>` 并将该地址传递给嵌入式 LikeC4 服务；未提供该参数时 SHALL 保持 LikeC4 的默认本地监听策略。

          - **从 Windows 访问 WSL 浏览服务**

            - 用户在 WSL 中运行 `xirang view --listen 0.0.0.0 --port 61000`
            - CLI 在启动前重新生成 LikeC4 缓存，并使服务监听 `0.0.0.0:61000` 以供 Windows 通过转发地址访问

          - **未显式开放网络接口**

            - 用户运行 `xirang view` 且未提供 `--listen`
            - CLI 不注入监听地址并保留 LikeC4 默认绑定行为

          - **自定义端口**

            - 用户运行 `xirang view --port 8080`
            - CLI 在端口 8080 启动浏览器服务
            - 输出服务器地址 `http://localhost:8080`
        acceptanceCases: []
  element:collaboration-structure:
    declaration:
      identity: collaboration-structure
      kind: perspective
      parent: realization
      title: 协作结构
      definition: 协作结构是按谁授权、判断、编排和操作的协作角度组织 Participants 与 Interaction Surfaces 的 Perspective。它包含用户、Agents 及其使用的界面结构，不包含落实工作的阶段顺序、入口或过程结果。
    sections:
      - name: 协作结构维度组织
        body: |-
          collaboration-structure SHALL 从协作角度组织 Realization 的主体与界面：Participants 承担授权、判断与编排，Interaction Surfaces 提供配置、呈现与确定性操作。两个维度在自身层级完整描述，跨维度语义覆盖是允许的。

          - **协作结构容纳主体与界面**

            - 浏览 collaboration-structure 的 descendants
            - 呈现 Participants（用户、Agents 与 Internal Agents）与 Interaction Surfaces（CLI、Web）

          - **工作身份描述所承担活动**

            - Agent 工作身份描述其所承担 Activity 的相关语义
            - 该跨维度语义覆盖是允许的
            - 推进过程与协作结构两个维度都不作为另一个维度的差量表达
        acceptanceCases: []
  element:definition-framing:
    declaration:
      identity: definition-framing
      kind: element
      parent: explore
      title: Definition Framing
      definition: Definition Framing 是项目意图形成过程中澄清并保留已确认关键设计的方法。它独立建模，为 Semantic Model Build 与 Explore 提供共同的确认依据形成方式，包含关键内容的识别、确认、冲突调和与记录修订；结构分解是其中适用的活动，而非全部范围。它不负责生成完整 Semantic Model 或 Change，也不承担项目实现。
    sections:
      - name: 澄清结构定义
        body: |-
          Definition Framing SHALL 作为 Build 与 Explore 可持续使用的方法，按需要澄清关键设计；处理结构时通过因果定义、identity 与边界澄清、单维度分解及 BFS 确认形成可审查的结构片段，SHALL NOT 将完整结构草稿设为全部设计讨论的前置条件。

          - **结构意图仍有多个合理解释**

            - 不同 identity、Kind、parent 或 Relationship 选择会改变目标语义
            - Definition Framing 比较受限选项并一次请求一个用户裁决
        acceptanceCases: []
      - name: 保持依赖设计一致
        body: |-
          已确认设计记录变化时，Definition Framing SHALL 标识受影响的设计、Summary 与覆盖结论，要求消费者重载并重新检查；未受影响内容保持不变，不得复用已经失效的确认。

          - **记录修订使结论失效**

            - 一个已确认条件或结构位置被授权修订
            - 依赖旧条目的设计与 Summary 不再视为有效，重新核对后才能继续交接。
        acceptanceCases: []
      - name: 按项目拆分指导确认结构目标
        body: |-
          Definition Framing SHALL 在提出或确认 Element hierarchy 目标前消费 normalized `decomposition`：完整读取解析路径指向的指导文件并按其指导形成结构。拆分指导 SHALL 与因果定义、identity 边界、单维度、MECE 和 BFS confirmation 联合使用，并 SHALL NOT 代替用户对本次记录内容的显式确认。

          - **指导文件驱动结构讨论**

            - Definition Framing 需要为一个 parent 确定完整 sibling set 且配置有效
            - Agent 在结构讨论前完整读取该指导文件
            - 再以单维度、MECE 与 BFS 检查该层结构

          - **拆分指导不可读时停止**

            - 解析路径的指导文件缺失或不可读
            - Definition Framing 停止形成受影响结构目标并询问用户
            - SHALL NOT 创建或更新 framing payload

          - **拆分指导不覆盖 Formal 语义**

            - 拆分指导与 Formal Semantic Model、用户明确意图或已确认结构目标冲突
            - Agent 报告冲突并请求用户裁决
            - SHALL NOT 用拆分指导静默替换规范语义
        acceptanceCases: []
      - name: 捕获已确认关键设计
        body: |-
          Agent SHALL 在每个已确认设计段落结束时主动发起该段确认项的批量记录，不等待用户提及 framing，也不把空记录列表视作豁免。Definition Framing SHALL 默认捕获下游生成不得擅自改变的关键确认，完整保留条件、数值、例外、时序及已确认结构片段。用户明确要求记录的材料 SHALL 优先保存，不得因 Agent 判定不重要而省略。一般讨论、备选方案、完整理由与实施/测试计划不自动记录；用户明确要求时 MAY 保存，但不得擅自改变其规范或说明性质。

          - **用户指定细节优先**

            - 用户明确要求记录一个 Agent 原先认为次要的例外或说明
            - 将该材料纳入待确认写入内容，保留细节和性质，不以重要性筛选丢弃。

          - **未要求保留全部讨论**

            - 对话同时包含已确认行为与未采用的备选讨论
            - 默认仅提取关键确认，不把全部讨论和计划写成确认记录。
        acceptanceCases: []
      - name: 只持久化明确授权的确认内容
        body: |-
          每次记录创建、更新或修订 SHALL 先展示完整拟保存内容、记录身份及受控目标，再取得独立的持久化确认并使用 xirang framing 保存；对方案、设计方向或段落的确认 SHALL NOT 自动授予写入权限。确认 SHALL 按设计段落聚合：一个设计段落结束后一次性展示本段产出的全部待写条目并取得该批决策，SHALL NOT 就单个条目反复打断。聚合 SHALL 只改变确认发生的时机，SHALL NOT 减少一次创建或更新所需的独立授权；未被用户在该批中处理并确认的条目 SHALL NOT 视为已确认。批量 SHALL NOT 放宽设计本身的一次一问纪律。

          - **用户只确认设计方向**

            - 用户选择方案或说可以，但没有明确确认本次记录写入
            - 继续设计，不创建或更新记录。

          - **确认具体记录写入**

            - 用户已看过本次完整待写内容与目标并明确授权保存
            - 仅通过 CLI 保存获准内容，不附加未确认条目。

          - **按设计段落批量确认**

            - 一个设计段落产出多条待写条目且用户已确认该段落方向
            - 一次性展示本段全部待写条目并取得一次批量决策
            - 不逐条打断，且每条仍只在其获准的创建或更新中写入

          - **批中未处理的条目不算确认**

            - 批量展示的条目中有一条用户未予处理
            - 该条目不算已确认，不随同批获准条目写入
            - 该批的获准不覆盖它

          - **批量不放宽一次一问**

            - 同一段落内仍有未决的设计问题
            - 设计问题仍按一次一问澄清，批量只适用于已确认条目的持久化决策
        acceptanceCases: []
      - name: 完整读取并调和后更新记录
        body: |-
          更新前 SHALL 使用 xirang framing show 读取完整当前记录，以当前内容加本次明确获准变化组合新状态。SHALL 在保存前识别新旧冲突并说明影响，由用户裁决；SHALL NOT 默认最新陈述覆盖先前确认。保存后 SHALL 审查 added / modified / removed 差异，未经授权消失的条目必须调和后才继续。

          - **冲突先裁决后写入**

            - 新设计与记录中的已确认条件相矛盾
            - 说明冲突和影响，请求用户裁决；裁决不等于保存授权，持久化仍另行确认。

          - **未改条目保持完整**

            - 用户只授权修订一个条目
            - 以完整读取的现状更新该条目，保留其他条目，保存后核对 diff。

          - **diff 暴露遗忘**

            - 保存后的 removed 显示未经确认删除的条目
            - 停止后续交接，调和并经授权修复记录，再检查依赖结论。
        acceptanceCases: []
      - name: 在交接前落定记录决策
        body: |-
          Definition Framing SHALL 在形成过程交接前落定恰好一个记录决策：已持久化记录、用户明确授予的豁免、或本次确认不含 normative 内容的声明。交接前 SHALL 对照确认对话检查各规范性确认均已记录或明确豁免；已有部分记录不覆盖后续遗漏的确认，缺失时先发起补录。存在 normative 确认而三者皆缺时 SHALL 停止交接。豁免 SHALL 由用户授予并将其理由记录于 Design Summary 与 provenance。SHALL NOT 以静默跳过代替任何一态，SHALL NOT 为满足决策而创建空记录，并在后续新增 normative 确认时重新开启已豁免的决策。

          - **有规范确认却未落定决策**

            - 已确认设计含至少一条 normative 确认，且用户既未建立记录也未授予豁免
            - 停止交接并向用户请求在记录与豁免之间裁决
            - 不创建空记录，也不以无记录继续

          - **用户授予豁免**

            - 用户明确表示本次不建立记录
            - 记录该豁免及其理由，进入 Design Summary 与 provenance 并可被下游验证
            - 后续新增 normative 确认时重新开启记录决策

          - **本次无规范内容**

            - 已确认设计仅含说明性材料、备选讨论或实施计划
            - 显式声明本次无 normative 内容，不要求建立记录
            - 声明而非沉默构成交接依据
        acceptanceCases: []
      - name: 逐条核对确认内容的落位
        body: |-
          Definition Framing SHALL 在交接前对记录的规范性条目逐条核对落位，将每条标记为已落位于目标模型或报告为未覆盖并说明理由。未标记的条目 SHALL 计为未覆盖并阻塞交接。合法落位目标 SHALL 覆盖 Declaration、Contract、Relationship、Metamodel 与 Authored View。每条核对 SHALL 给出目标位置及保留条件、例外和时序的简明语义判断，不能只列位置或复述原文。核对结果 SHALL 记录在对话中，SHALL NOT 建立持久审计账本。豁免或本次无 normative 内容时 SHALL 显式声明该事实，不得以沉默表示核对通过。

          - **条目未标记即阻塞**

            - 记录含若干规范性条目，其中一条既未标记落位也未报告未覆盖
            - 该条目计为未覆盖并阻塞交接
            - 需补充对应 Contract、报告缺口或请求用户裁决后才继续

          - **Authored View 条目有合法落位**

            - 用户确认的条目描述一个 Authored View 的目标状态
            - 标记其落位于 `views/<view identity>.md`
            - 不因落位清单未列 View 而将该条目判为未覆盖

          - **无条目可核对时显式声明**

            - 来源为已授权豁免或本次无 normative 内容
            - 显式声明没有条目需要核对
            - 不将无条目等同于核对通过
        acceptanceCases: []
  element:definition-framing-operations:
    declaration:
      identity: definition-framing-operations
      kind: element
      parent: deterministic-operations
      title: Definition Framing Operations
      definition: Definition Framing Operations 是统一管理已确认设计记录的 CLI 确定性操作集合。它封装记录的生命周期、相关上下文、差异及面向 Build 和 Change 的交接，不包含自然语言设计裁决、完整性语义判断或正式模型提升。
    sections:
      - name: 隔离受控文件路径
        body: |-
          Framing lifecycle SHALL 仅操作 canonical .xirang/framing/ 下按合法记录身份寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝与 filename/frontmatter 一致性检查。目标快照 SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

          - **Managed path 是 symlink**

            - 任一记录或交接目标路径是 symlink 或逃逸受控根目录
            - 返回稳定路径错误，不跟随链接也不写入目标。

          - **Windows 路径隔离**

            - 命令在 Windows 上创建、读取、更新或交接记录
            - 使用平台 path API 和同一 containment 规则，存储的项目相对路径保持 canonical 表示。
        acceptanceCases: []
      - name: 提供稳定 Framing JSON Contract
        body: |-
          每个 `xirang framing` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes。

          - **Validation 发现相关 Drift**

            - command 成功读取对象但 关联上下文 已变化
            - JSON status 为 invalid、exit code 为 1 且不输出 spinner、颜色或 stack trace
        acceptanceCases: []
      - name: 管理统一确认记录生命周期
        body: |-
          xirang framing create|list|show|status|validate|update|rename|consume|discard SHALL 管理非空已确认设计记录，以 exploration identity 寻址，使用统一 versioned 格式和彼此独立的 Build / Change 形成实例；CLI SHALL NOT 决定哪些用户内容重要。旧结构记录 SHALL 明确诊断不受支持，不自动迁移、删除或建立兼容副本。

          - **创建并恢复记录**

            - create 接收合法 slug、明确形成上下文和已获用户授权的非空条目
            - 生成稳定 explorationId 并保存到受控位置，show 返回完整当前条目，list 与 status 可重新发现记录。

          - **空记录和旧格式不隐式转换**

            - 输入为空或发现旧四分区结构记录
            - 拒绝无意义空记录或报告不支持的旧格式，既有文件不被迁移或删除。
        acceptanceCases: []
      - name: 返回记录校验与上下文变化
        body: |-
          Framing validation SHALL 分别报告格式、稳定身份、显式上下文关联与版本变化的确定性诊断，不推断自然语言冲突或完备性。相关上下文变化 SHALL 阻止复用旧检查结论；意图判断由 Agent 完成并由用户裁决。合法初始 Build 可无 formal model，存在而损坏的模型必须报错。

          - **合法缺失与损坏分离**

            - 首次 Build 没有正式模型，或已有模型损坏
            - 前者可创建合法记录，后者失败并保持源与目标不变。

          - **格式合法不等于意图完整**

            - 记录通过格式与身份检查但仍可能遗漏某个行为例外
            - CLI 只报告确定性有效性，不输出已完成语义覆盖的结论。
        acceptanceCases: []
      - name: 确定性交接确认来源
        body: |-
          framing consume SHALL 显式选择 named Change 或 active Candidate，核对当前源版本及适用目标校验；Agent 必须先完成该版本记录到目标的覆盖复核，CLI SHALL NOT 用四类结构相等或字符串存在性代替该语义判断。CLI SHALL 先保存精确来源快照，再完成适用校验，最后删除活动来源；任何前置失败 SHALL 保留来源与原有目标。同字节快照允许重验后恢复，冲突快照必须停止。

          - **相同快照恢复交接**

            - 上次交接在复制后中断且来源与目标快照字节相同
            - 重验源版本及目标后完成清理，不覆盖来源快照。

          - **冲突或失败保留来源**

            - 目标已有不同快照、版本变化或目标校验失败
            - 返回错误，保留活动来源及既有目标，不声明交接完成。

          - **显式选择消费目标**

            - 同一项目存在活动 Candidate 与多个 Changes
            - 只向命令明确指定的合法目标交接，不从当前目录猜测目标。
        acceptanceCases: []
      - name: 返回确认条目的相对变化
        body: |-
          framing update SHALL 按稳定条目 identity 返回 added / modified / removed 差异：added 给出新增条目，modified 包含完整 before / after，removed 包含完整旧条目。合法显式更新返回 ok；差异供 Agent 审查，不代表用户已授权所有变化，也不构成自然语言冲突判断。

          - **更新差异完整可审查**

            - 替换内容新增、修改或省略现有条目
            - 分别返回完整 added、before/after 和 removed 内容，使意外遗忘可见。
        acceptanceCases: []
  element:delivery-validation:
    declaration:
      identity: delivery-validation
      kind: element
      parent: realization-process
      title: Delivery Validation
      definition: Delivery Validation 定义仓库当前维护的可执行交付面：Nix 打包/开发环境与 GitHub 跨平台验证工作流。它是项目自身的交付契约，作为 Project Root 的细化 Element 独立演进。
    sections:
      - name: 版本化 Nix 交付面
        body: |-
          Nix flake SHALL 声明用于构建息壤和进入其开发 shell 的 Node.js 与 pnpm 包。

          - **Nix 包或开发 shell 被求值**

            - 贡献者求值 package 或进入默认开发 shell
            - flake SHALL 提供其固定的 Node.js 与 pnpm 工具链
            - SHALL 从锁定的 pnpm dependency closure 构建当前 package.json 版本
        acceptanceCases: []
      - name: 跨平台 GitHub 验证
        body: |-
          GitHub workflow SHALL 在 Linux、macOS 与 Windows 上、以其固定的 Node.js 与 pnpm 版本运行声明的 root 与 vendored 验证命令。

          - **跨平台工作流运行**

            - pull request 或 main-branch push 触发验证
            - root install、identity audit、lint、build、tests 与 browser tests SHALL 在每个声明的操作系统上运行
            - vendored install、typecheck、tests 与 build SHALL 在每个声明的操作系统上运行
        acceptanceCases: []
      - name: 交付声明跟随可执行配置
        body: |-
          交付文档与契约 SHALL 只描述 versioned flake 或 workflow 配置中存在的 job、命令、操作系统与工具版本。

          - **交付配置变化**

            - Nix package、workflow job、命令、操作系统或固定工具版本被增删或改变
            - 相应交付契约 SHALL 在同一 Change 中调和
        acceptanceCases: []
  element:design-exploration:
    declaration:
      identity: design-exploration
      kind: element
      parent: explore
      title: Design Exploration
      definition: Design Exploration 是 Explore 中澄清和确认设计的阶段。它基于 Semantic Model 与项目证据，通过一次一问和方案比较推进设计；复杂变更分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks，窄变更至少确认 problem、impact scope、approach 与 verification method，最终形成不持久化的 Design Summary。
    sections:
      - name: 处理确定性影响
        body: |-
          Design Exploration SHALL 将 CLI 返回的格式、版本与显式上下文变化纳入设计复核；CLI 可提供确定性影响线索，但不能据此断言自然语言设计无冲突或完整。

          - **上下文变化后复核设计**

            - 记录关联的正式模型上下文发生变化
            - 重查相关设计和授权，区分预期模型演进与未解决矛盾，而非直接丢弃记录或接受新状态。
        acceptanceCases: []
      - name: 确认适用设计
        body: |-
          Design Exploration SHALL 主动发现需要用户选择的决策点，通过一次一问、方案比较与适用 section confirmation，确认行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing、risks 及其他必要设计维度。Agent SHALL 解释适用的异常结果、竞争事件与时间起点或容差，给出推荐及理由并等待用户确认；推荐与未选方案不得当作已确认决定。关键条件、动作与可观察验收结果 SHALL 随设计确认，不能仅确认测试工具或技术方案名称；完整 Sections、Acceptance Cases 与 tasks 留给 Propose 文档化。

          - **多个实现方案符合目标语义**

            - 多个方案具有不同权衡
            - Design Exploration 比较方案并请求用户选择
        acceptanceCases: []
      - name: 形成不持久化的 Design Summary
        body: |-
          Design Exploration SHALL 在适用设计确认后形成 conversation-only Design Summary 供 Propose 使用。有记录时 SHALL 先重载完整当前记录，检查记录内部及记录与拟议设计间冲突，由用户裁决未决意图；涉及记录修改时仍单独授权并在保存后重载复核。任一未决冲突 SHALL 阻止 Summary，之后记录变化 SHALL 使受影响结论失效。

          - **Design Exploration 完成**

            - 适用设计已确认，当前记录已重载且不存在未决冲突
            - 呈现 conversation-only Design Summary，等待用户触发 Propose。

          - **冲突阻止 Summary**

            - 记录内部互相矛盾或拟议设计违背既有确认
            - 说明冲突及影响，等待用户裁决，不输出可交接的 Summary。

          - **裁决后重新检查**

            - 用户裁决并单独授权必要记录修改
            - 保存并检查 diff，再读取完整记录重查冲突；通过后才生成 Summary。

          - **后续记录变化使 Summary 过期**

            - Summary 已产生但相关记录条目随后改变
            - 重查并更新受影响 Summary 和覆盖结论，不使用旧结论放行。
        acceptanceCases: []
      - name: 设计自查与忠实交接
        body: |-
          Design Exploration SHALL 在交接前用适用的边界或竞争事件序列检查机制、不变量、时序和失败行为。已确认设计能确定答案的表达或推导错误 SHALL 由 Agent 修正；需要新增或改变决策时 SHALL 询问用户。影响当前目标的未决决策 SHALL 阻塞可交接声明；延后或排除范围 SHALL 经用户确认，不能把当前必需行为静默推给 Propose。

          Design Summary SHALL 保留已确认行为、范围、决策及理由，包含适用条件、数值、例外、时序和关键验收结果；推荐、未选方案、未决事项与用户明确排除的范围 SHALL 保持可区分。有记录时引用记录身份与已核对版本，不重复记录全文；Summary 保持会话内，不新增永久决策台账。Propose 仍可在文档化时发现新缺口。
        acceptanceCases: []
      - name: 使用完整当前确认记录
        body: |-
          Design Exploration SHALL 在开始、恢复和准备输出 Summary 时读取存在的完整当前记录，联合 Semantic Model 与项目证据使用已确认内容，不得仅依赖最近对话或记录摘要。无记录时 SHALL 直接按通常流程探索。

          - **恢复已有记录的探索**

            - 已有记录而对话中仅剩部分上下文
            - 通过 CLI 读取完整当前记录后继续，保留未出现在最近对话中的确认。

          - **没有记录时正常继续**

            - 记录不存在
            - 基于模型与项目证据自审设计，不要求建立空记录。
        acceptanceCases: []
  element:deterministic-operations:
    declaration:
      identity: deterministic-operations
      kind: element
      parent: cli
      title: Deterministic Operations
      definition: Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
    sections:
      - name: 对模型和 Change 提供结构化操作
        body: |-
          Deterministic Operations SHALL 支持 Semantic Model 与 Change 的查询、搜索、影响分析、差异、验证与派生呈现，并以 identity 而非文件位置寻址语义对象。

          - **查询 Element**

            - Agent 按稳定 identity 查询 Element
            - CLI 返回其语义上下文
        acceptanceCases: []
      - name: 原子提升 Candidate
        body: |-
          Candidate promotion SHALL 在用户确认精确版本后原子整体替换正式模型。

          - **Promotion 失败**

            - 原子替换无法完成
            - 正式模型不进入部分提升状态
        acceptanceCases: []
      - name: 在 Sync 前完整验证
        body: |-
          Delta sync SHALL 在应用前完整验证 Semantic Delta 与 Expected Semantic Model。

          - **Delta 无效**

            - Sync 准备阶段发现验证错误
            - 正式模型保持不变
        acceptanceCases: []
      - name: 最小重写 Sync 单元
        body: |-
          Delta sync SHALL 只重写 Semantic Delta 实际影响的存储单元。

          - **Delta 只影响一个 Element**

            - Sync 应用该 Delta
            - 无关模型单元保持原字节不变
        acceptanceCases: []
      - name: Sync 失败完整回滚
        body: |-
          Delta sync 任一环节失败时 SHALL 完整回滚到应用前状态。

          - **Sync 中途失败**

            - 任一目标单元无法写入
            - 正式模型恢复到应用前状态
        acceptanceCases: []
      - name: 持久化验证证据
        body: |-
          Deterministic Operations SHALL 持久化 Verify 与 Change Closure 使用的可复现验证证据。

          - **Closure 检查验证入口**

            - Change 请求进入 Closure
            - CLI 提供已持久化证据供入口判断
        acceptanceCases: []
      - name: 序列化是 IR 的确定性函数
        body: |-
          模型序列化 SHALL 是当前 IR 的确定性函数，相同 IR SHALL 产生逐字节相同输出。

          - **重复序列化相同 IR**

            - 系统两次序列化相同 IR
            - 两次输出逐字节一致
        acceptanceCases: []
      - name: 固定 Frontmatter 键顺序
        body: |-
          模型序列化 SHALL 以固定键顺序输出 frontmatter。

          - **序列化 Markdown 单元**

            - 系统写入同类实体
            - frontmatter 字段顺序保持确定
        acceptanceCases: []
      - name: 排序 Relationship Entries
        body: |-
          模型序列化 SHALL 按 `source`、`kind`、`target` 依次排序 Relationship entries。

          - **输入容器顺序不同**

            - IR 包含相同 Relationship 集合
            - 序列化列表顺序一致
        acceptanceCases: []
      - name: 验证序列化往返属性
        body: |-
          测试层 SHALL 以属性测试验证 `parse(serialize(ir))` 与原 IR 相等，并覆盖转义、多行文本、空集合与缺省字段。

          - **序列化边界输入**

            - 属性测试生成有效边界 IR
            - 序列化后重新解析得到语义相等 IR
        acceptanceCases: []
      - name: 规范化无权威顺序集合
        body: |-
          语义比较 SHALL 将 Elements、Relationships、Kinds、Authored Views 及 `parents`、`children`、`sourceKinds`、`targetKinds`、`include`、`exclude` 作为无序集合规范化后比较。

          - **仅集合排列变化**

            - 两个模型只在无权威顺序的排列上不同
            - diff 不报告语义变化
        acceptanceCases: []
      - name: 保留 Contract 条目顺序
        body: |-
          Element Contract 内 Section 顺序与 Section 内 Acceptance Case 顺序 SHALL 保留并参与语义比较。

          - **Section 顺序变化**

            - 同一 Contract 的 Sections 被重排
            - diff 报告语义变化
        acceptanceCases: []
      - name: 规范化散文比较
        body: |-
          散文比较 SHALL 只规范化行尾与文件末尾空白后逐字比较。

          - **散文仅行尾不同**

            - 两份散文只存在行尾编码差异
            - diff 不报告语义变化
        acceptanceCases: []
      - name: 排除非语义存储信息
        body: |-
          派生字段、文件路径与文件名 SHALL NOT 参与语义比较。

          - **单元只改变文件位置**

            - 实体内容与 identity 不变
            - diff 不报告语义变化
        acceptanceCases: []
      - name: 以实体身份输出差异
        body: |-
          差异输出 SHALL 以 entity type 与 identity 为键，SHALL NOT 携带存储分区信息。

          - **输出模型差异**

            - CLI 报告变化实体
            - 使用 entity type 与 identity 定位条目
        acceptanceCases: []
      - name: 区分初始化来源与 Formal Comparison
        body: |-
          Candidate validation SHALL 将 `candidate.yaml.baseline` 的初始化来源与当前 Formal Semantic Model 的 comparison availability 分别表达。

          - **Clean Candidate 面对现有 Formal Model**

            - Candidate 从 clean 初始化且当前 Formal Model 存在
            - validation 仍以当前 Formal Model 作为 comparison baseline
        acceptanceCases: []
      - name: Formal 缺失时报告 Diff 不可用
        body: |-
          当前 Formal Semantic Model 不存在时，Candidate validation SHALL 返回 `comparison.baseline: absent`、`comparison.diff: unavailable` 与 `reason: formal-model-absent`，SHALL NOT 构造无效空 diff 或假设空 Formal Model。

          - **构建首个 Formal Model**

            - 有效 Candidate 没有可比较的当前 Formal Model
            - validation 仍返回 review digest 且 comparison 明确不可用
        acceptanceCases: []
      - name: Formal 存在时生成 Promotion Diff
        body: |-
          当前 Formal Semantic Model 存在且有效时，Candidate validation SHALL 返回 `comparison.baseline: formal`、`comparison.diff: available`、Formal fingerprint 与从当前 Formal 到 Candidate 的真实 semantic diff。

          - **Candidate 改变正式语义**

            - validation 比较有效 Formal Model 与 Candidate
            - diff entries 完整表达 promotion 将产生的 ADDED、MODIFIED 与 REMOVED 语义
        acceptanceCases: []
      - name: Comparison 不参与 Review Digest
        body: |-
          Candidate comparison availability 与 diff 输出 SHALL NOT 参与 review digest；digest SHALL 只绑定 Candidate 的审查内容。

          - **Formal 状态在 Candidate 不变时变化**

            - 相同 Candidate 针对不同 comparison availability 进行校验
            - Candidate review digest 保持不变
        acceptanceCases: []
      - name: 通过 Validation 呈现 Change 差异
        body: |-
          Deterministic Operations SHALL 通过 `xirang validate --change <name>` 提供 Change 的只读文本差异预览与 JSON summary、entries 和 diagnostics，SHALL NOT 注册独立 `xirang diff` command 或将该差异持久化为 Change artifact。

          - **校验 Change 并查看文本差异**

            - 用户或 Agent 运行 `xirang validate --change sample`
            - CLI 在校验结果中呈现当前 Semantic Model 与 Expected Semantic Model 的差异且不创建文件

          - **获取结构化校验结果**

            - 用户或 Agent 运行 `xirang validate --change sample --json`
            - CLI 返回 validation status、summary、concise entries 与 diagnostics

          - **调用已删除的 Diff command**

            - 用户或脚本运行 `xirang diff --change sample`
            - CLI 以 unknown command 失败且不修改 Change directory
        acceptanceCases: []
      - name: 完整处理 Element Definition
        body: |-
          Deterministic Operations SHALL 在 IR、解析、校验、序列化、Semantic Delta、semantic diff、fingerprint、Candidate、Sync、查询、搜索与影响分析中保留完整 Element Definition，并 SHALL NOT 以展示 excerpt 替代或截断该规范文本。

          - **查询和搜索 Element**

            - Agent 通过 CLI query、search 或 impact 操作读取一个 Element
            - text 与 JSON 结果均返回完整 `definition`，search evidence 使用 `definition` 字段

          - **比较和同步 Definition 变化**

            - ADDED 或 MODIFIED Declaration 携带完整目标 Definition
            - diff、fingerprint、Candidate validation 与 Sync 均以该完整文本确定目标语义
        acceptanceCases: []
      - name: 拒绝 Legacy Declaration Summary
        body: |-
          Deterministic Operations SHALL 对当前 Semantic Model、Candidate 或活动 Change 中 Element Declaration 的 legacy `summary` 返回明确 ERROR，SHALL NOT 将其作为 alias、fallback 或未知字段静默删除。

          - **Parser 遇到 Legacy Summary**

            - 当前输入的 `element-declaration` 包含 `summary`
            - 加载失败并指出应迁移为 `definition`
        acceptanceCases: []
      - name: 隔离受控文件路径
        body: |-
          Framing lifecycle SHALL 仅操作 canonical .xirang/framing/ 下按合法记录身份寻址的 managed regular files，使用 Node.js path APIs、containment、lstat、symlink 拒绝与 filename/frontmatter 一致性检查。目标快照 SHALL 仅写入显式 named Change 或 active Candidate 的受控位置。Windows、macOS 与 Linux SHALL 采用同一隔离语义。

          - **Managed path 是 symlink**

            - 任一记录或交接目标路径是 symlink 或逃逸受控根目录
            - CLI 返回稳定路径错误，不跟随链接也不写入目标

          - **Windows 路径分隔符不同**

            - framing 在 Windows project root 下构造 managed path
            - CLI 使用 Node.js path API 保持 .xirang/framing/ 与明确消费目标的 containment，并仅在 JSON presentation 中转换为 project-relative POSIX path
        acceptanceCases: []
      - name: 提供稳定 Framing JSON Contract
        body: |-
          每个 `xirang framing` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes。

          - **Validation 发现相关 Drift**

            - command 成功读取对象但 关联上下文 已变化
            - JSON status 为 invalid、exit code 为 1 且不输出 spinner、颜色或 stack trace
        acceptanceCases: []
      - name: 通过 Show 与 List 呈现 Change 编译结果
        body: |-
          Deterministic Operations SHALL 从当前 Semantic Model 与 Change 的四分区 Semantic Delta 编译顶层 `show` JSON、顶层 `list` JSON 与 `--long` 文本结果，SHALL NOT 将 Change Plan 或 change-local `specs/` 作为 Semantic Delta 来源。

          - **获取 Change JSON**

            - 用户或 Agent 运行 `xirang show sample --json`
            - CLI 返回 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 和稳定 identity 表达的 concise `entries` 及 compiler `diagnostics`

          - **获取稳定 Change 列表 JSON**

            - 用户或 Agent 运行 `xirang list --json`
            - CLI 返回 `{ changes: [...] }` envelope，每项保留 `name`、task、last-modified、status 与 freshness information，并增加 compiler-derived `title` 和 `deltaCount`

          - **获取详细 Change 文本列表**

            - 用户运行 `xirang list --long`
            - 每个活动 Change 的文本结果包含 title、实体级 Delta 数量与 task status

          - **列出 Change Delta 数量**

            - 用户或 Agent 请求包含 Delta 数量的 Change 列表
            - `deltaCount` 等于 compiler diff 的实体级 `summary.total`

          - **Change 编译失败**

            - 四分区 Semantic Delta 无法形成有效 Expected Semantic Model
            - `show` JSON 返回 `valid: false` 与结构化 `diagnostics`，且消费者不得将返回的 `entries` 视为有效目标状态

          - **忽略旧 Change 语义来源**

            - Change Plan 含有旧式 Delta 描述或 Change 目录含有 change-local `specs/`
            - Show 与 List 只使用四分区 Semantic Delta 和当前 Semantic Model 推导结果
        acceptanceCases: []
      - name: 使用 Verb-first CLI 与 Element Contract 术语
        body: |-
          Deterministic Operations SHALL 仅通过顶层 verb-first commands 提供 Change 展示、列表与验证能力，并 SHALL 以 `contract` 作为 Element Contract 在 flags、type selectors、JSON discriminators、交互选项、completion 与 diagnostics 中的公开术语；CLI SHALL NOT 注册 deprecated `xirang change` command group，也 SHALL NOT 接受旧 `spec` forms 或 forwarding aliases。

          - **使用唯一 Change 操作入口**

            - 用户运行顶层 `xirang show <change>`、`xirang list` 或 `xirang validate --change <change>`
            - CLI 提供对应有效能力，且 `xirang change ...` 不再是已注册 command group

          - **创建 Change 不受影响**

            - 用户运行 `xirang new change <name>`
            - CLI 继续通过 verb-first `new` group 创建 Change

          - **校验全部 Element Contracts**

            - 用户运行 `xirang validate --contracts --json`
            - CLI 校验 Formal Semantic Model 中携带 Contract 的 Elements，并以 `type: "contract"` 返回每项结果

          - **按类型校验一个 Element Contract**

            - 用户运行 `xirang validate <element> --type contract`
            - CLI 以 Element identity 定位并校验其 Contract

          - **拒绝旧公开形式**

            - 用户提供 `--specs`、`--type spec` 或 `xirang change ...`
            - CLI 将其视为未注册 option、type 或 command，而不静默转发到新形式
        acceptanceCases: []
      - name: 管理统一确认记录生命周期
        body: |-
          xirang framing create|list|show|status|validate|update|rename|consume|discard SHALL 管理非空已确认设计记录，以 exploration identity 寻址，使用统一 versioned 格式和彼此独立的 Build / Change 形成实例；CLI SHALL NOT 决定哪些用户内容重要。旧结构记录 SHALL 明确诊断不受支持，不自动迁移、删除或建立兼容副本。

          - **创建并恢复记录**

            - create 接收合法 slug、明确形成上下文和已获用户授权的非空条目
            - 生成稳定 explorationId 并保存到受控位置，show 返回完整当前条目，list 与 status 可重新发现记录。

          - **空记录和旧格式不隐式转换**

            - 输入为空或发现旧四分区结构记录
            - 拒绝无意义空记录或报告不支持的旧格式，既有文件不被迁移或删除。
        acceptanceCases: []
      - name: 返回记录校验与上下文变化
        body: |-
          Framing validation SHALL 分别报告格式、稳定身份、显式上下文关联与版本变化的确定性诊断，不推断自然语言冲突或完备性。相关上下文变化 SHALL 阻止复用旧检查结论；意图判断由 Agent 完成并由用户裁决。合法初始 Build 可无 formal model，存在而损坏的模型必须报错。

          - **合法缺失与损坏分离**

            - 首次 Build 没有正式模型，或已有模型损坏
            - 前者可创建合法记录，后者失败并保持源与目标不变。

          - **格式合法不等于意图完整**

            - 记录通过格式与身份检查但仍可能遗漏某个行为例外
            - CLI 只报告确定性有效性，不输出已完成语义覆盖的结论。
        acceptanceCases: []
      - name: 确定性交接确认来源
        body: |-
          framing consume SHALL 显式选择 named Change 或 active Candidate，核对当前源版本及适用目标校验；Agent 必须先完成该版本记录到目标的覆盖复核，CLI SHALL NOT 用四类结构相等或字符串存在性代替该语义判断。CLI SHALL 先保存精确来源快照，再完成适用校验，最后删除活动来源；任何前置失败 SHALL 保留来源与原有目标。同字节快照允许重验后恢复，冲突快照必须停止。

          - **相同快照恢复交接**

            - 上次交接在复制后中断且来源与目标快照字节相同
            - 重验源版本及目标后完成清理，不覆盖来源快照。

          - **冲突或失败保留来源**

            - 目标已有不同快照、版本变化或目标校验失败
            - 返回错误，保留活动来源及既有目标，不声明交接完成。

          - **显式选择消费目标**

            - 同一项目存在活动 Candidate 与多个 Changes
            - 只向命令明确指定的合法目标交接，不从当前目录猜测目标。
        acceptanceCases: []
  element:explore:
    declaration:
      identity: explore
      kind: element
      parent: intent-first-path
      title: Explore
      definition: Explore 是 Intent-first Path 的起始阶段。它通过 Design Exploration，基于 Semantic Model 与项目证据澄清用户意图、范围、影响和设计；在探索过程中可通过 Definition Framing 持续确认并记录关键设计，记录的每次持久化需单独授权。它在适用设计已确认且记录冲突已解决后形成不持久化的 Design Summary，交由 Propose 收成完整 Change；它不写入完整 Change，也不实现项目。
    sections:
      - name: 识别语义影响面
        body: |-
          Explore SHALL 结合 Semantic Model 的 Elements、Relationships、Element Contracts 与授权项目证据识别影响面。

          - **分析潜在变更**

            - 用户意图可能影响现有项目语义
            - Explore 联合模型与项目证据确定相关范围
        acceptanceCases: []
      - name: 一次一问并比较方案
        body: |-
          Explore SHALL 主动识别行为、边界与实现方案中的决策点，通过一次一问与方案比较推进设计，并由用户确认选择。Agent SHALL 给出推荐与可观察后果，不将推荐当作确认；适用的关键验收结果随设计确认，完整制品留给 Propose。

          - **存在多个合理方案**

            - 不同方案具有不同权衡
            - Explore 比较方案并一次请求一个用户决策
        acceptanceCases: []
      - name: 分段确认复杂变更设计
        body: |-
          对复杂变更，Explore SHALL 分段确认适用的行为、Element Contracts、Authored Views、implementation approach、data flow、technology、testing 与 risks。

          - **变更跨越多个设计维度**

            - 单次确认不足以审查设计
            - Explore 逐段呈现并确认适用维度
        acceptanceCases: []
      - name: 确认窄变更最低设计集
        body: |-
          对窄变更，Explore SHALL 至少确认 problem、impact scope、approach 与 verification method。

          - **变更范围有限**

            - 完整复杂设计分段不适用
            - Explore 仍确认最低设计集
        acceptanceCases: []
      - name: 不形成完整 Change
        body: |-
          Explore SHALL NOT 形成完整 Change。

          - **Design Summary 已形成**

            - Explore 到达出口
            - 完整 Change 仍由 Propose 形成
        acceptanceCases: []
      - name: 澄清 Element Definition 影响
        body: |-
          Explore SHALL 在新增 Element 或改变概念身份、范围、parent、children 或 siblings 边界时澄清完整目标 Definition。已确认片段可在单独授权后通过 Definition Framing 保存；没有记录时保留在对话设计中。仅改变规范行为时 SHALL NOT 制造 Declaration 变化。

          - **Change 改变 Element 概念边界**

            - 不同 Definition 边界会产生不同 Semantic Delta
            - Explore 一次请求一个用户决策，直到目标 Definition 足以交由 Propose 编译
        acceptanceCases: []
      - name: 支持可选 Definition Framing
        body: |-
          Explore SHALL 告知可通过 Definition Framing 保存已确认设计，并按触发条件加载共享 framing reference：发现或接收相关记录（含恢复已有探索）时，在读取或依赖记录前加载；设计段落产生未被明确豁免的规范性确认，或用户要求 framing、记录或修订材料时，在拟定 payload 或操作记录前加载；Summary 前发现规范性确认既未记录也未明确豁免时，加载并解决交接缺口。未触发时不为普通讨论预加载协议。通过 Design Exploration 推进设计，在每个已确认设计段落结束时主动整理规范性确认并展示完整拟保存 payload，发起一次批量持久化确认，不等待用户主动要求记录，也不默认提供豁免。明确豁免覆盖的内容不重复请求记录。存在 normative 确认时，Explore SHALL 在交接前落定恰好一个记录决策——已持久化记录、用户明确授予的豁免、或本次无 normative 内容的声明——三者皆缺即阻塞交接。记录更新后 SHALL 重查受影响设计与 Summary，不得将结构 Framing 固定为所有设计的先行阶段。

          - **有规范确认时落定决策**

            - 采用的设计含 normative 确认
            - 在交接前取得记录、豁免或无 normative 内容声明之一
            - 不将无记录继续作为默认路径

          - **已确认内容修订**

            - 记录中的行为或结构确认被授权更新
            - 重载记录并重新检查依赖旧条目的设计结论
        acceptanceCases: []
      - name: 形成不持久化的 Design Summary
        body: |-
          Explore SHALL 在适用设计确认并完成边界、竞争与一致性自查后输出 conversation-only Design Summary。Summary SHALL 保留已确认决策的条件、数值、例外、时序和关键验收结果，区分推荐、未决事项与用户确认的排除范围；影响当前目标的未决决策 SHALL 阻塞交接，Agent 不自行延期。输出前 SHALL 对照已确认对话确认所有规范性确认均已记录或明确豁免，已有部分记录不代表后续确认已被覆盖。带记录时，只有完整重载、冲突调和和一致性复核通过后才能输出，并一起交付该记录身份及受核对版本；带豁免时 SHALL 交付无记录声明及其理由；本次无 normative 内容时 SHALL 声明该事实。SHALL NOT 创建空记录，也不以省略上述内容代替声明。

          - **带记录完成 Explore**

            - 当前完整记录与拟议设计无未决冲突且适用设计已确认
            - 输出 Design Summary 并交付记录身份及该次核对版本，不把 Summary 另存为记录。

          - **带豁免完成 Explore**

            - 用户已授予豁免且设计已确认
            - 输出 Design Summary 并交付无记录声明及其理由

          - **无规范内容完成 Explore**

            - 设计已确认但仅含说明性材料
            - 输出 Design Summary 并显式声明本次无 normative 内容，不建立记录
        acceptanceCases: []
  element:explore-role:
    declaration:
      identity: explore-role
      kind: element
      parent: agent
      title: Explore Role
      definition: Explore 是 Agent 在 Intent-first Path 中澄清用户意图、范围、影响和设计的工作身份。它结合 Semantic Model、CLI 查询与项目证据推进 Design Exploration，可在过程中使用 Definition Framing 并通过 CLI 保存用户单独授权的已确认设计记录；在适用设计确认和记录冲突调和后，交付 conversation-only Design Summary 与可用的记录身份，不编写完整 Change，也不实现项目。
    sections:
      - name: 保持只读工作边界
        body: |-
          Explore Role SHALL 保持项目实现、Semantic Model、generated Agent surfaces 与普通 Change 制品只读；只有用户单独确认当前具体记录写入后，MAY 使用 xirang framing 保存已确认设计记录，不得直接改文件或把设计确认视为写入授权。

          - **明确授权后经 CLI 保存**

            - 用户单独确认完整待保存内容及目标
            - 仅通过统一 framing CLI 保存，不修改实现、正式模型或其他 Change 制品。
        acceptanceCases: []
      - name: 交付 Design Summary
        body: |-
          Explore Role SHALL 在适用设计确认及当前记录冲突检查通过后向 Propose 交付 conversation-only Design Summary；存在记录时同时交付其稳定身份与核对版本，无记录时不强制创建。

          - **Explore 活动完成**

            - 适用设计已确认，存在时的记录已重载且无未决冲突
            - 交付有效 Summary 与可用来源身份，不以记录取代完整设计。
        acceptanceCases: []
      - name: 不实现项目
        body: |-
          Explore Role SHALL NOT 实现项目。

          - **设计方案已确认**

            - Explore 到达出口
            - Agent 进入 Propose 而不修改实现
        acceptanceCases: []
  element:framework-identity:
    declaration:
      identity: framework-identity
      kind: element
      parent: semantic-objects
      title: Framework Identity
      definition: Framework Identity 定义息壤开发框架的统一产品身份：唯一 `xirang` CLI 可执行入口、隐藏 `.xirang` durable workspace 与无兼容层合同。它是项目级身份不变量，可直接在 Project Root 下独立演进，不依赖实现结构。
    sections:
      - name: CLI 可执行命令 SHALL 为 xirang
        body: |-
          息壤 CLI 的唯一可执行命令 SHALL 为 `xirang`，不提供其他命令别名。

          - **运行 CLI 命令**

            - 用户在终端执行 `xirang --help`
            - 系统 SHALL 显示息壤 CLI 帮助信息
            - 帮助信息 SHALL 包含 `xirang` 作为命令名称

          - **尝试使用其他命令名称**

            - 用户尝试通过其他命令名称调用本框架
            - 系统 SHALL 报告命令不存在
            - SHALL NOT 自动路由到 `xirang`

          - **Shell completion**

            - 用户安装 shell completion
            - 补全脚本 SHALL 为 `xirang` 命令注册
            - SHALL NOT 为其他命令名称注册
        acceptanceCases: []
      - name: 项目工作区 SHALL 为 .xirang
        body: |-
          目标项目的息壤 durable workspace SHALL 位于项目根目录 `.xirang/`。Project Setup、Candidate 与 history 均 SHALL 使用该唯一 workspace，且 SHALL NOT 回退或双写其他目录。

          - **Setup 新项目**

            - 用户运行 `xirang setup`
            - 系统 SHALL 创建 `.xirang/` durable core
            - SHALL NOT 创建 non-hidden legacy workspace

          - **跨平台路径处理**

            - CLI 在 Windows、macOS 或 Linux 构建 `.xirang/` 路径
            - SHALL 使用 `path.join()` 或 `path.resolve()`
            - SHALL NOT 硬编码路径分隔符
        acceptanceCases: []
      - name: 工作区目录结构 SHALL 完整
        body: |-
          `.xirang/` SHALL 包含 formal Semantic Model、change-local deltas、Agent references 和配置，并 MAY 按操作需要物化一个 active Candidate 与 durable history。

          - **标准工作区结构**

            - 初始化息壤项目
            - durable core SHALL 包含四分区模型、`changes/`、`references/` 和 `config.yaml`
            - Project Build MAY 物化 `.xirang/candidate/`
            - promotion 和 retired workspace cleanup MAY 物化 `.xirang/history/`
            - SHALL NOT 物化 active bootstrap 或 migration workspaces

          - **History 不是 fallback source**

            - CLI 读取 formal model
            - SHALL 只读取 `.xirang/model/`
            - SHALL NOT 从 `.xirang/history/` 自动恢复或补全 source
        acceptanceCases: []
      - name: CLI 命令引用 SHALL 一致
        body: |-
          所有 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active Element Contracts SHALL 仅引用当前 `xirang --help` 暴露的命令与当前 managed skill names。

          - **Project Build command references**

            - active surface 描述 setup 或 Project Build
            - SHALL 使用 `xirang setup`、`xirang candidate init|status|validate|promote` 与 `xirang-build`
            - SHALL NOT 使用退役命令名或 bootstrap 工作流名称

          - **Archive history 残留**

            - stale references 仅存在于 `.xirang/changes/archive/**` 或 `.xirang/history/**`
            - MAY 将其保留为历史证据
            - active surfaces SHALL NOT 从这些文件生成 guidance
        acceptanceCases: []
      - name: 不提供迁移兼容层
        body: |-
          息壤 SHALL NOT 提供其他命令别名、non-hidden legacy workspace 回退或自动迁移工具。

          - **无命令别名**

            - CLI 注册可执行命令
            - 系统 SHALL 仅注册 `xirang`
            - SHALL NOT 注册其他别名

          - **无目录双读**

            - CLI 读取项目配置、模型或 changes
            - 系统 SHALL 仅从 `.xirang/` 读取
            - SHALL NOT 回退到 non-hidden legacy workspace 或提示迁移

          - **无自动迁移工具**

            - 用户在仅含 non-hidden legacy workspace 的项目运行 `xirang` 命令
            - 系统 SHALL 报告未找到 `.xirang/` 项目
            - SHALL NOT 自动迁移该 workspace
        acceptanceCases: []
      - name: Telemetry command identity SHALL 为 xirang
        body: |-
          Telemetry events SHALL 使用 `xirang` 作为 executable identity，并使用当前 command path 作为 command property。

          - **记录 setup**
            - 用户执行 `xirang setup`
            - telemetry SHALL 记录 command `setup`
            - SHALL NOT 记录 `init`

          - **记录 Candidate subcommand**
            - 用户执行 `xirang candidate validate`
            - telemetry SHALL 记录完整 command path `candidate:validate`
            - SHALL NOT 记录 Candidate paths、digest 或项目内容
        acceptanceCases: []
      - name: Package.json bin entry SHALL 为 xirang
        body: |-
          npm package 的 bin entry SHALL 为 `xirang`。

          - **npm 安装后可执行**

            - 用户通过 npm 安装框架
            - 系统 SHALL 在 PATH 中创建 `xirang` 可执行链接
            - SHALL NOT 创建其他框架命令链接
        acceptanceCases: []
  element:hierarchical-elements:
    declaration:
      identity: hierarchical-elements
      kind: element
      parent: semantic-model
      title: Hierarchical Elements
      definition: 从 Project Root 开始、可任意深入的项目抽象结构。每个 Element 表达项目在某一抽象层级上可独立理解的语义单元，父 Element 表达较高层抽象，子 Element 对其进一步精化。
    sections:
      - name: 以父子层级精化语义
        body: |-
          Hierarchical Elements SHALL 只有一个 Project Root；每个非根 Element SHALL 通过显式 parent identity 归属父 Element，子 Element SHALL 对父 Element 作进一步精化。

          - **下钻项目抽象**

            - 用户从一个 Element 查看其 children
            - 每个 child 在更具体的抽象层级细化该 Element

          - **唯一 Project Root 校验通过**
            - 模型包含一个标记为 root 的 project element 且其他 elements 均可追溯到该 root
            - root validation SHALL 通过
        acceptanceCases: []
      - name: 联合声明与契约
        body: |-
          每个 Element SHALL 由 Element Declaration 与其至多一个 Element Contract 共同表达，且 Contract 是否必需 SHALL 由对应 Element Kind 决定。

          - **理解一个 Element**

            - Agent 读取一个 Element
            - Agent 联合其 Declaration 与 Contract 判断结构身份和规范行为
        acceptanceCases: []
      - name: Containment 表达抽象精化
        body: |-
          非根 Element 的 parent SHALL 表达其高层抽象；`belongs_to`、`refines` 与 `abstracts` SHALL NOT 作为重复的持久化 Relationship edges。

          - **多层精化合法**

            - 模型使用任意深度的 single-parent nesting 且满足全部可选 Metamodel constraints
            - containment validation SHALL 通过，query SHALL 返回 parent、children 与 depth
        acceptanceCases: []
  element:identity-boundary-clarification:
    declaration:
      identity: identity-boundary-clarification
      kind: element
      parent: definition-framing
      title: Identity and Boundary Clarification
      definition: Identity and Boundary Clarification 是 Definition Framing 中澄清 identity 与边界的方法步骤。它确保 Change 涉及的结构对象具有明确的身份与边界。
    sections:
      - name: identity 与边界澄清
        body: |-
          Definition Framing SHALL 通过 identity 与边界澄清逐步确认 Change 涉及的结构内容。

          - **澄清 identity 与边界**

            - Definition Framing 确认结构对象
            - 澄清其 identity 与边界
        acceptanceCases: []
  element:implementation-first-path:
    declaration:
      identity: implementation-first-path
      kind: element
      parent: change-formation
      title: Implementation-first Path
      definition: Implementation-first Path 是 Change Formation 的路径之一：从已发生的项目实现出发，再形成完整 Change。该路径通过 Snack 对照 Semantic Model 与实现证据，形成完整 Change。
    sections:
      - name: 从已发生实现出发
        body: |-
          Implementation-first Path SHALL 以已经发生的项目实现为形成 Change 的起点。

          - **实现先于 Change**
            - 项目改动已经存在
            - Agent 不重做标准 Apply
        acceptanceCases: []
      - name: 通过 Snack 对照模型与证据
        body: |-
          Implementation-first Path SHALL 通过 Snack 对照 Semantic Model 与实现证据。

          - **识别语义影响**
            - Snack 检查已有实现
            - 它结合模型与证据识别影响面
        acceptanceCases: []
      - name: 形成完整 Change
        body: |-
          Implementation-first Path SHALL 通过 Snack 形成完整 Change。

          - **Snack Formation 完成**
            - Delta 与适用 Plan 已完整并确认
            - 已有实现获得对应的完整 Change
        acceptanceCases: []
      - name: 不生成执行任务清单
        body: |-
          Implementation-first Path SHALL 因实现已经完成而不生成 `tasks.md`。

          - **编写 Change Plan**
            - Snack 记录已有实现的意图与决策
            - Plan 不包含执行任务清单
        acceptanceCases: []
      - name: 移交验证与收束
        body: |-
          Implementation-first Path 形成完整 Change 后 SHALL 进入后续验证与 Change Closure。

          - **已有实现完成调和**
            - Formation 审查与确认通过
            - 当前实现交由 Verify 独立评估
        acceptanceCases: []
  element:intent-first-path:
    declaration:
      identity: intent-first-path
      kind: element
      parent: change-formation
      title: Intent-first Path
      definition: Intent-first Path 是 Change Formation 的路径之一：从用户意图出发，先形成 Change，再进入实现。该路径先通过 Explore 澄清意图、范围与影响并形成 Change 雏形，再通过 Propose 将雏形收成完整 Change，最终得到可进入 Change Implementation 的 Change。
    sections:
      - name: 从用户意图出发
        body: |-
          Intent-first Path SHALL 以尚待形成 Change 的用户意图为起点，并在项目实现前形成 Change。

          - **用户提出新意图**
            - 目标实现尚未发生
            - Agent 先进入 Formation
        acceptanceCases: []
      - name: 先由 Explore 形成 Change 雏形
        body: |-
          Intent-first Path SHALL 先通过 Explore 澄清意图、范围与影响，并形成 conversation-only Design Summary 作为 Change 雏形。

          - **设计需要澄清**
            - 用户意图尚不能直接编译为 Change
            - Explore 推进设计确认并形成 Summary
        acceptanceCases: []
      - name: 再由 Propose 形成完整 Change
        body: |-
          Intent-first Path SHALL 再通过 Propose 将 Change 雏形收成包含 Semantic Delta 与 Change Plan 的完整 Change。

          - **Design Summary 已确认**
            - Propose 接收已确认 Summary
            - 它将内容编译为完整 Change
        acceptanceCases: []
      - name: Formation 后方可实现
        body: |-
          Intent-first Path SHALL 在完整 Change 形成并完成必要审查与确认后方可进入 Change Implementation。

          - **Change 尚未完整**
            - Delta、Plan 或确认任一缺失
            - 项目实现不得开始
        acceptanceCases: []
  element:interaction-surfaces:
    declaration:
      identity: interaction-surfaces
      kind: element
      parent: collaboration-structure
      title: Interaction Surfaces
      definition: Interaction Surfaces 是 Realization 中供用户与 Agents 配置、理解和操作息壤的交互界面体系。它建立和维护息壤项目、项目配置与 Agent 工具集成，提供确定性操作，并以 Views 呈现 Semantic Model 与 Change-derived information；CLI 支持 Text Presentation，Web 支持 Visual Presentation。
    sections:
      - name: 维护项目与工具集成
        body: |-
          Interaction Surfaces SHALL 建立和维护息壤项目、项目配置与 Agent 工具集成。

          - **配置项目**

            - 用户建立或更新息壤项目
            - 界面维护项目与所选 Agent 工具的配置
        acceptanceCases: []
      - name: 提供确定性操作
        body: |-
          Interaction Surfaces SHALL 为 Realization 提供确定性操作。

          - **重复相同有效操作**

            - CLI 接收相同有效输入
            - 操作产生一致结果
        acceptanceCases: []
      - name: 通过 Views 呈现语义信息
        body: |-
          Interaction Surfaces SHALL 以 Views 呈现 Semantic Model 与 Change-derived information。

          - **用户浏览 Change**

            - 用户选择一个活动 Change
            - 界面使用适用 View 呈现模型和差异
        acceptanceCases: []
      - name: 不构成语义来源
        body: |-
          Interaction Surfaces SHALL NOT 构成新的规范性语义来源。

          - **界面显示派生信息**

            - 界面组织或布局模型信息
            - 规范语义仍由 Semantic Model、Change 与用户决策决定
        acceptanceCases: []
      - name: 保持呈现方法非独占
        body: |-
          CLI 与 Web 对 Text/Visual Presentation 的支持 SHALL NOT 表示某种呈现方法被某一界面独占。

          - **CLI 输出文本 View**

            - CLI 以人类可读文本呈现模型信息
            - 该文本呈现不因 CLI 存在而转归 Web 所有
        acceptanceCases: []
      - name: 由 CLI 与 Web 组成
        body: |-
          Interaction Surfaces SHALL 由 CLI 与 Web 两类界面共同支撑 Realization。

          - **选择交互界面**

            - 用户或 Agent 需要操作或理解息壤
            - 使用 CLI 或 Web
        acceptanceCases: []
  element:internal-agents:
    declaration:
      identity: internal-agents
      kind: element
      parent: agents
      title: Internal Agents
      definition: Internal Agents 是在与 Agent 隔离的 clean context 中承担无法由 CLI 确定性操作替代的独立判断的执行主体。它们通常只读，输出结构化结论供 Agent 消费；不修改项目，不关闭 Change，不提升 Semantic Model。
    sections:
      - name: 在 Clean Context 中判断
        body: |-
          Internal Agents SHALL 在不受 Apply 上下文影响的 clean context 中作出判断。

          - **Agent 请求独立评估**

            - 当前项目状态需要 Review 或 Optimization
            - Internal Agent 在隔离上下文中开始评估
        acceptanceCases: []
      - name: 独立读取判断依据
        body: |-
          Internal Agents SHALL 独立读取 Semantic Model、Change 与项目证据。

          - **形成评估结论**

            - Internal Agent 接手任务
            - 它从当前项目状态获取所需依据
        acceptanceCases: []
      - name: 输出结构化结论
        body: |-
          Internal Agents SHALL 输出结构化结论供 Agent 消费。

          - **独立判断完成**

            - Internal Agent 完成评估
            - Agent 获得可执行的结构化结论
        acceptanceCases: []
      - name: 不修改项目
        body: |-
          Internal Agents SHALL NOT 修改项目。

          - **发现需要修正或优化的事项**

            - Internal Agent 识别出项目改动
            - 它返回事项而不直接写入文件
        acceptanceCases: []
      - name: 不关闭 Change
        body: |-
          Internal Agents SHALL NOT 关闭 Change。

          - **验证结论通过**

            - Internal Agent 判断当前状态满足门禁
            - Closure 仍由 Agent 编排
        acceptanceCases: []
      - name: 不提升 Semantic Model
        body: |-
          Internal Agents SHALL NOT 提升 Semantic Model。

          - **Candidate 通过评估**

            - Internal Agent 没有发现阻塞问题
            - 它不执行 promotion
        acceptanceCases: []
      - name: 不替代确定性查询
        body: |-
          影响发现、模型导航和关系查询 SHALL 由 CLI 与 Web 承担，而不是由 Internal Agents 重做。

          - **需要模型影响上下文**

            - Internal Agent 需要确定性关系信息
            - 它消费 Interaction Surface 提供的结果
        acceptanceCases: []
  element:metamodel:
    declaration:
      identity: metamodel
      kind: element
      parent: semantic-model
      title: Metamodel
      definition: Semantic Model 使用的可扩展语义记法。它声明用于表达 Hierarchical Elements 的 Element Kinds 与用于表达 Relationships 的 Relationship Kinds，并可为每种 Kind 定义其所有实例共享的语义。
    sections:
      - name: 声明模型记法
        body: |-
          Metamodel SHALL 以稳定 identity 声明 Element Kinds 与 Relationship Kinds，并可规定各 Kind 的共享语义、契约策略、层级约束与关系端点约束。

          - **验证模型实体**

            - Element 或 Relationship 引用一个 Kind
            - 该 Kind 在 Metamodel 中存在且实体满足其约束
        acceptanceCases: []
      - name: 联合理解 Kind 变更
        body: |-
          Metamodel Kind 的变化 SHALL 与使用该 Kind 的 Element Declarations 或 Relationships 联合验证。

          - **修改 Kind 约束**

            - 一个 Kind 的共享约束发生变化
            - 目标模型中的全部相关实例按新约束重新验证
        acceptanceCases: []
      - name: 使用规范 Kind 字段
        body: |-
          Element Kind SHALL 声明 `identity` 与 `contract`，并可声明 `root`、`parents`、`children`、`nodePresentation`；`nodePresentation` SHALL 是可选 mapping，可声明 `shape`、`color`、`border`，其值域由 Xirang 与 LikeC4 适配所使用的显式枚举定义并由校验器约束。Relationship Kind SHALL 声明 `identity`，并可声明 `sourceKinds`、`targetKinds` 与 Kind 级 `presentation`；`presentation` SHALL 是可选 mapping，仅可声明 `color`、`line`、`head`、`tail`，各字段值域 SHALL 完整复用 LikeC4 公开支持的对应合法集合并由 Xirang 输入校验器严格执行。Kind 正文可表达其所有实例共享的语义。

          - **声明受约束 Relationship Kind**

            - Relationship Kind 限制允许的 endpoint Kinds
            - Metamodel 以 `sourceKinds` 与 `targetKinds` 声明并由模型校验器执行约束

          - **Element Kind 声明节点呈现**

            - Element Kind 声明合法 `nodePresentation`
            - 呈现只作为全局默认节点呈现，不改变该 Kind 的规范语义
            - 校验器验证字段和值合法性

          - **Relationship Kind 声明关系呈现**

            - Relationship Kind 声明合法 `presentation`
            - 该 Kind 的全部 Relationship instances 共享已声明的 `color`、`line`、`head` 与 `tail`
            - 未声明子字段分别继承 LikeC4 默认值
            - presentation 不改变 Relationship 的规范语义或 identity

          - **Relationship presentation 缺失**

            - Relationship Kind 未声明 `presentation`
            - 该 Kind 的 Relationships 使用 LikeC4 默认关系呈现

          - **非法 Kind presentation 被拒绝**

            - `nodePresentation` 或 Relationship `presentation` 包含未知字段、非法值或错误类型
            - 模型校验器返回 `ERROR`
            - 系统不将未知值自由透传给 LikeC4 renderer
        acceptanceCases: []
      - name: 默认开放 nesting
        body: |-
          未声明的 Kind pair constraint 不构成隐式禁止；显式声明的 parent/child 约束 SHALL 由验证器执行。

          - **未声明约束时通过**

            - parent kind 与 child kind 均存在且 Metamodel 未声明对应限制
            - containment SHALL 通过验证，不因深度或 kind pair 未列入固定表而失败
        acceptanceCases: []
  element:optimization:
    declaration:
      identity: optimization
      kind: element
      parent: quality
      title: Optimization
      definition: Optimization 是 Quality 中，在代码已通过 Review 的状态上对实现进行优化评估的活动，以一轮为单位推进。它由 Optimizer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，判断哪些不必要的复杂度可以通过删除或简化消除，以及必要工作是否可以通过更合适的方式提高效率；每个优化方向都必须具有可说明的实际收益、充分的代码证据，并保持 Expected Semantic Model 与项目行为不变。
    sections:
      - name: 仅在 Successful Checkpoint 上开始
        body: |-
          Optimization SHALL 仅在 Review 通过并保存 successful checkpoint 后执行。

          - **Review 尚未通过**

            - 当前状态没有 successful checkpoint
            - Optimization 不开始
        acceptanceCases: []
      - name: 读取完整优化依据
        body: |-
          Optimization SHALL 读取 Semantic Model、Change、successful checkpoint 对应代码、项目证据与既有优化记录。

          - **Optimizer 评估当前状态**

            - Optimization 开始
            - 全部适用依据参与判断
        acceptanceCases: []
      - name: 优先消除不必要复杂度
        body: |-
          Optimization SHALL 优先识别可删除或简化的不必要复杂度。

          - **正确实现含冗余复杂度**

            - 删除或简化可保持行为
            - Optimization 将其作为候选事项
        acceptanceCases: []
      - name: 优化必须存在的工作
        body: |-
          Optimization SHALL 评估必要工作是否可通过更合适的算法、数据结构、控制流、I/O 或资源使用提高效率。

          - **必要工作存在可证明低效**

            - 更合适实现可保持目标语义
            - Optimization 可形成候选事项
        acceptanceCases: []
      - name: 只选择有价值且可验证的事项
        body: |-
          每项选中优化 SHALL 有实际收益、充分代码证据、行为保持约束、相称成本风险与可执行验证方式，且其 `impactLevel` SHALL 不低于 `optimization.minImpactLevel`。低于门槛的方向 SHALL NOT 作为 actionable 报告、SHALL NOT 被标注为 deferred 以填充结果、SHALL NOT 通过抬高 `impactLevel` 越过门槛。`impactLevel` SHALL 度量改动价值而非实现难度：有真实可证效果的小改动仍可为 `high`，仅重排代码而无效果的大重构在任何规模下都低于门槛。

          - **建议无法证明收益**

            - 候选事项不满足选择条件
            - Optimization 延后或拒绝该事项

          - **方向低于收益门槛**

            - 某个待选方向的 `impactLevel` 低于 `optimization.minImpactLevel`
            - 该方向不报告为 actionable，也不标注为 deferred
            - 不通过抬高其 `impactLevel` 使其越过门槛
        acceptanceCases: []
      - name: 将选中事项返回 Apply
        body: |-
          选中的 Optimization 事项 SHALL 返回 Apply 实现。

          - **优化事项被确认**

            - Optimization 选择事项
            - 当前 checkpoint 保持不变，事项交给 Apply
        acceptanceCases: []
      - name: 正确性问题返回 Review
        body: |-
          Optimization 发现正确性问题时 SHALL 停止并将问题返回 Review。

          - **当前实现不符合 Expected Model**

            - Optimizer 识别行为缺陷
            - 问题不作为优化事项处理
        acceptanceCases: []
      - name: 语义变化形成新 Change
        body: |-
          改变 Expected Semantic Model 的建议 SHALL 形成新的 Change。

          - **建议会改变目标行为**

            - 候选方向不是行为保持优化
            - 它不在当前 Optimization 中实施
        acceptanceCases: []
      - name: 无需继续优化时完成
        body: |-
          最新 successful checkpoint 不再存在需要执行的优化方向，或全部待选方向均低于 `optimization.minImpactLevel`，或方向数上限用尽，或用户拒绝继续优化时，Optimization SHALL 收口。全部方向低于门槛时 SHALL 以 `NO_ACTIONABLE` 收口并在 summary 中说明剩余机会低于门槛，该结论 SHALL 被视为正当结果而非未找到工作的失败。

          - **没有满足方向**

            - Optimizer 完成当前评估且不存在满足选择条件的方向
            - Optimization SHALL 以 `NO_ACTIONABLE` 收口
            - Quality 可判断 Optimization 已完成

          - **全部方向低于门槛**

            - 该轮所有待选方向的 `impactLevel` 均低于 `optimization.minImpactLevel`
            - Optimization SHALL 以 `NO_ACTIONABLE` 收口并在 summary 说明门槛
            - 不消耗方向额度，也不报告任何 sub-threshold 方向
        acceptanceCases: []
  element:optimizer:
    declaration:
      identity: optimizer
      kind: element
      parent: internal-agents
      title: Optimizer
      definition: Optimizer 在已通过 Review 并保存为 Checkpoint 的实现上，评估是否存在值得执行且不改变目标语义的优化。它输出可说明收益与证据的优化事项，由 Apply 实现后再经 Review；不修改代码，不推进 Checkpoint；正确性问题返回 Review，改变目标语义的建议形成新的 Change。
    sections:
      - name: 独立取得 Optimization 依据
        body: |-
          Optimizer SHALL 自主读取最近 successful checkpoint、Semantic Model、Change、项目证据与优化记录。

          - **Optimizer 接受评估任务**
            - Optimization 开始
            - Optimizer 从当前成功状态取得依据
        acceptanceCases: []
      - name: 保持只读且不推进 Checkpoint
        body: |-
          Optimizer SHALL NOT 修改项目或推进 Checkpoint。

          - **Optimizer 选择事项**
            - 当前实现存在有价值优化
            - Optimizer 返回事项而不改变代码状态
        acceptanceCases: []
      - name: 交付结构化 Optimization 结论
        body: |-
          Optimizer SHALL 将选中事项、正确性问题或无需优化的结论作为结构化结果交付给 Agent。

          - **Optimization 判断完成**
            - Optimizer 完成当前评估
            - Agent 获得用于 Apply、Review 或完成阶段的结论
        acceptanceCases: []
  element:participants:
    declaration:
      identity: participants
      kind: element
      parent: collaboration-structure
      title: Participants
      definition: Participants 是 Realization 中参与意图授权、语义判断与项目落实的行为主体。由用户与 Agents 组成：用户保留意图与关键授权；Agents 依据 Semantic Model、Change、用户决策与项目证据推进 Realization，并通过 Interaction Surfaces 完成查询、投影与确定性操作。
    sections:
      - name: 由用户与 Agents 组成
        body: |-
          Participants SHALL 由用户与 Agents 组成。

          - **识别协作主体**

            - Realization 分配授权或执行职责
            - 职责归属于用户或适用 Agent
        acceptanceCases: []
      - name: 用户保留意图与关键授权
        body: |-
          Participants 的协作结构 SHALL 保留用户对意图与关键事项的授权权力。

          - **需要关键授权**

            - 事项必须由用户判断
            - Agents 等待用户授权
        acceptanceCases: []
      - name: Agents 依据语义与证据推进
        body: |-
          Participants 的协作结构 SHALL 由 Agents 依据 Semantic Model、Change、用户决策与项目证据推进 Realization。

          - **Agent 推进工作**

            - 用户已提供必要授权
            - Agent 使用规范语义与证据继续落实
        acceptanceCases: []
      - name: 通过 Interaction Surfaces 操作
        body: |-
          Participants SHALL 通过 Interaction Surfaces 完成查询、投影与确定性操作。

          - **需要确定性查询**

            - Participant 需要模型或 Change 信息
            - 通过 Interaction Surface 获取结果
        acceptanceCases: []
  element:post-propose-validation:
    declaration:
      identity: post-propose-validation
      kind: element
      parent: propose-workflow
      title: Post-propose Validation
      definition: Post-propose Validation 定义 Propose 收尾的一致性验证门禁：先执行计划一致性复核，对照 change-local Contracts、design.md 与 Semantic Delta 检测 tasks.md 的语义矛盾，发现矛盾时自行修正制品，仅当矛盾反映与用户意图或已确认决策不对齐时呈现给用户裁决；随后在最终制品上执行确定性校验作为收尾门禁，对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担，报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。
    sections:
      - name: 计划一致性复核
        body: |-
          Post-propose Validation SHALL 在确定性校验前将 change-local Contracts、design.md、Semantic Delta 与 tasks.md 联合对照 Explore 及 Propose 内的用户确认，检查计划与目标的一致性；不得仅以制品相互一致代替来源忠实性。已确认来源能确定修正方式时 SHALL 自行修正；需要改变已确认承诺、扩大范围或裁决重大业务及架构权衡时 SHALL 呈现全部发现，一次请求一个决策并等待确认。既定范围与方案内合理推导的细节及配套保证 MAY 在完成时披露，无需逐项确认。新确认的行为及推导补充的可观察保证 SHALL 贯穿相关 Delta 与 Plan，不得只藏在 design 或 tasks 中。 复核 SHALL 同时检查可用当前确认记录到目标语义、需实施的目标语义到 tasks 实现安排与 Checks 两段覆盖；引用存在只是结构合法，不是行为覆盖证明。共同遗漏的已确认细节同样阻塞完成；缺失行为先补 Contract，再调整 Plan，未决意图交给用户。

          - **检测到矛盾时自行修正**

            - 复核发现 task 间声明矛盾或 task 与 change-local 目标语义冲突
            - 已确认来源能确定修正方式时 SHALL 自行修正制品，否则先询问用户
            - SHALL 修正后继续复核

          - **矛盾反映用户意图不对齐**

            - 矛盾反映与用户意图或已确认决策不对齐
            - SHALL 一次性呈现全部发现
            - SHALL 等待用户裁决后再继续

          - **复核干净时无声继续**

            - 复核未发现矛盾
            - SHALL 无声继续进入确定性校验

          - **复核不再由 Apply 承担**

            - apply workflow 启动实现
            - apply SHALL NOT 执行计划一致性复核
            - 复核 SHALL 由 Propose 收尾门禁在 Formation 内完成

          - **有效引用不代表实际覆盖**

            - Check 引用了存在的 Section 与 Acceptance Case，但命令或证据不能验证其行为
            - 修正实现安排或验证方式后重新复核，不用引用校验通过替代语义覆盖。

          - **目标到任务存在遗漏**

            - 目标 Contract 已表达条件分支，但任务与检查没有安排实现或验证
            - 补足相应行为闭环与检查，不在任务内另造规范语义。
        acceptanceCases: []
      - name: 完整机制自查
        body: Propose SHALL 用适用的边界或竞争事件序列检验机制、不变量、时序及验收结果，具体推演初始状态、事件顺序与预期结果，并检查实现方案能否落实这些结果；只列出场景名称不构成机制检查。发现问题时 SHALL 区分表达或推导错误与缺失决策。前者依据已确认设计修正，后者先向用户询问；结构合法与引用有效不能证明机制正确。
        acceptanceCases: []
      - name: 收尾确定性校验门禁
        body: |-
          Post-propose Validation SHALL 在计划一致性复核与用户裁决后的最终制品上执行确定性校验作为收尾门禁：对完整 change 执行联合验证、生效差异审阅与任务结构校验，由确定性操作承担；报错阻塞 Apply 就绪声明，最多修复一轮、复检一次，警告只披露。格式修复 SHALL 仅重述已有承诺，不得为了满足校验器而新增限制或行为；修复后 SHALL 重新核对受影响的语义结论。

          - **报错阻塞 Apply 就绪声明**

            - 确定性校验返回报错
            - SHALL 阻塞 Apply 就绪声明
            - SHALL 最多修复一轮并复检一次

          - **修复后报错残留**

            - 修复一轮并复检后仍有报错
            - SHALL 保持阻塞并报告残留报错

          - **仅警告不阻塞**

            - 确定性校验仅有警告且语义就绪已满足
            - 警告本身 SHALL 不阻塞 Apply 就绪声明
            - SHALL 在汇总中披露警告
        acceptanceCases: []
  element:project-build-role:
    declaration:
      identity: project-build-role
      kind: element
      parent: agent
      title: Project Build Role
      definition: Project Build 是 Agent 构建或重建 Semantic Model 的工作身份。它在用户授权的探索范围与声明的权威依据下，编写完整的 Candidate Semantic Model，使用 CLI 做只读校验，向用户呈现 valid Candidate 与 review digest；仅在用户确认后，由 CLI 将 Candidate 原子提升为 Semantic Model。
    sections:
      - name: 在授权边界内写入 Candidate
        body: |-
          Project Build Role SHALL 在用户授权范围与权威依据下写入 Candidate Semantic Model 与临时 `build.md`。

          - **Project Build 需要编译语义**

            - Agent 已获得范围和依据授权
            - 它只在 Candidate 工作区写入构建制品
        acceptanceCases: []
      - name: 呈现 Candidate 并请求确认
        body: |-
          Project Build Role SHALL 仅在完整 Candidate 通过 deterministic validation 与 clean-context semantic review 后，向用户呈现 Candidate、Formal comparison、审查信息与 review digest，并请求用户确认精确版本。

          - **Candidate 完成全部审查**

            - CLI 返回有效 digest 且 semantic review PASS
            - Agent 请求确认而不自行作出授权决定
        acceptanceCases: []
      - name: 通过 CLI 推进确定性门禁
        body: |-
          Project Build Role SHALL 使用 CLI 执行 Candidate 校验与经授权的 promotion，SHALL NOT 手工重做这些确定性操作。

          - **用户确认当前 Digest**

            - Agent 获得精确版本授权
            - 它调用 CLI promotion
        acceptanceCases: []
      - name: 编排 Modeling Decision Gate
        body: |-
          Project Build Role SHALL 识别会改变目标 Semantic Model 的未决选择，向用户提供受限选项，并将裁决作为例外 provenance 记录到 `build.md`。

          - **实现证据不能唯一确定用户意图**

            - 多个目标语义与现有权威相容
            - Agent 暂停相关编写并请求用户裁决
        acceptanceCases: []
      - name: 委托 Clean-context Semantic Review
        body: |-
          Project Build Role SHALL 将 structurally valid Candidate 的审查入口和权威依据交给通用 read-only clean-context subagent，SHALL NOT 将自身完成声明作为审查证据。

          - **Subagent 返回阻塞 Finding**

            - semantic review 返回 BLOCKER 或 HIGH
            - Agent 修正 Candidate 或返回 Modeling Decision Gate
        acceptanceCases: []
      - name: 执行 Promotion 后检查
        body: |-
          Project Build Role SHALL 在经授权 promotion 后执行 Candidate status、四分区目录和 Formal validation 检查，并只在全部满足时报告完成。

          - **Formal validation 失败**

            - promotion 命令已经成功但 post-check 失败
            - Agent 报告当前状态且不自动重试 promotion
        acceptanceCases: []
      - name: 初始阶段检测 subagent 可用性并询问模型
        body: |-
          Project Build Role SHALL 在初始询问阶段（与探索范围选择同时）检测当前环境是否可用 subagent，可用时询问用户 subagent 应使用什么模型。

          - **检测 subagent 可用性**

            - Build 启动且用户已选择探索范围
            - Agent SHALL 检测当前环境是否提供 subagent 能力
            - 可用时 SHALL 询问用户后续 subagent 使用什么模型

          - **Subagent 不可用**

            - 当前环境无法提供 subagent
            - Agent SHALL 继续使用自身模型完成迁移工作
            - 非复制改写仍应由 Agent 选择内容归属
        acceptanceCases: []
      - name: 审查已恢复内容不复活退役语义
        body: |-
          Project Build Role SHALL 在委托 clean-context semantic review 时，要求 subagent 检查 recovered legacy/formal 内容是否匹配当前行为且不复活退役词汇或已记录排除项。

          - **Review 发现已恢复内容包含退役行为**

            - subagent 发现 recovered 内容正向使用已排除的语义（如 Spec store、architecture-delta.c4 持久化、impact-sweeper）
            - review 返回 BLOCKER 或 HIGH finding
            - Agent 修正 Candidate 后重新审查
        acceptanceCases: []
      - name: 区分用户与 Agent 修改后的 promotion 处理
        body: |-
          Project Build Role SHALL 在 promotion 前重跑 `candidate validate --json` 并呈现新 digest。若 digest 自上次审查后变化：由用户手动修改的视为用户对当前内容认可，可直接 promote；由 Agent 修改的使 review 结论失效，需重新审查。

          - **用户手动修改后 digest 变化**

            - 用户直接在 Candidate 中编辑文件
            - 重新 validate 后 digest 与上次审查不同
            - Agent SHALL 视为用户已认可当前内容
            - 可不经重新审查直接 promote

          - **Agent 修改后 digest 变化**

            - Agent 因修正 review finding 或用户要求修改 Candidate
            - 重新 validate 后 digest 与上次审查不同
            - Agent SHALL 启动新的 clean-context review
            - SHALL NOT 跳过审查直接 promote

          - **用户介入通常意味着返修**

            - 用户参与 Build 过程中手动修改或要求更改
            - Agent SHALL 将多次 review 轮次与重新验证视为预期流程
            - SHALL NOT 视为失败
        acceptanceCases: []
  element:project-tooling-configuration:
    declaration:
      identity: project-tooling-configuration
      kind: element
      parent: cli
      title: Project and Tooling Configuration
      definition: Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。
    sections:
      - name: 管理项目与 Agent 工作面
        body: |-
          Project and Tooling Configuration SHALL 建立和维护息壤工作区、项目配置与所选 Agent 工具集成，并持续管理息壤托管的 Agent 工作面。

          - **建立新项目**

            - 用户选择项目与 Agent 工具
            - CLI 建立工作区、项目配置与对应工具集成
        acceptanceCases: []
      - name: 保持配置一致
        body: |-
          Project and Tooling Configuration SHALL 通过 CLI 维护项目配置和 Agent 工具集成的一致状态。

          - **更新已配置项目**

            - 用户请求维护现有项目配置与工具集成
            - CLI 依据当前配置刷新息壤托管的工作面
        acceptanceCases: []
      - name: 投影共享 Element Contract 语义
        body: |-
          Project and Tooling Configuration SHALL 从单一共享 authoring fragment 向 `xirang-build`、`xirang-explore`、`xirang-propose` 与 `xirang-snack` 投影 Element Definition 与 Element Contract 的边界及写作规则，SHALL NOT 为这些工作面维护相互独立的定义副本。

          - **刷新 Agent 工作面**

            - CLI 生成或更新 Build、Explore、Propose 与 Snack skills
            - 四个工作面消费一致的 Definition authoring contract，且存储记法仍由独立 notation fragment 提供
        acceptanceCases: []
      - name: 以 Project Definition 初始化根 Element
        body: |-
          Project and Tooling Configuration SHALL 在建立新 Xirang 工作区时收集 Project Definition，并以该完整 Definition 初始化 Project Root Declaration，SHALL NOT 将紧凑 summary 作为根 Element 的规范性概念表述。

          - **跨平台初始化项目**

            - 用户在 macOS、Linux 或 Windows 上建立新项目
            - CLI 通过平台路径 API 写入包含 `definition` 的 Project Root 单元，且结果不依赖路径分隔符
        acceptanceCases: []
      - name: 投影共享 Definition Framing 协议
        body: |-
          Project and Tooling Configuration SHALL 从 Xirang-owned 单一生成源向 Build、Explore、Propose 及共享 references 投影同版本 Definition Framing 协议与默认 semantic-refinement 指导，不运行时依赖用户级 problem-framing skill。受管生成面的新增、更新和删除 SHALL 按显式 manifest 名单定位，不按名称模式扫描替换；用户专用拆分 skill 不受覆盖。

          - **共享协议在三入口可用**

            - CLI 同步所选 Agent 工具集成
            - Build、Explore、Propose 指向同版本可达 reference，入口包含适用的读取与重读条件。

          - **受管同步不覆盖用户内容**

            - 刷新受本 Change 影响的模板、reference 与生成面
            - 只按登记名单更新相关工作面，保留用户 skill 与未登记内容，不直接修改生成文件代替源模板。
        acceptanceCases: []
      - name: 管理 Outline Element Definition 深度配置
        body: |-
          Project and Tooling Configuration SHALL 将 `architecture.outline.elementDefinitionDepth` 作为项目级 functional configuration 管理。该字段 SHALL 为非负整数，缺失时有效默认值 SHALL 为 `2`；默认值 SHALL 由同一配置常量用于 setup/update 磁盘物化、resilient parsing 后的 effective config、normalized projection 与 `arch outline` command resolution。

          - **新项目物化默认值**

            - `xirang setup` 或 config default migration 创建项目配置
            - `.xirang/config.yaml` SHALL 包含 `architecture.outline.elementDefinitionDepth: 2`
            - SHALL 使用现有 functional default materialization path，而不是独立硬编码

          - **既有项目补充缺失默认值**

            - update 或 default migration 处理未声明 outline config 的既有 `.yaml` 或 `.yml` 配置
            - CLI SHALL 只补充缺失的 nested mapping keys
            - SHALL NOT 覆盖用户已有的合法 `elementDefinitionDepth`

          - **读取合法配置值**

            - 项目配置包含 `architecture.outline.elementDefinitionDepth: 4`
            - normalized project config 与未显式覆盖的 `arch outline` SHALL 使用值 `4`
            - SHALL NOT 将该值解释为模型结构裁剪深度

          - **非法配置回退有效默认值**

            - 配置值为负数、非整数或 nested shape 非法
            - resilient parser SHALL 输出 field-specific warning
            - effective normalized projection 与 `arch outline` SHALL 使用默认值 `2`
            - 其他有效项目配置字段 SHALL 继续可用

          - **config project 显示有效值**

            - 用户运行 `xirang config project --json`
            - normalized output SHALL 包含有效 `architecture.outline.elementDefinitionDepth`
            - 缺失 raw config 时 SHALL 仍显示默认值 `2`

          - **Agent config projection 显示有效值**

            - CLI 为 Agent-facing artifact instructions 构建 `configProjection.prompt.fragments`
            - projection SHALL 包含 `architecture` fragment 与 `architecture.outline.elementDefinitionDepth: <effective value>`
            - fragment SHALL 只投影有效值，不重复静态 Semantic Model 恢复协议

          - **跨平台配置路径一致**

            - 在 Windows、macOS 或 Linux 上读取、创建或迁移 `.xirang/config.yaml` 或 `.xirang/config.yml`
            - CLI SHALL 使用 Node.js path utilities
            - 两种扩展名 SHALL 产生相同 outline configuration semantics
        acceptanceCases: []
  element:project.root:
    declaration:
      identity: project.root
      kind: project
      parent: null
      title: 息壤（Xirang）
      definition: 面向 Agent、以结构化用户意图驱动项目构建与持续演进的开发框架。它包含表达项目应该是什么的 Semantic Model、承载新的演进意图的 Change，以及负责落实这些意图的 Realization；三者共同使 Agent 能够基于统一的项目认知完成需求探索、方案形成、代码实现、独立审查和变更收束。
    sections:
      - name: 以用户意图驱动项目演进
        body: |-
          息壤 SHALL 以 Semantic Model 表达用户意图，以 Change 承载新的演进意图，并通过 Realization 落实项目构建与变更。

          - **推进项目演进**
            - 用户表达项目目标或新的变更意图
            - Agent 依据相应 Semantic Model 或 Change 推进 Realization
        acceptanceCases: []
      - name: 保留用户授权
        body: |-
          息壤 SHALL 由用户保留意图确认和无法由语义与项目证据确定之决策的授权权力。

          - **遇到未决语义**
            - 目标层级、契约或关系无法从权威依据确定
            - Agent 请求用户裁决而不自行猜测
        acceptanceCases: []
      - name: 表达项目意图与范围
        body: |-
          息壤 SHALL 让用户表达项目行为、架构意图、所有权、边界与语义协作，构成 Agent 可在不发明重大决策的前提下编译的模型。

          - **Agent 编译一个 Change**
            - Agent 探索、提议、实现、验证、同步或归档一个 Change
            - 它 SHALL 将模型分区与 Element Contracts 视为同一个 Xirang Semantic Model 的组成来源
            - SHALL 只把实现代码用作当前证据
        acceptanceCases: []
      - name: 保持稳定成功标准
        body: |-
          息壤 SHALL 提供稳定的 CLI 与生成的 Agent 工作流表面，保留 Explore → Propose → Apply → Verify → Sync → Archive 生命周期，校验 Semantic Delta，并仅在证据支撑的审查后提升 source。

          - **Change 达到稳态**
            - 一个 Change 完成
            - 其外部可观察行为 SHALL 由 Element-owned Contracts 表达
            - 其架构意图 SHALL 由稳定 Elements、refinement containment 与类型化语义关系表达
            - validation SHALL 在提升前检测不完整或矛盾的 source
        acceptanceCases: []
      - name: 维护全局语义不变量
        body: |-
          Project Root SHALL 唯一；每个非根 Element SHALL 恰有一个 parent；稳定 Element identity SHALL 独立于 containment path；每个 Element Contract SHALL 有一个显式 owner Element；contract required 的 Elements SHALL 具有真实契约。

          - **source 不完整**
            - 绑定、层级决策、契约、关系端点或必需策略无法从授权 source 确定
            - 息壤 SHALL 报告审查缺口
            - SHALL NOT 从文件名、imports、calls、source 布局、文本相似性或 catch-all owner 推断该决策
        acceptanceCases: []
      - name: 独立产品与持久工作区
        body: |-
          息壤 SHALL 通过唯一 `xirang` CLI 与 `.xirang` workspace 独立运行。Setup、Project Build、Candidate、formal source 与 history SHALL 具有明确边界，且不得存在 migration 或 history fallback semantic stores。

          - **项目 setup 或 build**
            - 息壤创建 setup skeleton 或 Agent 构建 Candidate
            - generated workflows SHALL 使用当前 Xirang identity 和统一 Semantic Model
            - retired bootstrap/migration workspaces SHALL 仅归档为 history evidence
            - runtime SHALL NOT 消费这些 retired inputs
        acceptanceCases: []
      - name: 证据门禁的源提升
        body: |-
          Candidate 模型与本次用户要求 SHALL 在 `.xirang/candidate/` 中保持隔离，直到记法、identities、policies、relationships、平台行为与 rollback path 通过 validation，且用户明确授权当前 `reviewDigest`。

          - **Candidate 有未解决缺口**
            - required validation 或 human decision 缺失
            - formal `.xirang/model/` SHALL 保持不变

          - **用户确认后 Candidate 改变**
            - `build.md` 或 Candidate source 在用户确认后发生变化
            - prior authorization SHALL 失效
            - promotion SHALL 要求新的 valid `reviewDigest`

          - **Promotion 成功**
            - confirmed digest 仍新鲜且原子转换完成
            - formal `.xirang/model/` SHALL 被完整替换
            - previous formal source SHALL 保存在 `.xirang/history/`
        acceptanceCases: []
  element:propose:
    declaration:
      identity: propose
      kind: element
      parent: intent-first-path
      title: Propose
      definition: Propose 是 Intent-first Path 的收成阶段。它承接 Explore 形成的 Design Summary，以及存在时的已确认设计记录，将规范性确认内容编译为完整 Semantic Delta，并以 Change Plan 解释意图、决策与实现路径。它在 Formation 内完成记录到目标语义及目标语义到任务的覆盖复核、必要审查与确认，使 Change 可进入实现；它不实现项目、不更新正式模型，也不关闭 Change。
    sections:
      - name: 复用已确认 Design Summary
        body: |-
          Propose SHALL 承接并复用 Explore 形成的已确认 Design Summary，以完整文档化为主要职责，不静默重做设计。 存在确认记录时 SHALL 核对 Summary 所依赖的记录版本；受影响内容变化或冲突未决时，先调和和重新确认，不能直接沿用旧 Summary。

          - **Design Summary 已存在**

            - Propose 接收完整 Summary
            - Agent 忠实编译已确认决策
        acceptanceCases: []
      - name: 补足最低语义就绪条件
        body: |-
          缺少 Design Summary 时，Propose SHALL 先确认 problem、impact scope、approach 与 verification method 足够清晰。

          - **用户直接进入 Propose**

            - 对话中没有完整 Summary
            - Agent 在编写 Change 前确认最低设计集
        acceptanceCases: []
      - name: 查缺补漏与决策确认
        body: |-
          Propose MAY 将已确认机制展开为完整正文、图示、验收案例及任务和验证安排，并修正遗漏、重复、表达或推导错误。合理推导的细节与配套保证，只要不改变已确认承诺、不超出既定范围与方案，且不实质改变业务结果、用户义务或架构权衡，MAY 无需逐项确认而直接编写，在完成时披露其依据与制品位置；不要求这些细节能够唯一推导。编写时补出的分支结果、默认值、错误结果与限制条件 SHALL 对照已确认对话与设计，包括“否则”等兜底分支。改变已确认承诺、扩大范围或需要裁决重大业务及架构权衡时，Propose SHALL 说明缺口、选项及推荐理由，一次询问一个问题并等待确认后再写成确定内容；此类重大决策不能仅以完成时告知代替事先确认。

          孤立缺口 MAY 在 Propose 内确认；大幅重做设计或修订已持久化记录时 SHALL 返回 Explore，并遵循已有记录授权与交接协议。直接 Propose、要求不追问或 override 就绪建议不构成缺失决策的答案；无法获得所需确认时 SHALL 报告阻碍。
        acceptanceCases: []
      - name: 编写完整 Semantic Delta
        body: |-
          Propose SHALL 以 Semantic Delta 表达 Change 的完整目标语义。

          - **目标设计已明确**

            - Agent 编译目标状态
            - Delta 完整表达新增、修改或移除的语义
        acceptanceCases: []
      - name: 编写完整 Change Plan
        body: |-
          Propose SHALL 以 Change Plan 解释意图与实现路径。

          - **Change 需要审查与执行**

            - Agent 形成 Plan
            - Plan 提供适用的意图、决策和执行安排
        acceptanceCases: []
      - name: 完成 Formation 审查与确认
        body: |-
          Propose SHALL 在 Change Formation 内完成必要审查与确认，对照已确认来源检查完整机制与制品一致性，以适用的边界或竞争序列检验规范承诺，不能仅依赖制品之间一致或 CLI 通过。新确认的决策与推导补充的可观察保证 SHALL 贯穿相关 Delta 与 Plan；推导补充不回写为来源记录中的用户确认。

          - **Change 仍有未决内容**

            - 目标语义或实现路径尚未确认
            - Propose 不得完成
        acceptanceCases: []
      - name: 完成时披露文档化补充
        body: |-
          Propose 完成汇报 SHALL 区分沿用的 Explore 确认或当前已确认输入、文档化时补出的内容及其依据和制品位置、Propose 内经用户确认的新决策，以及未决事项对就绪的影响；没有补充或新决策时 SHALL 明确说明。补充清单保留在会话，不新增永久台账或向规范正文混入确认过程状态。

          制品齐全与 CLI 校验通过 SHALL NOT 代替语义就绪判断；影响目标行为、范围或实现方案的未决重大决策 SHALL 阻止 ready-for-apply 声明；合理推导并披露的细节不因缺少单独确认而阻塞。完成报告 SHALL 区分实际 CLI 结果、Agent 语义检查发现与仍存在的证据缺口，以简明的检查发现及相关制品位置支持就绪结论；不得以制品数量、引用合法或依赖声明代替实际覆盖、机制与可执行性检查，也不要求输出完整自查过程或新增报告制品。
        acceptanceCases: []
      - name: 不实现项目
        body: |-
          Propose SHALL NOT 实现项目。

          - **Change 已完整形成**

            - Propose 到达出口
            - 项目实现仍由后续 Apply 落实
        acceptanceCases: []
      - name: 不更新或关闭 Change 状态
        body: |-
          Propose SHALL NOT 将 Semantic Delta 同步到 Semantic Model，也 SHALL NOT 关闭 Change。

          - **Delta 校验通过**

            - 完整 Change 可进入 Change Implementation
            - 正式模型与活动 Change 状态保持未收束
        acceptanceCases: []
      - name: 遵循共享 Contract 语义
        body: |-
          Propose SHALL 按共享 Element Contract、Section 与 Acceptance Case 语义编写 Contract Delta，并以 Section 的独立演进边界确定 Entries。

          - **编写多个 Section 义务**

            - 已确认设计包含可独立变化的规范承诺
            - Propose 将其表达为独立 Section Entries，并仅以 Acceptance Cases 具体化各自宿主 Section
        acceptanceCases: []
      - name: 编写完整 Definition 目标态
        body: |-
          Propose SHALL 为每个 ADDED 或 MODIFIED Element Declaration 编写完整目标态 Definition，SHALL NOT 以本次变化摘要、proposal 动机、design 实现方案或 Contract 义务代替 Definition；Contract-only Change SHALL NOT 顺带改写 Definition。

          - **Design Summary 已确认概念边界**

            - Propose 编译受影响 Declaration
            - Delta 携带变化后完整 Definition，而非只描述本次新增或修改的部分

          - **Definition 边界仍未确认**

            - 现有证据不能唯一确定目标概念身份或边界
            - Propose 返回 Explore 或一次询问一个用户决策，且不猜测 Declaration 目标态
        acceptanceCases: []
      - name: 处理已确认设计记录
        body: |-
          Propose SHALL 在入口读取共享 framing reference 并通过 CLI 主动发现记录，不以 Summary 是否提及记录为前提。SHALL 完整读取可用记录并检查来源版本、上下文及与 Summary 的一致性，自编写开始将其作为确认依据；将规范性确认内容编译为完整 Semantic Delta，说明性材料按性质进入 Plan 或 provenance。精简记录不等于完整结构目标。无记录时，Propose SHALL 要求 Design Summary 或当前输入声明记录决策——用户明确授予的豁免，或本次无 normative 内容的声明——SHALL NOT 将未声明的缺失当作已覆盖的默认路径，SHALL NOT 将其视为隐式豁免；两者皆未声明时 SHALL 停止 Formation 并退回 Explore 取得该决策。

          - **Propose 接收精简记录**

            - 记录只覆盖部分设计而 Summary 已确认
            - 按已确认内容编译 Delta，不把精简记录当作完整结构目标

          - **无记录且已声明豁免**

            - Design Summary 明确声明用户已授予豁免
            - 按当前输入照常形成 Change，不建立空记录

          - **无记录且未声明任何决策**

            - 来源既无记录也未声明豁免或无 normative 内容
            - 停止 Formation 并退回 Explore 取得记录决策
            - 不将其当作隐式豁免，也不以默认覆盖继续编译
        acceptanceCases: []
      - name: 验证确认内容到目标语义的覆盖
        body: |-
          存在记录时 Propose SHALL 对记录的规范性条目逐条核对落位，将每条标记为已落位于 Declaration、Contract、Relationship、Metamodel 或 Authored View 目标，或报告为未覆盖并说明理由；未标记的条目 SHALL 计为未覆盖并阻塞 ready-for-apply。每条核对 SHALL 给出目标位置及保留条件、例外和时序的简明语义判断，不能只列位置或复述原文。SHALL 明确说明已核对条目数与未覆盖条目身份；来源为豁免或无 normative 内容时 SHALL 显式声明该事实，不得以沉默表示核对通过。已满足内容可确认 no-op，说明材料不强造规范义务。CLI validation、结构相等或文本引用存在 SHALL NOT 替代此语义检查。缺少语义时补充适当 Contract，意图未决时请求用户裁决。

          - **记录细节不能被共同遗漏**

            - 记录含多条规范条目且其中一条未落入任何目标
            - 该条目标为未覆盖并阻塞 ready-for-apply
            - 说明未覆盖身份，补足语义或请求裁决

          - **Authored View 条目有合法落位**

            - 记录条目描述一个 Authored View 的目标状态
            - 标记其落位于 `views/<view identity>.md`
            - 不因落位清单遗漏 View 而阻塞该条目

          - **说明材料保持非规范性质**

            - 条目属于理由、备选或实施计划
            - 不强造规范义务，按性质进入 Plan 或 provenance

          - **已经满足的语义可无操作**

            - 某条规范确认在当前语义中已完整表达
            - 确认其 no-op 并记录该判断，不重复声明

          - **无条目可核对时显式声明**

            - 来源为已授权豁免或本次无 normative 内容
            - 显式声明没有条目需要核对
            - 不将无条目等同于核对通过
        acceptanceCases: []
      - name: 交接已确认设计来源
        body: |-
          存在记录时，完整 Change 的两段覆盖复核及确定性 validation 通过后，Propose SHALL 通过 framing consume 明确向该 Change 保存精确来源快照并完成来源生命周期；失败时保留来源且不声明 Formation 完成。豁免或无记录时 SHALL 跳过 framing validation 与 consumption，同时保留已声明的记录决策，不建立空记录。记录快照不参与 Expected Semantic Model。

          - **交接成功才完成 Formation**

            - 覆盖复核与 validation 均通过且记录来源可消费
            - 保存精确来源快照并完成 Formation

          - **Consume 失败**

            - framing consume 返回失败
            - 保留来源且不声明 Formation 完成，按共享恢复协议处理

          - **豁免时跳过消费但保留决策**

            - 来源已声明豁免
            - 跳过 framing validation 与 consumption
            - 保留该记录决策于 Formation 证据中，不建立空记录
        acceptanceCases: []
  element:propose-role:
    declaration:
      identity: propose-role
      kind: element
      parent: agent
      title: Propose Role
      definition: Propose 是 Agent 将 Change 雏形收成完整 Change 的工作身份。它复用已确认设计与有效 Design Summary，消费可用的已确认设计记录，编写完整 Semantic Delta 与 Change Plan，并编排语义覆盖复核、确定性校验及来源交接；它交付可进入实现的 Change，不修改项目实现、不更新正式模型，也不关闭 Change。
    sections:
      - name: 写入 Change 制品
        body: |-
          Propose Role SHALL 在授权范围内写入 Semantic Delta 与 Change Plan 制品。

          - **Propose 编译完整 Change**

            - 目标语义与路径已明确
            - Agent 写入对应 Change 目录
        acceptanceCases: []
      - name: 交付可进入实现的 Change
        body: |-
          Propose Role SHALL 将 Propose 完成的完整 Change 交付给 Change Implementation。

          - **Propose 活动完成**

            - Delta、Plan、审查与确认均完整
            - Agent 报告该 Change 可进入 Change Implementation
        acceptanceCases: []
      - name: 不修改项目或正式模型
        body: |-
          Propose Role SHALL NOT 修改项目实现，也 SHALL NOT 将 Delta 应用于 Semantic Model。

          - **Change 已形成**

            - Propose 到达出口
            - 项目实现与正式模型保持未落实该 Change 的状态
        acceptanceCases: []
      - name: 编排确认记录消费
        body: |-
          Propose Role SHALL 在完整 Change 通过来源到语义、语义到任务的覆盖复核与 validation 后调用 framing consume，核对版本、目标快照和来源生命周期成功才交付 Formation 结果。没有记录时直接按普通 Propose 路径交付，不执行空消费。

          - **带记录交付 Change**

            - 覆盖复核和最终校验通过且来源版本未改变
            - 向明确的目标 Change 消费记录，核对成功结果后交付。

          - **无记录交付 Change**

            - 完整 Change 仅由已确认设计与模型形成
            - 不调用 framing consume，不为流程创建空记录。
        acceptanceCases: []
  element:propose-workflow:
    declaration:
      identity: propose-workflow
      kind: element
      parent: propose
      title: Propose Workflow
      definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
    sections:
      - name: Propose 创建完整 change 制品
        body: |-
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
        acceptanceCases: []
      - name: Propose smart routing
        body: |-
          Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`，忠实文档化已确认设计。它 MAY 在不改变承诺或选择新行为、架构的前提下展开机制、案例和任务并修正表达或推导错误；新发现的决策点 SHALL 先说明选项与推荐，再一次一问等待用户确认。孤立缺口在 Propose 内确认，大幅重做设计或需要修订记录时返回 Explore；完成披露不能代替决策前确认。没有 summary 时，SHALL 依据 problem、impact scope、approach、verification method 与未决 Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

          - **复用 Design Summary**

            - conversation 包含已确认的 `Design Summary`
            - propose SHALL 说明正在复用该 summary
            - SHALL 将其中的 architecture、testing、risk 与 trade-off decisions 路由到对应 artifacts
            - SHALL NOT 重新执行字符数或 detail score 判断

          - **Semantic readiness 不完整**

            - 任一 readiness 项缺失或 source decision 未决
            - propose SHALL 在对话中列出具体缺口；孤立决策可就地询问，大幅设计工作建议 Explore
            - readiness 通过或被明确 override 前 SHALL NOT 创建 change 或写入制品
            - 新决策确认前 SHALL NOT 将依赖它的内容写成确定方案；routing decision 保留在会话

          - **用户显式 override**

            - propose 已报告 readiness 缺口且用户明确要求直接生成
            - propose SHALL 接受 override 并继续
            - override SHALL NOT 授权 Agent 猜测影响 behavior 或 architecture 的关键决策
            - 直接要求 propose 或不追问不提供缺失决策，必要确认无法取得时 SHALL 报告阻碍

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
        acceptanceCases: []
      - name: Proposal 分离 behavior 与 architecture source impact
        body: |-
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
        acceptanceCases: []
      - name: Propose 在架构 delta 前 reconcile architecture scope
        body: |-
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
        acceptanceCases: []
      - name: Propose 状态输出保持收敛
        body: |-
          Propose SHALL 只在 readiness、blocker 与 final summary 节点输出状态；需要用户决定时一次询问一个问题。

          - **Readiness 状态**

            - propose 完成 semantic readiness 判断
            - SHALL 报告 Design Summary reuse、readiness 或具体 gap

          - **最终总结**

            - propose 完成 artifacts、validation 与 report generation
            - SHALL 汇总 artifacts、errors/warnings、effective diff review 与 ready-for-apply 状态
            - SHALL 区分沿用的确认、Propose 合理推导的细节与配套保证及其依据与制品位置、在 Propose 内新确认的重大决策和未决事项；合理细节无需逐项确认，无补充或新决策时明确说明
            - SHALL 不把补充声称为 Explore 原有确认，不新增永久补充台账
            - SHALL 区分实际 CLI 结果、Agent 语义检查发现与剩余证据缺口，以具体检查发现及相关制品位置支持结论；不以产物数量或引用合法推断语义通过，也不要求完整自查过程或额外报告制品
            - 制品完成与 CLI 通过不等于语义就绪，影响当前目标或实现方案的未决决策 SHALL 阻塞 ready-for-apply

          - **Blocker 状态**

            - identity、source decision、validation 或 effective diff 阻塞流程
            - SHALL 报告最小必要 blocker
            - 需要用户决定时 SHALL 一次询问一个问题
        acceptanceCases: []
      - name: 仅在 Propose 形成结构目标时应用拆分指导
        body: |-
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
        acceptanceCases: []
      - name: Propose 按 TDD 闭环划分 Tasks
        body: |-
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
            - SHALL 按执行顺序从每个 Check 实际需要的实现、文件与命令反推依赖，确认仅用已有实现、此前 GREEN 的任务与当前任务即可达到 GREEN；若依赖后续任务则调整顺序或合并任务，引用的测试文件与命令须已存在或安排在此时提供，不能仅复述声明的依赖
            - 发现 task 依赖后续 task、Check 按 Acceptance Case 1:1 机械拆分或假防护测试时 SHALL reconcile 后再声明

          - **确认细节贯穿执行安排**

            - 用户确认的条件、例外与时序已经写入 Contract
            - 任务安排其实现与检查并引用该 Contract，不复制规范文本；缺少安排时不声明 ready-for-apply。
        acceptanceCases: []
      - name: Propose 使用制品定义先行写作
        body: |-
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
        acceptanceCases: []
  element:quality:
    declaration:
      identity: quality
      kind: element
      parent: change-implementation
      title: Quality
      definition: Quality 是 Change Implementation 中评估并改进项目结果代码质量的环节，由 Review 与 Optimization 两个活动共同完成。它以当前代码是否已经过 Review 作为唯一驱动：存在未经 Review 的代码变更时必须先执行 Review，只有当前代码已通过 Review 才可以执行 Optimization，二者交替进行直到当前代码已通过 Review 且不存在需要继续执行的优化事项。它包含代码状态判定、两个活动的进入与收口、优化过程中的判断记录，以及确认 Change Implementation 可以进入 Change Closure 的证据；它不包含 Apply 如何产生改动、Change Closure 如何收束，也不包含两个活动各自的判断标准。
    sections:
      - name: 每次修改后先执行 Review
        body: |-
          Quality SHALL 在每次 Apply 修改项目后先执行 clean-context Review。

          - **项目状态被修改**

            - Apply 完成一轮写入
            - Quality 进入 Review
        acceptanceCases: []
      - name: 代码状态决定进入的活动
        body: |-
          Quality SHALL 以当前代码是否已经过 Review 作为选择活动的唯一依据。存在未经 Review 的代码变更时 SHALL 进入 Review；当前代码已通过 Review 时才可以进入 Optimization。

          - **存在未检测的代码变更**

            - 当前代码与最近一条通过的 Review 记录不一致，或尚无 Review 记录
            - Quality 的状态为 `dirty`
            - 只有 Review 可以继续

          - **当前代码已通过 Review**

            - 存在一条 Review 记录，其 result 为 `PASS` 或 `PASS_WITH_WARNINGS`，且其 fingerprint 与当前代码一致
            - Quality 的状态为 `clean`
            - Optimization 可以开始
        acceptanceCases: []
      - name: Review 通过后建立 Baseline
        body: |-
          首次 Review 通过的项目状态 SHALL 成为 baseline checkpoint。

          - **初始实现通过 Review**

            - 当前状态首次满足正确性门禁
            - Quality 保存 baseline checkpoint
        acceptanceCases: []
      - name: 成功优化推进 Checkpoint
        body: |-
          每个优化轮次经 Apply 实现并重新通过 Review 后，当前项目状态 SHALL 成为新的 successful checkpoint。

          - **优化实现通过 Review**

            - 优化轮次产生的代码变更通过 Review
            - Quality 推进 successful checkpoint
        acceptanceCases: []
      - name: 失败优化恢复 Checkpoint
        body: |-
          优化轮次未通过 Review 时，Quality SHALL 恢复最近的 successful checkpoint。

          - **优化产生不合格状态**

            - 优化轮次产生的代码变更未通过 Review
            - Quality 回到最近成功状态
        acceptanceCases: []
      - name: 保留失败方向与优化历史
        body: |-
          失败轮次恢复后，Quality SHALL 保留 Review 结论、失败方向与优化判断记录，使后续评估仍可读取失败证据与历史。

          - **恢复成功状态**

            - Quality 丢弃未通过的优化改动
            - 恢复后的状态仍可读取失败方向与轮次记录
        acceptanceCases: []
      - name: 仅以最新成功状态完成
        body: |-
          Quality SHALL 仅在最新项目状态已成为 successful checkpoint 时完成。

          - **当前状态尚未通过 Review**

            - 最新修改仍是未通过 Review 的状态
            - Quality 不得完成
        acceptanceCases: []
      - name: 收口后确认可进入 Change Closure
        body: |-
          Quality SHALL 仅在当前代码已通过 Review、Optimization 已收口且终态不是 `ABORTED_UNSAFE`、且用于判断的证据仍然有效时，确认 Change Implementation 可以进入 Change Closure。

          - **Optimization 尚未收口**

            - 还没有任何收口记录
            - Quality 不得确认进入 Change Closure

          - **验证证据必须仍然有效**

            - Quality 无法以现有记录支持当前代码已通过 Review 的结论
            - 它要求重新执行 Review
        acceptanceCases: []
  element:realization:
    declaration:
      identity: realization
      kind: perspective
      parent: project.root
      title: Realization
      definition: Realization 是将项目意图落实为项目状态的 Perspective，独立建模以从推进过程与协作结构两个互补角度组织 Semantic Model 构建和 Change 演进。在推进过程上，它通过 Semantic Model Build 构建或重建 Semantic Model，通过 Change Realization 将已授权 Change 落实为项目新状态并收束；在协作结构上，由 Participants 承担授权、判断与编排，由 Interaction Surfaces 提供配置、呈现与确定性操作。
    sections:
      - name: 通过 Semantic Model Build 构建模型
        body: |-
          Realization SHALL 通过 Semantic Model Build 构建或重建 Semantic Model。

          - **项目需要建立模型**

            - 用户授权模型构建范围与依据
            - Realization 进入 Semantic Model Build
        acceptanceCases: []
      - name: 通过 Change Realization 落实变更
        body: |-
          Realization SHALL 通过 Change Realization 将已授权 Change 落实为项目新状态并完成收束。

          - **Change 获得授权**

            - 完整 Change 可进入实现
            - Realization 推进 Change Implementation 与 Closure
        acceptanceCases: []
      - name: Participants 承担协作职责
        body: |-
          Realization SHALL 由 Participants 承担授权、判断与编排。

          - **推进需要语义判断**

            - 确定性操作不足以完成决策
            - 适用 Participant 承担判断
        acceptanceCases: []
      - name: Interaction Surfaces 提供操作支撑
        body: |-
          Realization SHALL 由 Interaction Surfaces 提供配置、呈现与确定性操作。

          - **推进需要模型操作**

            - Agent 需要查询、校验或状态转换
            - 它通过适用 Interaction Surface 完成操作
        acceptanceCases: []
      - name: 以两个维度完整描述落实
        body: |-
          Realization SHALL 由推进过程完整描述 Activity 或 Stage 的入口、推进、约束与结果，并由协作结构完整描述 Participant 或 Agent 工作身份的授权、责任、判断、操作、协调与交付。

          - **理解同一落实工作**

            - 用户或 Agent 查看一个 Realization 工作
            - 推进过程说明工作如何成立且协作结构说明主体承担什么职责
        acceptanceCases: []
      - name: 允许跨维度语义覆盖
        body: |-
          推进过程与协作结构 MAY 在各自维度表达相互覆盖的规范语义，且任一维度 SHALL NOT 被表达为另一维度的差量。

          - **Role 承担 Activity**

            - Agent 工作身份描述其承担 Activity 的相关职责
            - Activity 与 Role Contracts 分别保持各自维度的完整语义
        acceptanceCases: []
  element:realization-process:
    declaration:
      identity: realization-process
      kind: perspective
      parent: realization
      title: 推进过程
      definition: 推进过程是按落实工作如何发生的过程角度组织 Semantic Model Build 与 Change Realization 的 Perspective。它包含各阶段和活动的入口、顺序、约束与结果，不包含承担这些工作的 Participants、Agent 工作身份或 Interaction Surfaces。
    sections:
      - name: 推进过程维度组织
        body: |-
          realization-process SHALL 从过程推进角度组织 Realization 的落实活动：Semantic Model Build 构建或重建 Semantic Model，Change Realization 将已授权 Change 落实为项目新状态并收束。

          - **推进过程容纳两类落实活动**

            - 浏览 realization-process 的 descendants
            - 呈现 Semantic Model Build 与 Change Realization 及其细化阶段

          - **过程维度不定义语义来源**

            - 用户或 Agent 依据推进过程推进项目
            - 过程维度自身不构成新的语义来源
            - 规范性语义仍由 Semantic Model 与 Change 表达
        acceptanceCases: []
  element:relationships:
    declaration:
      identity: relationships
      kind: element
      parent: semantic-model
      title: Relationships
      definition: Relationships 是 Elements 之间显式的、类型化的语义联系。每个 Relationship 连接 source Element 与 target Element，并使用由 Metamodel 声明的 Relationship Kind，表达 Elements 之间的协作、依赖或约束；它补充 Hierarchical Elements 无法表达的联系。
    sections:
      - name: 表达跨层级语义联系
        body: |-
          Relationship SHALL 以 source Element identity、Relationship Kind identity 与 target Element identity 表达层级结构无法表达的协作、依赖或约束。

          - **建立语义联系**
            - 两个 Elements 存在需要显式表达的协作关系
            - 模型以 Metamodel 已声明的 Relationship Kind 连接二者
        acceptanceCases: []
      - name: 以全部内容确定 identity
        body: |-
          Relationship identity SHALL 由有方向的 source、kind 与 target 三元组完整确定，并且 Relationship SHALL NOT 包含其他字段或 MODIFIED 状态。

          - **改变关系端点**
            - source、kind 或 target 任一项变化
            - 该变化表示移除旧 Relationship 并新增不同 Relationship
        acceptanceCases: []
      - name: 保持容器无语义
        body: |-
          Relationship 容器 SHALL 仅包含 `relationships` 列表，条目 SHALL 仅含 `source`、`kind` 与 `target`；文件名、路径和分组方式 SHALL NOT 参与 identity 或语义。

          - **按不同 Kind 重新分组**
            - 相同 Relationship entries 被移动到不同容器文件
            - 模型比较不报告语义差异
        acceptanceCases: []
      - name: 保持关系词汇精确
        body: |-
          Relationship SHALL 使用 Metamodel 声明的 Relationship Kind；containment 派生语义（`belongs_to`、`refines`、`abstracts`）SHALL NOT 作为持久化 relationship edges。

          - **持久化 containment 关系被拒绝**
            - 模型显式声明 `belongs_to`、`refines` 或 `abstracts` edge
            - validation SHALL 返回重复语义 ERROR
        acceptanceCases: []
      - name: 校验关系端点
        body: |-
          Relationship endpoints SHALL 引用可解析 Elements，并遵守 Metamodel 可选 `sourceKinds` 与 `targetKinds`；未声明 endpoint constraint 时默认开放。

          - **Endpoint 约束违规**
            - relationship endpoint kind 不满足显式 Metamodel constraint
            - validation SHALL 返回包含 relation 与 endpoint kinds 的 ERROR
        acceptanceCases: []
  element:review:
    declaration:
      identity: review
      kind: element
      parent: quality
      title: Review
      definition: Review 是 Quality 中由代码状态反复触发的正确性门禁：只要存在未经 Review 的代码变更，就必须先执行 Review。它由 Reviewer 作为 Internal Agent 在不受 Apply 阶段上下文影响的 clean context 中执行，独立评估 Change 是否完整落实、项目行为是否正确、实现是否遵循决策与约束、必要清理是否完成，并判断当前结果是否符合 Expected Semantic Model。
    sections:
      - name: 在每次 Apply 修改后执行
        body: |-
          Review SHALL 在每次 Apply 修改项目后执行。

          - **项目状态被修改**

            - Apply 完成一轮写入
            - 最新状态进入 Review
        acceptanceCases: []
      - name: 在 Clean Context 中独立评估
        body: |-
          Review SHALL 由 Reviewer 在不受 Apply 上下文影响的 clean context 中执行。

          - **Review 开始**

            - 当前状态可供评估
            - Reviewer 使用隔离上下文
        acceptanceCases: []
      - name: 读取完整评估依据
        body: |-
          Review SHALL 读取 Semantic Model、Change、当前项目状态与项目证据。

          - **Reviewer 形成判断**

            - Review 获取输入
            - 四类依据共同支持结论
        acceptanceCases: []
      - name: 评估目标实现质量
        body: |-
          Review SHALL 评估 Change 是否完整落实、行为是否正确、实现是否一致、项目约束是否遵循以及必要清理是否完成。

          - **检查当前状态**

            - Reviewer 对照 Expected Semantic Model
            - 逐项评估完整性、正确性、一致性与清理
        acceptanceCases: []
      - name: 先证据后结论
        body: |-
          Review SHALL 只以当前项目状态中独立获得的充分证据判定通过。

          - **只有完成声明**

            - 当前状态缺少覆盖目标行为的证据
            - Review 不推测通过
        acceptanceCases: []
      - name: 输出 Required Corrections 或证据缺口
        body: |-
          证据缺失、证据矛盾或实现不符合目标时，Review SHALL 输出 Required Corrections 或明确证据缺口。

          - **发现阻塞问题**

            - 当前实现未满足门禁
            - 问题返回 Apply
        acceptanceCases: []
      - name: 通过状态具备 Checkpoint 资格
        body: |-
          Review 通过时，当前项目状态 SHALL 有资格成为 baseline 或 successful checkpoint。

          - **当前状态通过 Review**

            - 没有阻塞问题且证据充分
            - Quality 可保存该状态为 Checkpoint
        acceptanceCases: []
      - name: 结论绑定被评估状态
        body: |-
          Review 结论 SHALL 只适用于被评估的项目状态。

          - **Review 后项目修改**

            - 当前项目状态发生任何修改
            - 旧 Review 结论不适用于新状态
        acceptanceCases: []
      - name: 修改后重新 Review
        body: |-
          任何项目修改 SHALL 要求修改后的状态重新执行 Review。

          - **Apply 实现修正或优化**

            - 项目产生新状态
            - 该状态成为 `dirty`
            - Quality 再次进入 Review
        acceptanceCases: []
  element:reviewer:
    declaration:
      identity: reviewer
      kind: element
      parent: internal-agents
      title: Reviewer
      definition: Reviewer 评估当前项目状态是否完整、正确且一致地实现 Expected Semantic Model。它独立读取 Semantic Model、Change、项目状态与证据，先证据、后结论；阻塞问题形成 Required Corrections 返回 Apply。Review 通过时，当前状态才有资格成为 Checkpoint；Reviewer 不创建或恢复 Checkpoint，不修改项目。
    sections:
      - name: 独立取得 Review 证据
        body: |-
          Reviewer SHALL 自主读取 Review 所需的 Semantic Model、Change、项目状态与证据，不依赖 Apply 的完成声明。

          - **Reviewer 接受评估任务**
            - Review 开始
            - Reviewer 从当前状态独立取得依据
        acceptanceCases: []
      - name: 保持只读且不管理 Checkpoint
        body: |-
          Reviewer SHALL NOT 修改项目、创建 Checkpoint 或恢复 Checkpoint。

          - **Reviewer 发现问题**
            - 当前状态需要修正
            - Reviewer 返回结论而不改变被评估状态
        acceptanceCases: []
      - name: 交付结构化 Review 结论
        body: |-
          Reviewer SHALL 将通过结论、Required Corrections 或证据缺口作为结构化结果交付给 Agent。

          - **Review 完成**
            - Reviewer 已完成证据判断
            - Agent 获得用于下一步编排的结论
        acceptanceCases: []
  element:semantic-delta:
    declaration:
      identity: semantic-delta
      kind: element
      parent: change
      title: Semantic Delta
      definition: Semantic Delta 是 Change 的规范性组成，由一组相对于当前 Semantic Model 声明的 Semantic Delta Entries 构成。它与当前 Semantic Model 共同唯一确定 Expected Semantic Model；持久化于 `.xirang/changes/<change>/` 的四分区，其修改语为 ADDED、MODIFIED 与 REMOVED。
    sections:
      - name: 唯一确定目标模型
        body: |-
          Semantic Delta SHALL 由一组 Semantic Delta Entries 构成，并与当前 Semantic Model 共同唯一确定 Expected Semantic Model。

          - **应用完整 Delta**
            - 同一 Change 的全部 Entries 一并应用
            - 结果是唯一的 Expected Semantic Model
        acceptanceCases: []
      - name: 与 Model 同构存储
        body: |-
          Semantic Delta SHALL 持久化于 `.xirang/changes/<change>/` 的四个模型分区，并在 Model 单元字段基础上为每个 Entry 携带 operation。

          - **加载 Change Delta**
            - CLI 读取一个活动 Change
            - CLI 从四分区联合加载全部 Entries 而不从 Plan 推断缺失语义

          - **创建结构 delta**
            - change 修改 Metamodel、elements、containment 或 semantic relationships
            - SHALL 在 `.xirang/changes/<name>/` 对应分区（`metamodel/`、`elements/` Declaration Entry、`relationships/`）写入 delta 单元
            - 使用与 Model 同构的单元记法并携带 operation 字段

          - **结构模块与 Contract 同属一个 delta**
            - change 同时修改结构与 Element Contracts
            - Metamodel、Element Declaration 与 Relationship operations SHALL 写入对应分区单元
            - Section operations SHALL 写入对应 change-local `elements/` 单元正文
            - 系统 SHALL 共同 materialize 一个 Target Semantic Model
        acceptanceCases: []
      - name: 不污染目标状态
        body: |-
          Delta operation 与变更历史 SHALL 只属于 Change，SHALL NOT 成为 Expected Semantic Model 或同步后 Semantic Model 的组成。

          - **同步 Delta**
            - Semantic Delta 成功应用到正式模型
            - 结果只保留目标语义内容而不保留修改语
        acceptanceCases: []
      - name: 使用统一修改语
        body: |-
          Semantic Delta 的修改语 SHALL 只有 ADDED、MODIFIED 与 REMOVED；ADDED 与 MODIFIED 携带对应实体的完整目标内容，REMOVED 只声明需要移除实体的 identity。

          - **修改现有实体**
            - 一个现有实体在目标状态中内容变化
            - MODIFIED Entry 直接声明其完整目标态而不叙述变化过程

          - **改变 kind 使用 MODIFIED Declaration**
            - element 的 kind、Definition、title 或 parent 在相同稳定 identity 下发生变化
            - delta SHALL 使用携带完整目标态的 `MODIFIED` Element Declaration
            - 该 Element 的稳定 identity SHALL 保持不变

          - **identity 变化使用 REMOVED + ADDED**
            - element 的稳定 identity 本身发生变化
            - delta SHALL 使用 `REMOVED` old element 与一个完整 `ADDED` new element
            - MUST NOT 使用 `MODIFIED` 改变 identity

          - **禁止 raw extend reconciliation**
            - skill 指导 delta authoring
            - MUST NOT 将 raw LikeC4 `extend` 描述为 canonical operation
            - SHALL 指引使用 identity-level 单元记法
        acceptanceCases: []
      - name: 在 Entry 粒度表达 operation
        body: |-
          Delta 中的 Metamodel、View 与 Element Declaration Entry SHALL 在 frontmatter 携带 `operation`；Element Contract 的 Section Entries SHALL 通过 `## ADDED Sections`、`## MODIFIED Sections` 与 `## REMOVED Sections` 分节获得修改语；Relationship entries SHALL 各自携带 operation（仅 ADDED 或 REMOVED，endpoint/kind 变化以 REMOVED 旧 tuple 与 ADDED 新 tuple 表达）。

          - **仅修改 Element Contract**
            - Delta 只改变一个 Element 的 Sections
            - Element frontmatter 只用于定位且不声明 Declaration operation
        acceptanceCases: []
      - name: 支持 Element 单元内独立 Entries
        body: |-
          一个 Element Delta 单元 SHALL 能独立表达 Declaration Entry 与零到多个 Section Entries；仅修改 Declaration 时正文 SHALL 为空。

          - **同时修改声明和契约**
            - 一个 Element 的 parent 与多个 Sections 均需改变
            - 同一单元分别以 frontmatter operation 和 Sections 分节表达完整目标 Entries
        acceptanceCases: []
      - name: 禁止冲突操作
        body: |-
          同一 identity 在一个 Semantic Delta 中 SHALL NOT 出现冲突操作；`ADDED` identity 已存在、`MODIFIED`/`REMOVED` identity 不存在、声明 MODIFIED 无有效变化 SHALL 被验证拒绝。

          - **检测身份前置条件**
            - `ADDED` identity 已存在于当前模型，或 `MODIFIED`/`REMOVED` identity 不存在
            - validation SHALL 返回包含 operation、identity 与 source location 的 ERROR

          - **声明 MODIFIED 无有效变化**
            - `MODIFIED` payload 与当前模型聚合相同
            - validation SHALL 返回 operation reconciliation ERROR

          - **Operation identity precondition**
            - `ADDED` identity 已存在，或 `MODIFIED`/`REMOVED` identity 不存在
            - SHALL 返回包含 operation、identity 与 source location 的 ERROR

          - **Declared MODIFIED 无 effective change**
            - `MODIFIED` payload 与 Formal aggregate 相同
            - validation SHALL 返回 operation reconciliation ERROR

          - **同一 identity operation 冲突**
            - 同一 identity 出现多个不构成合法 structural replacement 的 operations
            - validation SHALL 返回 conflict ERROR
            - MUST NOT 依赖 source order 选择 operation
        acceptanceCases: []
      - name: 联合验证 Kind 目标
        body: |-
          Metamodel Entry 以 Element Kinds 与 Relationship Kinds 的稳定 identity 识别对象；Kind 变化 SHALL 与 Expected Semantic Model 中的 Element Declarations 与 Relationships 联合理解。

          - **修改 Kind 约束**
            - delta `MODIFIED` element kind 或 relationship kind
            - payload SHALL 包含该 identity 的完整目标 constraints
            - Expected Model 中全部 elements 与 relationships SHALL 重新验证
        acceptanceCases: []
  element:semantic-model:
    declaration:
      identity: semantic-model
      kind: element
      parent: semantic-objects
      title: Semantic Model
      definition: Semantic Model 是项目用户意图的完整结构化规范表达，独立建模以统一声明项目是什么并为 Agent 导航、验证和演进提供依据。它包含 Metamodel、Hierarchical Elements、Relationships 与 Views，不包含单次演进的 Semantic Delta、Change Plan 或落实这些意图的 Realization 过程。
    sections:
      - name: 完整表达项目语义
        body: |-
          Semantic Model SHALL 在可扩展 Metamodel 约束下，以任意深度的 Hierarchical Elements、显式 Relationships 与 Views 完整表达项目用户意图。

          - **Agent 理解项目**

            - Agent 导航或验证项目
            - Agent 可从模型获得所需层级、契约和关系而无需猜测
        acceptanceCases: []
      - name: 使用稳定 identity
        body: |-
          Semantic Model SHALL 只以稳定 identity 引用语义对象，且文件路径、目录结构与语法位置 SHALL NOT 构成 identity 或层级语义。

          - **移动存储单元**

            - 一个语义实体的文件被移动但 identity 与内容不变
            - 模型语义保持不变
        acceptanceCases: []
      - name: 完整四分区持久化
        body: |-
          Semantic Model SHALL 完整持久化于 `.xirang/model/` 的 `metamodel`、`elements`、`relationships` 与 `views` 四个分区。

          - **加载正式模型**

            - CLI 读取 `.xirang/model/`
            - CLI 联合四个分区构建完整模型
        acceptanceCases: []
      - name: 使用 Element 存储单元
        body: |-
          `elements` 中每个 Markdown 单元 SHALL 表达一个 Element Declaration 及其至多一个 Element Contract。

          - **加载 Element 单元**

            - CLI 读取 `elements` 分区中的 Markdown 单元
            - 它联合 frontmatter Declaration 与正文 Contract 构建一个 Element
        acceptanceCases: []
      - name: 使用 Metamodel 存储单元
        body: |-
          `metamodel` 中每个 Markdown 单元 SHALL 表达一个 Element Kind 或 Relationship Kind。

          - **加载 Kind 单元**

            - CLI 读取 `metamodel` 分区中的 Markdown 单元
            - 它依据 entity 加载一个 Kind
        acceptanceCases: []
      - name: 使用 Authored View 存储单元
        body: |-
          `views` 中每个 Markdown 单元 SHALL 表达一个 Authored View。

          - **加载 View 单元**

            - CLI 读取 `views` 分区中的 Markdown 单元
            - 它依据 frontmatter 加载一个 Authored View
        acceptanceCases: []
      - name: 使用 Relationship 列表容器
        body: |-
          `relationships` 文件 SHALL 仅作为任意多条 Relationship 的结构化列表容器。

          - **重组 Relationship 文件**

            - Relationship entries 在容器文件之间重新分组但三元组集合不变
            - 模型语义保持不变
        acceptanceCases: []
      - name: 自声明实体类型
        body: |-
          除 Relationship 容器文件外，每个 Markdown 单元 SHALL 在 frontmatter 以 `entity` 声明自身类型；分区 SHALL NOT 决定 entity type，错置单元 SHALL 按自声明解析并产生 `ENTITY_PARTITION_MISMATCH` WARNING。

          - **Element 单元位于错误分区**

            - 一个自声明 `element-declaration` 的单元出现在非 `elements` 分区
            - 加载器按 Element 解析、报告 warning，且不因该 warning 判定模型无效
        acceptanceCases: []
      - name: 约束 Identity 语法
        body: |-
          持久 identity SHALL 匹配 `[A-Za-z0-9._-]+`，SHALL NOT 包含路径分隔符或文件系统保留字符。

          - **Identity 含路径分隔符**

            - 一个模型实体声明不合法 identity
            - CLI 拒绝该模型
        acceptanceCases: []
      - name: 保持 Kind Identity 全局唯一
        body: |-
          Element Kind 与 Relationship Kind identities 在 Metamodel 内 SHALL 全局唯一。

          - **两类 Kind 使用相同 Identity**

            - Metamodel 声明重复 Kind identity
            - CLI 拒绝该模型
        acceptanceCases: []
      - name: 不以 LikeC4 持久化语义
        body: |-
          LikeC4 SHALL NOT 参与 Semantic Model 的规范持久化。

          - **保存正式模型**

            - 系统写入 `.xirang/model/`
            - 只写入四分区源而不写入 `.c4`
        acceptanceCases: []
      - name: 整体生成 LikeC4 缓存
        body: |-
          `.c4` SHALL 由完整 Semantic Model 整体生成到 `.xirang/.cache-likec4/`。

          - **生成可视化源**

            - CLI 为模型生成 LikeC4 表示
            - 产物只写入缓存
        acceptanceCases: []
      - name: 不回写生成期结构
        body: |-
          生成期局部名与嵌套结构 SHALL NOT 回写 Semantic Model。

          - **LikeC4 派生局部名**

            - 生成器为当前输出分配局部名
            - 该名称不成为持久 identity
        acceptanceCases: []
      - name: 只以 Identity 建立引用
        body: |-
          `parent`、Relationship endpoints、Kind 的 `parents`、`children`、`sourceKinds`、`targetKinds` 以及 View 的 `of`、`include`、`exclude` SHALL 只引用对应语义对象的 identity。

          - **被引用单元改名**

            - 一个存储文件改名但其中实体 identity 不变
            - 全部语义引用仍解析到同一实体
        acceptanceCases: []
      - name: 建立 Identity Source Index
        body: |-
          加载器 SHALL 以 entity type 与 identity 共同建立 `(entity type, identity) → source module` 索引；同一 identity 在不同实体类型下 SHALL 分别定位到各自的存储单元。

          - **定位语义实体来源**

            - CLI 需要读取或重写一个实体
            - 它 SHALL 按该实体的 entity type 与 identity 通过索引定位对应存储单元

          - **跨类型同名单元各自定位**

            - 模型同时包含同名 element 与 element-kind
            - CLI 通过索引定位其中任一实体
            - SHALL 定位到该实体所属类型的存储单元
            - MUST NOT 定位到另一类型实体的存储单元
        acceptanceCases: []
      - name: 保持文件组织非规范
        body: |-
          目录内文件名与位置 SHALL 只作为组织约定；默认可使用 `elements/<identity>.md`、`metamodel/<kind identity>.md`、`views/<view identity>.md` 并按 Relationship Kind 分组容器，但偏离默认 SHALL NOT 改变模型语义。

          - **使用非默认文件名**

            - 有效单元使用不同文件名
            - 加载与模型比较依据 entity 和 identity 正常处理该单元
        acceptanceCases: []
      - name: 保持 Section Name 唯一
        body: |-
          同一 Element Contract 内的 Section names SHALL 唯一。

          - **Contract 包含重名 Sections**

            - Validator 发现同一 Element Contract 中两个 Sections 使用相同 name
            - Validator 返回 `DUPLICATE_SECTION_NAME` ERROR
        acceptanceCases: []
      - name: 保持 Acceptance Case Name 唯一
        body: |-
          同一 Section 内的 Acceptance Case names SHALL 唯一。

          - **Section 包含重名 Acceptance Cases**

            - Validator 发现同一 Section 中两个 Acceptance Cases 使用相同 name
            - Validator 返回 `DUPLICATE_ACCEPTANCE_CASE_NAME` ERROR
        acceptanceCases: []
      - name: 验证 Element Kind 引用
        body: |-
          每个 Element Declaration 的 `kind` SHALL 引用已声明的 Element Kind。

          - **Element 使用未声明 Kind**

            - Validator 无法在 Metamodel 中解析 Element 的 kind
            - Validator 返回 `UNDECLARED_ELEMENT_KIND` ERROR
        acceptanceCases: []
      - name: 验证 Relationship Kind 引用
        body: |-
          每个 Relationship 的 `kind` SHALL 引用已声明的 Relationship Kind。

          - **Relationship 使用未声明 Kind**

            - Validator 无法在 Metamodel 中解析 Relationship 的 kind
            - Validator 返回 `UNDECLARED_RELATIONSHIP_KIND` ERROR
        acceptanceCases: []
      - name: 验证 Kind Constraint 引用
        body: |-
          Element Kind 的 `parents`、`children` 与 Relationship Kind 的 `sourceKinds`、`targetKinds` SHALL 只引用已声明的 Element Kinds；该引用闭包 SHALL NOT 要求 `parents` 与 `children` 机械对称。

          - **Constraint 引用未声明 Kind**

            - Validator 在任一 Kind constraint 字段发现无法解析的 identity
            - Validator 返回 `UNRESOLVED_KIND_REFERENCE` ERROR
        acceptanceCases: []
      - name: 验证 Authored View 引用
        body: |-
          Authored View 的 `of`、list-form `include` 与 `exclude` SHALL 只引用已声明的 Elements；`include: '*'` SHALL 不要求逐项引用检查。

          - **View 引用未声明 Element**

            - Validator 无法解析 `of`、list-form `include` 或 `exclude` 中的 Element identity
            - Validator 返回 `UNRESOLVED_VIEW_REFERENCE` ERROR
        acceptanceCases: []
      - name: 保持 Identity 命名空间独立
        body: |-
          Semantic Model SHALL 将 identity 唯一性约束在各自的实体类型命名空间内：Element identity、Metamodel Kind identity（Element Kind 与 Relationship Kind 共用）与 Authored View identity SHALL 各自独立；不同命名空间使用相同 identity SHALL 合法，MUST NOT 被报告为冲突，且引用 SHALL 按字段的实体类型解析。

          - **Element 与 Element Kind 跨类型同名**

            - 模型同时包含 element-declaration `implementation` 与 element-kind `implementation`
            - CLI 加载该模型
            - 两个实体 SHALL 各自独立存在且 MUST NOT 产生冲突诊断
            - Element 的 `kind` 引用 SHALL 解析到 element-kind，引用 MUST NOT 因同名而解析到另一类型的实体
        acceptanceCases: []
  element:semantic-model-build:
    declaration:
      identity: semantic-model-build
      kind: element
      parent: realization-process
      title: Semantic Model Build
      definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
    sections:
      - name: 遵守用户授权范围与依据
        body: |-
          Semantic Model Build SHALL 在用户授权的探索范围与声明的权威依据下推进。

          - **开始模型构建**

            - 用户明确范围与权威来源
            - Agent 只在授权边界内编译目标语义
        acceptanceCases: []
      - name: 选择探索范围与 Candidate 起点
        body: |-
          Build 启动时 SHALL 让用户选择探索范围（whole project、code and tests、documentation and current Xirang 或 custom paths and rules），并在当前 formal model 存在时显式选择 Candidate 起点（基于当前模型构建、重新构建或使用指定内容作为起点）。

          - **用户选择探索范围**

            - Build 在无 active Candidate 时启动
            - 用户声明的 source-of-truth 约束被记录在 `build.md`
            - 不静默将代码、测试、文档、配置、Git history 或当前 Xirang 指定为 source of truth

          - **用户选择基于当前模型构建**

            - 用户选择“基于当前 Xirang 构建”
            - Candidate 从当前 formal source 初始化，且 digest-confirmed promotion 前当前 formal source 保持不变

          - **用户选择重新构建**

            - 用户选择“重新构建 Xirang”
            - 初始化 clean Candidate skeleton，当前 formal source MAY 作为选定证据但不被复制到 Candidate

          - **用户指定构建起点**

            - 用户选择"使用指定内容作为起点"
            - Candidate 仅从用户批准的路径初始化
            - SHALL NOT 推断额外的 baseline 路径
        acceptanceCases: []
      - name: 产出完整 Candidate
        body: |-
          Semantic Model Build SHALL 产出一个完整四分区 Candidate Semantic Model。

          - **Candidate 可供审查**

            - 模型编写完成
            - Candidate 联合包含 Metamodel、Elements、Relationships 与 Views

          - **Candidate 按四分区编写**

            - Agent 已解决所需的 semantic decisions
            - SHALL 编写 `.xirang/candidate/{metamodel,elements,relationships,views}/`，使其共同组成一个 Candidate
            - 每个 `elements/<identity>.md` 单元 SHALL 同时承载一个 Element Declaration 与至多一个 Element Contract（正文为 `## Specification`）
            - SHALL NOT 创建 `candidate/architecture`、`candidate/contracts` 或其他平行 Contract store

          - **Required element 需要 contract**

            - Agent 编写 `contract: required` 的 element kind
            - 每个 required element SHALL 在其自身 `elements/` 单元正文中携带 Contract（至少一个 Section）
            - Agent SHALL 将缺失 Contract 视为 decision gap，不得创建 catch-all owner 或独立 Spec 单元
        acceptanceCases: []
      - name: 不通过 Change 构建模型
        body: |-
          Semantic Model Build SHALL NOT 通过 Change 或 Semantic Delta 构建或重建 Semantic Model。

          - **执行 Project Build**

            - 目标是整体构建模型
            - Agent 使用 Candidate 而不创建模型 Change
        acceptanceCases: []
      - name: 只读校验 Candidate
        body: |-
          CLI SHALL 对 Candidate 执行只读确定性校验。

          - **Candidate 存在错误**

            - 校验发现无效语义或记法
            - CLI 返回 diagnostics 且不修改 Candidate
        acceptanceCases: []
      - name: 返回 Review Digest
        body: |-
          CLI SHALL 为有效 Candidate 返回绑定该精确版本的 review digest。

          - **Candidate 校验通过**

            - Candidate 没有验证错误
            - CLI 返回可供确认的 digest
        acceptanceCases: []
      - name: 由用户确认精确版本
        body: |-
          Promotion SHALL 仅接受用户确认的 Candidate 精确版本。

          - **Candidate 在确认后改变**

            - 当前内容与用户确认的 digest 不一致
            - CLI 拒绝 promotion
        acceptanceCases: []
      - name: 原子提升并保留 History
        body: |-
          用户确认后，CLI SHALL 将 Candidate 原子提升为 Semantic Model 并保留必要 history。

          - **Promotion 成功**

            - 当前 Candidate 匹配已确认 digest
            - 正式模型整体进入新状态且历史保留
        acceptanceCases: []
      - name: 整体替换正式模型
        body: |-
          Promotion SHALL 以 Candidate 的四个分区整体替换 `.xirang/model/`；Candidate 中不存在的正式模型单元 SHALL NOT 被保留。

          - **Candidate 删除旧单元**

            - 已确认 Candidate 不包含旧模型中的实体
            - promotion 后该实体不再属于正式模型
        acceptanceCases: []
      - name: 隔离临时构建依据
        body: |-
          `build.md` 等临时 scaffolding SHALL NOT 成为提升后 Semantic Model 的组成。 已确认设计来源快照同样 SHALL 只进入 Build history，不提升为正式模型分区。

          - **提升 Candidate**

            - promotion 成功
            - `.xirang/model/` 仅包含四个规范分区
        acceptanceCases: []
      - name: 先初始化再记录构建依据
        body: |-
          Semantic Model Build SHALL 在确定 Candidate baseline 并执行 `candidate init` 后，才将授权范围、权威顺序和当前要求写入 `.xirang/candidate/build.md`。 独立的 CLI-managed 已确认设计记录 MAY 在 Candidate 初始化前建立，但不得提前写入尚不存在的 Candidate build.md；它不能绕过后续范围、依据与精确版本确认。

          - **开始新的 Build**

            - 用户已选择 Candidate baseline
            - Agent 先初始化 Candidate workspace，再写入 build.md
        acceptanceCases: []
      - name: 显式处理 Active Candidate
        body: |-
          进入 Build 时已存在 active Candidate，Semantic Model Build SHALL 向用户呈现其 baseline、inventory 与 status，并要求用户明确选择继续或授权丢弃后重新初始化。

          - **检测到 Active Candidate**

            - Candidate status 报告 active
            - Build 不静默继续或替换该 Candidate
        acceptanceCases: []
      - name: 在编写前通过 Modeling Decision Gate
        body: |-
          Semantic Model Build SHALL 在探索授权证据后、首次编写 Candidate 前解决所有会改变目标模型的未决选择，并按权威冲突、Element identity 与边界、hierarchy、Metamodel、Contracts、Relationships、Authored Views 的依赖顺序推进。

          - **多个目标模型符合现有依据**

            - 一个未决选择会改变稳定 identity、层级、契约、Kind、Relationship 或 View
            - Agent 提供受限选项并一次请求一个用户裁决
        acceptanceCases: []
      - name: 仅记录例外 Provenance
        body: |-
          `build.md` SHALL 仅在全局权威顺序之外记录用户裁决、权威冲突解决、非显然证据选择和明确排除的实现事实，并 SHALL 标识决策、依据及影响范围。

          - **语义直接来自全局权威**

            - 目标语义可从已记录权威唯一确定
            - Build 不为该语义重复创建逐条来源记录
        acceptanceCases: []
      - name: 按 BFS 语义层编写 Candidate
        body: |-
          Semantic Model Build SHALL 依次编写 Metamodel、Element Declarations 与 hierarchy、Element Contracts、Relationships、Authored Views；每个 Declaration SHALL 在对应 Contract 之前完成完整 Definition，并在每层完成后执行针对该层的 Agent 检查。

          - **中间层尚不完整**

            - required Contracts 尚未在 Declaration 层之后写入
            - Build 不对故意不完整的中间状态要求完整 candidate validate
        acceptanceCases: []
      - name: 按独立演进边界编写 Sections
        body: |-
          Semantic Model Build SHALL 以规范承诺能否独立新增、修改或移除判断 Section 边界，SHALL NOT 按句子、分句、`SHALL` 数量或目标条数机械拆分。

          - **动作与结果不可分**

            - 条件、动作、结果与保证共同构成同一不可独立演进的承诺
            - Build 将它们保留在一个 Section 中
        acceptanceCases: []
      - name: 保留独立整体约束
        body: |-
          Element Contract 中只复述 Declaration Definition 或 sibling Sections 语义并集且不增加规范承诺的条目 SHALL NOT 成为 Section；独立的不变量、顺序、原子性、一致性或完成条件 SHALL 保留为 Section。

          - **父级定义跨子能力顺序**

            - 整体 Element 需要约束多个子行为的顺序
            - Build 保留该整体 Section
        acceptanceCases: []
      - name: 确定性校验后执行独立语义审查
        body: |-
          完整 Candidate 通过 `candidate validate` 后，Semantic Model Build SHALL 启动一个新的 read-only clean-context 通用 subagent，要求其自行读取 `build.md`、四分区、权威来源、必要证据与 validation 结果并审查授权完整性和语义正确性。

          - **Candidate 结构有效**

            - deterministic validation 没有 ERROR
            - Build 在向用户呈现 digest 前执行独立 semantic review

          - **可选 subagent 加速探索**

            - 并行探索有助于 Agent 理解用户批准的项目范围
            - Agent MAY 使用 task-specific prompts 调用 subagents
            - Candidate validation 与 promotion SHALL NOT 依赖 subagent availability 或固定 subagent role
        acceptanceCases: []
      - name: 只以阻塞语义问题拒绝审查
        body: |-
          Candidate semantic review SHALL 只以 `BLOCKER` 或 `HIGH` findings 判定 FAIL，SHALL NOT 将措辞偏好或非阻塞样式意见送入修正循环。

          - **Review 只有样式意见**

            - Subagent 未发现授权、完整性或语义正确性问题
            - Semantic review 返回 PASS
        acceptanceCases: []
      - name: Candidate 修改后重新审查
        body: |-
          任何 Candidate 修改 SHALL 使先前 semantic review 结论失效；Build SHALL 重新运行 deterministic validation，并启动另一个新的 clean-context subagent。

          - **修正 Review Finding**

            - Agent 修改 Candidate source
            - Build 不恢复或复用原 subagent 上下文
        acceptanceCases: []
      - name: 缺少 Clean Context 时 Fail Closed
        body: |-
          当前工具无法提供 clean-context subagent 时，Semantic Model Build SHALL 暂停并报告缺失能力，SHALL NOT 退化为 authoring Agent 自审。

          - **工具不支持隔离委托**

            - Build 到达 semantic review gate
            - Build 不向用户声明 Candidate 已通过完整审查
        acceptanceCases: []
      - name: Promotion 后验证 Build 后置条件
        body: |-
          Promotion 成功后，Semantic Model Build SHALL 依次确认 Candidate inactive、`.xirang/model/` 四个分区均为真实目录且 `arch validate --json` success，才报告 Build 完成。

          - **Post-promotion Validation 有 Warning**

            - Formal validation success 且包含 warnings
            - Build 报告 warnings 但仍可完成
        acceptanceCases: []
      - name: 后置条件失败时不自动重试
        body: |-
          任一 promotion 后置条件失败时，Semantic Model Build SHALL 报告 promotion 是否成功、失败条件及当前 Formal/Candidate 状态，SHALL NOT 自动再次 promotion。

          - **Promotion 成功但 Candidate 仍 Active**

            - post-promotion status 不满足生命周期条件
            - Build 停止完成声明并报告异常
        acceptanceCases: []
      - name: 编写完整 Element Definition
        body: |-
          Semantic Model Build SHALL 结合 Element 的 parent、children 与 siblings 编写完整 Definition，使 Agent 可仅从 Declaration 与相邻层级上下文识别该 Element 的概念身份、独立理由和范围边界。

          - **Definition 只是标题换写**

            - Candidate Declaration 未完整表达 Element 的概念身份或边界
            - Build 在进入 Contract 层前修正该 Definition
        acceptanceCases: []
      - name: 独立审查 Definition 质量
        body: |-
          Candidate semantic review SHALL 检查每个 Definition 是否完整、是否混入 Contract 或实现语义，以及是否与 parent、children 或 siblings 重复、冲突或发生边界漂移。

          - **Clean-context Review 发现概念边界冲突**

            - 两个 Elements 的 Definitions 无法区分各自独立概念范围
            - review 返回阻塞 finding，Build 修正 Candidate 或返回 Modeling Decision Gate
        acceptanceCases: []
      - name: Element Kind 是语义标签不约束层级
        body: |-
          Semantic Model Build 编写 Element Declaration 时 SHALL 将 Element Kind 视为项目定义的语义标签，而非层级约束：优先选择最能准确表达该 Element 语义的最具体既有 Kind；当无合适 Kind 时，通过 Metamodel 新增或细化 Kind，而不是削弱 Element 的语义仅因能通过验证就使用泛化 Kind。任何 Kind 可出现在任意深度，父 Element 的 Kind 不限制子 Element 的 Kind。层级只表达抽象→细化。`parent` 字段必需，children 由 parents 推导获得。

          - **跨 kind 层级**

            - Agent 编写一个 element 其为任意 Kind
            - Build SHALL 接受该层级结构
            - SHALL NOT 因 kind 不匹配白名单而拒绝

          - **无合适 Kind 时通过 Metamodel 新增**

            - 项目当前没有 Kind 能准确表达 Element 的语义
            - Build SHALL 在 Metamodel 中新增或细化一个 Kind
            - SHALL NOT 使用一个虽然可验证但语义不匹配的泛化 Kind
        acceptanceCases: []
      - name: 从 legacy 文档恢复语义需 agent 选择归属
        body: |-
          Semantic Model Build 从 legacy 文档或正式模型恢复仍适用的行为时，SHALL 由 Agent 确定每段内容归属于哪个 Element、哪个层级、哪个 Contract Section。内容归属是语义选择，需要 model 理解能力，不得由文件名称、标题匹配或程序化映射自动决定。

          - **纯复制可直接做**

            - 恢复内容可直接复制且无需改写
            - Agent MAY 直接复制

          - **非复制改写必须通过 subagent**

            - 恢复内容需要改写或词汇迁移（如 `spec` → `contract`、`architecture-delta.c4` → 四分区 Semantic Delta、`.opsx` → `.xirang`）
            - Agent SHALL 通过 subagent 完成（有 subagent 时）
            - SHALL 使用初始阶段用户选择的模型

          - **已覆盖内容不重复添加**

            - Candidate 已有内容覆盖 legacy 文档的同义行为
            - Agent SHALL 跳过该内容

          - **退役行为不复活**

            - legacy 文档包含已明确排除的退役行为（如 architecture-delta.c4 持久化、Spec store/registry/frontmatter、`xirang change/spec/diff` 命令组、archive-time sync 或 `--no-sync`、impact-sweeper、operation label 接受）
            - Agent SHALL NOT 将该行为写入 Candidate
            - SHALL 在 `build.md` 中记录 covered、added 与 retired 的 sources
        acceptanceCases: []
      - name: 按项目配置形成 Candidate hierarchy
        body: |-
          Semantic Model Build SHALL 在 Modeling Decision Gate 与首次 Candidate hierarchy 写入前消费 normalized `decomposition`：完整读取解析路径指向的指导文件，并按其形成 Candidate hierarchy；文件缺失或不可读时 fail closed。CLI 解析是机械的名称到路径映射，SHALL NOT 解释方法论内容。拆分指导只决定 Element abstraction/refinement 使用的分解坐标系，SHALL NOT 覆盖用户授权、证据权威、Element Contract 或 Relationship 语义。

          - **读取解析后的指导文件**

            - 有效配置的 `decomposition` 解析出指导文件路径
            - Build 在结构决策前完整读取该文件并遵循其拆分指导
            - 对每个 sibling set 执行单维度、MECE 与 BFS 检查

          - **指导文件不可用时停止结构形成**

            - 解析路径的指导文件缺失或不可读
            - Build fail closed 并报告该解析路径
            - 不以任何默认方法继续写入 Candidate hierarchy

          - **独立语义审查检查拆分一致性**

            - Candidate 进入 clean-context semantic review
            - review 检查 hierarchy 是否一致应用已选择的拆分指导
            - 检查同一 sibling set 未混合不相容的职责、生命周期、部署或实现维度
        acceptanceCases: []
      - name: 复用确认记录形成 Candidate
        body: |-
          Semantic Model Build SHALL 使用统一 Definition Framing 持续澄清与保存已确认设计，每次保存单独授权，实例与 Change 形成记录隔离，并按设计段落聚合持久化确认。存在记录时 SHALL 重载、调和冲突并对记录的规范性条目逐条核对到 Candidate 的落位，将每条标记为已落位于 Declaration、Contract、Relationship、Metamodel 或 Authored View 目标，或报告为未覆盖并说明理由；未标记的条目 SHALL 计为未覆盖并阻塞 source handoff。条件、数值、例外、时序必须进入适当 Contract；说明材料进入构建依据或 provenance。无记录时 SHALL 要求授权范围在 `build.md` 上携带记录决策——用户明确授予的豁免或本次无 normative 内容的声明——未声明即阻塞 promotion readiness；SHALL NOT 自行建立空记录。本流程 SHALL 保持 Candidate review / digest / promotion，不增加 Design Summary 门禁。

          - **记录驱动完整 Candidate**

            - 存在记录且其规范性条目已逐条落位到 Candidate
            - 按记录形成完整 Candidate
            - 说明每条落位结果与已核对条目数

          - **无记录但已声明决策**

            - 授权范围在 `build.md` 上声明豁免或本次无 normative 内容
            - 沿用既有 Build 门禁继续，不建立空记录
            - promotion readiness 以该声明为前提

          - **无记录且未声明决策**

            - 授权范围既无记录也未在 `build.md` 上声明记录决策
            - 阻塞 promotion readiness 并向用户请求该决策
            - 不将未声明当作默认覆盖

          - **规范细节遗漏阻止确认**

            - 记录的某条规范确认未落入任何 Candidate 目标
            - 该条目标为未覆盖并阻塞 source handoff
        acceptanceCases: []
      - name: 交接记录后确认精确 Candidate
        body: |-
          Build SHALL 在来源覆盖复核与适用校验通过后经 framing consume 向 active Candidate 交接精确记录来源，再验证带来源的最终 Candidate 并执行既有独立审查与用户 digest 确认。源或目标变化使受影响覆盖与确认失效。豁免或无记录时 SHALL 跳过 consumption 并在 promotion readiness 前核对已声明的记录决策，SHALL NOT 跳过确定性校验或独立语义审查本身。来源快照 SHALL 进入 history 而不进入正式模型。

          - **确认最终带来源版本**

            - 覆盖复核与校验通过且来源可消费
            - 交接精确来源，验证带来源的最终 Candidate 并以其 digest 完成确认

          - **来源交接失败**

            - framing consume 返回失败
            - 保留来源与既有目标，阻塞 promotion readiness

          - **豁免时跳过消费但不跳过校验**

            - 来源已声明豁免或无记录
            - 跳过 consumption 并在 promotion readiness 前核对 `build.md` 上的记录决策
            - 确定性校验与独立语义审查仍照常执行
        acceptanceCases: []
  element:semantic-objects:
    declaration:
      identity: semantic-objects
      kind: perspective
      parent: project.root
      title: 语义对象
      definition: 语义对象是从项目规范语义构成角度组织 Semantic Model 与 Change 的 Perspective。它独立建模以将项目应该是什么及应该如何变化，与负责落实这些意图的 Realization 区分开；包含 Semantic Model 与 Change，不包含落实过程、参与者或交互界面。
    sections:
      - name: 语义对象维度组织
        body: |-
          semantic-objects SHALL 从语义角度组织 Semantic Model 与 Change：Semantic Model 表达项目当前状态下的结构化语义，Change 表达针对该模型的一次演进意图。两个维度在自身层级完整描述，跨维度语义覆盖是允许的。

          - **语义对象容纳模型与变更**

            - 浏览 semantic-objects 的 descendants
            - 同时呈现 Semantic Model 的组成（Metamodel、Hierarchical Elements、Relationships、Views）与 Change 的组成（Semantic Delta、Change Plan）

          - **维度独立演进**

            - Change 以 Semantic Delta 表达针对 Semantic Model 的演进意图
            - Semantic Model 与 Change 各自作为独立语义对象演进
            - 语义对象的组织不引入新的规范性语义
        acceptanceCases: []
  element:snack:
    declaration:
      identity: snack
      kind: element
      parent: implementation-first-path
      title: Snack
      definition: Snack 是 Implementation-first Path 的形成阶段。它从已发生的项目实现出发，对照 Semantic Model 形成完整 Change：通过 CLI 查询 Elements、Relationships 与 Element Contracts，并结合 conversation context、working-tree / staged / HEAD 与用户指定 diff 等实现证据识别影响面；再按证据与 Semantic Model 写出或更新 Semantic Delta 以及 `proposal.md` 与 `design.md`，不生成 `tasks.md`。
    sections:
      - name: 从已发生实现开始 Formation
        body: |-
          Snack SHALL 以已经发生的项目实现作为 Change Formation 输入。

          - **实现先于 Change**

            - 项目改动已经存在
            - Snack 对该状态进行语义调和
        acceptanceCases: []
      - name: 对照模型与实现证据识别影响
        body: |-
          Snack SHALL 结合 Semantic Model 查询以及 conversation context、working tree、staged、HEAD 与用户指定 diff 等适用证据识别影响面。

          - **收集已有实现证据**

            - Snack 开始
            - 它读取可用证据并与模型对照
        acceptanceCases: []
      - name: 形成或更新 Semantic Delta
        body: |-
          Snack SHALL 按实现证据与 Semantic Model 写出或更新 Semantic Delta。

          - **实现改变规范行为**

            - 当前模型未表达已实现目标状态
            - Snack 形成对应 Delta Entries
        acceptanceCases: []
      - name: 形成或更新意图与决策说明
        body: |-
          Snack SHALL 写出或更新 `proposal.md` 与 `design.md`。

          - **解释已有实现**

            - Change 需要记录原因与关键决策
            - Snack 调和 proposal 与 design
        acceptanceCases: []
      - name: 保持已一致内容不变
        body: |-
          Snack SHALL 保持已经与实现证据和 Semantic Model 一致的 Change 内容不变。

          - **现有 Entry 已匹配实现**

            - 某项语义无需调整
            - Snack 不改写该内容
        acceptanceCases: []
      - name: 不生成 Tasks
        body: |-
          Snack SHALL NOT 生成 `tasks.md`。

          - **实现已经完成**

            - Snack 形成 Change Plan
            - Plan 不包含虚构的执行任务
        acceptanceCases: []
      - name: 完成 Formation 审查与确认
        body: |-
          Snack SHALL 在 Change Formation 内完成必要审查与确认。

          - **实现意图存在歧义**

            - 证据不能唯一确定目标语义
            - Snack 等待用户确认
        acceptanceCases: []
      - name: 移交验证与收束
        body: |-
          Snack 完成后，已有实现 SHALL 对照完整 Change 进入后续验证与 Change Closure。

          - **Snack Formation 完成**

            - Change 已完整且确认
            - 当前实现进入 Verify
        acceptanceCases: []
      - name: 遵循共享 Contract 语义
        body: |-
          Snack SHALL 按共享 Element Contract、Section 与 Acceptance Case 语义调和 Contract Delta，并以 Section 的独立演进边界确定 Entries。

          - **已有实现影响多个规范承诺**

            - 实现证据分别改变可独立演进的语义
            - Snack 将变化调和为独立 Section Entries，并保持 Acceptance Cases 从属于各自宿主 Section
        acceptanceCases: []
      - name: 仅从充分证据调和 Definition
        body: |-
          Snack SHALL 只有在已确认用户意图与实现证据足以确定稳定概念身份和边界时才创建或修改 Element Definition；文件名、类名、符号、调用关系或实现移动 SHALL NOT 单独证明 Declaration 变化。

          - **代码结构不足以确定概念边界**

            - 多个 Definition 均与当前实现证据相容
            - Snack 标记未决内容并等待用户确认，不从代码结构自动生成 Definition

          - **实现重构不改变概念**

            - 已发生修改只移动代码或重命名实现符号且 Element 概念边界不变
            - Snack 不产生 Declaration Delta
        acceptanceCases: []
  element:snack-role:
    declaration:
      identity: snack-role
      kind: element
      parent: agent
      title: Snack Role
      definition: Snack 是 Agent 在 Implementation-first Path 中、从已发生实现出发形成或调和 Change 的工作身份。它对照 Semantic Model 与实现证据写出或更新 Semantic Delta 以及 Plan 中的意图与决策说明；因实现已完成，不生成执行任务清单。
    sections:
      - name: 限定 Change 写入范围
        body: |-
          Snack Role MAY 写入或更新 Semantic Delta、`proposal.md` 与 `design.md`，SHALL NOT 生成 `tasks.md`。

          - **Snack 需要调和制品**
            - 活动识别出不一致或缺失内容
            - Agent 只写入适用的 Change 制品
        acceptanceCases: []
      - name: 保留一致制品内容
        body: |-
          Snack Role SHALL 避免改写已被 Snack 判定与模型和实现证据一致的内容。

          - **某项 Change 内容已一致**
            - Agent 执行制品更新
            - 该内容保持不变
        acceptanceCases: []
      - name: 交付当前实现供独立验证
        body: |-
          Snack Role SHALL 将完整 Change 与当前项目状态交付给 Verify。

          - **Snack 活动完成**
            - Formation 审查与确认通过
            - Agent 组织后续独立评估
        acceptanceCases: []
  element:text-presentation:
    declaration:
      identity: text-presentation
      kind: element
      parent: view-presentation
      title: Text Presentation
      definition: Text Presentation 是通过人类可读文本向用户传达 View 所组织语义信息的呈现方法。它可以使用标题、段落、列表、表格或文本差异等形式组织内容，使用户能够阅读、引用和审查 View；文本的排版、措辞与输出载体只服务于呈现。
    sections:
      - name: 以人类可读文本传达 View
        body: |-
          Text Presentation SHALL 通过标题、段落、列表、表格或文本差异等人类可读形式组织并传达 View 的语义信息，使用户能够阅读、引用和审查该 View。

          - **阅读 Change-derived View**

            - 系统以 Text Presentation 呈现一个 Change-derived View
            - 用户可从文本中识别该 View 组织的语义变化
        acceptanceCases: []
      - name: 排除程序化结构数据
        body: |-
          文本的排版、措辞与输出载体 SHALL 只服务于呈现且 SHALL NOT 构成规范性语义；仅供程序消费的结构化数据 SHALL NOT 属于 Text Presentation。

          - **CLI 返回 JSON IR**

            - CLI 输出仅供程序消费的结构化结果
            - 该结果不因采用文本编码而成为 Text Presentation
        acceptanceCases: []
  element:user:
    declaration:
      identity: user
      kind: element
      parent: participants
      title: 用户
      definition: 用户表达并确认用户意图，裁决无法仅从 Semantic Model、Change 与项目证据确定的语义与范围问题，并授权需要用户判断的重要决策与状态转换；用户不必亲自执行项目修改或确定性 CLI 操作。
    sections:
      - name: 表达用户意图
        body: |-
          用户 SHALL 表达项目或 Change 的用户意图。

          - **发起项目演进**
            - 用户希望建立项目或改变目标状态
            - 用户说明期望意图
        acceptanceCases: []
      - name: 确认用户意图
        body: |-
          用户 SHALL 确认将被落实的用户意图。

          - **Agent 形成目标表达**
            - Agent 将意图编译为 Candidate 或 Change
            - 用户确认该目标表达
        acceptanceCases: []
      - name: 裁决证据无法确定的问题
        body: |-
          用户 SHALL 裁决无法仅从 Semantic Model、Change 与项目证据确定的语义与范围问题。

          - **存在多个合理解释**
            - 不同解释会改变目标语义
            - 用户选择目标解释
        acceptanceCases: []
      - name: 授权重要决策与状态转换
        body: |-
          用户 SHALL 授权需要用户判断的重要决策与状态转换。

          - **提升 Candidate**
            - Candidate 已验证并呈现 digest
            - 用户决定是否授权 promotion
        acceptanceCases: []
      - name: 无需亲自执行落实操作
        body: |-
          用户 SHALL NOT 被要求亲自执行项目修改或确定性 CLI 操作。

          - **已完成必要授权**
            - 后续步骤可由 Agent 与 CLI 确定推进
            - Agent 代表用户完成操作
        acceptanceCases: []
  element:view-presentation:
    declaration:
      identity: view-presentation
      kind: perspective
      parent: views
      title: View Presentation
      definition: View Presentation 是 Views 按语义信息如何传达给用户划分的呈现维度。View 可以采用 Visual Presentation、Text Presentation，或者同时提供两种呈现方法；呈现方法不改变 View 的呈现视角、组成方式或所依据的规范性语义。
    sections:
      - name: 支持一种或多种呈现方法
        body: |-
          View Presentation SHALL 允许一个 View 采用 Visual Presentation、Text Presentation 或同时采用两种方法。

          - **同时提供视觉与文本呈现**

            - 一个 View 需要支持浏览和引用
            - 系统可同时提供 Visual Presentation 与 Text Presentation
        acceptanceCases: []
      - name: 不改变 View 语义依据
        body: |-
          同一个 View 的不同呈现方法 SHALL 表达同一呈现视角，并 SHALL NOT 改变该 View 的组成方式或规范性依据。

          - **切换呈现方法**

            - 用户在同一 View 的视觉与文本形式之间切换
            - View 选择和组织的语义保持一致
        acceptanceCases: []
  element:views:
    declaration:
      identity: views
      kind: element
      parent: semantic-model
      title: Views
      definition: Views 是 Semantic Model 面向用户的呈现层。View 面向特定的理解、讨论、审查或决策目的，选择、组织并呈现 Semantic Model 的语义对象及与 Change 相关的派生信息；Views 不引入规范性语义，也不改变或替代 Semantic Model 与 Change 所表达的规范性语义。
    sections:
      - name: 组织面向用户的模型视角
        body: |-
          View SHALL 从 Semantic Model 中选择并组织 Elements 与 Relationships，以形成面向用户的特定视角。

          - **用户切换视角**

            - 用户选择一个 View
            - 系统按该视角组织相关 Elements 与 Relationships
        acceptanceCases: []
      - name: 不承载规范性语义
        body: |-
          View SHALL NOT 引入规范性语义，且 View 的变化 SHALL NOT 改变 Semantic Model 的语义。

          - **调整 View 布局**

            - View 的选择或布局发生变化
            - 模型规范性语义保持不变
        acceptanceCases: []
      - name: 区分 Authored 与 Derived Views
        body: |-
          Views SHALL 由 Authored Views 与 Derived Views 组成。

          - **确定 View 来源**

            - 系统提供一个 View
            - 该 View 要么由用户声明，要么由语义输入派生
        acceptanceCases: []
      - name: 区分 View Composition 与 View Presentation
        body: |-
          Views SHALL 以 View Composition 表达呈现视角如何形成，并以 View Presentation 表达语义信息如何传达给用户；两个维度 SHALL 相互独立。

          - **同一 View 采用多种呈现方法**

            - 一个 Authored View 或 Derived View 同时提供 Visual Presentation 与 Text Presentation
            - 两种方法表达同一呈现视角且不改变该 View 的组成方式
        acceptanceCases: []
      - name: 排除纯程序化数据
        body: |-
          仅供程序消费的结构化数据 SHALL NOT 属于 Views。

          - **CLI 输出结构化结果**

            - CLI 输出仅供程序消费的 JSON 结果
            - 该结果不因文本编码而成为 View
        acceptanceCases: []
  element:visual-presentation:
    declaration:
      identity: visual-presentation
      kind: element
      parent: view-presentation
      title: Visual Presentation
      definition: Visual Presentation 是通过图形元素、空间组织与视觉编码向用户传达 View 所组织语义信息的呈现方法。它可以提供选择、导航和下钻等交互，使用户能够观察整体结构并查看局部语义；图形布局、视觉样式与交互状态只服务于呈现。
    sections:
      - name: 以视觉形式传达 View
        body: |-
          Visual Presentation SHALL 通过图形元素、空间组织与视觉编码向用户传达 View 所组织的语义信息，并 MAY 提供选择、导航和下钻交互。

          - **浏览层级结构**

            - 用户通过 Visual Presentation 查看一个层级 View
            - 用户可观察整体结构并导航到局部语义
        acceptanceCases: []
      - name: 视觉选择不构成规范性语义
        body: |-
          图形布局、视觉样式与 runtime interaction state SHALL 只服务于呈现，SHALL NOT 成为 Semantic Model 或 Change 的规范性语义。持久 presentation MAY 存在于 Metamodel，作为 Element Kind 的 `nodePresentation` 或 Relationship Kind 的 `presentation` 全局默认值；它不改变 Kind 的规范语义、View composition 或 Relationship identity。Renderer SHALL 使用 LikeC4 默认值补全缺失字段，且非法值 SHALL 在 Xirang 输入校验阶段被拒绝。

          - **调整视觉布局**

            - 同一 semantic projection 的节点位置、routing 或 viewport 发生变化
            - View Selection 与模型规范语义保持不变

          - **Kind presentation 不改变语义**

            - Element Kind 声明 `nodePresentation` 或 Relationship Kind 声明 `presentation`
            - 该 Kind 实例的职责、行为、层级与 Relationship 语义保持不变
            - presentation 不参与 View Selection 决策

          - **缺失 Relationship presentation 字段**

            - Relationship Kind 未声明 `presentation` 或只声明部分子字段
            - 缺失内容分别使用 LikeC4 默认值
        acceptanceCases: []
      - name: 使用原生 LikeC4 布局管线
        body: |-
          Visual Presentation SHALL 基于由官方 LikeC4 parser 与 validator 建立的 base model，让每个 Web runtime projection 通过官方 compute-view 与 Graphviz layout 产生最终 geometry 与 Relationship routing；正常呈现 SHALL NOT 在 layout 后使用另一套固定网格或手工 spline 替换结果。

          - **呈现 Model 与等价 Authored View**

            - Model Selection 与 Authored View Selection 形成相同可见语义集合
            - 两者使用相同 LikeC4/Graphviz 管线
            - 不因 View 来源不同切换布局算法

          - **Graphviz 失败**

            - 当前 projection 无法完成 Graphviz layout
            - Browser 显示结构化错误与 retry
            - 不静默回退低质量 renderer
        acceptanceCases: []
      - name: 叠加差异而不覆盖业务呈现
        body: |-
          Visual Presentation SHALL 将 Element Kind 与 Relationship Kind presentation 作为前景业务样式，并通过独立 overlay 呈现 ADDED、MODIFIED 与 REMOVED；diff state SHALL 同时使用非颜色视觉标记，SHALL NOT 仅通过覆盖业务 color、line、head、tail、shape 或 border 表达。

          - **呈现修改的 Relationship**

            - 一个具有 Kind presentation 的 Relationship 为 MODIFIED
            - 前景 edge 保持该 Kind 的 color、line、head 与 tail
            - 更宽的半透明 underlay 与状态图标表达 MODIFIED

          - **呈现 REMOVED Element**

            - diff-capable projection 包含 REMOVED Element
            - Element 保留 before-state 业务样式并降低主体透明度
            - 状态描边与图标明确表示 REMOVED

          - **非颜色识别**

            - 用户无法依赖颜色区分 diff state
            - 状态图标、形态与 tooltip 仍可区分 ADDED、MODIFIED 与 REMOVED
        acceptanceCases: []
      - name: 分离 Relationship Edges
        body: |-
          Visual Presentation SHALL 为每个 Xirang Relationship 保留独立 visual edge，分别使用各自 identity、Kind presentation、diff state、label、arrow 与 details mapping。布局前，映射到相同可见 endpoints 的同向 Relationships 聚合为单条携带全部 relation identities 的官方 Graphviz edge 以复用 geometry，避免平行关系数导致的布局/内存爆炸；布局后，Xirang 依据聚合 edge 携带的 identities 恢复独立 visual edges，并重新应用各自的 Kind presentation 与 diff state。A→B 与 B→A 作为不同方向由 Graphviz 分别 routing，不得方向合并；同向不同 Kind 或同向不同 diff operation 的 Relationships 保持独立 identity、label、presentation 与详情映射，共享 geometry 不改变语义或交互身份。

          - **同时呈现两个方向**

            - 当前 projection 包含 A→B 与 B→A
            - 两个方向的路径由 Graphviz 分别 routing，且任一 edge 可独立 hover、选择和打开详情

          - **一个方向发生变化**

            - reciprocal pair 中只有一个 Relationship 携带 diff operation
            - diff overlay 只作用于该方向
            - 另一方向的业务 presentation 保持不变

          - **同向 Relationships 具有不同 Kind presentation**

            - 多个同向 Relationships 映射到相同可见 source/target 且使用不同 Kind presentation
            - 每个 Relationship 保留独立 visual edge、label 与业务 presentation
            - 一个 edge 的 diff operation 不改变其他 edge
        acceptanceCases: []
      - name: 在重新布局时保持视觉锚点
        body: |-
          Graphviz 在 focus、展开或 Mode 变化后 MAY 重新排列 projection；Visual Presentation SHALL 以触发 Element 或当前 focus 作为视觉锚点，尽量保持其屏幕位置与 viewport，并以平滑过渡更新其他节点。系统 SHALL NOT 在每次交互后自动 fit 全图。

          - **就地展开 Element**

            - 用户展开一个具有 children 的 Element并收到新 layout
            - 该 Element 尽量保持原屏幕锚点
            - viewport 不被自动重置为全图

          - **首次打开 projection**

            - 一个 projection 首次显示且没有既有视觉锚点
            - Browser MAY 执行初始 fit view
        acceptanceCases: []
      - name: 跳过 Compound Projection 的 disconnected-node chaining 预处理
        body: |-
          Visual Presentation SHALL 在官方 Graphviz layout 之前，对包含 compound endpoint edges 的 Element View projection 跳过 `unflatten` 的 disconnected-node chaining 预处理，直接使用 LikeC4 printer 生成的原始 DOT 进入 Graphviz layout；对不包含 compound endpoint edges 的 Element View projection，SHALL 保留既有 `unflatten` 预处理。判定 SHALL 基于 layout 前已建立的 compound endpoint 拓扑，不依赖 View 来源、focus、expanded set 或 Presentation Mode。

          - **呈现 Compound Projection**

            - 当前 Element View projection 至少一条 visual edge 的 source 或 target endpoint 是 compound container
            - 布局前 SHALL NOT 执行 `unflatten`
            - 该 projection 的原始 DOT 直接进入 Graphviz layout

          - **呈现非 Compound Projection**

            - 当前 Element View projection 不含 compound endpoint edges
            - 布局前 SHALL 执行既有 `unflatten` 预处理
            - 布局行为与预处理加入前保持一致

          - **Compound 存在但 edges 均为 leaf-to-leaf**

            - 视图包含 compound nodes，但所有 visual edges 的 endpoints 均不是 compound
            - 布局前 SHALL 执行既有 `unflatten` 预处理
            - 判定依据为 edge endpoints 而非视图是否包含 compound nodes
        acceptanceCases: []
  element:web:
    declaration:
      identity: web
      kind: element
      parent: interaction-surfaces
      title: Web
      definition: Web 是息壤在浏览器中的可视化交互界面，以经 Xirang 改造的 LikeC4 为技术支撑，与 CLI 并列作为 Interaction Surface，向用户呈现 Semantic Model、active Candidate 与 active Changes 的层级浏览与差异审查。它独立建模以承接面向用户的浏览编排语义；不包含 CLI 的配置维护与确定性操作，不构成规范性语义来源，不负责规范语义持久化、Candidate promotion 与 Change Closure。
    sections:
      - name: 启动边界：项目根发现与无项目失败
        body: |-
          `xirang view` SHALL 从嵌套目录沿父目录向上发现最近的 `.xirang/` 项目根，并仅在该项目根下启动嵌入式浏览器；不存在 `.xirang/` 项目时 SHALL 以非零状态失败。

          - **项目根向上发现**

            - 用户从 `.xirang/changes/some-change/` 等子目录运行 `xirang view`
            - CLI 沿父目录向上查找最近包含 `.xirang/` 的目录作为项目根
            - 使用该项目根的 Formal source 与 active changes

          - **未找到项目**

            - 用户在不包含 `.xirang/` 的目录运行 `xirang view`
            - CLI 报错："未找到 Xirang 项目"
            - 以非零状态退出且不启动服务器
        acceptanceCases: []
      - name: 支持分层语义浏览
        body: |-
          Web SHALL 在单一 route 中使用 Full Model 或 Authored View Selection，并可结合 Model Selection（active Candidate 或活动 Change 的 Expected Semantic Model），在被浏览 Model 实例内呈现不同抽象层级的 Elements、Element Contracts 与 Relationships；普通 Browser 的当前层 SHALL 由 View Selection 边界、focus、direct children、已就地展开后代与可映射到不同可见 endpoints 的 Relationships 共同确定。

          - **下钻 Full Model 或 Authored View**

            - 用户在 Full Model 或 Authored View Selection 中进入具有 children 的 Element
            - Browser 保持当前 View Selection，更新 focus、runtime projection、breadcrumb 与导航历史

          - **浏览 Element 详情**

            - 用户选择没有 children 的 Element
            - Browser 展示其声明、Contract、Relationships 与 refinement context
            - 不创建新的 View identity 或空 route
        acceptanceCases: []
      - name: 保持 Authored View 声明视角
        body: |-
          Authored View SHALL 以持久化 `include`、`exclude` 与可选 `of` 确定 View Selection 边界，并 SHALL 在该边界内支持与 Model 相同的 focus、下钻、breadcrumb 与就地展开；这些 runtime 状态 SHALL NOT 修改 View Definition。

          - **浏览 Authored View 子树**

            - 用户在 Authored View 中 focus 或展开具有 children 的 Element
            - Browser 只显露该 View 选择闭包内且未被 `exclude` 剪除的 descendants
            - Authored View 文件保持不变

          - **切换后呈现声明边界内内容**

            - 用户从 Model View 切换到 Authored View
            - 投影只呈现该 View 选择闭包内的 Elements，边界外 Elements 不呈现
            - 初始 focus 为该 View 的根 Element，不引用 View 外 Element

          - **在 Authored View 内就地展开**

            - 用户在 Authored View 内就地展开选择闭包内的 Element
            - Browser 以与 Model View 一致的方式呈现其 children

          - **在 Authored View 内显示 focus breadcrumb**

            - 用户在 Authored View 内下钻到闭包内 Element
            - focus breadcrumb 以该 View 根为起点呈现路径
            - 路径在该 View 边界处截断，不包含 View 外祖先
        acceptanceCases: []
      - name: focus 失效时确定性回退
        body: |-
          Semantic Model、Candidate 或 Semantic Delta 刷新使当前 focus 不再存在时，Web SHALL 沿刷新前的 ancestor 链回退到最近仍存在的 Element，并在没有可用 ancestor 时回退 Project Root。

          - **Change 更新移除当前 focus**

            - 用户正在 Change-derived View 中浏览的 Element 被更新后的 Semantic Delta 移除
            - Browser 选择最近仍存在的 ancestor、更新布局和 breadcrumb，且旧请求不得恢复已移除 focus

          - **Candidate 更新移除当前 focus**

            - 用户正在 Candidate 目标模型中浏览的 Element 被更新后的 Candidate 移除
            - Browser 选择最近仍存在的 Candidate ancestor、更新布局和 breadcrumb，且旧 source 内容不得恢复已移除 focus
        acceptanceCases: []
      - name: URL 编码导航状态并响应浏览器前进后退
        body: |-
          Web SHALL 在单一 route 的 URL 中编码 `view`、`model`、`mode` 与 `focus`，并将三维选择与 focus 变化呈现为浏览器历史步；expanded set SHALL 只存储于 Controller 会话和 browser history state，不进入 URL。浏览器前进/后退 SHALL 恢复对应状态，且同步 SHALL NOT 产生循环或重复历史条目。

          - **下钻与 breadcrumb 跳转**

            - 用户下钻 Element 或点击 breadcrumb ancestor
            - Browser 将新 focus 写入 URL 并新增历史步
            - 浏览器后退恢复先前 focus 与 projection

          - **控件变化**

            - 用户改变 View Selection、Model Selection 或 Presentation Mode
            - Browser 将对应 `view`、`model` 或 `mode` 写入 URL
            - 一次用户操作只形成一个历史步

          - **expanded 不进入 URL**

            - 用户就地展开任意数量的 Elements
            - URL 不增加 expanded identities
            - 前进后退可通过 history state 恢复，刷新后使用当前 focus 的默认折叠状态

          - **深链恢复**

            - 用户直接打开携带有效 `view`、`model`、`mode` 或 `focus` 的 URL
            - Controller 建立对应合法状态
            - 不存在的 identity 触发确定性默认回退而不是空白画布
        acceptanceCases: []
      - name: focus breadcrumb 可拖动
        body: |-
          Web 的 focus breadcrumb 导航 SHALL 可通过拖动手柄在 diagram 容器内移动，使用户可将它移开以避免遮挡编辑器控件；拖动 SHALL NOT 触发 diagram 平移，且 breadcrumb 内元素按钮的 focus 导航 SHALL 保持可用。

          - **拖动 breadcrumb**

            - 用户按住 breadcrumb 拖动手柄并在 diagram 容器内移动指针
            - breadcrumb 跟随指针移动
            - diagram 视图 SHALL NOT 随之平移或缩放

          - **breadcrumb 按钮仍可导航**

            - 用户点击 breadcrumb 内的元素按钮
            - 对应元素成为 focus
            - 该点击 SHALL NOT 启动拖动
        acceptanceCases: []
      - name: 提供当前 view 的层级树导出
        body: |-
          Web SHALL 为当前 view 提供层级树导出：按视图内呈现元素的父子层级构建树，根为视图根元素，子元素按声明层级嵌套，且树 SHALL 仅包含当前 view 呈现的元素。

          - **导出当前 view 层级树**

            - 用户从导出菜单选择层级树导出
            - 打开层级树导出页，内容为当前 view 的元素层级树
            - 根节点为当前 view 的根元素，子孙按父子关系嵌套

          - **树仅含当前 view 元素**

            - 当前 view 只呈现模型的一部分元素
            - 层级树 SHALL 只包含该 view 呈现的元素及其层级
            - SHALL NOT 混入 view 之外的模型元素
        acceptanceCases: []
      - name: 层级树多格式与字段选择
        body: |-
          层级树导出 SHALL 支持三种序列化格式——纯文本缩进树（`├──`/`└──` 树形线）、Markdown 嵌套列表与 JSON 结构化层级——由用户在导出页选择；文本与 Markdown 每行内容 SHALL 按 `title`/`fqn`/`kind` 字段组合呈现，JSON SHALL 恒包含 `title`、`fqn`、`kind` 与 `children`。

          - **切换导出格式**

            - 用户在层级树导出页选择纯文本、Markdown 或 JSON 格式
            - 内容按所选格式重新渲染
            - 复制与下载的文件扩展名与所选格式一致（`.tree.txt`/`.tree.md`/`.tree.json`）

          - **选择每行字段**

            - 用户勾选 `title`、`fqn` 与 `kind` 字段
            - 文本与 Markdown 的每行按选中字段组合呈现
            - 未选中的字段不出现在行内容中

          - **JSON 输出全字段**

            - 格式为 JSON
            - 输出为嵌套 JSON，每个节点包含 `title`、`fqn`、`kind` 与 `children`
            - 不受字段选择影响
        acceptanceCases: []
      - name: 图片导出所见即所得
        body: |-
          Web SHALL 通过既有图片导出入口导出当前 layouted projection：PNG/JPG SHALL 包含当前 View Selection、optional Change、Presentation Mode、focus、direct children 与已就地展开后代对应的画布内容；交互式 Browser chrome SHALL 被排除，在没有可用 snapshot 时 SHALL 回退到既有默认导出行为。

          - **导出聚焦且就地展开的 Authored View**

            - 用户在 Authored View Selection 中 focus 并展开部分后代后导出 PNG 或 JPG
            - 导出节点和 edges 与屏上 projection 一致
            - 不包含三个控制器或 breadcrumb

          - **导出 Complete with diff**

            - 用户在 `complete-with-diff` 中导出 PNG 或 JPG
            - 导出图片保留业务 presentation、diff overlay 与 REMOVED ghosts

          - **无前置 snapshot**

            - 用户直接打开导出页且没有交互 Browser 写入的 snapshot
            - 导出回退到既有默认行为且不产生错误
        acceptanceCases: []
      - name: 文件类导出保持完整模型结构
        body: |-
          Web 的 dot、d2、mmd、puml、Draw.io 与层级树导出 SHALL 导出当前所选 source 的完整模型结构（全部 Elements 与其层级），SHALL NOT 反映当前 focus 与就地展开状态；该行为是导出能力的既定范围而非缺陷，图片导出（PNG/JPG）按“图片导出所见即所得”呈现当前视图。

          - **导出 dot/mmd/puml/d2/Draw.io 文件**

            - 用户在聚焦并就地展开后导出 dot、d2、mmd、puml 或 Draw.io
            - 导出内容为完整模型结构，包含全部 Elements 与其层级，与当前 focus 和就地展开无关

          - **导出层级树**

            - 用户在聚焦后导出层级树
            - 树包含当前 source 的完整模型层级，而非仅当前 focus 视图
        acceptanceCases: []
      - name: 提供三维独立控制
        body: |-
          Web SHALL 在单一 Browser route 中以持久可见且相互独立的 Model Selection、View Selection 与 Presentation Mode 控件形成当前浏览状态。Model Selection SHALL 为 baseline、active Candidate（若存在，`model=candidate`）或一个活动 Change 的 Expected Semantic Model（`model=change:<identity>`），Candidate 不存在时 SHALL NOT 出现该值；View Selection SHALL 只选择 Full Model 或一个对当前 Model 实例解析非空的 Authored View；Presentation Mode SHALL 在非 baseline Model 时提供 `complete`、`complete-with-diff` 与 `diff-only`，baseline 时锁定为 `complete`。

          - **三维独立切换**

            - 用户改变 Model Selection、View Selection 或 Presentation Mode
            - 另外两个维度的选择保持不变
            - 新的组合状态立即生成对应 projection

          - **Candidate 提供三态 Mode**

            - Model Selection 为 active Candidate
            - Presentation Mode 控件列出 `complete`、`complete-with-diff` 与 `diff-only`
            - 默认为 `complete`
        acceptanceCases: []
      - name: 协调 View Selection 运行时状态
        body: |-
          Web SHALL 在切换 View Selection 时保留仍属于新选择边界的 focus，并将 expanded set 限制为新选择中仍有效且可达的 Elements；focus 不再有效时 SHALL 回到新 View 默认 root，Model Selection 与 Presentation Mode SHALL 保持不变。

          - **切换到仍包含当前 focus 的 Authored View**

            - 当前 focus 与部分 expanded Elements 仍属于新 Authored View 的选择边界
            - Browser 保留 focus 与仍有效的 expanded Elements
            - 使用新 projection key 重新布局

          - **切换后 focus 不可用**

            - 当前 focus 不在新选择中或被 `exclude` 剪除
            - Browser 回到新 View 默认 root
            - 被排除或不可达的 expanded Elements 不得重新出现

          - **当前 Model 在新 View 中无差异**

            - 保留的非 baseline Model Selection 与新 View Selection 没有交集
            - Browser 显示明确的空差异状态
            - 不自动修改 View、Model 或 Mode
        acceptanceCases: []
      - name: 静态渲染不呈现交互式 Browser Chrome
        body: |-
          Web 的三个控制器、breadcrumb、loading/error controls 与其他交互式 Browser chrome SHALL 只在交互页面呈现；首页卡片、悬停预览与 PNG/JPG 导出 SHALL 只呈现当前 layouted projection。

          - **导出当前 projection**

            - 用户从交互 Browser 导出 PNG 或 JPG
            - 图片包含当前 projection 内容
            - 不包含 View、Change、Mode 控件、breadcrumb 或 diagnostics chrome
        acceptanceCases: []
      - name: 首页提供 Candidate 与活动 Change 快速入口
        body: |-
          Web 首页 SHALL 为 active Candidate（若存在）与每个活动 Change 提供快速入口卡片；Candidate 卡片 SHALL 以 `model=candidate` 状态打开单一 route 并省略 `mode`；活动 Change 卡片 SHALL 以 `model=change:<name>&mode=diff-only` 状态打开单一 route；活动 Change 与 Candidate SHALL NOT 因首页入口而形成独立 View source。

          - **点击 Candidate 卡片**

            - 用户在首页点击 Candidate 入口卡片
            - Browser 以 `model=candidate` 状态打开，URL 不含 `mode`
            - Model Selection 显示 Candidate，Mode 为 `complete`

          - **点击活动 Change 卡片**

            - 用户在首页点击一个活动 Change 卡片
            - Browser 以 `model=change:<name>&mode=diff-only` 状态打开
            - View Selection 保持 Full Model
        acceptanceCases: []
      - name: 切换 View、Model 或 Mode 后自动适配视口
        body: |-
          Web SHALL 在 View Selection、Model Selection 或 Presentation Mode 切换产生的新 projection 应用后，自动缩放并居中，使该 projection 的全部内容完整可见；由 focus 下钻或就地展开引起的 projection 更新 SHALL NOT 触发自动适配，SHALL 保持用户当前视口。

          - **切换 View 后适配**

            - 用户在交互式 Browser 中切换 View Selection
            - 新 projection 应用后视口自动缩放并居中
            - 该 projection 的全部内容完整可见

          - **切换 Model 后适配**

            - 用户切换 Model Selection
            - 新 projection 应用后视口自动缩放并居中
            - 该 projection 的全部内容完整可见

          - **切换 Mode 后适配**

            - 用户切换 Presentation Mode
            - 新 projection 应用后视口自动缩放并居中
            - 该 projection 的全部内容完整可见

          - **快速入口进入后适配**

            - 用户通过首页快速入口卡片以 `view`/`model`/`mode` 状态打开单一 route
            - 首个 projection 应用后视口自动缩放并居中
            - 该 projection 的全部内容完整可见

          - **下钻与就地展开不触发适配**

            - 用户下钻 focus 或就地展开后代
            - 视口保持用户当前位置
            - 不自动缩放或居中
        acceptanceCases: []
      - name: 呈现 Model 目标与差异
        body: |-
          Web SHALL 将 Model Selection、View Selection 与 Presentation Mode 确定性组合并呈现对应 projection；非 baseline Model SHALL 提供 `complete`、`complete-with-diff` 与 `diff-only` 三种 Presentation Mode，默认值按 Model 值区分（Candidate 为 `complete`，活动 Change 为 `complete-with-diff`），baseline SHALL 锁定为 `complete`；系统 SHALL NOT 为每个 Model 值创建独立可选 View source。`complete` 与 `complete-with-diff` projection SHALL 使用该 Model 的 target-only sources，`diff-only` projection SHALL 使用 baseline 与该 Model 的 union sources；REMOVED elements SHALL 仅在 `diff-only` 中以 ghost 保留。

          - **Complete 模式**

            - 用户使用 `complete`
            - baseline 呈现当前模型，非 baseline Model 呈现其目标模型
            - 不添加 diff overlay

          - **Complete with diff 模式**

            - 用户使用 `complete-with-diff`
            - Browser 呈现该 Model 的 target projection
            - 可见节点与边叠加 ADDED、MODIFIED 与 REMOVED 差异标记
            - REMOVED elements 不属于 target projection，不在该模式中呈现

          - **Diff only 模式**

            - 用户使用 `diff-only`
            - Browser 仅保留 changed objects、必要 ancestors、Relationship endpoints 与 removed ghosts
            - unchanged context 不计入 diff counts

          - **浏览 Candidate 默认目标态**

            - 用户以 `model=candidate` 打开
            - Browser 呈现 Candidate 目标模型，Mode 为默认 `complete`，无差异标记
        acceptanceCases: []
  element:workspace-init-update:
    declaration:
      identity: workspace-init-update
      kind: element
      parent: project-tooling-configuration
      title: 工作区初始化与更新
      definition: 工作区初始化与更新是 CLI 中初始化和更新息壤工作区的能力。它通过 `xirang setup` 与 `xirang update` 创建或保留 `.xirang` durable workspace、安装固定 Agent workflow 集合、刷新受管 Agent surfaces，并维护配置默认值与退役 workspace 的迁移。
    sections:
      - name: 初始化完整工作区
        body: |-
          `xirang setup` SHALL 创建或保留 `.xirang` durable core、项目配置、formula Semantic Model skeleton 与 Agent workflow 集合，且不得声称 Project Build 已完成。

          - **新项目 setup**

            - 项目不存在 `.xirang/` workspace
            - setup SHALL 创建 config、四分区模型骨架、changes 与 references，并安装固定 workflow 集合
            - SHALL NOT 从项目证据推断 Candidate 语义

          - **既有项目 setup**

            - `.xirang/` 已存在
            - setup SHALL 保留 existing formal source、配置与用户内容，并仅在用户明确选择工具后刷新 managed Agent surfaces
        acceptanceCases: []
      - name: 安装固定 Agent Workflow 集合
        body: |-
          `xirang setup` 与 `xirang update` SHALL 安装固定 workflow 集合：propose、explore、apply、archive、build 和 snack。

          - **安装 Build workflow**

            - configured tool 支持 skills
            - setup SHALL 生成 `xirang-build`
            - SHALL NOT 生成退役的 bootstrap workflow artifacts
        acceptanceCases: []
      - name: 支持跨平台与 non-interactive 运行
        body: |-
          Setup SHALL 对所有 workspace paths 使用 Node.js path APIs，并 SHALL 提供显式 non-interactive tool selection。

          - **Windows setup**

            - setup 在 Windows、macOS 或 Linux 上运行
            - generated workspace paths 与 formal source 内容等价，且 filesystem operations 使用 path-aware APIs

          - **Non-interactive setup**

            - setup 在无 prompts 环境中运行
            - SHALL 要求显式 supported `--tools` value，invalid values 返回可操作 diagnostics
        acceptanceCases: []
      - name: 更新受管工作面
        body: |-
          `xirang update` SHALL 根据全局配置刷新项目中的受管 skills 指令文件，SHALL NOT 刷新退役的 slash-command workflow artifacts。

          - **刷新现有工具制品**

            - 项目中已配置 AI 工具
            - 检测已安装的工具 skills 目录并为每个检测到的工具重新生成固定 workflow skills

          - **无变化时保持稳定**

            - installed skills 匹配固定 workflow 集合且所有模板为最新
            - update SHALL 显示 "Already up to date."
        acceptanceCases: []
      - name: 迁移配置默认值
        body: |-
          `xirang update` SHALL 以 missing-only 方式在 `.xirang/config.yaml` 或 `.xirang/config.yml` 中物化缺失的功能性默认值，且 SHALL NOT 覆盖用户已设置的值。

          - **配置缺失时创建**

            - 项目没有 config 文件且用户运行 `xirang update`
            - 命令创建包含 `schema`、`optimization`、`apply` 与 `git` 默认节点的 config 文件
            - 不写入退役的 git 字段（`git.autoCommit`、`commitMessage.convention` 等）

          - **缺失嵌套默认值补齐**

            - config 包含部分用户值且缺少 `optimization.directionLimit` 或 `optimization.directionRetries` 等默认值
            - 命令保留用户值并补齐缺失默认值
        acceptanceCases: []
      - name: 清理退役工作区
        body: |-
          当 update 或 setup 发现退役 workspace 时，SHALL 在用户确认后将其移动到显式 `.xirang/history/legacy-<timestamp>/` entry。

          - **Retired workspace cleanup**

            - 检测到退役 workspace 且用户确认 cleanup
            - 完整移动该 directory 并用 manifest 记录原始相对路径，runtime 不再读取旧 active path

          - **用户拒绝 cleanup**

            - 用户拒绝 cleanup
            - setup/update 失败且不删除或部分移动退役 workspace
        acceptanceCases: []
  relationship-kind:constrains:
    identity: constrains
    body: ""
  relationship-kind:consumes:
    identity: consumes
    body: ""
  relationship-kind:invokes:
    identity: invokes
    body: ""
  relationship-kind:precedes:
    identity: precedes
    body: ""
  relationship-kind:produces:
    identity: produces
    body: ""
  relationship-kind:responsible-for:
    identity: responsible-for
    body: "`responsible-for` 从 Participant 或工作身份指向其承担职责的 Activity 或 Stage。该关系表示职责关联，不表示 source 独占或独自执行 target，也不转移用户、CLI 或其他 Participants 在该过程中的职责。"
  relationship-kind:supports-presentation:
    identity: supports-presentation
    body: "`supports-presentation` 从 Interaction Surface 指向其支持的 View Presentation，表示该交互界面能够通过目标呈现方法向用户传达 Views。该关系不表示排他归属，也不改变 View 的组成方式、呈现视角或规范性依据。"
  relationship-kind:validates:
    identity: validates
    body: ""
  "relationship:agent\0invokes\0deterministic-operations":
    source: agent
    kind: invokes
    target: deterministic-operations
  "relationship:apply\0consumes\0semantic-delta":
    source: apply
    kind: consumes
    target: semantic-delta
  "relationship:apply\0precedes\0review":
    source: apply
    kind: precedes
    target: review
  "relationship:apply-role\0responsible-for\0apply":
    source: apply-role
    kind: responsible-for
    target: apply
  "relationship:archive-role\0responsible-for\0change-closure":
    source: archive-role
    kind: responsible-for
    target: change-closure
  "relationship:change-closure\0consumes\0semantic-delta":
    source: change-closure
    kind: consumes
    target: semantic-delta
  "relationship:change-closure\0invokes\0deterministic-operations":
    source: change-closure
    kind: invokes
    target: deterministic-operations
  "relationship:change-closure\0produces\0semantic-model":
    source: change-closure
    kind: produces
    target: semantic-model
  "relationship:change-formation\0consumes\0semantic-model":
    source: change-formation
    kind: consumes
    target: semantic-model
  "relationship:change-formation\0precedes\0change-implementation":
    source: change-formation
    kind: precedes
    target: change-implementation
  "relationship:change-formation\0produces\0change":
    source: change-formation
    kind: produces
    target: change
  "relationship:change-implementation\0consumes\0change":
    source: change-implementation
    kind: consumes
    target: change
  "relationship:change-implementation\0precedes\0change-closure":
    source: change-implementation
    kind: precedes
    target: change-closure
  "relationship:change-realization\0consumes\0change":
    source: change-realization
    kind: consumes
    target: change
  "relationship:cli\0supports-presentation\0text-presentation":
    source: cli
    kind: supports-presentation
    target: text-presentation
  "relationship:definition-framing\0produces\0change-structural-definition":
    source: definition-framing
    kind: produces
    target: change-structural-definition
  "relationship:delivery-validation\0validates\0framework-identity":
    source: delivery-validation
    kind: validates
    target: framework-identity
  "relationship:design-exploration\0consumes\0change-structural-definition":
    source: design-exploration
    kind: consumes
    target: change-structural-definition
  "relationship:deterministic-operations\0consumes\0change":
    source: deterministic-operations
    kind: consumes
    target: change
  "relationship:deterministic-operations\0consumes\0change-structural-definition":
    source: deterministic-operations
    kind: consumes
    target: change-structural-definition
  "relationship:deterministic-operations\0consumes\0semantic-model":
    source: deterministic-operations
    kind: consumes
    target: semantic-model
  "relationship:deterministic-operations\0produces\0change-structural-definition":
    source: deterministic-operations
    kind: produces
    target: change-structural-definition
  "relationship:deterministic-operations\0validates\0semantic-delta":
    source: deterministic-operations
    kind: validates
    target: semantic-delta
  "relationship:deterministic-operations\0validates\0semantic-model":
    source: deterministic-operations
    kind: validates
    target: semantic-model
  "relationship:explore\0invokes\0deterministic-operations":
    source: explore
    kind: invokes
    target: deterministic-operations
  "relationship:explore\0precedes\0propose":
    source: explore
    kind: precedes
    target: propose
  "relationship:explore-role\0responsible-for\0explore":
    source: explore-role
    kind: responsible-for
    target: explore
  "relationship:framework-identity\0constrains\0workspace-init-update":
    source: framework-identity
    kind: constrains
    target: workspace-init-update
  "relationship:metamodel\0constrains\0hierarchical-elements":
    source: metamodel
    kind: constrains
    target: hierarchical-elements
  "relationship:metamodel\0constrains\0relationships":
    source: metamodel
    kind: constrains
    target: relationships
  "relationship:optimization\0consumes\0change":
    source: optimization
    kind: consumes
    target: change
  "relationship:optimizer\0responsible-for\0optimization":
    source: optimizer
    kind: responsible-for
    target: optimization
  "relationship:post-propose-validation\0invokes\0deterministic-operations":
    source: post-propose-validation
    kind: invokes
    target: deterministic-operations
  "relationship:project-build-role\0responsible-for\0semantic-model-build":
    source: project-build-role
    kind: responsible-for
    target: semantic-model-build
  "relationship:propose\0consumes\0change-structural-definition":
    source: propose
    kind: consumes
    target: change-structural-definition
  "relationship:propose\0invokes\0deterministic-operations":
    source: propose
    kind: invokes
    target: deterministic-operations
  "relationship:propose\0precedes\0apply":
    source: propose
    kind: precedes
    target: apply
  "relationship:propose-role\0responsible-for\0propose":
    source: propose-role
    kind: responsible-for
    target: propose
  "relationship:quality\0validates\0change-implementation":
    source: quality
    kind: validates
    target: change-implementation
  "relationship:review\0consumes\0change":
    source: review
    kind: consumes
    target: change
  "relationship:review\0precedes\0optimization":
    source: review
    kind: precedes
    target: optimization
  "relationship:review\0validates\0change-implementation":
    source: review
    kind: validates
    target: change-implementation
  "relationship:reviewer\0responsible-for\0review":
    source: reviewer
    kind: responsible-for
    target: review
  "relationship:semantic-delta\0constrains\0apply":
    source: semantic-delta
    kind: constrains
    target: apply
  "relationship:semantic-model-build\0consumes\0change-structural-definition":
    source: semantic-model-build
    kind: consumes
    target: change-structural-definition
  "relationship:semantic-model-build\0invokes\0definition-framing":
    source: semantic-model-build
    kind: invokes
    target: definition-framing
  "relationship:semantic-model-build\0produces\0semantic-model":
    source: semantic-model-build
    kind: produces
    target: semantic-model
  "relationship:snack\0invokes\0deterministic-operations":
    source: snack
    kind: invokes
    target: deterministic-operations
  "relationship:snack\0precedes\0quality":
    source: snack
    kind: precedes
    target: quality
  "relationship:snack-role\0responsible-for\0snack":
    source: snack-role
    kind: responsible-for
    target: snack
  "relationship:user\0constrains\0agent":
    source: user
    kind: constrains
    target: agent
  "relationship:web\0supports-presentation\0visual-presentation":
    source: web
    kind: supports-presentation
    target: visual-presentation
-->
