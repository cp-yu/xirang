---
entity: element-declaration
identity: apply-quality-integration
kind: element
parent: apply
title: Apply Quality Integration
definition: Apply Quality Integration 是 Apply 对基线独立审查、可选受托优化、Git-based recovery 和 Seal 的集成协议，独立承载角色分工、共享 references 和 Quality opinion 诊断消费。它让主 Agent 编排可写 Opt 及所需 Reviewer，负责处理修正及任务状态；不定义自动 task writeback、Quality checkpoint 或逐方向台账。
---

## Specification

### Section: Review 记录先写回再持久化

`xirang-apply-change` SHALL 先委托 fresh reviewer，再校验其结构化 payload，只应用 CRITICAL `writeBackPlan`，最后调用 `xirang quality review` 持久化该 payload。CLI 持久化 SHALL 发生在 writeback 之后，使 `tasksFileHash` 对应最终写入的 `tasks.md`。

- **CRITICAL writeback 先于记录**

  - reviewer 返回包含 CRITICAL `writeBackPlan` 的合法 payload
  - Apply SHALL 先更新 `tasks.md`
  - SHALL 在更新完成后调用 `xirang quality review "<change-name>" --input '<json>' --json`
  - CLI SHALL 从最终 `tasks.md` 计算 `tasksFileHash`

- **非 CRITICAL finding 不写回**

  - reviewer payload 只包含 WARNING 或 SUGGESTION
  - Apply SHALL NOT 将这些 finding 写入 `tasks.md`

### Section: 主 agent 和 subagent 角色分工

Apply SHALL 由主 Agent 负责委托范围、越界处理、继续投入及最终验证范围，允许读取实际代码与证据；Opt 负责发现、分组、合并、修改及局部测试并交付；Reviewer 只读独立审查。缺少对应测试时 Opt SHALL 先补测试再改实现。主 Agent 与 Opt 的判断不替代必需独立 Review。

### Section: 配置驱动优化控制

optimization.enabled SHALL 控制是否启动优化；配置禁用或用户明确拒绝时记录明确跳过。Opt 与主 Agent 按证据、收益、成本、风险和进展判断继续或停止，遵守用户和委托预算；无新证据或实质进展的重复尝试 SHALL 停止并记录。directionLimit、directionRetries、minImpactLevel 等退役输入给出明确诊断，不继续参与控制。

### Section: Apply 读取 Quality 诊断信息

当新 Quality JSON 存在时，Apply SHALL 读取 Review opinions、Opt disposition/opinions、Seal 与具体诊断，将其作为修复或收口上下文。失败 Review 的 findings 交由主 Agent 判断并安排修正；主 Agent 可更新对应 task 与 Required Corrections，形成修正 commit 后重新 Review。Quality/CLI SHALL NOT 自动 unmark task 或追加 task section。没有新 Quality JSON 时，Apply SHALL 按新协议取得基线 Review，不得从旧 snapshot/log/evidence 推断已通过。

### Section: Apply reference 拥有 checkpoint 编排

Apply 的共享优化 reference SHALL 定义修改前可恢复基线、Opt 按需中间保存、主 Agent 所需验证通过后最终 successful checkpoint；Reviewer 不创建、恢复 checkpoint 或写入项目。局部失败优先按证据修正或撤销并保留有效工作，必要时恢复可确认基线；无法确认恢复则停止。代码、commits/checkpoints、当前及历史记录保持可用，不强制逐方向 commit 或整批回滚。

### Section: 共享恢复 reference 编排重验

Apply 与 Archive SHALL 使用同一共享 Git recovery reference。Opt 中断后，主 Agent 确认旧写入者已停止，再通过 Git history、status 与当前代码核对结果并决定继续、修正或撤销；未交付状态不作为 Opt opinion。用户要求从头重新验证时，主 Agent 在原流程停止后追加新的 Review opinion，不重置或轮换 Quality JSON 历史。旧质量格式不读取、不迁移、不删除；旧文件和 commits 保持原样。

### Section: 恢复交付的验证证据

恢复交付 SHALL 以可复现的 Git commit 和项目测试/检查结果支持主 Agent 判断，包括局部撤销保留有效工作及失败历史可从 Git 读取。Quality JSON 只记录 Review/Opt opinions、Opt disposition 和 Seal，不记录测试输出、manifest 或恢复快照。持久测试验证 CLI commit 关联、JSON 原子 CAS 与门禁；路径使用 Node.js path API，并覆盖 Windows 与 POSIX。

### Section: 以委托交付推进优化

普通实现通过基线独立 Review 后，主 Agent SHALL 决定是否委托 Opt；不执行时在 Seal 前记录简短处置理由。Opt 在一次委托内可连续分组实施和测试，交付时记录 `baseCommit`、`resultCommit` 与 opinion。主 Agent 可返回具体修正或启动 fresh-context 新探索，不要求固定轮数。主 Agent 根据累计改动决定所需测试和是否追加独立 Review，随后用 Seal 声明绑定 commit 可运行且预期通过适用测试；CLI 不运行测试或比较当前工作区。

### Section: 记录失败尝试并告知

Opt 可选尝试失败时 SHALL 依据 Git 状态修正或撤销，保留可靠结果，并在交付 opinion 中记录尝试、原因、处理与遗留问题，最终由主 Agent 告知用户。未完成的中断工作不视为 Opt opinion；当前 Change 正确性缺陷由主 Agent 安排修复并针对性独立 Review。
