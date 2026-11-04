---
operation: "MODIFIED"
entity: "element-declaration"
identity: "apply-quality-integration"
kind: "element"
parent: "apply"
title: "Apply Quality Integration"
definition: "Apply Quality Integration 是 Apply 对基线独立审查、受托优化、恢复和最终验证的集成协议，独立承载 CRITICAL 写回顺序、角色分工、共享 references 和质量诊断消费。它让主 Agent 编排可写 Opt 及所需 Reviewer，保持普通 Apply 任务纪律；不定义 CLI 方向台账或重复 Quality 的判定引擎。"
---

## MODIFIED Sections

### Section: 主 agent 和 subagent 角色分工

Apply SHALL 由主 Agent 负责委托范围、越界处理、继续投入及最终验证范围，允许读取实际代码与证据；Opt 负责发现、分组、合并、修改及局部测试并交付；Reviewer 只读独立审查。缺少对应测试时 Opt SHALL 先补测试再改实现。主 Agent 与 Opt 的判断不替代必需独立 Review。

### Section: 配置驱动优化控制

optimization.enabled SHALL 控制是否启动优化；配置禁用或用户明确拒绝时记录明确跳过。Opt 与主 Agent 按证据、收益、成本、风险和进展判断继续或停止，遵守用户和委托预算；无新证据或实质进展的重复尝试 SHALL 停止并记录。directionLimit、directionRetries、minImpactLevel 等退役输入给出明确诊断，不继续参与控制。

### Section: Apply reference 拥有 checkpoint 编排

Apply 的共享优化 reference SHALL 定义修改前可恢复基线、Opt 按需中间保存、主 Agent 所需验证通过后最终 successful checkpoint；Reviewer 不创建、恢复 checkpoint 或写入项目。局部失败优先按证据修正或撤销并保留有效工作，必要时恢复可确认基线；无法确认恢复则停止。代码、commits/checkpoints、当前及历史记录保持可用，不强制逐方向 commit 或整批回滚。

### Section: 共享恢复 reference 编排重验

Apply 与 Archive SHALL 使用同一共享恢复 reference。优化中断后 SHALL 在主 Agent 确认旧写入者已停止后核对原委托、最近进度与磁盘差异，默认继续同一委托；意外中断可能没有最终保存。记录 A 已完成而磁盘有半成品 B 时，检查 B 和相互影响后继续、修正或撤销，不直接判 B 完成或自动丢弃 A/B。未记录、未验证或过期证据需补查；归属或恢复可靠性不明时停止并交回主 Agent。只有主 Agent 主动开始新探索才建新委托。 用户明确要求从头重新验证时，保留原工作区身份、baseCommit、代码、commits/checkpoints 和历史，原流程停止后取得新的独立基线 Review；不要求用户重复确认已给出的重验意图。普通失败或可处理缺陷不永久锁定，也不自动重启整个流程。不支持的旧质量格式、旧命令输入和退役优化配置 SHALL 给出明确诊断，不静默解释、自动迁移或启用兼容执行路径。旧活动记录不自动转换为新完成结论；既有代码、commits/checkpoints、归档和历史记录 SHALL 保留，由主 Agent 与用户判断旧 Change 如何继续。

### Section: 恢复交付的验证证据

恢复交付 SHALL 提供可复现的实际行为证据，包括磁盘未记录改动的处理、局部撤销保留有效工作、失败历史保留及测试与实际状态对应。持久测试验证 CLI 可观察门禁和文件保持，不锁解释性措辞；reference 操作和生成面通过临时工作区的一次性行为证据验证，覆盖 Windows 与 POSIX 路径。

## ADDED Sections

### Section: 以委托交付推进优化

Apply SHALL 读取共享优化 reference，在普通实现通过基线独立 Review 后保存可恢复起点并委托 Opt；Opt 在一次委托内可连续分组实施和测试。交付后主 Agent 可返回具体修正或启动 fresh-context 新探索，不要求每项交接、重新扫描或固定轮数，最终验证可覆盖累计改动。完成条件 SHALL 关联优化前通过的独立基线 Review、已完整交付的委托或配置禁用/用户拒绝的明确跳过、实际成功测试、主 Agent 的最终验证范围与理由、所有已声明必需的增量 Review，以及当前 Change 基线缺陷修复后必需的针对性独立 Review；所需验证全部通过且证据适用当前状态、无未解决正确性或恢复问题，才可保存最终 successful checkpoint 并完成。未追加 Review 的风险判断不记为 Reviewer PASS，基线 PASS 不声称覆盖优化后代码。

### Section: 记录失败尝试并告知

放弃已尝试优化时 SHALL 保存事项、失败原因及处理结果，保留其他可靠优化，交付恢复后的测试证据并最终告知用户。失败尝试不使整个结果被笼统认定下降；当前 Change 原有正确性缺陷须交主 Agent 安排修复并针对性独立 Review，不能作为可选优化放弃。

## REMOVED Sections

### Section: 优化循环以轮为单位

### Section: 失败方向记录
