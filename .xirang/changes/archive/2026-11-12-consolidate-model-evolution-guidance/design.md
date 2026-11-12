## Context

本 Change 复用用户已接受的整合稿，处理模型演进、阶段决策与分解方法之间的重复提示词。当前配置支持项目方法路径与 reference 裸名称，四个结构形成阶段已经加载共享语义指导，可以复用该路径承载框架纪律。静态文本变短尚未证明实际交互或模型质量改善。

## Goals / Non-Goals

**Goals:**

- 使局部模型组织与需要用户裁决的实质选择具有一致、可执行的边界。
- 允许受影响 Declaration 与 Contract 按目标层级重组表达，同时保持应有语义和用户权限。
- 让框架基础、具体方法、方法加载和创建指南分别由明确位置负责，减少实际加载链中的重复规则。
- 用生成回归和实际 Agent 行为分别验证交付、授权边界、语义保持及运行成本。

**Non-Goals:**

- 不改变模型 identity、Delta 记法、decomposition 配置解析、默认值或六阶段工作流集合。
- 不自动重组本项目 Semantic Model 的 hierarchy，不以新增 reference 为由新增 Element。
- 不放宽 Build 的 Candidate 提升、Propose 的最终 Change 接受、Design Record 修订或其他工作流授权门槛。
- 不重写无关任务、Quality 或实现指导，不以固定文字快照代替行为判断。
- 不为退役的指导入口提供 CLI 兼容转发或对既有工作区进行自动清理；不改变跨平台路径正确性或用户文件所有权保护。

## Decisions

### 1. 保持阶段分工，集中决策规则

Explore 的概念影响段只负责澄清影响目标、范围或方案的选择，携带已确认边界与 Definitions。Propose 的 Documentation and gap handling 完整规定自主处理与实质选择边界；Readiness boundary 只负责写入前实际检查，Flow 保留取证、编写、回查与审阅动作。

不采用逐个重复位置追加同义提醒的方法，也不新增独立决策 reference。需要用户裁决的选择依旧先确认；有依据的局部组织无需唯一答案。真正存在 blocker 时不先写已定部分，用户明确 override 也不提供缺失决策。

Propose 的具体组织如下：

- 在 Local detail and faithful writing 中纳入局部模型组织权限，保留分支、默认值、错误结果与来源对照的具体检查。
- 删除 Confirmed design inputs 中重复的返回 Explore 条件，以及 Flow3 中再次展开的决策/override 规则；保留 Readiness boundary 的实际入口与权限。
- 删除 Flow5 的整段逐 sibling set 确认和重复方法加载说明；结构对照动作保留。
- 在 Drafting and user review 集中包含结构差异、理由与语义影响。
- Flow7 只负责制品齐备后的适用草稿审阅。
- Flow8 同时接受用户确认决定和允许自主完成的局部模型组织作为范围变化的来源，并同步 Delta 与 Plan；不把写入 design 当作用户确认。
- Closing gate 保留来源到目标、目标到来源、机制序列与 CLI 校验等不同动作，删除再次解释自主修正/用户裁决的纯重复句。

### 2. 框架基础并入共享语义指导

semantic-authoring 保留现有 Definition、Contract、Section、父级本层完整性及同层去重规则。开头使用以下已确认统一检查原则：

> When the model changes, review affected Elements' Declarations and Contracts in the target model context. Revise them as needed to maintain semantic consistency and express complete, appropriate semantics at each abstraction level without redundant repetition.


沿用原文的条件调整为：

> Reuse accurate existing wording where it remains appropriate in the target model; revise only affected content.

父子精化、单维度 MECE 与 BF 集中在该共享指导的 Hierarchy formation 部分：

> Project decomposition guidance specializes parent-to-child semantic refinement within these framework constraints; it does not override confirmed intent, model semantics, or the current workflow's decision and authorization rules.
>
> Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and work breadth-first: form and check each complete sibling set before refining its children. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.

MECE 限定于所选维度和确认范围，BF 规定形成及检查顺序；它们不取消父子必要覆盖，也不增加逐层用户审批。源码可以按职责拆出常量，最终只有一个完整承载位置。

### 3. 方法加载保持短入口

各结构形成阶段复用同一个 DECOMPOSITION_ENTRY：

> Before forming or reorganizing a hierarchy, read and follow the complete guidance resolved by `xirang config project --select decomposition --json`; stop if it is unavailable.

common 的按需表提供方法选择和自定义方法创建的发现入口，不再复述完整加载协议。已加载且仍有效的静态指导继续复用；独立 Agent 仍取得自身所需上下文。

### 4. 默认方法与项目方法保留具体分解选择

默认方法的完整目标正文为：

~~~markdown
# Semantic Refinement

Use this default method when selected by `decomposition`, within the constraints of `.xirang/references/xirang-semantic-authoring.md` and the current workflow's decision and authorization rules.

