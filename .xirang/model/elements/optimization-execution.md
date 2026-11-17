---
entity: element-declaration
identity: optimization-execution
kind: element
parent: quality
title: Optimization Execution
definition: Optimization Execution 是 Quality 的 Opt 检查、授权实施、交付与验证收口执行协议，独立承载基线、批次推进、Git 恢复及 Seal 衔接。它允许组内连续实施与局部验证，由协调者提交结果并安排累计独立审查；Quality 不保存执行进度或代码 checkpoint。报告内容由 Optimizer Findings 定义，机械关联由 Quality CLI Gate 定义。
---

## Specification

### Section: 最优性检验执行

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

### Section: Checkpoint 与回滚

优化前 SHALL 保存可恢复基线；Opt 按需保存中间状态，主 Agent 所需验证通过后保存最终 successful checkpoint；不强制每方向提交或 Review。优化引入的问题 SHALL 依据实际证据局部修正或撤销并验证，保留其他可靠优化，不因测试或 Review 失败固定整批回滚。合并后无法直接定位时 MAY 拆分、二分或采用更合适方法；各部分单测通过但组合失败时 SHALL 检查组合影响。无法确认局部恢复可靠时 SHALL 恢复到可确认基线；仍无法确认时停止并交回主 Agent，不以未解决状态完成。

既有代码、commits/checkpoints、质量记录和历史 SHALL 保留。恢复不可靠时停止，不能将本来已有的当前 Change 缺陷当可选优化撤销后遗留。

### Section: 优化结果持久化

开始修改前 SHALL 保存委托起点（范围、起始代码状态、基线 Review、恢复位置）；放弃已尝试优化时 SHALL 立即保存事项、原因与处理结果；交付、主动暂停或交回主 Agent 时 SHALL 保存进度、实际测试结果及遗留问题；完成时 SHALL 保存主 Agent 最终验证结论。其余进度按实际恢复和交接需要保存，例如工作较长、较大调整前或上下文将耗尽时，不要求每个小动作登记或每次保存 commit。

### Section: 模型判断继续与停止

Opt 与主 Agent SHALL 按收益、成本、风险、实际进展及明确委托约束判断继续、放弃或停止，无固定方向数量、失败次数或收益分级门槛。没有新证据或实质进展的重复尝试 SHALL 停止；已完成或放弃的尝试及处理结果在交付时写入 Opt opinion。是否继续 Opt 由主 Agent 决定，CLI 不选择下一项工作。

### Section: 核对现场继续原委托

中断后主 Agent SHALL 先确认旧 Opt 停止；原 Opt 或接手者读取原委托、最近进度和磁盘差异，检查未记录、未验证或证据过期的改动，再继续、修正或撤销。更换执行者不新建委托，主 Agent 主动新探索才建立新委托；意外中断不得假设退出前必有完整报告。

- **A 已完成、B 未记录**：记录显示 A 已完成，磁盘另有改到一半的 B；接手者检查 B 后决定处理，不把 B 当完成，也不自动丢弃 A 和 B。无法辨明归属或恢复可靠时交回主 Agent。
- **中断本身**：不固定整批回滚、再执行 Review 或重新发现全部候选，根据实际证据判断恢复和验证。

### Section: 失败尝试与正确性缺陷分流

Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可修正或撤销；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，可继续委托 Opt 或由主 Agent 处理，确认缺陷解决并完成针对问题及影响的独立 Review 前不得收尾，不得把真实缺陷作为可放弃优化。无关历史问题记录并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。可修复缺陷不造成永久 unsafe 锁定或要求用户手工重启。

可选优化无法修好时 MAY 放弃；Opt SHALL 撤销问题改动、保留可靠结果，并交付原因和恢复后的测试证据。放弃记录当时保存，最终告知用户，未完成优化不阻塞正确且满足验证要求的 Change。

### Section: 主 Agent 决定最终验证

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

协调者 SHALL 判断适用测试范围、运行所需验证，处理已确认缺陷与 supplemental Review；Opt 局部验证不能替代独立审查。只有基线与适用后续 Review、真实 Opt 处置和 commit 关联均满足时才记录 Seal 的 canRun、testsExpectedToPass、testScope 与 assessment；CLI 不执行测试或评分自然语言依据。

### Section: Git 管理优化代码状态与恢复

代码修改、提交历史与恢复 SHALL 由 Git 承载，Quality 不保存 baseline/intermediate/successful checkpoint、代码 manifest 或恢复位置。协调者 SHALL 核对并提交保留的交付结果；按恢复需要保存中间状态，不要求每个方向 commit。失败优化 SHALL 依据 Git 中的实际代码状态局部修正或撤销并验证，保留可靠工作；合并问题无法定位时 MAY 拆分或使用更合适方法。恢复无法确认时停止并交回主 Agent，不以未解决状态完成。

### Section: 仅持久化已交付意见

Quality SHALL 只持久化 Review opinions、Opt opinions/明确不做 Opt 的处置及当前 Seal，不保存 Opt 开始、进度、暂停、恢复或完整测试输出。Opt opinion SHALL 在完成交付时写入，并关联起始与结果 commit；被中断且未交付的 Opt 不视为已完成 opinion。后续恢复依据 Git history 与工作区状态，由主 Agent 负责编排。

### Section: 中断后依据 Git 继续

Opt 中断后，主 Agent SHALL 先确认旧写入者及 pending writes 已停止，再检查 Git history、工作区差异和现存文件；不得将未交付状态推断为完整 Opt opinion。记录与磁盘存在差异时，依据 Git 证据检查、继续、修正或撤销，保留可信工作；归属或恢复可靠性不明时停止并交回主 Agent。
