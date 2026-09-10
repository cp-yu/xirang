---
operation: MODIFIED
entity: element-declaration
identity: change-archive
kind: element
parent: change-closure
title: Change Archive
definition: Change Archive 定义归档已完成 Change 的行为：在 quality、sync、task 与 final validation gates 通过后将 active change directory 原样移动到 date-prefixed archive path、输出 git handoff 提醒，并由 Agent 在 CLI 完成后继续 git 流程；Archive 不创建、重算或覆盖任何 presentation artifact，也不执行 git 写操作。
---

## MODIFIED Requirements

### Requirement: Artifact Completion Check

Archive 流程 SHALL 在归档前检查 artifact 完成状态：任一 artifact 状态非 `done` 时列出未完成 artifacts 并要求用户确认后才可继续；全部完成时无 warning 继续。该检查独立于 task completion 与 quality/sync gates。

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

### Requirement: Archive Process

Archive SHALL 在 quality、sync、task 与 final change validation gates 通过后，将 active change directory 原样移动到 date-prefixed archive path。Archive MUST NOT 再次修改 Formal Semantic Model，也不得创建、重算或覆盖任何 View presentation artifact。effective diff 仅由只读 `xirang validate --change` 以 ephemeral text/JSON 输出提供，不持久化。

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

#### Scenario: 摘要报告字段
- **WHEN** archive CLI 完成归档
- **THEN** 摘要 SHALL 包含以下字段：
  - change name
  - schema
  - archive location
  - quality gate result
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

### Requirement: Archive CLI 输出 git handoff 提醒

`xirang archive` 在完成 quality、sync 与 move-to-archive 后 SHALL 输出后续 git 工作由 agent 自动继续的责任归属提醒，不再读取或区分任何 handoff 模式配置。

#### Scenario: 归档完成后提醒 agent 接管
- **WHEN** `xirang archive <change>` 完成归档
- **THEN** CLI SHALL 输出归档已完成
- **AND** SHALL 提醒后续 git 提交流程由 agent 自动继续处理
- **AND** SHALL NOT 输出任何推荐 commit message
- **AND** SHALL NOT 读取 `git.autoCommit` 配置

### Requirement: Agent 在归档后继续 git 流程

Archive CLI 完成 quality、sync 与 move-to-archive 后，Agent SHALL 无条件继续归档后的 git 流程：先提交残余实现 diff（如有），再无条件创建 semantic boundary commit，然后提交归档制品。

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

## REMOVED Requirements

### Requirement: Archive 在用户显式要求时允许绕过 verify gate

### Requirement: Archive verify freshness routing

## ADDED Requirements

### Requirement: Archive 在用户显式要求时允许绕过 quality gate

archive 流程 SHALL 在用户显式要求时允许向 archive CLI 传递 `--no-verify` 标志；未显式要求时优先引导标准 quality gate 流程。

#### Scenario: 用户显式要求绕过 gate
- **WHEN** 用户明确指示跳过质量门禁（例如"直接 --no-verify"、"跳过验证"）
- **THEN** agent SHALL 向 `xirang archive <change-name>` 命令传递 `--no-verify` 标志
- **AND** agent SHALL NOT 阻拦或要求用户先完成 quality Review

#### Scenario: 用户未要求绕过时优先标准流程
- **WHEN** 用户未显式要求跳过质量门禁
- **AND** Review 记录缺失或与当前代码不一致
- **THEN** agent SHALL 优先执行标准 quality 流程
- **AND** agent SHALL NOT 自行决定使用 `--no-verify`

### Requirement: Archive quality freshness routing

archive 流程 SHALL 根据 `xirang quality status` 命令返回的代码状态路由 Review 执行。

#### Scenario: clean 结果包含 informational HEAD 差异
- **WHEN** 代码状态为 `clean`
- **AND** `archiveCompatibility.compatible` 为 `true`
- **AND** 记录的 Git HEAD 与当前 HEAD 不一致
- **THEN** 流程 SHALL 复用已有 Review 记录
- **AND** SHALL NOT 仅因 Git HEAD 信息差异重新执行 reviewer

#### Scenario: 记录缺失或状态为 dirty
- **WHEN** 代码状态为 `MISSING` 或 `dirty`
- **THEN** 流程 SHALL 在继续 archive 前执行 full quality 流程
- **AND** SHALL 在完成后重新执行 status gate

#### Scenario: Informational 字段不覆盖 compatibility
- **WHEN** 代码状态为 `clean`
- **AND** `archiveCompatibility.compatible` 为 `false`
- **THEN** skill SHALL 独立处理不兼容的 Optimization 状态
- **AND** SHALL NOT 将 informational Git HEAD 字段视为状态不一致的证据