1. Identify the current abstraction from domain concepts, capabilities, or user goals, and choose a decomposition dimension for its children.
2. Express semantic category through `project`, `element`, and `perspective` rather than prescribing levels. A Perspective must have a real semantic boundary that needs child refinement; when grouping merely presents the same set of concepts, use a View instead of duplicating Elements or Contracts.
3. Express cross-view collaboration, dependency, or constraint as typed Relationships. Extend the Metamodel only when genuinely shared semantics cannot be expressed accurately by an existing Kind.
4. Refine to the point where the model can be understood and decided on; C4's fixed technical levels and any fixed number of levels are not required.

Return the resulting model design and any unresolved decisions to the current workflow.
~~~

本项目方法保留其 frontmatter、顶层边界和两个 Realization Perspectives 的完整正文；原“分解纪律：MECE 精化树”整段删除。开头统一为：

> 本方法在 `.xirang/references/xirang-semantic-authoring.md` 的框架约束和当前 workflow 的决策与授权规则下，通过 Perspective 确定本项目的分解维度。

用户已确认的项目特有内容不变：semantic-objects/realization 两个顶层维度，realization-process/collaboration-structure 两个 Realization Perspectives，以及 Perspective 的规范性身份和跨视角 Relationships。

### 5. 创建指南独立按需交付

common 的 referenceFiles 增加 decomposition-authoring，并在按需表添加创建或修改项目 decomposition 的入口。完整目标正文为：

~~~markdown
# Custom Decomposition Guidance

Before creating or revising project decomposition guidance, read `.xirang/references/xirang-semantic-authoring.md` and follow its framework constraints.

Describe how the project selects decomposition dimensions, identifies meaningful Element boundaries, and decides when further refinement is useful. Use project examples where they clarify the method.

Store the guidance in a project-maintained Markdown file and select it through `decomposition`: use a project-root relative path, or a bare name resolved under `.xirang/references/` (`.md` is appended when absent). Use a separate file rather than editing the framework-generated default guidance.
~~~

不要求创建固定模板，不把本项目 Perspective 选择写入通用指南。使用独立项目文件避免更新覆盖默认方法时丢失用户定制；既有路径和裸名称机制足够，无需新 CLI 或配置字段。

### 6. 直接退役旧指导入口

移除 decomposition-use 的 referenceFiles 条目和所有受管引用；不新增对 xirang-decomposition-use.md 的自动删除，既有工作区中的旧文件留待用户与 Agent 按需处理。新指导按现有显式清单交付，不增加旧入口或转发别名；保留项目方法、用户文件及显式配置。

物理文件路径通过 Node.js path API 构建。文档中的项目相对逻辑路径继续采用现有 canonical 记法；配置解析不改变。生成与回归验证覆盖 Windows CI 及 macOS/Linux，并检查既有文件不被本次更新删除、引用可达性和新文件交付，不能用 Linux 本地通过冒称 Windows 已验证。

### 7. 确立 CLI 的兼容边界

Project Root 继续承诺确定的 CLI 入口、工作流与验证门槛，但“稳定的 CLI”不暗示旧用法跨版本有效。Framework Identity 明确允许 CLI 更新时直接改变旧用法，不作向后兼容保证；升级适配由用户与 Agent 协作，不因旧用法添加 CLI 兼容层。此原则不要求每次更新都破坏兼容性，也不改变与版本兼容无关的跨平台正确性及用户文件保护。

### 8. 验证交付与实际行为

生成回归复用现有模板及 shared reference 安装/同步测试，重点验证入口可达、按需加载、旧入口不再生成或引用、新文件交付与既有文件不被本次更新删除；旧普通措辞断言按职责变化调整，不新增整段自然语言快照。协议 token、停止条件与禁止操作仍需覆盖。

实际 Agent 验证使用相同模型/设置、任务与评价依据进行可比执行，覆盖同场景重复和不同场景：有依据的局部组织继续推进，实质承诺变化先询问，父子细化保持父级本层承诺，合并/删除 Element 或 Section 正确承接语义，项目方法遵守框架且 BF 不形成逐层审批。结果以真实产物与轨迹为依据，保留失败；不以模型自述或模板含某句话代替证据。

比较实际加载的 skill/reference、stdout/stderr、工具调用、无必要暂停、返工、耗时与可取得的 token 数据。未运行 tokenizer 时只报告字符/字节，不设固定节省比例；相同内容换文件不算收益。若质量回归，先判断删去了必要规则还是只是提醒位置失效，再局部修正，不通过恢复全部重复段落掩盖问题。

#### One-time Verification

构建、类型检查、生成面与源码一致性、旧引用残留及机制走查用于本次证据；无需为单纯说明性措辞维护永久测试。当前静态比较仅来自内存稿：Propose 自身正文 26146→24161 字符，默认方法 3553→1096，本项目方法 1601→1044，共享语义指导 3912→4759，新创建指南 684。统计不是端到端 token 或行为收益。

