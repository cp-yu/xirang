---
element: project.root/domain.cli/cap.cli.project-setup
---

# Update Command Specification

## Purpose

As a developer using OPSX, I want to update the OPSX instructions in my project when new versions are released, so that I can benefit from improvements to AI agent instructions.
## Requirements
### Requirement: Update Behavior

该命令 SHALL 根据全局配置刷新项目中的 OPSX skills 指令文件。

#### Scenario: 刷新现有工具制品

- **WHEN** 项目中已配置 AI 工具
- **THEN** 检测已安装的工具 skills 目录
- **AND** 为检测到的每个工具重新生成固定 workflow skills
- **AND** 使用相同的模板生成逻辑
- **AND** 显示更新摘要，列出刷新的工具
- **AND** SHALL NOT refresh slash command workflow artifacts

#### Scenario: 清理过时配置字段

- **WHEN** 全局配置包含 `profile`、`workflows` 或 `delivery` 字段
- **THEN** 自动删除这些字段
- **AND** 保存清理后的配置
- **AND** 输出警告："已移除过时配置字段：profile, workflows, delivery"
- **AND** 输出提示："现在固定安装 workflow skills"

#### Scenario: 项目配置默认值迁移

- **WHEN** 项目 `.opsx/config.yaml` 缺少功能性默认值
- **THEN** 以 missing-only 方式补齐默认值
- **AND** SHALL NOT 覆盖用户已设置的值
- **AND** 删除陈旧的 `git.merge.messageFrom`, `git.autoCommit` 与 `commitMessage.convention` 节点
- **AND** 补齐新的 git 功能性默认结构

### Requirement: Prerequisites
Update command SHALL 要求现有 `.opsx/` workspace，才能刷新 managed surfaces。

#### Scenario: Workspace 缺失
- **WHEN** `.opsx/` 不存在
- **THEN** update SHALL 失败，并指引运行 `opsx setup`
- **AND** SHALL NOT 创建 partial workspace

### Requirement: File Handling
The update command SHALL handle file updates in a predictable and safe manner.

#### Scenario: Updating files
- **WHEN** updating files
- **THEN** completely replace `opsx/AGENTS.md` with the latest template
- **AND** if a root-level stub exists, update the managed block content so it keeps directing teammates to `@/opsx/AGENTS.md`

### Requirement: Tool-Agnostic Updates

The update command SHALL refresh OPSX-managed skills in a predictable manner while respecting each team's chosen tooling.

#### Scenario: Updating files

- **WHEN** updating files
- **THEN** completely replace `opsx/AGENTS.md` with the latest template
- **AND** create or refresh the root-level `AGENTS.md` stub using the managed marker block, even if the file was previously absent
- **AND** update OPSX-managed skill files for configured AI tools
- **AND** avoid creating new native-tool configuration files such as slash commands or CLAUDE.md unless they are part of existing non-workflow OPSX behavior
- **AND** SHALL NOT refresh existing slash command workflow files

### Requirement: Core Files Always Updated
The update command SHALL always update the core OPSX files and display an ASCII-safe success message.

#### Scenario: Successful update
- **WHEN** the update completes successfully
- **THEN** replace `opsx/AGENTS.md` with the latest template
- **AND** if a root-level stub exists, refresh it so it still directs contributors to `@/opsx/AGENTS.md`

### Requirement: 工具感知的更新提示

`opsx update` SHALL 使用已刷新 workflow skills 的调用语义来展示 onboarding 与 restart guidance。

#### Scenario: 刷新 Codex skills 时显示精确的 skill 调用名

- **WHEN** `opsx update` 刷新或新配置了受管的 Codex workflow skills
- **THEN** 所有 getting-started 或 onboarding guidance SHALL 使用精确的受管 Codex skill 调用名，例如 `$opsx-propose`、`$opsx-new-change`、`$opsx-continue-change` 与 `$opsx-apply-change`
- **AND** 显示给用户的 Codex 引用 SHALL 使用 workflow 的 `skillDirName`，而不是 command slug
- **AND** SHALL NOT tell the user to run `/opsx:*`

#### Scenario: skills-only 重启提示避免 slash-command 文案

- **WHEN** `opsx update` 完成时刷新了 workflow skills
- **THEN** 所有 restart guidance SHALL 描述为刷新的 skills 或 workflow files 生效
- **AND** SHALL NOT mention slash commands taking effect

#### Scenario: 无精确 skill 调用语法时使用中性文案

- **WHEN** `opsx update` 为没有精确 skill invocation metadata 的工具输出 onboarding guidance
- **THEN** guidance SHALL 使用中性 skill invocation 文案
- **AND** SHALL reference the explicit `skillDirName`
- **AND** SHALL NOT fall back to command syntax

### Requirement: Update respects removed workflow-selection config

The update command SHALL refresh the fixed workflow skill set and SHALL ignore removed workflow-selection settings.

