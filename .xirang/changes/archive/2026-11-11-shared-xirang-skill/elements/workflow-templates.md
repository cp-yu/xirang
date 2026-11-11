---
entity: element-declaration
identity: workflow-templates
kind: "element"
parent: "agent-workbench-projection"
title: "Workflow Templates"
definition: "Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、Quality 模板对 subagent 使用明确 delegation 指令、Review/可选 Opt/Seal 状态投影、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。"
---

## ADDED Sections

### Section: 阶段选择与公共指导复用

Workflow templates SHALL 支持公共入口与阶段入口双向进入。用户只加载 `xirang-common` 后用自然语言声明阶段或表达对应工作意图，Agent SHALL 判断并读取相应阶段 skill；用户直接加载阶段 skill 时，Agent SHALL 补充加载尚未取得的 common。公共与阶段入口 SHALL NOT 循环加载：已选阶段在补读 common 后保持，继续当前阶段。

同一 Agent、同一项目且指导仍在有效上下文中时，Agent SHALL 跨阶段复用公共内容与专项指导，只补读新增需求；新 Agent、必要上下文丢失或指导更新时重新取得所需内容。仅有“曾读过”的摘要而必要正文不可用时，不得认为已具备指导。静态协议复用 SHALL NOT 取消当前 Record、模型、配置、Git 与 Quality 状态的适用门禁。

自然语言请求 SHALL 可用于进入后续阶段，交接提示不得将手动调用 skill 作为唯一入口。Agent SHALL 按用户意图选择阶段，继续执行该阶段的准备条件、设计确认及验证门禁；读取 skill 本身不授权跳过门禁或自行扩大工作范围。

- **自然语言探索**：用户只加载 common 后说“探索一下这个需求”或“进入 Explore”，Agent 读取 Explore 并开展探索，不要求再次手动调用 Explore。
- **直接进入**：用户直接加载 Explore 且缺少 common，Agent 补读 common 后继续 Explore，不重新选择阶段或回读已具备的 Explore。
- **连续切换**：Explore 后用户要求形成 Change，Agent 读取 Propose 并复用仍有效的 common，专项指导只补缺；Propose 的准备和确认门禁仍生效。
- **失效补读**：新的独立 Agent、必要上下文丢失或指导更新后，重新取得所需内容，不全量预加载无关 references。
- **门禁未满足**：用户已表达进入阶段的意图但缺少该阶段必须确认的决策时，按阶段规则处理缺口，不能以路由成功代替语义就绪。

## MODIFIED Sections

### Section: Workflow Skills 声明 Internal Subagents 约束

Workflow skill instructions SHALL 声明 common 前置依赖，并保留自身职责、阶段动作、停止或确认条件、输出交接与专项指导加载入口。完整公共规则由 common 或唯一专项 reference 承载，阶段正文只保留触发条件和必要提醒，不扩写另一份 Philosophy。

Reviewer 与 Optimizer 的完整角色定义、判断标准和输出合同 SHALL 由对应 generated agent artifact 承载。

- **Explore 结构**：入口取得 common，保留只读工作边界、模型导航及设计循环的按需入口，不重复完整 brainstorming flow。
- **Apply 结构**：入口取得 common，保留 Flow Outline 与 Implementation Discipline，流程步骤指向适用的 `.xirang/references/xirang-apply-step-<N>-<name>.md`。
- **任务指导一致**：Propose、相关 artifact references 与 Apply SHALL 一致规定 tasks.md 只表达实施目标、Contract 引用及验证方向，不写测试动作；测试复用、修改、新增、删除与执行方式由 Apply 依据当前项目动态决定。

### Section: 内部 subagent 引用替换内联 fragment

quality/apply/archive 三个模板中 delegate to reviewer subagent 的步骤 SHALL delegate to `xirang-reviewer`；delegate to optimizer subagent 的步骤 SHALL delegate to `xirang-optimizer`。Reviewer 与 Optimizer 的完整角色定义、判断标准和输出合同 SHALL 由对应 generated agent artifact 承载。Explore SHALL NOT delegate impact discovery to an internal subagent，而通过 `xirang arch search` 与 `xirang arch impact` 获取 Formal Semantic Model context。

- **Apply 模板 delegate to reviewer agent**

  - apply 模板执行 Review
  - 模板 SHALL 指示顶层 agent delegate to the clean-context reviewer agent with `context: "fresh"`
  - agent 的审查维度和判定标准 SHALL 由 reviewer agent 自身 prompt 定义

- **Explore 模板使用 CLI 影响面查询**

  - explore 模板被生成
  - semantic impact behavior SHALL 直接引用 `xirang arch search` 与 `xirang arch impact` CLI command surface
  - SHALL NOT 生成或引用第三个 internal subagent

- **Apply 模板 Optimization 的 optimizer agent**

  - apply 模板执行 Optimization 循环
  - 模板 SHALL 指示主 agent delegate to the clean-context `xirang-optimizer` agent with `context: "fresh"`
  - SHALL 传递 Review 结果、artifacts、文件内容、config 和失败方向

- **Workflow Skills 声明 Internal Subagents 约束**

  - workflow skill 模板被生成
  - instructions SHALL 声明 common 前置依赖，并按当前有效上下文取得公共指导
  - Reviewer 与 Optimizer 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中

### Section: 统一加载协议与优雅降级

Core workflows SHALL 使用同一无状态 Semantic Model loading protocol：`arch outline` 默认返回完整 Element hierarchy 导航，按显式选项展开 Element Definitions、Relationships 与 Metamodel；`arch impact` 默认返回 focus、refinement context、相关 identities 与必要关系摘要，canonical paths 按显式选项展开；batch `arch query` 返回显式 identities 的完整 Declarations 与可选 Contracts。`arch snapshot` SHALL 保留为完整 Declaration、Relationships 与 Metamodel 结构工具，不包含 Contracts，且不作为默认 Agent onboarding command。Semantic Model 缺失或不完整时，只读 workflow MAY 使用部分 context 继续并声明不可用；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。

普通探索按 `arch search --limit`、`arch outline`/`arch impact`、`arch query`、`arch query --contract` 渐进读取。仅当整体模型理解丢失、上下文压缩、长会话切换或明确需要全局结构诊断时，才显式扩大到完整结构投影或 snapshot。读取减少不得弱化已选语义的完整性：选定 Declaration 与 Contract 必须原样完整返回，不摘要、不截断、不改写。Explore、Propose、Apply 与 Reviewer SHALL 按需读取同一测试品质 reference；Build、Propose 与 Snack SHALL 按需读取同一 Element Contract 语义 reference（含 Acceptance Case 行为纪律），复用当前上下文中仍有效的内容，不在各入口内联完整正文。

- **默认导航与按需展开**

  - workflow 需要定位语义或影响范围
  - 默认使用层级导航与局部影响摘要
  - 只有需要判断具体完整语义时才调用显式 identity query

- **全局结构恢复**

  - 整体模型理解不清、怀疑上下文已丢失或需要全局结构诊断
  - 显式请求需要的 outline projection，必要时运行 `arch snapshot`
  - 普通探索不默认加载完整结构与 Contracts

- **完整语义不猜测**

  - Definition 或 Contract 未在当前权威读取中出现
  - 使用 `arch query` 重新读取对应 identity
  - MUST NOT 根据 identity、title、旧摘要、残余对话上下文、impact identity 或 implementation evidence 猜测语义

- **源模板与生成面一致**

  - workflow instructions 发生变更
  - 受管生成 surface 与 source template SHALL 同步，并由行为测试验证读取路由和 fail-closed 边界
