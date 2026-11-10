---
entity: element-declaration
identity: change-archive
kind: element
parent: change-closure
title: Change Archive
definition: Change Archive 是在 Quality Seal、Sync、任务和最终验证门禁通过后封存活动 Change 的能力。它将活动目录原样移动到带日期的归档位置，保留最终来源及证据；后续 Git 流程由 Agent 按 Archive 工作指导推进。它不创建或重算展示制品，不修改正式模型，也不执行 Git 写操作。
---

## Specification

### Section: Change Selection

archive 命令 SHALL 支持交互式和直接指定两种 change 选择方式。

- **Interactive selection**

  - 未提供 change-name
  - 显示可用 changes 的交互列表（排除 `archive/`）并允许选择一个

- **Direct selection**

  - 提供 change-name
  - 直接使用该 change 并校验其存在

- **Change selection prompt**

  - agent executes `xirang archive` without specifying a change
  - the agent prompts user to select from available changes
  - shows only active changes (excludes archive/)

### Section: Artifact Completion Check

Archive 流程 SHALL 在归档前检查 artifact 完成状态：任一 artifact 状态非 `done` 时列出未完成 artifacts 并要求用户确认后才可继续；全部完成时无 warning 继续。该检查独立于 task completion 与 quality/sync gates。

- **Incomplete artifacts warning**

  - agent 通过 `xirang status --change "<change-name>" --json` 检查 artifact 状态
  - 一个或多个 artifact 的状态非 `done`
  - 显示列出未完成 artifacts 的 warning
  - 提示用户确认是否继续
  - 用户确认后继续

- **All artifacts complete**

  - agent 检查 artifact 状态
  - 全部 artifacts 的状态为 `done`
  - 无 warning 继续

- **Archive a change with all artifacts complete**

  - agent executes `xirang archive` with a change name
  - all artifacts in the schema are complete
  - all tasks are complete
  - the agent moves the change to `.xirang/changes/archive/YYYY-MM-DD-<name>/`
  - 返回必要的归档位置，不附成功装饰或通用状态摘要

### Section: Task Completion Check

archive 命令 SHALL 在归档前验证任务完成状态，防止过早归档。

- **Incomplete tasks found**

  - 发现未完成任务（标记为 `- [ ]`）
  - 显示全部未完成任务并要求用户确认继续
  - 出于安全默认回答 "No"

- **All tasks complete**

  - 所有任务完成或不存在 tasks.md
  - 不提示直接继续归档

### Section: Archive Process

Archive SHALL 在 quality、sync、task 与 final change validation gates 通过后，将 active change directory 原样移动到 date-prefixed archive path。Archive MUST NOT 再次修改 Formal Semantic Model，也不得创建、重算或覆盖任何 View presentation artifact。effective diff 仅由只读 `xirang validate --change <name> --preview` 以 ephemeral text/JSON 输出提供，不持久化。

- **直接归档**

  - 所有 gates 通过且 change directory 存在
  - SHALL 运行只读完整校验并以退出码确认结果及 fingerprints 当前，不要求解析成功文字
  - SHALL 将 change directory 原样移动到 `YYYY-MM-DD-<change-name>`
  - SHALL 返回必要的归档位置，后续 Git 指导由 Archive workflow 承载
  - SHALL NOT 创建、重算或覆盖任何 presentation artifact
  - SHALL NOT 执行 git 写操作

- **已归档 change 检测**

  - target archive path 已存在且 active change 不存在
  - SHALL 返回已有归档位置后退出，不重复 Git handoff 指导

- **Final validation 失败**

  - final change validation 失败
  - SHALL 终止 archive
  - active change directory SHALL 保持原样

- **归档失败不回写**

  - 任一 archive gate 失败
  - SHALL 不移动 change directory
  - SHALL NOT 修改 Formal Semantic Model

- **封存已同步的 change 与证据**

  - archive gates 确认 graph 与 contract operations 已 sync
  - SHALL 将 active change directory（source delta 与既有证据）原样移动到 archive
  - MUST NOT 重写 Formal content
  - MUST NOT 生成 review report 或 presentation 文件

### Section: Error Conditions

archive 命令 SHALL 优雅处理各种错误条件。

- **Handling errors**

  - errors 发生
  - 处理缺失 `.xirang/changes/` 目录、change 未找到、archive target 已存在与文件系统权限问题

- **Archive already exists**

  - target archive directory already exists
  - fail with error message
  - suggest renaming existing archive or using different date

### Section: Display Output

Archive SHALL 保留实际 gate 诊断与必要归档位置，不在默认成功输出中重复 Quality/Sync/task/validation 摘要或 Git handoff 提醒。Quality、同步或任务门禁失败时 SHALL 给出具体原因；--no-validate 的 unsafe warning SHALL 保留，未验证不得声称 Passed。

