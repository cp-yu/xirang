---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: "Workflow Templates"
definition: "Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、Quality 模板对 subagent 使用明确 delegation 指令、Review/可选 Opt/Seal 状态投影、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。"
---

## MODIFIED Sections

### Section: apply skill SHALL 读取架构上下文

Apply skill SHALL 指导 Agent 通过 outline 理解 Target Semantic Model 的整体结构，通过 impact 发现 affected Elements 的 abstraction/refinement 与 semantic Relationship identities，再通过 batch query 读取显式 Elements 的完整 Declarations 与 owned Contracts。

- **查询受影响 elements**

  - Agent 开始 apply task 且 task 涉及特定 Element
  - SHALL 运行 `xirang arch impact <elementId> --depth 2 --json`
  - SHALL 对需要实现或验证的 identities 运行 batch `xirang arch query <identities...> --contract --json`

- **从 Project Root 建立整体上下文**

  - task 的局部 Element 缺少足够 context，或 Agent 怀疑整体认知已丢失
  - Agent SHALL 重新运行 `xirang arch outline --format markdown`
  - SHALL 使用完整 hierarchy 回溯到足以解释 intent 的 abstraction，再按需 query 更深 Element

- **读取 element-owned Contracts**

  - query 返回显式 identities 的 Contracts
  - Agent SHALL 将每个 Contract 解释为对应宿主 Element 单元中的完整 Sections
  - MUST NOT 依赖 metadata、impact payload 或未显式请求对象

- **语义优先的实现流程**

  - Agent 开始实现 task
  - SHALL 依次使用 outline 恢复必要整体认知、impact 发现 affected identities、query 读取选定 Definitions/Contracts、解释 relevant semantic Relationships、使用 CodeGraph 或 ACE/`rg`/`read` 获取 current implementation evidence，再开始编码
  - code evidence MUST NOT 静默覆盖 approved Semantic Delta

### Section: Agent 认知缺口 SHALL 触发确定性语义重载

Core workflow templates SHALL 将不清楚、上下文压缩后可能遗忘或无法从当前权威内容确定的 Semantic Model 语义视为认知缺口，并通过 CLI 重新读取。普通探索按候选定位、结构导航、局部影响与显式身份语义读取逐步展开；不重复读取已掌握且未发生相关变化的内容。Agent MUST NOT 根据 identity、title、旧摘要、残余对话上下文或实现代码猜测缺失的 Element Definition 或 Contract。

- **整体模型认知不清**

  - Agent 不清楚整体 Semantic Model，或怀疑上下文压缩、长会话或上下文切换已丢失整体认知
  - Agent SHALL 重新运行 `xirang arch outline --format markdown`，按需要显式展开结构，必要时运行 `arch snapshot`
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
  - 未变且仍有效的已知语义可复用；压缩、session 切换、来源或目标变化、相关 drift 或状态未知时重建完整依据

- **扩展读取有明确问题**

  - Agent 准备扩大读取范围或批量查询
  - 先说明该读取回答的具体问题，只读取需要的 identity 与范围
  - 代码证据先用 rg、LSP 或符号定位，再读取最小相关范围；测试先定位拥有行为的测试，不批量读取整个测试目录
  - 并发只用于已确定且独立的小查询；不得把原始嵌套 JSON 全量输出
  - 输出超范围时缩小或分批读取，不把截断结果视为完整证据

- **共享规则保持一致**

  - Explore、Propose 与共享 reference 生成
  - 采用一致的局部读取、当前依据复用、恢复门禁、完整性与禁止猜测规则
  - Build 等共享使用方只消费其适用的部分，不被误改为 Change 专属流程

- **验证行为而非措辞**

  - 只是调整说明措辞或信息编排而未改变协议
  - 不新增锁定普通提示词措辞或标题顺序的持久测试；协议 token、读取门禁与禁止操作仍被验证

## ADDED Sections

### Section: 按消费目的控制上下文读取

所有 CLI 驱动工作流 SHALL 优先取消不必要调用与重复读取，其次删除无用回执和重复内容，再缩小查询范围，最后选择紧凑表示。Agent 阅读理解 SHALL 优先选择请求范围内内容完整且紧凑的文本，例如 arch outline --format markdown；程序需要精确取字段时使用 JSON。逐命令核对信息覆盖，不假定文本与 JSON 全部等价；完整 Contract、snapshot 与 review projection 不得被自动摘要或截断。

静态指导 SHALL 按任务加载并复用当前已掌握内容，不把 instructions 全量移入每个 skill 或每次必读文件。Apply 不固定同时调用 status、instructions apply 和 quality status；先从 status 获取目标概况及推进状态，需要具体质量结论或 revision 时再查 quality status。Record 首次接手、上下文丢失、交接前完整读取，普通阶段按需读取条目，不固定 show/status/validate 三连；适用的语义和确定性门禁仍须执行。

上下文开销比较 SHALL 使用相同样本、任务目的和调用场景，计入实际 stdout、stderr 及读取的 skill/reference 字节，既评估单次响应也评估累计工作流。不将同量内容从 CLI 搬入文件算作收益，不设未经确认的固定降幅，未运行 tokenizer 不报告 token 节省量。每项优化 SHALL 指明省掉的调用或内容及必要信息的获取位置；行为验证复用已有测试，不以固定自然语言全文或字节快照代替可观察结果。
