---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、Quality 模板对 subagent 使用明确 delegation 指令、Review/可选 Opt/Seal 状态投影、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。
---

## Specification

### Section: 模板不内联 subagent 角色定义

quality/apply/archive 模板 SHALL NOT 在模板 body 中内联 reviewer 或 optimizer 的完整角色定义、验证协议、判断标准或输出格式。这些内容归对应的 generated internal subagent artifact 所有。模板 SHALL 保留 orchestration 职责描述：依据 Git commit 组装证据、subagent delegation、opinion payload 校验、Quality JSON 持久化、主 Agent 处置与 Seal；MUST NOT 要求 Quality checkpoint、自动 task writeback 或 freshness manifest。

### Section: 统一 CLI 查询接口

Core workflow templates SHALL 使用 `xirang arch search` 定位未知概念候选，使用 `xirang arch outline` 获取默认层级导航，使用 `xirang arch impact` 获取默认局部影响摘要，并使用 batch `xirang arch query` 读取显式 Elements 的完整 Declaration 与 owned Contracts。完整读取 SHALL 只覆盖当前决策需要的显式 identities；不得自动 query impact 的全部 identities。需要全局结构诊断时 MAY 使用完整 `arch snapshot`，但不得作为普通 Agent onboarding command。需要校验全体 Element Contracts 时 SHALL 使用 `xirang validate --contracts`；MUST NOT 引用退役 spec commands 或已移除的 query navigation options。

- **渐进读取选定语义**

  - Propose 或 Explore 模板被加载
  - 指导 Agent 先用 `arch search --limit`，再按需用 outline/impact、query 与 query --contract 展开
  - query 仅包含需要完整语义的显式 identities

- **Apply 保留必要完整读取**

  - Apply task 涉及特定 Element
  - 使用 `arch impact` 发现相关范围，再对需要实现或验证的 identities batch query 完整语义

- **Optimizer 按需读取 Relationship 端点**

  - Optimizer 展开 directed semantic Relationships
  - 使用 impact 获得 identity 与关系范围，按需 batch query 选定 identity，不要求 impact 返回完整语义

### Section: 固定工作流模板集合

WorkflowManifestRegistry SHALL 恰好包含六个 user workflows：propose、explore、apply、archive、build 和 snack。Registry SHALL NOT 包含退役的 build 工作流。

- **Registry 包含 Project Build**

  - 查询 workflow manifest
  - SHALL 包含 workflow ID `build`，其 skill name 与 directory 均为 `xirang-build`
  - SHALL NOT 包含退役 build 名称

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
  - instructions SHALL 以共享 Xirang Philosophy 开头
  - Reviewer 与 Optimizer 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中

### Section: Workflow Skills 声明 Internal Subagents 约束

Workflow skill 模板的 instructions SHALL 以共享 Xirang Philosophy 开头；具体 authoring、canonical syntax 与 gate 规则 SHALL 由对应 workflow surface 声明，不得重新扩写项目哲学。Reviewer 与 Optimizer 的描述和约束 SHALL 放在对应 subagent 自身的 agent prompt 中。

- **Explore skill 的 instructions 结构**

  - explore skill 被生成
  - instructions SHALL 包含 Xirang Philosophy、只读 workflow stage、Required References、Hard Rules、Required Context、Semantic Impact 与唯一 Brainstorming Checklist
  - SHALL NOT 重复完整 brainstorming flow

- **Apply skill 的 instructions 结构**

  - `getApplyChangeSkillTemplate()` 生成 apply skill instructions
  - instructions SHALL 以 Xirang Philosophy 开头，后接制品定义先行写作规则、Flow Outline 和 Implementation Discipline
  - 每个流程步骤 SHALL 指向独立的 `.xirang/references/xirang-apply-step-<N>-<name>.md` 文件

### Section: apply skill SHALL 读取架构上下文

Apply skill SHALL 指导 Agent 通过 outline 理解 Target Semantic Model 的整体结构，通过 impact 发现 affected Elements 的 abstraction/refinement 与 semantic Relationship identities，再通过 batch query 读取显式 Elements 的完整 Declarations 与 owned Contracts。

- **查询受影响 elements**

  - Agent 开始 apply task 且 task 涉及特定 Element
  - SHALL 运行 `xirang arch impact <elementId> --depth 2 --json`
  - SHALL 对需要实现或验证的 identities 运行 batch `xirang arch query <identities...> --contract --json`

- **从 Project Root 建立整体上下文**

  - task 的局部 Element 缺少足够 context，或 Agent 怀疑整体认知已丢失
  - Agent SHALL 重新运行 `xirang arch outline --format json`
  - SHALL 使用完整 hierarchy 回溯到足以解释 intent 的 abstraction，再按需 query 更深 Element

