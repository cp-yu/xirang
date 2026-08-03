---
entity: element-declaration
identity: change-archive
kind: element
parent: change-closure
title: Change Archive
definition: Change Archive 定义归档已完成 Change 的行为：在 verify、sync、task 与 final validation gates 通过后将 active change directory 原样移动到 date-prefixed archive path、输出 git handoff 提醒，并由 Agent 在 CLI 完成后继续 git 流程；Archive 不创建、重算或覆盖任何 presentation artifact，也不执行 git 写操作。
---

## Requirements

### Requirement: Change Selection

archive 命令 SHALL 支持交互式和直接指定两种 change 选择方式。

#### Scenario: Interactive selection

- **WHEN** 未提供 change-name
- **THEN** 显示可用 changes 的交互列表（排除 `archive/`）并允许选择一个

#### Scenario: Direct selection

- **WHEN** 提供 change-name
- **THEN** 直接使用该 change 并校验其存在
#### Scenario: Change selection prompt
- **WHEN** agent executes `xirang archive` without specifying a change
- **THEN** the agent prompts user to select from available changes
- **AND** shows only active changes (excludes archive/)
### Requirement: Artifact Completion Check

Archive 流程 SHALL 在归档前检查 artifact 完成状态：任一 artifact 状态非 `done` 时列出未完成 artifacts 并要求用户确认后才可继续；全部完成时无 warning 继续。该检查独立于 task completion 与 verify/sync gates。

#### Scenario: Incomplete artifacts warning

- **WHEN** agent 通过 `xirang status --change "<change-name>" --json` 检查 artifact 状态
- **AND** 一个或多个 artifact 的状态非 `done`
- **THEN** 显示列出未完成 artifacts 的 warning
- **AND** 提示用户确认是否继续
- **AND** 用户确认后继续

#### Scenario: All artifacts complete

- **WHEN** agent 检查 artifact 状态
- **AND** 全部 artifacts 的状态为 `done`
- **THEN** 无 warning 继续
#### Scenario: Archive a change with all artifacts complete
- **WHEN** agent executes `xirang archive` with a change name
- **AND** all artifacts in the schema are complete
- **AND** all tasks are complete
- **THEN** the agent moves the change to `.xirang/changes/archive/YYYY-MM-DD-<name>/`
- **AND** displays success message with archived location
### Requirement: Task Completion Check

archive 命令 SHALL 在归档前验证任务完成状态，防止过早归档。

#### Scenario: Incomplete tasks found

- **WHEN** 发现未完成任务（标记为 `- [ ]`）
- **THEN** 显示全部未完成任务并要求用户确认继续
- **AND** 出于安全默认回答 "No"

#### Scenario: All tasks complete

- **WHEN** 所有任务完成或不存在 tasks.md
- **THEN** 不提示直接继续归档

### Requirement: Archive Process

Archive SHALL 在 verify、sync、task 与 final change validation gates 通过后，将 active change directory 原样移动到 date-prefixed archive path。Archive MUST NOT 再次修改 Formal Semantic Model，也不得创建、重算或覆盖任何 View presentation artifact。effective diff 仅由只读 `xirang validate --change` 以 ephemeral text/JSON 输出提供，不持久化。

#### Scenario: 直接归档
- **WHEN** 所有 gates 通过且 change directory 存在
- **THEN** SHALL 运行只读 `xirang validate --change` 确认 validation status 为 Passed 且 fingerprints 当前
- **AND** SHALL 将 change directory 原样移动到 `YYYY-MM-DD-<change-name>`
- **AND** SHALL 输出 git handoff 提醒
- **AND** SHALL NOT 创建、重算或覆盖任何 presentation artifact
- **AND** SHALL NOT 执行 git 写操作

#### Scenario: 已归档 change 检测
- **WHEN** target archive path 已存在且 active change 不存在
- **THEN** SHALL 输出已归档状态与 git handoff 提醒后退出

#### Scenario: Final validation 失败
- **WHEN** final change validation 失败
- **THEN** SHALL 终止 archive
- **AND** active change directory SHALL 保持原样

#### Scenario: 归档失败不回写
- **WHEN** 任一 archive gate 失败
- **THEN** SHALL 不移动 change directory
- **AND** SHALL NOT 修改 Formal Semantic Model
#### Scenario: 封存已同步的 change 与证据
- **WHEN** archive gates 确认 graph 与 contract operations 已 sync
- **THEN** SHALL 将 active change directory（source delta 与既有证据）原样移动到 archive
- **AND** MUST NOT 重写 Formal content
- **AND** MUST NOT 生成 review report 或 presentation 文件
#### Scenario: Successful archive
- **WHEN** archiving a change
- **THEN** create `archive/` directory if it doesn't exist
- **AND** generate target name as `YYYY-MM-DD-<change-name>` using current date
- **AND** move entire change directory to archive location
- **AND** preserve `.xirang.yaml` file in archived change
### Requirement: Error Conditions

