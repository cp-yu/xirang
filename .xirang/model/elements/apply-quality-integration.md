---
entity: element-declaration
identity: apply-quality-integration
kind: element
parent: apply
title: Apply Quality Integration
definition: Apply Quality Integration 定义 Apply 与 Quality 的集成契约：Review 记录先写回再持久化、以轮为单位的优化循环、失败方向记录、主 agent 与 subagent 的角色分工、配置驱动的优化控制，以及 Apply reference 拥有的 checkpoint 编排。它不定义 Quality 自身的状态判定与命令面。
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

### Section: 优化循环以轮为单位

`xirang-apply-change` SHALL 从生成 reference 读取优化循环协议。每轮 SHALL 创建非空 baseline commit、调用 fresh optimizer 取得方向台账、只实现本轮选中的方向、由 master 按 TDD 编码，再由 fresh reviewer 复核并通过 `xirang quality review` 记录该轮结论。普通实现轮次 SHALL NOT 创建 commit；Checkpoint 使用 git commit，失败回滚使用 `git reset --hard HEAD` 与 `git clean -fd`。

- **方向驱动的优化循环**

  - Optimization 开始
  - apply SHALL 创建非空 baseline checkpoint，并将其 SHA 写入 `.apply-isolation.json.optimizationBaselineCommit`
  - SHALL 委托 fresh optimizer 取得方向台账
  - SHALL 只实现本轮唯一选中的方向
  - SHALL 委托 fresh reviewer 复核该轮改动
  - SHALL 在该轮结束后重新判断剩余方向

- **成功 checkpoint 包含方向 ID**

  - 选中的方向通过该轮复核
  - apply SHALL 创建包含方向 ID 的增量 checkpoint commit
  - SHALL 保留该 commit 供后续轮次作为最近成功状态

- **失败回滚保留 quality 记录且不残留改动**

  - 该轮复核返回 `FAIL_NEEDS_CORRECTIONS`
  - CLI 已把失败事件与失败方向写入 quality 记录
  - Apply SHALL 把 quality 记录与 `.apply-isolation.json` 快照到 repository 外并分别记录 SHA-256
  - SHALL 在确认当前 `HEAD` 为最近成功 checkpoint 后执行 `git reset --hard HEAD` 和 `git clean -fd`
  - SHALL 原子恢复两个持久状态文件并校验各自 SHA-256
  - 恢复失败、hash 不匹配或仍有未回滚文件时 SHALL 停止

### Section: 失败方向记录

系统 SHALL 以方向 ID、目标位置、关键设计边界与 reviewer 失败证据记录失败方向。未达 `optimization.directionRetries` 时 optimizer MAY 提供实质不同的方案；达到上限后该方向 SHALL 被否决，但系统 SHALL 继续评估其他方向。

- **记录方向失败**

  - 选中方向的该轮复核失败
  - 系统 SHALL 追加该方向的失败事件与失败证据
  - SHALL 在失败方向记录中写入该方向的设计边界与失败原因

- **后续 optimizer 避免重复**

  - optimizer 重新判断方向
  - SHALL 读取失败方向记录
  - SHALL NOT 通过换措辞重复已达上限的方向

### Section: 主 agent 和 subagent 角色分工

系统 SHALL 区分三类职责：reviewer 判断行为是否正确；optimizer 判断正确实现是否值得及如何优化；master agent 负责 TDD 编码、证据收集与有证据的撤销。Master SHALL 按选中方向的 keyDesign 与 preservation constraints 实现，MUST NOT 自行生成、跳过或否决优化方向。要撤销某个方向时 SHALL 在台账中提交理由与证据。

- **optimizer 提供判断与关键设计**

  - 优化轮次执行
  - 系统 SHALL 委托 fresh optimizer
  - optimizer SHALL 输出方向、修改意见、keyDesign 与 validation
  - SHALL NOT 修改文件或输出逐字补丁

- **master 实现选中方向**

  - CLI 已记录本轮选中方向
  - master SHALL 按 TDD 修改代码与测试
  - SHALL 记录方向 ID 及任何非实质实现细节差异

- **reviewer 独立复核**

  - master 完成选中方向
  - 系统 SHALL 委托 fresh reviewer
  - reviewer SHALL 判断 preservation constraints 是否保持
  - SHALL NOT 重新判断该方向是否值得优化

### Section: 配置驱动优化控制

`optimization.enabled` SHALL 控制 Optimization 是否运行；`optimization.directionLimit` SHALL 限制可选取的新方向数；`optimization.directionRetries` SHALL 只限制同一方向的失败次数，不限制成功轮次数；`optimization.minImpactLevel` SHALL 声明可选取的最低 `impactLevel`，未配置时视为 `low`。门槛由 CLI 在选择阶段确定性执行，低于门槛的方向永不被选中。

- **方向数上限与失败额度互不消耗**

  - `directionRetries` 为 2 且存在三个依次通过复核的方向
  - 三个方向 SHALL 均允许完成，成功不消耗失败额度

- **门槛由 CLI 确定性执行**

  - 已配置 `minImpactLevel` 且某方向低于该值
  - CLI 在选择阶段不选取该方向
  - 当全部待选方向均低于门槛时该轮以 `NO_ACTIONABLE` 收口

### Section: Apply 读取 Quality 诊断信息

当 quality 状态记录存在时，apply SHALL 读取其中的诊断信息，把它作为修复上下文注入任务实现循环。

- **检测到失败的 Review 记录**

  - apply 检测到 `.xirang/changes/<name>/.quality-state.json` 存在且 result 为 `FAIL_NEEDS_CORRECTIONS`
  - apply SHALL 读取该记录的 `issues` 数组
  - 对每个被 unmark 的 task，将对应的 issue 作为修复指导注入上下文

- **检测到 Required Corrections section**

  - apply 读取 `tasks.md` 发现存在 `## Required Corrections` section
  - apply SHALL 将修正事项条目视为优先修复项
  - SHALL 在实现被 unmark 的 task 时引用对应条目作为修复方向

- **artifact_fix 类型的修正事项处理**

  - apply 遇到 `[artifact_fix]` 类型的修正事项条目
  - apply SHALL 修改对应的 artifact 而非代码
  - SHALL 标记该修正事项为完成

- **记录通过或不存在**

  - quality 状态记录不存在，或 result 为 `PASS` 或 `PASS_WITH_WARNINGS`
  - apply SHALL 按原有逻辑执行，不注入额外修复上下文

### Section: Apply reference 拥有 checkpoint 编排

checkpoint 创建、成功提交、失败回滚与状态恢复 SHALL 由 Apply reference 定义。Reviewer 合约 SHALL 只负责该轮复核结论，不得创建、恢复或消费 git checkpoint。

- **Reviewer 只返回复核结论**

  - reviewer subagent 执行该轮复核
  - reviewer SHALL 验证选中方向的 preservation constraints
  - SHALL NOT 执行 git commit、reset、clean 或 worktree 操作

- **Apply reference 编排 checkpoint**

  - Apply 模板执行优化循环
  - reference SHALL 定义非空 baseline commit 与成功方向 checkpoint commit
  - SHALL 定义失败时对 quality 记录与 `.apply-isolation.json` 的 repository-external snapshot、实现回滚、原子恢复与 SHA-256 校验
  - SHALL 保留失败历史、失败方向与 `optimizationBaselineCommit`
