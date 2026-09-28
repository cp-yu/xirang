---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、quality 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。
---

## Specification

### Section: 模板不内联 subagent 角色定义

quality/apply/archive 模板 SHALL NOT 在模板 body 中内联 reviewer 或 optimizer 的完整角色定义、验证协议、判断标准或输出格式。这些内容归对应的 generated internal subagent artifact 所有。模板 SHALL 保留 orchestration 职责描述：证据包收集、subagent delegation、payload 校验、CLI 持久化、checkpoint 管理和写回执行。

- **模板内容精简**

  - 比较改进前后的 quality 模板
  - 改进后模板 SHALL NOT 包含 reviewer 的验证维度列表、severity 定义或输出 JSON schema
  - 改进后模板 SHALL 保留 evidence 包组装和 subagent delegation 指令

### Section: 统一 CLI 查询接口

Core workflow templates SHALL 使用 `xirang arch outline` 恢复整体结构认知，使用 `xirang arch search` 定位未知概念候选，使用 `xirang arch impact` 发现 refinement 与 Relationship 相关 identities，并使用 batch `xirang arch query` 读取显式 Elements 的完整 Declaration 与 owned Contracts。需要校验全体 Element Contracts 时 SHALL 使用 `xirang validate --contracts`；MUST NOT 引用退役 spec commands 或已移除的 query navigation options。

- **Propose 模板包含正确的契约导航指令**

  - propose 模板被加载
  - SHALL 指导 Agent 使用 `arch search` 定位候选 identities、使用 `arch impact` 发现相关 identities，并使用 batch `arch query --contract --json` 读取所选 Elements 的完整语义
  - MUST NOT 引用 `arch query --relations`、`arch query --depth`、退役 spec commands 或 list-based Contract 扫描

- **Apply 模板包含正确的契约交叉检查指令**

  - apply-change 模板被加载
  - SHALL 指导 Agent 在实现 element-owned behavior 前使用 `arch impact` 获取相关范围并使用 batch `arch query --contract` 查询显式关联 Elements
  - MUST NOT 引用已移除的 query navigation options 或退役 spec commands

- **Optimizer 使用 impact 获取 directed relationships**

  - optimizer 执行 semantic Relationship dependency expansion
  - SHALL 使用 `arch impact <identity> --depth 1 --json` 获取一跳 directed Relationship context
  - SHALL 按需 batch query 选定 identities，而不是要求 impact 返回完整语义

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

Core workflows SHALL 使用同一无状态 Semantic Model loading protocol：`arch outline` 返回完整 Element hierarchy、Relationships 与 Metamodel，并按项目配置局部加载 Element Definitions；`arch impact` 返回影响 identities 与结构路径；batch `arch query` 返回显式 identities 的完整 Declarations 与可选 Contracts。`arch snapshot` SHALL 保留为完整导出工具，不作为默认 Agent onboarding command。Semantic Model 缺失或不完整时，只读 workflow MAY 使用部分 context 继续并声明不可用；需要编译或写入语义的 workflow MUST NOT 将缺失 source 当作空且完整的模型。Explore、Propose、Apply 与 Reviewer SHALL 复用同一测试品质片段；Build、Propose 与 Snack SHALL 复用同一 Element Contract 语义片段（含 Acceptance Case 行为纪律）。

- **Model 不存在**

  - Formal Semantic Model 不存在
  - 只读 workflow MAY 继续使用 code evidence
  - SHALL 声明 Semantic Model unavailable

- **Target model 不完整**

  - apply 或 sync 发现 root、identity 或 required contract error
  - SHALL 停止需要完整语义的操作
  - MUST NOT 以空 collection 掩盖 error

- **Shared context 使用统一模型**

  - workflow 启动且新版 model 存在
  - SHALL 使用 outline 获取完整 identity/hierarchy/Relationship/Metamodel context，并使用 impact 与 query 按需读取更深语义
  - MUST NOT 使用 domain/capability 固定层级或 parallel YAML graph

- **Shared context 使用 outline 恢复模型总览**

  - workflow 需要项目模型整体认知或怀疑整体认知已丢失
  - shared context fragment SHALL 指引运行 `xirang arch outline --format json`
  - SHALL 说明 `architecture.outline.elementDefinitionDepth` 只控制 Element Definition projection，完整 Contract 必须通过显式 batch query 获取

- **Code evidence 与 Semantic Model 分层**

  - workflow 需要 source path、symbol、import 或 call facts
  - SHALL 将其作为 current implementation evidence
  - MUST NOT 将其自动提升为 Element、Relationship、Definition 或 Contract

- **Templates 使用同一 fragment**

  - 检查 generated workflow templates
  - relevant surfaces SHALL 复用同一 exported constant
  - SHALL 使用一致 canonical terminology 与认知恢复规则

- **测试品质片段被四阶段复用**

  - 生成 Explore、Propose、Apply 或 Reviewer workflow 模板
  - 输出 SHALL 包含同一测试品质片段
  - 该片段 SHALL 定义可重复隔离、锁行为不锁结构、单一失败原因与难测先改设计
  - SHALL NOT 把项目特定锁词规则写入该通用片段

### Section: Agent 认知缺口 SHALL 触发确定性语义重载

Core workflow templates SHALL 指导 Agent 将不清楚、上下文压缩后可能遗忘或无法从当前权威内容确定的 Semantic Model 语义视为认知缺口，并通过 CLI 重新读取。Agent MUST NOT 根据 identity、title、旧摘要、残余对话上下文或实现代码猜测缺失的 Element Definition 或 Contract。

- **整体模型认知不清**

  - Agent 不清楚整体 Semantic Model，或怀疑上下文压缩、长会话或上下文切换已丢失整体认知
  - Agent SHALL 重新运行 `xirang arch outline --format json`
  - SHALL 使用当前完整 hierarchy、Relationships、Metamodel 与局部 loaded Definitions 恢复整体认知

- **具体 Element 语义不清**

  - Agent 不清楚或怀疑遗忘某个 Element 的完整 Definition 或 Contract
  - Agent SHALL 使用该稳定 identity 重新运行 `xirang arch query <identity> --json`，并在需要 Contract 时添加 `--contract`
  - SHALL NOT 从 impact identity、outline unloaded node 或 implementation evidence 猜测完整语义

- **多个具体 Elements 批量重载**

  - Agent 同时需要多个已知 identities 的完整语义
  - Agent SHALL 使用一次 batch `arch query` 显式请求这些 identities
  - SHALL NOT 为方便而自动加载 impact 返回的全部 identities

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

- **冲突流程能按提示执行**

  - Agent 依据生成入口处理新设计与当前记录的冲突
  - 可定位完整协议，先重载与解释冲突，等待裁决和独立写入授权，复核后才交接；不会从重复段落推导相反授权。

- **任务生成保持语义分工**

  - Agent 依据任务生成提示编排实现
  - 能把 Contract 作为完整规范，把 Tasks 作为实施与检查安排，并执行两段覆盖复核而不复制第二份规范。

- **验证约束行为而非解释性措辞**

  - 只是调整说明措辞或信息编排而未改变协议
  - 不新增锁定措辞或标题顺序的持久测试；协议 tokens、必读路由、fail-closed 门禁与禁止操作仍被验证。
