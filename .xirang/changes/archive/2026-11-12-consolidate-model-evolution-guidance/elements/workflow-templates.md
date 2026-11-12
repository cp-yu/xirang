---
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: "Workflow Templates"
definition: "Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、Quality 模板对 subagent 使用明确 delegation 指令、Review/可选 Opt/Seal 状态投影、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。"
---

## MODIFIED Sections

### Section: 交付并路由通用语义精化指导

框架 SHALL 交付可直接消费的 semantic-refinement 共享 reference 作为默认 `decomposition` 值的解析目标，并让需要结构形成的 Build、Explore、Propose 及使用共享片段的入口按 normalized decomposition 解析路径读取指导。不得仅更改默认值而缺少内容，也不得新增工作流。

- **默认指导可达**

  - 使用默认 `decomposition` 值的项目开始结构形成
  - 对应入口能按解析路径读取随框架投影的完整默认指导，形成任意深度语义结构。

- **项目指导优先**

  - 项目显式配置其他指导文件路径或裸名称
  - 入口读取该解析结果，不用默认 reference 覆盖项目指导，不改变固定六工作流集合。

默认方法 SHALL 聚焦从领域概念、能力或用户目标识别抽象和分解维度，区分具有语义边界的 Perspective 与仅服务呈现的 View，以类型化 Relationships 表达跨视角联系，并在既有 Kind 无法准确表达共享语义时扩展 Metamodel。细化程度以可理解、可决策为依据，不限定 C4 技术层级或固定层数。通用身份、Declaration/Contract、MECE、BF 和用户确认规则由其负责的共享指导或工作流承载，方法不重复另设这些规则。

本项目方法 SHALL 保留 semantic-objects/realization 顶层划分和 realization-process/collaboration-structure 的 Perspective 边界，并继承同一框架纪律；项目差异不作为其他项目的默认要求。

### Section: 以行为门禁组织形成提示词

Build、Explore、Propose、任务生成及相关共享指导 SHALL 清楚区分当前输入与权威、阶段动作、停止/确认条件、输出与交接。完整规则 SHALL 在负责该规则的 skill 或 reference 中唯一维护，入口明确何时读取或重读；阶段步骤保留实际动作，纯重复说明直接省略，不将每处重复改成另一条相同引用，不把模板排版、解释性措辞或完整例句当成行为承诺。相关源模板、受管生成面与行为验证 SHALL 一起维护。

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

- **单一决策定义**：Propose 的自主组织与实质选择边界由其决策段完整定义；成文、就绪与审阅步骤不分别重述规则，但各自需要的检查动作仍执行。
- **独立入口**：新 Agent 或独立入口仍取得完成任务所需指导；文件间文字相似不构成删除必要加载的依据。
- **原文与行为**：不为保留旧的普通措辞测试而恢复冗余规则；保留协议 token、实际停止条件、禁止操作及来源忠实性检查。

### Section: 按消费目的控制上下文读取

所有 CLI 驱动工作流 SHALL 优先取消不必要调用与重复读取，其次删除无用回执和重复内容，再缩小查询范围，最后选择紧凑表示。Agent 阅读理解 SHALL 优先选择请求范围内内容完整且紧凑的文本，例如 arch outline --format markdown；程序需要精确取字段时使用 JSON。逐命令核对信息覆盖，不假定文本与 JSON 全部等价；完整 Contract、snapshot 与 review projection 不得被自动摘要或截断。

静态指导 SHALL 按任务加载并复用当前已掌握内容，不把 instructions 全量移入每个 skill 或每次必读文件。Apply 不固定同时调用 status、instructions apply 和 quality status；先从 status 获取目标概况及推进状态，需要具体质量结论或 revision 时再查 quality status。Record 首次接手、上下文丢失、交接前完整读取，普通阶段按需读取条目，不固定 show/status/validate 三连；适用的语义和确定性门禁仍须执行。

上下文开销比较 SHALL 使用相同样本、任务目的和调用场景，计入实际 stdout、stderr 及读取的 skill/reference 字节，既评估单次响应也评估累计工作流。不将同量内容从 CLI 搬入文件算作收益，不设未经确认的固定降幅，未运行 tokenizer 不报告 token 节省量。每项优化 SHALL 指明省掉的调用或内容及必要信息的获取位置；行为验证复用已有测试，不以固定自然语言全文或字节快照代替可观察结果。

提示词精简的实际行为比较 SHALL 保持可比的模型、设置、任务和评价依据，覆盖同场景重复与不同场景；结合实际产物、加载轨迹、工具调用、无必要暂停、返工、耗时及可取得的 token 数据判断。文本变短或生成检查通过不证明行为改善；漏掉实质确认、父级承诺或其他必要语义属于回归，不能以节省上下文抵消。