archive 命令 SHALL 优雅处理各种错误条件。

#### Scenario: Handling errors

- **WHEN** errors 发生
- **THEN** 处理缺失 `.xirang/changes/` 目录、change 未找到、archive target 已存在与文件系统权限问题
#### Scenario: Archive already exists
- **WHEN** target archive directory already exists
- **THEN** fail with error message
- **AND** suggest renaming existing archive or using different date
### Requirement: Display Output

archive 命令 SHALL 提供清晰的 gate 状态反馈。

#### Scenario: 显示 gate 状态

- **WHEN** 执行 archive
- **THEN** 依次显示每个 gate 的通过/跳过/失败状态
- **AND** 显示 task 完成状态
- **AND** 归档完成后显示最终确认消息和 git handoff 提醒
#### Scenario: Archive summary reports sync prerequisite status
- **WHEN** archive completes
- **THEN** the summary SHALL report whether the Sync prerequisite is satisfied（pending delta 会阻止 archive）
- **AND** SHALL distinguish synced from blocked
#### Scenario: Archive complete with sync
- **WHEN** archive completes after the Sync prerequisite has been satisfied
- **THEN** display summary:
  - Contracts synced
  - Change archived to location
  - Schema that was used
#### Scenario: 摘要报告字段
- **WHEN** archive CLI 完成归档
- **THEN** 摘要 SHALL 包含以下字段：
  - change name
  - schema
  - archive location
  - verify gate result
  - sync 前置状态（已同步 / 因 pending delta 被阻塞）
  - next git responsibility（agent 继续处理）
#### Scenario: Archive blocked by pending delta
- **WHEN** change 仍存在未同步的 Semantic Delta
- **THEN** archive SHALL 被阻止
- **AND** 摘要 SHALL 指引先完成 `xirang sync` 后重试
- **AND** change 保持 active
#### Scenario: Archive complete with warnings
- **WHEN** archive completes with incomplete artifacts or tasks
- **THEN** include note about what was incomplete
- **AND** suggest reviewing if archive was intentional
#### Scenario: 不报告 CLI merge 结果
- **WHEN** archive CLI 完成归档
- **THEN** 摘要 SHALL NOT 声称 CLI 创建了 archive commit
- **AND** SHALL NOT 声称 CLI 执行了 merge
- **AND** SHALL NOT 声称 CLI 删除了 feature branch
### Requirement: Archive Validation

Archive SHALL 在移动 change 前执行完整 change compiler validation。`--no-validate` MAY 跳过一般 validation gate，但 MUST NOT 将未验证结果标记为 Passed。

#### Scenario: Pre-archive validation
- **WHEN** 执行 `xirang archive change-name`
- **THEN** SHALL materialize Target Semantic Model 并验证完整 Semantic Delta
- **AND** validation 通过后 SHALL 将 change directory 原样移动到 archive

#### Scenario: Force archive without validation
- **WHEN** 执行 `xirang archive change-name --no-validate`
- **THEN** SHALL 显示 unsafe warning
- **AND** 输出 SHALL 明确反映实际 validation 状态
- **AND** MUST NOT 将未验证结果标记为 Passed

#### Scenario: 跨平台 archive path
- **WHEN** archive 在 Windows、macOS 或 Linux 移动 change directory
- **THEN** SHALL 使用 Node.js path API 构造 active 与 archive paths
- **AND** SHALL 保持移动内容的字节不变

### Requirement: Sync Gate

archive 命令 SHALL 要求 Sync 作为已完成前置条件：存在未合并 delta 时阻止归档并指引先完成 Sync；不存在 `--no-sync` 跳过通道。pending Semantic Delta SHALL 阻塞 archive。

#### Scenario: 存在未合并 delta 时阻止归档

- **WHEN** change 包含尚未通过 sync 合并到 formal 模型的 delta
- **THEN** archive 命令 SHALL 输出错误消息指明 pending delta
- **AND** SHALL 提示用户执行 `xirang sync` 后重试
- **AND** SHALL 终止归档操作

#### Scenario: delta 已全部合并时通过检查

- **WHEN** change 的所有 delta 已通过 sync 合并到 formal 模型
- **THEN** sync gate SHALL 通过
- **AND** archive 命令 SHALL 继续后续步骤

#### Scenario: 仅含 removal delta 且目标已不存在

