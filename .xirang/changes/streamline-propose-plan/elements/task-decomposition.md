---
entity: element-declaration
identity: task-decomposition
kind: element
parent: apply
title: Task Decomposition
definition: Task Decomposition 定义 Apply Phase 0 如何依据 `tasks.md` 中已形成的 task-level TDD 闭环执行实现工作、收集证据、更新进度并处理失败恢复。它不定义执行主体、任务调度方式或具体实现方法。
---

## MODIFIED Sections

### Section: Apply Phase 0 SHALL 依据 task-level TDD 处理 pending task

Apply Phase 0 SHALL 读取 `tasks.md` 中的未完成目标及验证方向，以目标 Semantic Model、Change Plan、项目约束和当前实现证据动态确定实施步骤、代码范围、测试动作与顺序。对用户明确要求的目标顺序 SHALL 遵守；通常的技术依赖由 Apply 根据现场决定，不以额外编排规则替代 Contract。每个目标 SHALL 形成适用的实现和验证闭环，只有验证证据充分才更新该目标完成状态。

- **处理未完成目标**
  - tasks.md 含待实现目标
  - Apply SHALL 读取目标与验证方向，确定具体实现与验证方式并取得证据

- **实现纪律保持中性**
  - apply skill 被加载
  - skill SHALL 用 `Implementation Discipline` 提供不绑定执行主体、调度方式或临时材料的指导

- **非隔离流程步骤指向 reference**
  - Apply 执行 Preparation、Review、Optimization 或 Seal
  - SHALL 读取对应 `.xirang/references/xirang-apply-step-<N>-<name>.md`，skill body 只保留描述与路径

- **隔离方法只读取一个 reference**
  - 已选择 branch、worktree 或 current-branch
  - Apply SHALL 只读取所选 Step 2 reference，不读另两个互斥方法

### Section: Checks 是任务进度源

系统 SHALL 使用 `tasks.md` 的目标级 checkbox 和 Required Corrections 记录 Apply Phase 0 进度与恢复工作。目标的实现与适用验证证据均成立时 SHALL 勾选目标；证据不足时 SHALL 保持未完成，不把具体文件、命令、测试结果或执行日志回填 tasks。现有 `.quality.json` SHALL 仅用于保存 commit-bound Review 意见、Opt 处置和 Seal 的验证范围/判断摘要，不作为测试输出日志；本流程 SHALL NOT 新增持久化的逐项目标测试日志。Reviewer SHALL 从当前项目与可复现证据独立判断，而不是信任 checkbox 或摘要。

- **完成目标后勾选**
  - 实施已完成且适用验证实际通过
  - 系统 SHALL 勾选该目标；无证据时不得勾选

- **Required Corrections 优先**
  - tasks 包含未完成的 `## Required Corrections` 项
  - 系统优先处理相关 `[code_fix]` 或 `[artifact_fix]`，证据通过后勾选

- **跨平台命令兼容**
  - 系统执行或生成涉及路径的命令
  - SHALL 使用 Node.js path 模块，不硬编码平台路径分隔符

### Section: 任务执行失败处理

系统 SHALL 在目标执行遇到非预期失败时先诊断再修复，每次修复只改变一个变量，并在同一目标累计 3 次修复仍未解决时停止并呈现证据；连续 2 次相同 normalized error signature SHALL 快速 pause。补充上下文时，Apply SHALL 使用 Change artifacts、formal Contracts、Semantic Model navigation 与当前 code evidence；MUST NOT 读取或要求 code-map，也 MUST NOT 使用已移除的 query navigation options。

- **目标或验证方向不明确**
  - Apply 发现目标含糊
  - SHALL 先读取 proposal、design、Delta Contracts、formal Contracts 与项目代码；使用 `xirang arch impact` 和针对性 `xirang arch query --contract` 查明语义，不因首次模糊立即询问用户

- **项目上下文不足**
  - Apply 无法找到相关现有代码或测试
  - SHALL 使用 CodeGraph 或 `rg`/`read` 获取实现证据，将探索转为当前目标的可验证步骤，不从模型猜 code paths

- **同一错误重复失败快速暂停**
  - 同一目标的同一 normalized error signature 连续失败 2 次
  - SHALL pause 并报告目标、实际检查、命令、失败类型、错误及已尝试修正

- **累计修复次数达到上限**
  - 同一目标累计 3 次修复未解决
  - SHALL 停止并报告已尝试路径、根因判断与怀疑方向，等待用户指导
