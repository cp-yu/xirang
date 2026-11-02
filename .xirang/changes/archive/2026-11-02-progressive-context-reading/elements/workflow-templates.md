---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、quality 模板对 subagent 使用明确 delegation 指令、checkpoint state machine 表格、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。
---

## MODIFIED Sections

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