- **WHEN** change delta 仅包含 REMOVED 操作
- **AND** 对应 formal 模型中所有被移除的 header 已不存在
- **THEN** sync gate SHALL 将该项 delta 视为已同步
- **AND** SHALL NOT 阻止归档
#### Scenario: 未同步 delta 阻塞 archive
- **WHEN** graph 或 contract operation 仍 pending
- **THEN** SHALL 阻塞 archive
- **AND** SHALL 指引先运行 sync
### Requirement: Archive CLI 输出 git handoff 提醒

`xirang archive` 在完成 verify、sync 与 move-to-archive 后 SHALL 输出后续 git 工作由 agent 自动继续的责任归属提醒，不再读取或区分任何 handoff 模式配置。

#### Scenario: 归档完成后提醒 agent 接管

- **WHEN** `xirang archive <change>` 完成归档
- **THEN** CLI SHALL 输出归档已完成
- **AND** SHALL 提醒后续 git 提交流程由 agent 自动继续处理
- **AND** SHALL NOT 输出任何推荐 commit message
- **AND** SHALL NOT 读取 `git.autoCommit` 配置

### Requirement: Agent 在归档后继续 git 流程

Archive CLI 完成 verify、sync 与 move-to-archive 后，Agent SHALL 无条件继续归档后的 git 流程：先提交残余实现 diff（如有），再无条件创建 semantic boundary commit，然后提交归档制品。

#### Scenario: 无条件创建 semantic boundary commit

- **WHEN** archive CLI 完成 sync 与 mv
- **AND** 残余实现 diff 已提交或不存在
- **THEN** agent SHALL 创建 `--allow-empty` 的 semantic boundary commit
- **AND** boundary commit SHALL 发生在归档制品提交之前
- **AND** boundary commit 的 subject SHALL 使用真实语义类型而非 `meta`

#### Scenario: boundary commit message 承载完整 change 总结

- **WHEN** agent 生成 semantic boundary commit message
- **THEN** message body SHALL 包含 `## Why` 章节（来自 proposal 与 design）
- **AND** SHALL 包含 `## Changes` 章节（按文件清单逐文件描述改动原因）
- **AND** SHALL 以 `Implementation: <base>..<head> (carried by <commits>)` footer 记录 effective diff 范围

### Requirement: Boundary commit SHALL 覆盖完整 diff 清单与承载 commits

Boundary commit message 的 `## Changes` 章节 SHALL 如实列出 diff 清单中存在但归档制品未提及的文件；`Implementation:` footer SHALL 记录 effective diff 范围，并列出承载该 diff 的 commits（含 `wip: opt-*` checkpoint commits 与刚创建的普通 implementation commit）。

#### Scenario: diff 清单中归档制品未提及的文件如实列出

- **WHEN** agent 生成 semantic boundary commit message
- **AND** `git diff --name-only <base>..<head>` 包含归档制品未提及的文件
- **THEN** `## Changes` 章节 SHALL 如实列出这些文件并描述改动原因
- **AND** SHALL NOT 省略或隐藏未提及文件

#### Scenario: Implementation footer 列出承载 commits

- **WHEN** agent 生成 semantic boundary commit message
- **THEN** `Implementation:` footer SHALL 记录 `Implementation: <base>..<head> (carried by <commits>)` effective diff 范围
- **AND** 承载 commits 列表 SHALL 包含 `wip: opt-*` checkpoint commits 与刚创建的普通 implementation commit

#### Scenario: 非 git 仓库时只报告归档结果

- **WHEN** 项目根目录不是 git 仓库
- **THEN** archive skill SHALL 报告 archive CLI 已完成的归档结果
- **AND** SHALL NOT 尝试执行 git 提交、合并或分支清理
#### Scenario: agent 继续 git 流程
- **WHEN** archive CLI 完成 sync 与 mv
- **THEN** archive skill SHALL 由 agent 继续处理 git 提交流程
- **AND** agent SHALL 按顺序处理：残余实现 diff 提交（如有）、semantic boundary commit、Xirang/docs 归档制品提交
- **AND** agent SHALL 在生成归档制品 commit message 前读取 `git.commitMessage.archive` 指向的用户模板，未配置时读取 `.xirang/references/xirang-archive-commit-message.md`
#### Scenario: 存在未提交实现变更
- **WHEN** archive CLI 完成 sync 与 mv
- **AND** 工作区仍存在未提交的真实项目实现变更
- **THEN** agent SHALL 先创建普通 implementation commit
- **AND** 该 commit SHALL 只承载尚未提交的真实项目实现变更
- **AND** agent SHALL 在该 commit 之后继续创建 semantic boundary commit
### Requirement: Archive 消费 Apply isolation metadata

Archive skill SHALL 在调用 archive CLI 前读取并保留 active change 的 `.apply-isolation.json`；归档 commits 完成后，Archive SHALL 按 `method` 执行后续导航、merge 与 cleanup；CLI 本身 SHALL NOT 执行这些 Git 操作。