- **读取 element-owned Contracts**

  - query 返回显式 identities 的 Contracts
  - Agent SHALL 将每个 Contract 解释为对应宿主 Element 单元中的完整 Sections
  - MUST NOT 依赖 metadata、impact payload 或未显式请求对象

- **语义优先的实现流程**

  - Agent 开始实现 task
  - SHALL 依次使用 outline 恢复必要整体认知、impact 发现 affected identities、query 读取选定 Definitions/Contracts、解释 relevant semantic Relationships、使用 CodeGraph 或 ACE/`rg`/`read` 获取 current implementation evidence，再开始编码
  - code evidence MUST NOT 静默覆盖 approved Semantic Delta

### Section: 统一加载协议与优雅降级

Core workflows SHALL 使用同一无状态 Semantic Model loading protocol：`arch outline` 默认返回完整 Element hierarchy 导航，按显式选项展开 Element Definitions、Relationships 与 Metamodel；`arch impact` 默认返回 focus、refinement context、相关 identities 与必要关系摘要，canonical paths 按显式选项展开；batch `arch query` 返回显式 identities 的完整 Declarations 与可选 Contracts。`arch snapshot` SHALL 保留为完整 Declaration、Relationships 与 Metamodel 结构工具，不包含 Contracts，且不作为默认 Agent onboarding command。Semantic Model 缺失或不完整时，只读 workflow MAY 使用部分 context 继续并声明不可用；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。

普通探索按 `arch search --limit`、`arch outline`/`arch impact`、`arch query`、`arch query --contract` 渐进读取。仅当整体模型理解丢失、上下文压缩、长会话切换或明确需要全局结构诊断时，才显式扩大到完整结构投影或 snapshot。读取减少不得弱化已选语义的完整性：选定 Declaration 与 Contract 必须原样完整返回，不摘要、不截断、不改写。Explore、Propose、Apply 与 Reviewer SHALL 复用同一测试品质片段；Build、Propose 与 Snack SHALL 复用同一 Element Contract 语义片段（含 Acceptance Case 行为纪律）。

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

### Section: Agent 认知缺口 SHALL 触发确定性语义重载

Core workflow templates SHALL 将不清楚、上下文压缩后可能遗忘或无法从当前权威内容确定的 Semantic Model 语义视为认知缺口，并通过 CLI 重新读取。普通探索按候选定位、结构导航、局部影响与显式身份语义读取逐步展开；不重复读取已掌握且未发生相关变化的内容。Agent MUST NOT 根据 identity、title、旧摘要、残余对话上下文或实现代码猜测缺失的 Element Definition 或 Contract。

- **整体模型认知不清**

  - Agent 不清楚整体 Semantic Model，或怀疑上下文压缩、长会话或上下文切换已丢失整体认知
  - Agent SHALL 重新运行 `xirang arch outline --format json`，按需要显式展开结构，必要时运行 `arch snapshot`
  - SHALL 使用当前正式模型恢复整体结构，不将 snapshot 当作默认日常入口

- **具体 Element 语义不清**

  - Agent 不清楚或怀疑遗忘某个 Element 的完整 Definition 或 Contract
  - Agent SHALL 使用该 stable identity 重新运行 `xirang arch query <identity> --json`，需要 Contract 时添加 `--contract`
  - SHALL NOT 从 impact identity、outline unloaded node 或 implementation evidence 猜测完整语义

- **多个具体 Elements 批量重载**

  - Agent 同时需要多个已知 identities 的完整语义
  - Agent SHALL 使用一次 batch `arch query` 显式请求这些 identities
  - SHALL NOT 为方便而自动 query impact 返回的全部 identities

### Section: Agent 制品定义先行写作

编写 Project Build source 的 workflow template SHALL 消费 Candidate contract 与 CLI command surface，且 SHALL NOT 重新引入 phase-specific bootstrap instructions。

- **Build skill authoring**

  - 生成 `xirang-build`
  - SHALL 指导 Agent 询问 exploration scope 与 build starting point
  - SHALL 指导 Agent 编写 `build.md` 与四分区 Candidate
  - SHALL 指导 Agent 使用 `xirang candidate validate` diagnostics
  - SHALL NOT 要求退役的 bootstrap instructions、scan/map files 或固定 subagent roles

### Section: Quality template 对 subagent 使用明确 delegation 指令

quality 模板 SHALL 使用明确的 subagent delegation instructions 替代 prose description，指定 delegate to clean-context generated subagent、传入显式 evidence bundle 结构、等待完整 payload，且主 agent MUST NOT 读取或内联 generated subagent artifact。

- **Reviewer subagent step 具有明确 delegation 指令**

  - subagent-orchestrated quality prompt 到达 reviewer step
  - prompt SHALL 明确要求 delegate to clean-context generated reviewer subagent
  - prompt SHALL 包含 evidence bundle 字段列表
  - SHALL NOT 只包含 prose 描述

