---
entity: element-declaration
identity: skill-generation
kind: capability-specification
parent: agent-workbench-projection
title: 公共与阶段 Skill 交付
definition: 公共与阶段 Skill 交付是息壤工作指导面向用户 Agent 的投影契约。它独立承载 common 与六个阶段的入口、内容分工、配置和语义读取、按需指导、阶段行为及合法 frontmatter；共享生成与同步由工作面整体负责，内部角色和专项 reference 的完整内容由各自交付能力承担。
---

## Specification

### Section: Scope and Non-goals

公共与阶段 Skill 交付 SHALL 提供 common 及六个用户阶段的合法 skill 制品、入口和工作指导，组织公共依赖、阶段行为及按需协议。内部角色完整定义和专项 reference 内容由对应交付能力承担；共享同步与工具适配由工作面整体负责。

### Section: Business Logic

Propose、Snack 及共享差量写作入口 SHALL 以 `semantic-delta` 标识完整 Semantic Delta，读取项目根 `.xirang/references/xirang-artifact-semantic-delta.md`，并通过 `config project --artifact semantic-delta` 取得适用规则。制品依赖及完成状态使用同一身份。

Skill 交付 SHALL 联合组织公共入口、阶段动作和按需指导，使独立入口获得所需依据并保留适用工作边界。

#### 入口、公共内容与复用

common SHALL 交付英文 Philosophy，表达结构化人类意图、统一 Semantic Model、Change 的目标状态及 Plan 的辅助角色、关键语义决策完整性和 Agent 依意图落实项目。该定义片段不承载真实编译器管线、语法细则或阶段执行步骤，不受制品 proseLanguage 覆盖。

用户只加载 common 并表达阶段意图时，Agent SHALL 读取相应阶段 skill；直接加载阶段时补齐缺失 common，保留已选阶段。阶段正文保留职责、动作、输入权威、停止/确认条件及输出交接，完整规则仅在负责的 common/reference 维护，入口保留触发和必要提醒。自然语言可用于进入后续阶段，不要求用户手动调用 skill；路由不取消适用门禁。

同 Agent、同项目且指导仍有效可用时跨阶段复用；新 Agent、必要正文丢失或指导变化时取得所需内容。独立 Reviewer/Optimizer 从各自上下文判断公共依据是否可用，保留受托角色及权限，不重新选择用户阶段。主 Agent 已读不等于子 Agent 已读。

#### 配置与模型读取

common SHALL 直接包含配置使用规则和 `xirang config project --select context --json` 入口；加载后读取项目背景，同项目当前内容未变可复用，自行修改、换项目或上下文丢失后重读。不重解 raw YAML；proseLanguage/context、canonical tokens、附加且匹配的 rules 和按需 Apply/Archive 配置依各自作用域生效。

用户请求修改配置时 SHALL 按需加载项目根 xirang-configuration-edit.md，取得授权范围、长期/本次、字段选择、内容保留、重读校验与简短报告规则；此入口不授予只读角色写权限。

模型导航 SHALL 按有限 search 候选、outline 整体层级、impact 局部影响和显式 identities 的 query/query --contract 展开。读取仅涵盖当前决策需要的对象，完整 Declaration/Contract 不摘要、不截断、不从名字或代码猜测。不批量 query 全部 impact 结果；snapshot 保留给必要全局诊断，默认 onboarding 不使用它。整体理解丢失时先恢复 outline，具体语义缺失时查询其 identity。

Agent 阅读优先请求范围完整且紧凑的文本，程序需精确字段时使用 JSON，不假定两者信息等价。扩大读取前说明具体问题，代码/测试先定位拥有行为的符号或用例，再读必要范围。并发只用于独立小查询，不输出过量原始嵌套 JSON。

#### 分解与阶段工作

Build/Explore/Propose/Snack 仅在形成或重组 hierarchy 时，通过 `config project --select decomposition --json` 取得有效方法并完整读取；普通 Contract-only 工作不加载它。框架父子精化、同级 MECE、广度优先和用户授权纪律由 semantic-authoring 承载，项目方法决定具体分解维度；不要求每层机械等待确认。