## Risks / Trade-offs

- 集中规则后，遗漏加载会使约束不可见 → 保留独立入口与当前指导复用规则，检查实际加载轨迹和引用可达性。
- 把表达调整误认为职责变更授权 → 保留统一实质决策门槛，使用父子细化、语义移除与多种合理组织方案的正反场景验证。
- 只按字符缩短评价优化 → 以结果正确性和权限为前提，观察整个运行成本；未验证的收益明确保留为证据缺口。
- 项目方法有自己的旧确认文字 → 本项目方法与默认方法同步对齐框架纪律，保留项目特有内容；其他项目不自动改写用户文件。

## Migration Plan

按既有受管清单交付新指导并停止生成、引用旧入口，刷新各工具投影及本仓库受管工作面；不新增自动清理既有旧文件的逻辑。出现引用或生成回归时，在当前 Change 范围内修正相应生成源与登记后重新同步，不修改项目自定义方法的所有权。

## Open Questions

无影响目标设计的未决选择。实际 Agent 行为和效率结果、Windows CI 运行结果均待实施阶段取得；不把设计接受或 CLI 制品校验视为这些验证已经通过。

## 已确认的局部实现文本

这些文本属于已确认实现策略，配合上述规则归属整合使用；不得把早期逐处候选再叠加到最终稿。具体规范语义以 Delta 为准，普通英文措辞不作为新增业务验收断言。

### Propose

- 定位原句起始："Before creating or updating Change artifacts, check whether any unresolved decision affects this target. If on"

~~~text
Before creating or updating Change artifacts, apply Documentation and gap handling to identify decisions requiring user judgment. Complete the necessary read-only discovery and permitted record maintenance, then stop for any unresolved decision affecting this target.
~~~

- 定位原句起始：" Local decisions and record revisions can stay in Propose; practical feasibility experiments or substantial re"

删除该处重复句；其义务由前述唯一负责位置承载。

- 定位原句起始："Independently handle minor details within the agreed scope and approach, case organization, and expression or "

~~~text
Independently resolve local model organization from confirmed intent and modeling rules, handle minor details within the agreed scope and approach, organize cases, and correct expression or derivation errors; preserve the user's clear wording when it remains appropriate in the target model.
~~~

- 定位原句起始：" Resolve any material decision before authoring content that depends on it."

删除该处重复句；其义务由前述唯一负责位置承载。

- 定位原句起始："Preserve artifact dependency order while using these review units."

~~~text
Include structural changes, their rationale and semantic impact in draft review. Preserve artifact dependency order while using these review units.
~~~

- 定位原句起始："   - If readiness is incomplete, list the concrete missing items and use Documentation and gap handling: confi"

~~~text
   - If readiness is incomplete, report the concrete gaps and apply the Readiness boundary.
~~~

- 定位原句起始："   - Do not redo confirmed structural decisions. A partial record leaves room for unconfirmed structure: when "

删除该处重复句；其义务由前述唯一负责位置承载。

- 定位原句起始："   - When Architecture Source is `None`, do not invoke decomposition guidance or invent hierarchy changes.\n"

删除该处重复句；其义务由前述唯一负责位置承载。

- 定位原句起始："7. Continue until all `applyRequires` artifacts are done, applying Documentation and gap handling to newly dis"

~~~text
7. Complete the applicable whole-draft or mechanism-group review once all `applyRequires` artifacts are done.
~~~

- 定位原句起始："If a user-confirmed decision recorded in Design changes structural impact across Declarations, refinement, Rel"

~~~text
If confirmed decisions or permitted local model organization change structural impact, update proposal source scope and reconcile the affected Delta and Plan. Writing a choice in Design does not itself confirm it.
~~~

- 定位原句起始：" Correct source-determined writing errors yourself; when a substantive decision is needed, present all finding"

删除该处重复句；其义务由前述唯一负责位置承载。

- 定位原句起始：" Repair expression or derivation errors without changing confirmed decisions; otherwise use Documentation and "

删除该处重复句；其义务由前述唯一负责位置承载。

- 定位原句起始："handle minor details within the agreed scope and approach, organize cases, and correct expression or derivatio"

~~~text
handle minor details within the agreed scope and approach, and correct expression or derivation errors;
~~~

- 定位原句起始：" Disclose permitted minor additions with their basis and locations at completion."

删除该处重复句；其义务由前述唯一负责位置承载。

### Explore

定位原句起始："Assess Declaration/Definition impact only when concept identity or scope changes, and carry the comp"

~~~text
When concept identity or scope changes, resolve choices affecting the goal, scope or approach and carry confirmed boundaries and Definitions into the Summary. Propose may complete local model organization and target Definitions from that basis.
~~~

定位原句起始："Resolve contradictions, vague boundaries, and target-affecting pending choices."

~~~text
Resolve contradictions and target-affecting choices requiring user judgment.
~~~