CLI SHALL 不声称执行过测试、Seal commit 匹配当前 HEAD/工作区或存在 successful checkpoint，不重新判断意见文本充分性，不创建 Git commit。Archive 完成后 SHALL 由 Agent 按既有工作流继续提交 Change 与 Quality JSON，Seal 或 Archive 前不要求单独提交质量记录。

### Section: Archive Validation

Archive SHALL 在移动 change 前执行完整 change compiler validation。`--no-validate` MAY 跳过一般 validation gate，但 MUST NOT 将未验证结果标记为 Passed。

- **Pre-archive validation**

  - 执行 `xirang archive change-name`
  - SHALL materialize Target Semantic Model 并验证完整 Semantic Delta
  - validation 通过后 SHALL 将 change directory 原样移动到 archive

- **Force archive without validation**

  - 执行 `xirang archive change-name --no-validate`
  - SHALL 显示 unsafe warning
  - 输出 SHALL 明确反映实际 validation 状态
  - MUST NOT 将未验证结果标记为 Passed

- **跨平台 archive path**

  - archive 在 Windows、macOS 或 Linux 移动 change directory
  - SHALL 使用 Node.js path API 构造 active 与 archive paths
  - SHALL 保持移动内容的字节不变

### Section: Sync Gate

archive 命令 SHALL 要求 Sync 作为已完成前置条件：存在未合并 delta 时阻止归档并指引先完成 Sync；不存在 `--no-sync` 跳过通道。pending Semantic Delta SHALL 阻塞 archive。

- **存在未合并 delta 时阻止归档**

  - change 包含尚未通过 sync 合并到 formal 模型的 delta
  - archive 命令 SHALL 输出错误消息指明 pending delta
  - SHALL 提示用户执行 `xirang sync` 后重试
  - SHALL 终止归档操作

- **delta 已全部合并时通过检查**

  - change 的所有 delta 已通过 sync 合并到 formal 模型
  - sync gate SHALL 通过
  - archive 命令 SHALL 继续后续步骤

- **仅含 removal delta 且目标已不存在**

  - change delta 仅包含 REMOVED 操作
  - 对应 formal 模型中所有被移除的 header 已不存在
  - sync gate SHALL 将该项 delta 视为已同步
  - SHALL NOT 阻止归档

- **未同步 delta 阻塞 archive**

  - graph 或 contract operation 仍 pending
  - SHALL 阻塞 archive
  - SHALL 指引先运行 sync

### Section: Agent 在归档后继续 git 流程

Archive CLI 完成 quality、sync 与 move-to-archive 后，Agent SHALL 无条件继续归档后的 git 流程：先提交残余实现 diff（如有），再无条件创建 semantic boundary commit，然后提交归档制品。

- **无条件创建 semantic boundary commit**

  - archive CLI 完成 sync 与 mv
  - 残余实现 diff 已提交或不存在
  - agent SHALL 创建 `--allow-empty` 的 semantic boundary commit
  - boundary commit SHALL 发生在归档制品提交之前
  - boundary commit 的 subject SHALL 使用真实语义类型而非 `meta`

- **boundary commit message 承载完整 change 总结**

  - agent 生成 semantic boundary commit message
  - message body SHALL 包含 `## Why` 章节（来自 proposal 与 design）
  - SHALL 包含 `## Changes` 章节（按文件清单逐文件描述改动原因）
  - SHALL 以 `Implementation: <base>..<head> (carried by <commits>)` footer 记录 effective diff 范围

### Section: Boundary commit SHALL 覆盖完整 diff 清单与承载 commits

Boundary commit message 的 `## Changes` 章节 SHALL 如实列出 diff 清单中存在但归档制品未提及的文件；`Implementation:` footer SHALL 记录 effective diff 范围，并列出承载该 diff 的 commits（含 `wip: opt-*` checkpoint commits 与刚创建的普通 implementation commit）。

- **diff 清单中归档制品未提及的文件如实列出**

  - agent 生成 semantic boundary commit message
  - `git diff --name-only <base>..<head>` 包含归档制品未提及的文件
  - `## Changes` 章节 SHALL 如实列出这些文件并描述改动原因
  - SHALL NOT 省略或隐藏未提及文件

- **Implementation footer 列出承载 commits**

  - agent 生成 semantic boundary commit message
  - `Implementation:` footer SHALL 记录 `Implementation: <base>..<head> (carried by <commits>)` effective diff 范围
  - 承载 commits 列表 SHALL 包含 `wip: opt-*` checkpoint commits 与刚创建的普通 implementation commit

- **非 git 仓库时只报告归档结果**

  - 项目根目录不是 git 仓库
  - archive skill SHALL 报告 archive CLI 已完成的归档结果
  - SHALL NOT 尝试执行 git 提交、合并或分支清理

- **agent 继续 git 流程**

  - archive CLI 完成 sync 与 mv
  - archive skill SHALL 由 agent 继续处理 git 提交流程
  - agent SHALL 按顺序处理：残余实现 diff 提交（如有）、semantic boundary commit、Xirang/docs 归档制品提交
  - agent SHALL 在生成归档制品 commit message 前读取 `git.commitMessage.archive` 指向的用户模板，未配置时读取 `.xirang/references/xirang-archive-commit-message.md`

