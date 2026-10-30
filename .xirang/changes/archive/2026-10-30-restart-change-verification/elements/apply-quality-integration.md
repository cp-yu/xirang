---
entity: element-declaration
identity: apply-quality-integration
kind: element
parent: apply
title: Apply Quality Integration
definition: Apply Quality Integration 定义 Apply 与 Quality 的集成契约：Review 记录先写回再持久化、以轮为单位的优化循环、失败方向记录、主 agent 与 subagent 的角色分工、配置驱动的优化控制，以及 Apply reference 拥有的 checkpoint 编排。它不定义 Quality 自身的状态判定与命令面。
---

## MODIFIED Sections

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
  - Apply SHALL 把三份当前状态文件 `.quality-state.json`、`.quality-log.jsonl`、`.apply-isolation.json` 与完整质量历史目录保存到 repository 外并记录清单与 SHA-256
  - SHALL 在确认当前 `HEAD` 为最近成功 checkpoint 后执行 `git reset --hard HEAD` 和 `git clean -fd`
  - SHALL 恢复三份当前状态文件与完整质量历史目录，并校验文件集合及各自 SHA-256
  - 恢复失败、hash 不匹配或仍有未回滚文件时 SHALL 停止

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

失败回滚的 repository-external 保存范围 SHALL 包含三份当前状态文件 `.quality-state.json`、`.quality-log.jsonl`、`.apply-isolation.json` 和完整质量历史目录。Apply reference SHALL 先保存清单与 SHA-256，再回滚 speculative code，最后恢复并校验全部当前及历史文件；未跟踪的历史不得被 `git clean -fd` 永久清除。恢复不完整时停止，不进入后续优化判断。

## ADDED Sections

### Section: 共享恢复 reference 编排重验

Apply SHALL 提供共享恢复 reference，Archive SHALL 复用同一 reference；恢复使用现有 `quality review`、`quality optimize`、`quality status` 和 `quality seal`，不提供 `xirang quality reset` 子命令。

遇到 `ABORTED_UNSAFE` 时，Agent SHALL 保留阻塞观察与 CLI 诊断，停止自动推进，并加载恢复 reference 说明后续行动。用户明确要求重新开始验证（例如“从头 review optimize”）即授权 Agent 保存历史、轮换当前质量记录并记录原因，无须用户手工执行或重复确认同一意图。其他优化终态后的显式重验使用同一流程。未获得重启授权时保持停止，不把普通修正、回滚或中断续跑自动升级为重启。

恢复前 SHALL 确认原流程已停稳，无仍在运行的 Reviewer、Optimizer、实现任务或待处理结果、回写、提交、回滚。恢复 SHALL 沿用 `.apply-isolation.json` 的工作区身份与不可变 `baseCommit`，不重新初始化隔离，不自动回退或删除代码，也不删除已有 commits/checkpoints。Agent 依据已知任务与工作区信息遵守串行前提；CLI 不承担外部 subagent 进程检测或取消职责。

Apply 的进入与中断续跑 SHALL 在依据根目录记录路由到 Review 前检查未完成的轮换；部分缺失不得被误当作可以新建活动记录的入口。

Agent SHALL 按受控轮换规则保存并校验旧快照、日志与原因，轮换完成后检查 `quality status` 为 `dirty`，再委派 fresh Reviewer。新 Review 失败返回修正循环；通过后才按现有规则建立或验证本轮 checkpoint 并进入 Optimization。新台账不继承旧终态或计数，历史仅供判断参考。

- **已有明确请求**：用户说“从头 review optimize”，原流程已结束；Agent 执行恢复 reference，不再次询问是否重启。
- **未授权 unsafe**：Optimizer 报告冲突并记为 `ABORTED_UNSAFE`，用户尚未要求重启；Agent 展示问题与恢复路径，不轮换记录或自动修正后复审。
- **保留原工作区**：原 Change 使用 worktree，已有 `baseCommit` 和多个 checkpoint；重启保留同一 worktree 身份、原证据基线、代码与 commits，新 Review 自主读取当前实现。

### Section: 恢复交付的验证证据

恢复实现的交付 SHALL 具有可复现的行为证据。既有状态引擎与 CLI 回滚测试 SHALL 保护历史 PASS 匹配后最新失败计数、方向状态和 unsafe 终态仍保留的行为；优先修改现有测试，不建立平行的重复套件。

reference 中的文件操作 SHALL 通过一次性临时 Change 与临时 Git 仓库流程验证，不为解释性文档措辞新增持久锁词测试。验证 SHALL 覆盖：代码未变时轮换后仍须新 Review，Optimization 新额度从零开始；保存或轮换中断不丢历史；后续失败优化回滚仍保留历史；Apply、Archive 生成结果可达同一恢复 reference，Reviewer 与 Optimizer 能读取历史。

持久测试 SHALL 验证可观察状态或 CLI 门禁，可因真实行为变异而失败；构建、类型检查、平台路径与生成结果检查 SHALL 保留一次性证据。路径操作 SHALL 具有 Windows 与 POSIX 一致的验证结果。