#### Scenario: Update adds missing workflows from config

- **WHEN** user runs `opsx update`
- **AND** global config specifies workflows not currently installed in the project
- **THEN** the system SHALL ignore the removed workflows setting
- **AND** generate missing fixed workflow skill files
- **AND** display added skill workflows when applicable

#### Scenario: Update refreshes existing workflows

- **WHEN** user runs `opsx update`
- **AND** workflows are already installed in the project
- **THEN** the system SHALL refresh those workflow skill files with latest templates
- **AND** display refreshed workflow names when applicable

#### Scenario: Update with no changes needed

- **WHEN** user runs `opsx update`
- **AND** installed skills match the fixed workflow set
- **AND** all templates are current
- **THEN** the system SHALL display: "Already up to date."

#### Scenario: Workflow drift with current templates

- **WHEN** user runs `opsx update`
- **AND** workflow templates are current for the installed skills
- **AND** global config contains removed profile, workflows, or delivery fields
- **THEN** the system SHALL treat stale config cleanup as an update-required state
- **AND** SHALL NOT add or remove command files

#### Scenario: Update summary output

- **WHEN** update completes with changes
- **THEN** the system SHALL display a summary of added or updated skills
- **AND** the system SHALL list affected tools
- **AND** the summary SHALL NOT report command files as generated, refreshed, or removed

### Requirement: Update detects configured tools from skills only

The update command SHALL treat a tool as configured only when it has generated OPSX skill files.

#### Scenario: Commands-only installation

- **WHEN** user runs `opsx update`
- **AND** a tool has generated OPSX command files
- **AND** that tool has no OPSX skill files
- **THEN** the tool SHALL NOT be treated as configured from command files alone
- **AND** the system SHALL NOT refresh or remove those command files

### Requirement: Update detects new tool directories
Update command SHALL 报告新检测到的 AI tool directories，并指引用户运行 `opsx setup` 进行配置。

#### Scenario: 检测到新工具
- **WHEN** supported tool directory 存在，但没有 managed OPSX skills
- **THEN** update SHALL 报告该工具
- **AND** SHALL NOT 静默配置该工具
- **AND** SHALL 指引用户运行 `opsx setup`

### Requirement: Update requires an OPSX project
`opsx update` SHALL 只在包含 `.opsx/` 的项目内运行。

#### Scenario: 在 OPSX 项目外运行
- **WHEN** `.opsx/` directory 不存在
- **THEN** update SHALL 报告 OPSX project 缺失，并提供 `opsx setup` remediation
- **AND** SHALL 以非零状态退出

### Requirement: Extra workflows synchronized to the fixed workflow set
Update SHALL 使用显式 managed-name list 删除不属于 `propose`、`explore`、`apply`、`archive`、`build`、`snack` 的 managed skill artifacts。

#### Scenario: Retired Build skill
- **WHEN** managed `opsx-bootstrap-arch` skill 存在
- **THEN** update SHALL 删除该 skill
- **AND** SHALL 生成或刷新 `opsx-build`
- **AND** SHALL NOT 删除 user-authored skills

### Requirement: Migrate project config defaults

`opsx update` SHALL 在现有 OPSX 项目中迁移项目配置默认值，通过在 `.opsx/config.yaml` 或 `.opsx/config.yml` 中物化缺失的功能性默认值（不覆盖用户值），并移除过时的 `git.merge.messageFrom`、`git.autoCommit`、`git.archive.commitMessage.convention` 和 `git.merge.commitMessage.convention` 字段。

#### Scenario: 配置缺失时创建

- **WHEN** 项目包含 `.opsx/` 目录
- **AND** `.opsx/config.yaml` 和 `.opsx/config.yml` 均不存在
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 创建 `.opsx/config.yaml`
- **AND** 创建的文件 SHALL 包含 `schema: spec-driven`
- **AND** 创建的文件 SHALL 包含 `optimization.enabled: true`
- **AND** 创建的文件 SHALL 包含 `optimization.optRetries: 2`
- **AND** 创建的文件 SHALL 包含 `apply.defaultIsolation: ask`
- **AND** 创建的文件 SHALL 包含 `git.merge.strategy: no-ff`
- **AND** 创建的文件 SHALL 包含 `git.branch.deleteAfterArchive: false`
- **AND** 创建的文件 SHALL NOT 包含 `git.autoCommit`
- **AND** 创建的文件 SHALL NOT 包含 `git.archive.commitMessage.convention`
- **AND** 创建的文件 SHALL NOT 包含 `git.merge.commitMessage.convention`
- **AND** 创建的文件 SHALL NOT 包含 `git.merge.messageFrom`

#### Scenario: 添加缺失的顶层默认值