#### Scenario: Branch isolation 返回原分支合并

- **WHEN** retained metadata 的 `method` 为 `branch`
- **THEN** Archive SHALL 在归档 commits 完成后切换到 `originalBranch`
- **AND** SHALL 按投影的 merge strategy 合并 `branchName`

#### Scenario: Worktree isolation 从 sourceRoot 合并并清理

- **WHEN** retained metadata 的 `method` 为 `worktree`
- **THEN** Archive SHALL 在 `worktreePath` 中完成归档 commits
- **AND** SHALL 验证 `sourceRoot` 当前分支为 `originalBranch`
- **AND** SHALL 使用 `git -C <sourceRoot>` 按投影策略合并 `branchName`
- **AND** 成功合并且 Apply worktree clean 后 SHALL 执行 `git worktree remove <worktreePath>`
- **AND** 配置要求删除 branch 时 SHALL 在 worktree 删除后确认 merged 再删除 `branchName`

#### Scenario: Source workspace 的无关修改受保护

- **WHEN** worktree archive 访问 `sourceRoot`
- **THEN** Archive MUST NOT reset、clean、stash 或 commit 无关 source-workspace 修改
- **AND** metadata 与当前状态不匹配时 SHALL 停止并报告，不得猜测

#### Scenario: Current branch 不执行隔离 cleanup

- **WHEN** retained metadata 的 `method` 为 `none`
- **THEN** Archive SHALL NOT 切换或合并当前 branch
- **AND** SHALL NOT 删除 worktree 或当前 branch

### Requirement: Archive 通过 projection 消费 git 配置

archive 流程 SHALL 通过统一 prompt/runtime projection 消费 `git` 配置节点，而非直接读取 raw YAML 键。

#### Scenario: 配置经投影后被 archive 消费

- **WHEN** archive 需要决定归档后 git 流程的 commit message 模板与 merge 策略
- **THEN** archive SHALL 从 projection 读取 `git.commitMessage.*`、`git.merge.strategy` 与 `git.branch.deleteAfterArchive`
- **AND** SHALL NOT 在模板正文里直接解析 config.yaml
- **AND** projection 缺失字段时 SHALL 使用默认行为

#### Scenario: 陈旧 projection 字段不再出现

- **WHEN** archive surface 请求 prompt/runtime projection
- **THEN** projection SHALL NOT 输出 `git.autoCommit` 等退役字段
#### Scenario: Archive guidance inherits projected authoring constraints
- **WHEN** the skill explains the Sync prerequisite or Required Corrections handling
- **THEN** it SHALL use the shared prompt projection contract for prose guidance
- **AND** SHALL preserve canonical structure and normative tokens unchanged
### Requirement: Archive 在用户显式要求时允许绕过 verify gate

archive 流程 SHALL 在用户显式要求时允许向 archive CLI 传递 `--no-verify` 标志；未显式要求时优先引导标准 verify gate 流程。

#### Scenario: 用户显式要求绕过 verify

- **WHEN** 用户明确指示跳过 verify（例如"直接 --no-verify"、"跳过验证"）
- **THEN** agent SHALL 向 `xirang archive <change-name>` 命令传递 `--no-verify` 标志
- **AND** agent SHALL NOT 阻拦或要求用户先完成 verify

#### Scenario: 用户未要求绕过时优先标准 verify

- **WHEN** 用户未显式要求跳过 verify
- **AND** verify 结果缺失或 stale
- **THEN** agent SHALL 优先执行标准 verify 流程
- **AND** agent SHALL NOT 自行决定使用 `--no-verify`

### Requirement: Archive verify freshness routing

archive 流程 SHALL 根据 verify status 命令返回的 `freshness.status` 路由 verify 执行。

#### Scenario: FRESH 结果包含 informational HEAD 差异

- **WHEN** `freshness.status` 为 `FRESH`
- **AND** `archiveCompatibility.compatible` 为 `true`
- **AND** `freshness.information.gitHeadCommit.matches` 为 `false`
- **THEN** 流程 SHALL 复用已有 verify result
- **AND** SHALL NOT 仅因 Git HEAD 信息差异重新执行 reviewer

#### Scenario: MISSING 或 STALE 结果

- **WHEN** `freshness.status` 为 `MISSING` 或 `STALE`
- **THEN** 流程 SHALL 在继续 archive 前执行 full verify contract
- **AND** SHALL 在 full verify 完成后重新执行 status gate
#### Scenario: Informational 字段不覆盖 compatibility
- **WHEN** `freshness.status` 为 `FRESH`
- **AND** `archiveCompatibility.compatible` 为 `false`
- **THEN** skill SHALL 独立处理不兼容的 optimization 状态
- **AND** SHALL NOT 将 informational Git HEAD 字段视为 freshness stale 证据
