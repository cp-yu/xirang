---
operation: "MODIFIED"
entity: "element-declaration"
identity: "optimization-execution"
kind: "element"
parent: "quality"
title: "Optimization Execution"
definition: "Optimization Execution 是 Quality 中以委托及实际交付推进优化的执行协议，独立承载起点、执行、持久化时点、恢复与主 Agent 最终验证的衔接。它允许 Opt 自主组合实施与局部测试，按需续跑或新探索；报告内容由 Optimizer Findings 定义，命令形态由 Quality CLI Gate 定义，不负责方向排序或额度控制。"
---

## MODIFIED Sections

### Section: 最优性检验执行

系统 SHALL 在优化前实现通过独立 Review 后，除配置禁用或用户明确拒绝外，由主 Agent 委托 fresh-context Opt 执行优化。开始修改前保存范围、起始代码状态、基线 Review 与可恢复位置；Review 写回或质量记录使工作区非空不自动构成跳过理由。Opt 可在一次委托内分组、合并、连续修改与局部验证；对应测试缺失时在改实现前补充。配置禁用或用户拒绝 SHALL 明确记录跳过，保留基线 Review 与适用验证。

### Section: Checkpoint 与回滚

优化前 SHALL 保存可恢复基线；Opt 按需保存中间状态，主 Agent 所需验证通过后保存最终 successful checkpoint；不强制每方向提交或 Review。优化引入的问题 SHALL 依据实际证据局部修正或撤销并验证，保留其他可靠优化，不因测试或 Review 失败固定整批回滚。合并后无法直接定位时 MAY 拆分、二分或采用更合适方法；各部分单测通过但组合失败时 SHALL 检查组合影响。无法确认局部恢复可靠时 SHALL 恢复到可确认基线；仍无法确认时停止并交回主 Agent，不以未解决状态完成。

既有代码、commits/checkpoints、质量记录和历史 SHALL 保留。恢复不可靠时停止，不能将本来已有的当前 Change 缺陷当可选优化撤销后遗留。

### Section: 优化结果持久化

开始修改前 SHALL 保存委托起点（范围、起始代码状态、基线 Review、恢复位置）；放弃已尝试优化时 SHALL 立即保存事项、原因与处理结果；交付、主动暂停或交回主 Agent 时 SHALL 保存进度、实际测试结果及遗留问题；完成时 SHALL 保存主 Agent 最终验证结论。其余进度按实际恢复和交接需要保存，例如工作较长、较大调整前或上下文将耗尽时，不要求每个小动作登记或每次保存 commit。

## ADDED Sections

### Section: 模型判断继续与停止

Opt 与主 Agent SHALL 按收益、成本、风险、实际进展及明确委托约束判断继续、放弃或停止，无固定方向数量、失败次数或收益分级门槛。没有新证据或实质进展的重复尝试 SHALL 停止并记录。交付后主 Agent 可返回具体修正或启动 fresh-context 新探索，也可判断最终验证并收尾；不强制每批重评、固定轮数或无机会证明。

### Section: 核对现场继续原委托

中断后主 Agent SHALL 先确认旧 Opt 停止；原 Opt 或接手者读取原委托、最近进度和磁盘差异，检查未记录、未验证或证据过期的改动，再继续、修正或撤销。更换执行者不新建委托，主 Agent 主动新探索才建立新委托；意外中断不得假设退出前必有完整报告。

- **A 已完成、B 未记录**：记录显示 A 已完成，磁盘另有改到一半的 B；接手者检查 B 后决定处理，不把 B 当完成，也不自动丢弃 A 和 B。无法辨明归属或恢复可靠时交回主 Agent。
- **中断本身**：不固定整批回滚、再执行 Review 或重新发现全部候选，根据实际证据判断恢复和验证。

### Section: 失败尝试与正确性缺陷分流

Opt SHALL 区分优化引入的问题、优化前已存在且被基线 Review 漏掉的当前 Change 正确性缺陷、无关历史问题及需求契约冲突。优化问题可修正或撤销；基线缺陷的证据 SHALL 交给主 Agent 判断并安排修复，可继续委托 Opt 或由主 Agent 处理，确认缺陷解决并完成针对问题及影响的独立 Review 前不得收尾，不得把真实缺陷作为可放弃优化。无关历史问题记录并告知，不自动扩大范围；需求契约冲突交给主 Agent 澄清，需要用户决策时询问用户，不擅改目标语义。可修复缺陷不造成永久 unsafe 锁定或要求用户手工重启。

可选优化无法修好时 MAY 放弃；Opt SHALL 撤销问题改动、保留可靠结果，并交付原因和恢复后的测试证据。放弃记录当时保存，最终告知用户，未完成优化不阻塞正确且满足验证要求的 Change。

### Section: 主 Agent 决定最终验证

优化前实现 SHALL 先通过独立 Review。主 Agent SHALL 根据累计优化改动、行为保持依据与测试覆盖确定最终验证范围并简短说明理由；测试必需，全量测试和优化后增量 Review 按实际风险决定，不增加固定风险审批。已确认的当前 Change 基线正确性缺陷 SHALL 修复并通过针对问题及其影响的独立 Review。只有所需验证全部完成且通过、证据对应当前状态、交付完整且无未解决的正确性或恢复问题时，才可保存最终 successful checkpoint 并完成。基线 Review 不证明后续改动经过独立审查；无需追加 Review 的判断不记为 Reviewer PASS。后续代码变化 SHALL 重新判断受影响的验证。

- **两项局部优化合并**：Opt 合并完成两项局部优化且对应测试通过；主 Agent 按改动范围、保持依据及覆盖判断无需全量测试或增量 Review，保存判断即可完成所需验证并保存成功 checkpoint。需要增量 Review 时必须等其通过。最终验证可覆盖多次委托累计改动。

## REMOVED Sections

### Section: 重试预算控制

### Section: 优化 finding reconciliation

### Section: 每轮实现后由 fresh reviewer 复核