- **WHEN** `.opsx/config.yaml` 存在，包含有效 YAML 对象内容，但缺少 `optimization`、`apply` 和 `git`
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 添加 `optimization` 默认节点
- **AND** 命令 SHALL 添加 `apply` 默认节点
- **AND** 命令 SHALL 添加 `git` 默认节点
- **AND** 命令 SHALL 保留现有字段如 `schema`、`docLanguage`、`context` 和 `rules`
- **AND** 命令 SHALL 保留插入默认值之外的用户值

#### Scenario: 添加缺失的嵌套默认值而不覆盖现有值

- **WHEN** `.opsx/config.yaml` 包含 `optimization.enabled: false`
- **AND** 包含 `apply.defaultIsolation: worktree`
- **AND** 包含 `git.merge.strategy: squash`
- **AND** 缺少 `optimization.optRetries` 和 `git.branch.deleteAfterArchive`
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 保留 `optimization.enabled: false`
- **AND** 命令 SHALL 保留 `apply.defaultIsolation: worktree`
- **AND** 命令 SHALL 保留 `git.merge.strategy: squash`
- **AND** 命令 SHALL 添加 `optimization.optRetries: 2`
- **AND** 命令 SHALL 添加 `git.branch.deleteAfterArchive: false`

#### Scenario: 移除过时的 git 字段

- **WHEN** `.opsx/config.yaml` 包含 `git.merge.messageFrom`、`git.autoCommit`、`git.archive.commitMessage.convention` 或 `git.merge.commitMessage.convention` 中的任何一个
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 移除这些过时字段
- **AND** SHALL NOT 将其值映射到任何新字段
- **AND** SHALL 物化缺失的新 git 默认值
- **AND** SHALL 保留其他用户值 `git` 字段，包括 `git.commitMessage.*` 路径覆盖

#### Scenario: 迁移 config.yml 别名

- **WHEN** `.opsx/config.yaml` 不存在
- **AND** `.opsx/config.yml` 存在且包含有效 YAML 对象内容
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 迁移 `.opsx/config.yml`
- **AND** SHALL NOT 创建第二个 `.opsx/config.yaml`

#### Scenario: 跳过无效配置而不阻塞工具刷新

- **WHEN** `.opsx/config.yaml` 包含无效 YAML 或非对象 YAML 文档
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 保持该配置文件不变
- **AND** 命令 SHALL 警告项目配置默认值迁移被跳过
- **AND** 命令 SHALL 继续进行已配置工具的 artifact 刷新

#### Scenario: Windows 上迁移项目配置路径

- **WHEN** `opsx update` 在 Windows 上迁移 `.opsx/config.yaml` 或 `.opsx/config.yml`
- **THEN** 命令 SHALL 使用 Node.js path 工具构建配置路径
- **AND** SHALL 移除过时 git 字段并添加新默认值，行为与 Unix 系统一致

### Requirement: 固定工作流更新
`opsx update` SHALL 刷新全部六个 fixed workflow skills，并 SHALL NOT 读取 retired workflow-selection settings。

#### Scenario: Fixed workflow refresh
- **WHEN** update 在 configured project 中运行
- **THEN** SHALL 收敛到 `opsx-propose`、`opsx-explore`、`opsx-apply-change`、`opsx-archive-change`、`opsx-build`、`opsx-snack`
- **AND** SHALL NOT 创建 bootstrap slash commands

### Requirement: Update SHALL 归档退役的 OPSX workspace
当 update 或 setup 发现 `.opsx/bootstrap/`、`.opsx/bootstrap-history/` 或 `.opsx/migration-candidate/` 时，SHALL 在用户确认后将其移动到显式 `.opsx/history/legacy-<timestamp>/` entry。

#### Scenario: Retired workspace cleanup
- **WHEN** 检测到 retired workspace 且用户确认 cleanup
- **THEN** SHALL 完整移动该 directory，并用 manifest 记录原始 relative path
- **AND** OPSX runtime SHALL 不再读取旧 active path

#### Scenario: 用户拒绝 cleanup
- **WHEN** 用户拒绝 cleanup
- **THEN** setup/update SHALL 失败
- **AND** SHALL NOT 删除或部分移动 retired workspace

## Edge Cases

### Error Handling

The command SHALL handle edge cases gracefully.

#### Scenario: File permission errors

- **WHEN** file write fails
- **THEN** let the error bubble up naturally with file path

#### Scenario: Missing AI tool files

- **WHEN** an AI tool configuration file doesn't exist
- **THEN** skip updating that file
- **AND** do not create it

#### Scenario: Custom directory names

- **WHEN** considering custom directory names
- **THEN** not supported in this change
- **AND** the default directory name `opsx` SHALL be used

## Success Criteria

Users SHALL be able to:
- Update OPSX instructions with a single command
- Get the latest AI agent instructions
- See clear confirmation of the update

The update process SHALL be:
- Simple and fast (no version checking)
- Predictable (same result every time)
- Self-contained (no network required)
