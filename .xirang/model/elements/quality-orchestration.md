---
entity: element-declaration
identity: quality-orchestration
kind: element
parent: quality
title: Quality Orchestration
definition: Quality Orchestration 是 Quality 的 Review、Opt 检查与授权实施及 Seal 提示协议，独立承载协调者的范围、等待、后续投入、Git 恢复、提交与最终声明编排。它区分实现、独立审查和确定性记录责任，供 Apply 与 Archive 共用；不替 Reviewer 作结论，不让 CLI 自主选择优化工作。
---

## Specification

### Section: Coordinator 角色声明

Quality 提示词 SHALL 区分主 Agent、Optimizer、Reviewer 与 CLI：主 Agent 在委派前确保待审实现已提交且受托工作所需测试已运行通过，选择 `reviewKind` 与非冲突质量维度、处理输入错误和修正、等待并合并 Reviewer 结论、决定 Opt 和最终 Seal；Opt 按 inspection 只读检查或 implementation 授权组内修改与局部测试；Reviewer 自主从受托 checkout 的 HEAD 独立只读审查，判断测试及其他证据是否充分而不必重复运行测试；CLI 只负责 v5 opinion、Opt disposition、Seal 的确定性记录和门禁。主 Agent 和 Opt 的判断不能代替必需独立 Review。

面向当前执行者的提示词 SHALL 使用直接祈使或 you，不用 The main Agent 含混自指；内部角色指向另一协调角色时保留明确角色区别，不机械全局替换。

### Section: 阶段模式标签

quality 工作流提示词 SHALL 使用 mode label 标记主要阶段切换，以提示认知上下文切换。Mode label SHALL NOT 应用于 checkpoint 子状态；这些只是单一 `[Mode: Checkpoint]` 认知模式内的实现分支。

- **主要阶段切换带有 mode label**

  - 工作流从证据准备切换到 reviewer 委派
  - step header SHALL 包含 `[Mode: Delegate Review]`
  - mode label SHALL 作为 step number 的前缀

- **Checkpoint 子状态不单独使用 mode label**

  - 工作流处于 checkpoint 管理阶段
  - 单个 checkpoint 状态 SHALL NOT 获得独立 mode label
  - SHALL 在 `[Mode: Checkpoint]` section 内描述

### Section: 显式 subagent delegation 指令

主 Agent SHALL 给 Reviewer 提供 `changeName`、实际 checkout 的绝对 `projectRoot`、`reviewKind`，并以自然语言指定必要的质量维度或受影响行为；不传 `reviewId`、单独的 `changeDir` 或目标 commit。可并行委派多个维度，但同轮委派 SHALL 分工不冲突、每个 `full-change` 维度覆盖整个累计 Change；收齐有效结果后由主 Agent 合并为一条 Review opinion，保留重要结论与修正，任一必需维度失败或未解决时不能 PASS。Pi Reviewer 在后台运行以获取环境扩展工具，主 Agent 等待完整结果；错误委派或 HEAD 变化交回重新委派，不写 FAIL opinion。Opt 委派仍由其原有范围与 `baseCommit`/`resultCommit` 交付规则约束。

### Section: Subagent 超时和等待规则

quality 工作流提示词 SHALL 为所有 subagent delegation 包含显式 timeout 与 waiting rules：等待完整 subagent 结果、超时后继续等待、询问用户而不是终止 subagent，且顶层 agent MUST 在进入下一步前接收完整 payload。

- **Subagent 未及时返回**

  - subagent 在预期时间内没有返回
  - coordinator SHALL NOT 将其视为失败
  - SHALL 继续等待
  - SHALL NOT 在收到结果前进入 payload 校验

- **等待时间过长**

  - coordinator 等待某个 subagent 超过设定的等待预算
  - coordinator SHALL 询问用户是否继续等待或终止
  - SHALL NOT 在未经用户确认时终止 subagent

### Section: Checkpoint 协议使用有序执行步骤

共享 reference SHALL 说明优化前独立 Review 和可恢复基线、按需中间保存、所需验证全部通过后的最终成功状态。失败可局部修正或撤销并保留可靠工作，不要求每方向 commit 或失败整批 reset/clean。恢复 SHALL 保留代码、commits/checkpoints、当前记录及全部历史；不能确认局部恢复则恢复可确认基线，再不能确认则停止。优化中断后 SHALL 在主 Agent 确认旧写入者已停止后核对原委托、最近进度与磁盘差异，默认继续同一委托；意外中断可能没有最终保存。记录 A 已完成而磁盘有半成品 B 时，检查 B 和相互影响后继续、修正或撤销，不直接判 B 完成或自动丢弃 A/B。未记录、未验证或过期证据需补查；归属或恢复可靠性不明时停止并交回主 Agent。只有主 Agent 主动开始新探索才建新委托。

### Section: 语言一致性

quality 工作流中新增或修改的 prompt text SHALL 使用与现有模板一致的语言。Mode label SHALL 使用 `[Mode: ...]` 形式。

- **Mode label 使用固定形式**

  - quality prompt 被组装
  - 所有 mode label SHALL 以 `[Mode: <Label>]` 形式出现

### Section: Git recovery 与 Seal 顺序

通过基线 full-change Review 后，协调 Agent SHALL 默认委托干净上下文的 Optimizer 执行一次只读 inspection，再依据证据、项目目标、约束、预期收益、成本和风险授权一组相关改进或说明停止理由；无需先找到具体改法才委托检查。每批 implementation 交付后，协调者核对实际改动与验证证据，决定继续当前 Opt、请求新的干净上下文 inspection 或停止；后续实施保持明确授权范围，以实际进展和预期价值判断继续，不强制每轮重启或固定轮数。

实际完成的只读检查或无改动工作 SHALL 使用 delivered，not_performed 仅表示 Opt 确实未运行，并记录简短理由。没有值得实施的机会，与发现机会但协调者选择不实施须区分；后一情况保留发现与实际取舍理由，不能写成未发现机会。

每批交付后，协调 Agent SHALL 核对并提交保留改动，再用真实 baseCommit/resultCommit 记录 Opt opinion；不要求每次编辑提交。Optimizer 负责受托修改、验证与报告，结果提交由协调者负责。没有保留改动时复用原提交，不创建空提交；baseCommit == resultCommit 仅表示未交付新的实现状态，不证明过程只读，尝试后完全撤销也可复用原提交并如实报告。不同提交表示新的交付状态，产生后续 Review 义务；不通过内容等价比较免除此义务。

Seal 前，所有保留且尚未独立审查的累计优化改动 SHALL 通过 full-change 或 incremental Review；协调者按累计影响选择范围，风险决定审查范围而非是否审查。允许多批后累计审查或提前审查；通过后继续修改，新增改动及其影响须再次独立审查。无变更交付不新增义务，也不取消先前未完成的审查或已确认缺陷修复义务。

失败 Review 的修正 SHALL 形成新 Git commit 并针对相应类别复审，基线缺陷必须 supplemental Review。Seal 绑定符合意见顺序与提交关联的受审 commit；CLI 不比较 HEAD/工作区或执行测试，Archive 只检查有效记录的 Seal commit 存在。