创建或修改项目方法时，common SHALL 路由到 decomposition-authoring 指导；方法是项目维护的独立 Markdown，通过 decomposition 选择。日常使用方法不预加载编写指南，不修改受管默认文件替代自定义方法。

Build SHALL 确定探索范围与权威依据，编写 build.md 和四分区 Candidate，使用 candidate validate 并经用户确认提升；不依赖内部 Agent 可用性。Apply 按目标模型、任务与当前代码实施；Propose/Apply 的 tasks 以 Goals、Contract、Verify 对齐，具体测试工作由 Apply 决定。适用工作身份按需读取测试质量和语义写作指导，复用有效内容。

Snack SHALL 明确适用于已发生代码变化，可接收显式 Change 名或检测活动 Change。证据包括 conversation context、working-tree、staged、HEAD 及用户指定 commit/range；对照模型识别影响和 Contract 覆盖，按缺失、陈旧、不一致或已一致状态有条件地调和 proposal、design、Semantic Delta，不生成 tasks.md，已一致内容不重写。描述与正文均须表达此边界。

#### 生成与验证

skill 的 name、description、license、compatibility、metadata SHALL 写为合法 YAML 字符串，解析后保持模板值。源模板、工具投影与行为验证一致；不以自然语言全文、标题顺序或字节快照代替关键协议、门禁和禁止操作的验证。

上下文优化 SHALL 先取消无必要调用和读取，再删无用回执与重复内容，再缩小范围，最后选择紧凑表示。相同任务目的和场景比较 stdout/stderr、文件读取及累计开销，未运行 tokenizer 不报告 token 节省；不把同量内容从 CLI 搬到文件当收益。行为比较控制模型和设置，覆盖重复及不同场景，检查产物、加载、暂停、返工、耗时与可得 token；必要语义或确认缺失属于回归。

### Section: Edge Cases and Exception Handling

指导 SHALL 对实际缺口采用下列边界：缺少 context 不制造要求，查询失败报告且不伪称成功，不引入监听；无法读取配置选中的分解方法时停止结构工作，不替换方法。模型缺失/无效时，只读探索可声明限制并使用部分证据，编译或写入语义的工作不得视为空完整模型。

来源或目标变化、相关 drift、状态未知及上下文丢失 SHALL 触发所需当前依据重读；普通阶段复用不取消 Record、模型、配置、Git 或 Quality 检查。读取输出被截断时缩小或分批取得缺失内容，不能当作完整证据。缺少实质用户决策时停在适用确认点，已进入阶段不代表获得决定授权。生成 frontmatter 含特殊字符时必须仍可解析，不能以表面无引号文本假定正确。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 双向入口不循环

只加载 common 后说“进入 Explore”：加载 Explore。直接加载 Explore 且 common 缺失：补读 common 后继续 Explore，不重新路由或要求用户手动补调。

#### Acceptance Case: 阶段复用与新 Agent

同项目从 Explore 到 Propose，公共指导仍有效则只补新增需求；fresh Reviewer 独立取得自己的公共依据，保持只读角色。

#### Acceptance Case: 配置按需消费

进入 Explore 后读取 context，不无条件加载 Apply 隔离或 Archive Git；用户请求修改配置才加载 edit reference。

#### Acceptance Case: 分解方法与缺口

Contract-only 修改不读分解方法；结构工作取得配置路径后文件不可读，则停止该工作；用户创建方法时加载编写指南并保存独立项目文件。

#### Acceptance Case: 渐进模型读取

impact 返回多个身份时，只 query 当前判断需要的完整语义；整体上下文丢失时恢复 outline，输出截断时取得缺失内容，不用旧摘要补猜。

#### Acceptance Case: Snack 证据和条件调和

仅有 staged 变更时也能定位影响；制品与实现、模型一致时不重写，缺失语义时形成 Delta；任一情形都不生成 tasks.md。

#### Acceptance Case: 合法 Frontmatter

description 含 sync:、双引号或换行，在 setup/update 交付的 YAML 中可解析，字段值与原模板语义一致。