- **存在未提交实现变更**

  - archive CLI 完成 sync 与 mv
  - 工作区仍存在未提交的真实项目实现变更
  - agent SHALL 先创建普通 implementation commit
  - 该 commit SHALL 只承载尚未提交的真实项目实现变更
  - agent SHALL 在该 commit 之后继续创建 semantic boundary commit

### Section: Archive 消费 Apply isolation metadata

Archive skill SHALL 在调用 archive CLI 前读取并保留 active change 的 `.apply-isolation.json`；归档 commits 完成后，Archive SHALL 按 `method` 执行后续导航、merge 与 cleanup；CLI 本身 SHALL NOT 执行这些 Git 操作。

- **Branch isolation 返回原分支合并**

  - retained metadata 的 `method` 为 `branch`
  - Archive SHALL 在归档 commits 完成后切换到 `originalBranch`
  - SHALL 按投影的 merge strategy 合并 `branchName`

- **Worktree isolation 从 sourceRoot 合并并清理**

  - retained metadata 的 `method` 为 `worktree`
  - Archive SHALL 在 `worktreePath` 中完成归档 commits
  - SHALL 验证 `sourceRoot` 当前分支为 `originalBranch`
  - SHALL 使用 `git -C <sourceRoot>` 按投影策略合并 `branchName`
  - 成功合并且 Apply worktree clean 后 SHALL 执行 `git worktree remove <worktreePath>`
  - 配置要求删除 branch 时 SHALL 在 worktree 删除后确认 merged 再删除 `branchName`

- **Source workspace 的无关修改受保护**

  - worktree archive 访问 `sourceRoot`
  - Archive MUST NOT reset、clean、stash 或 commit 无关 source-workspace 修改
  - metadata 与当前状态不匹配时 SHALL 停止并报告，不得猜测

- **Current branch 不执行隔离 cleanup**

  - retained metadata 的 `method` 为 `none`
  - Archive SHALL NOT 切换或合并当前 branch
  - SHALL NOT 删除 worktree 或当前 branch

### Section: Archive 通过 projection 消费 git 配置

archive 流程 SHALL 通过统一 prompt/runtime projection 消费 `git` 配置节点，而非直接读取 raw YAML 键。

- **配置经投影后被 archive 消费**

  - archive 需要决定归档后 git 流程的 commit message 模板与 merge 策略
  - archive SHALL 从 projection 读取 `git.commitMessage.*`、`git.merge.strategy` 与 `git.branch.deleteAfterArchive`
  - SHALL NOT 在模板正文里直接解析 config.yaml
  - projection 缺失字段时 SHALL 使用默认行为

- **陈旧 projection 字段不再出现**

  - archive surface 请求 prompt/runtime projection
  - projection SHALL NOT 输出 `git.autoCommit` 等退役字段

- **Archive guidance inherits projected authoring constraints**

  - the skill explains the Sync prerequisite or Required Corrections handling
  - it SHALL use the shared prompt projection contract for prose guidance
  - SHALL preserve canonical structure and normative tokens unchanged

### Section: Archive 在用户显式要求时允许绕过 quality gate

archive 流程 SHALL 在用户显式要求时允许向 archive CLI 传递 `--no-verify` 标志；未显式要求时优先引导标准 quality gate 流程。

- **用户显式要求绕过 gate**

  - 用户明确指示跳过质量门禁（例如"直接 --no-verify"、"跳过验证"）
  - agent SHALL 向 `xirang archive <change-name>` 命令传递 `--no-verify` 标志
  - agent SHALL NOT 阻拦或要求用户先完成 quality Review

- **用户未要求绕过时优先标准流程**

  - 用户未显式要求跳过质量门禁
  - Review 记录缺失或与当前代码不一致
  - agent SHALL 优先执行标准 quality 流程
  - agent SHALL NOT 自行决定使用 `--no-verify`

### Section: Archive quality freshness routing

Archive SHALL 根据 quality status 的实际证据关联和缺口路由：缺基线则委托独立 Review；已有基线而委托未完或中断则按共享恢复协议继续原委托；最终验证缺失或过期则由主 Agent 重判并补足。优化后的代码变化不自动意味着整 Change Review 重跑。内容及证据关联不变时，HEAD informational 差异不触发重审。明确不支持旧格式时保留历史并报告，不自动迁移或删除。

### Section: Archive Quality Seal routing

Archive SHALL 在 Quality gate 失败时报告缺少或不可解析的 Seal commit，并指引主 Agent 返回 Apply 补齐正确的 Review、Opt disposition 或 Seal。Archive Quality gate SHALL 只检查新 JSON 中存在 Seal 且其 commit 对象仍存在；不比较 HEAD、工作区 clean 状态或当前实现与 Seal commit 内容，不因工作区变化重跑 Quality。Sync、Semantic Delta validation 与 task gates 仍独立执行。