- **Quality template 不包含工具 API 语法**

  - quality prompt 被组装
  - prompt SHALL NOT 包含工具专属 API 调用语法

- **Optimizer subagent step 具有明确 delegation 指令**

  - quality prompt 到达 Optimization step
  - prompt SHALL 明确要求 delegate to clean-context generated `xirang-optimizer` subagent
  - SHALL 将失败方向作为具名输入字段传入
  - SHALL NOT 指示主 agent 读取或内联 generated subagent artifact

### Section: checkpoint state machine 使用表格格式

quality 模板 SHALL 将 checkpoint state machine 描述为 Markdown table，映射 state、trigger 与 git operation；`QUALITY_STATE_MACHINE_DIAGRAM` fragment SHALL 放在 Optimization section 开头、位于 checkpoint state machine table 之前；`Hard rules` bullet list SHALL 跟在表格之后列出不可协商的安全约束。

- **Checkpoint state 以表格展示**

  - quality prompt 到达 checkpoint section
  - 四个 state（CREATED、BASELINE_RESTORED_FOR_RETRY、TERMINAL_ACCEPTED、TERMINAL_RESTORED）SHALL 出现在表格中
  - 每一行 SHALL 显示 state name、trigger condition 与 git operation
  - 表格前 SHALL 出现 `[Mode: Checkpoint]` label

- **简洁意识使用中性术语**

  - explore 指令描述简单性检查
  - 章节 SHALL 使用 "Simplicity Awareness" 标题
  - 规则列表 SHALL 称为 "simplicity filter"
  - SHALL 使用中性术语，不引用外部框架名称

### Section: 交付并路由通用语义精化指导

框架 SHALL 交付可直接消费的 semantic-refinement 共享 reference 作为默认 `decomposition` 值的解析目标，并让需要结构形成的 Build、Explore、Propose 及使用共享片段的入口按 normalized decomposition 解析路径读取指导。不得仅更改默认值而缺少内容，也不得新增工作流。

- **默认指导可达**

  - 使用默认 `decomposition` 值的项目开始结构形成
  - 对应入口能按解析路径读取随框架投影的完整默认指导，形成任意深度语义结构。

- **项目指导优先**

  - 项目显式配置其他指导文件路径或裸名称
  - 入口读取该解析结果，不用默认 reference 覆盖项目指导，不改变固定六工作流集合。

### Section: 以行为门禁组织形成提示词

Build、Explore、Propose、任务生成及相关共享指导 SHALL 清楚区分当前输入与权威、阶段动作、停止/确认条件、输出与交接。共同协议由单一框架 reference 定义，入口必须明确何时读取或重读；减少重复或相互竞争的指令，不把模板排版、解释性措辞或完整例句当成行为承诺。相关源模板、受管生成面与行为验证 SHALL 一起维护。

- **渐进读取和上下文恢复**

  - Agent 进入 Explore 或 Propose 并执行模型或记录读取
  - 按阶段入口、普通局部补读、恢复入口和收尾门禁的规则选择读取范围
  - 有效 sourceVersion 与未变的已知语义可复用；压缩、session 切换、版本冲突、相关 drift 或状态未知时重建完整依据

- **扩展读取有明确问题**

  - Agent 准备扩大读取范围或批量查询
  - 先说明该读取回答的具体问题，只读取需要的 identity 与范围
  - 代码证据先用 rg、LSP 或符号定位，再读取最小相关范围；测试先定位拥有行为的测试，不批量读取整个测试目录
  - 并发只用于已确定且独立的小查询；不得把原始嵌套 JSON 全量输出
  - 输出超范围时缩小或分批读取，不把截断结果视为完整证据

- **共享规则保持一致**

  - Explore、Propose 与共享 reference 生成
  - 采用一致的局部读取、sourceVersion 复用、恢复门禁、完整性与禁止猜测规则
  - Build 等共享使用方只消费其适用的部分，不被误改为 Change 专属流程

- **验证行为而非措辞**

  - 只是调整说明措辞或信息编排而未改变协议
  - 不新增锁定普通提示词措辞或标题顺序的持久测试；协议 token、读取门禁与禁止操作仍被验证

### Section: Quality flow 使用 Review、Opt 与 Seal 表格

Quality workflow template SHALL 以表格呈现以下门槛：每个 Change 先取得通过的独立基线 Review；之后由主 Agent 决定执行 Opt 或记录不做 Opt 的理由；Seal 绑定 commit 并记录主 Agent 的可运行及测试预期声明。Opinion 与 commit identity 由 CLI 关联，代码恢复由 Git 承载，Archive 只确认 Seal commit 对象存在。
