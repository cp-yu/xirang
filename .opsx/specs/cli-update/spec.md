---
capabilities:
  - cap.cli.update
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

The command SHALL require an existing OPSX structure before allowing updates.

#### Scenario: Checking prerequisites

- **GIVEN** the command requires an existing `opsx` directory (created by `opsx init`)
- **WHEN** the `opsx` directory does not exist
- **THEN** display error: "No OPSX directory found. Run 'opsx init' first."
- **AND** exit with code 1

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
The update command SHALL notify the user if new AI tool directories are detected that aren't currently configured.

#### Scenario: New tool directory detected
- **WHEN** user runs `opsx update`
- **AND** a new tool directory is detected (e.g., `.windsurf/` exists but Windsurf is not configured)
- **THEN** the system SHALL display: "Detected new tool: Windsurf. Run 'opsx init' to add it."
- **THEN** the system SHALL NOT automatically add the new tool
- **THEN** the system SHALL proceed with update for currently configured tools only

#### Scenario: Multiple new tool directories detected
- **WHEN** user runs `opsx update`
- **AND** multiple new tool directories are detected (e.g., `.github/` and `.windsurf/` exist but neither tool is configured)
- **THEN** the system SHALL display one consolidated message listing all detected tools, for example: "Detected new tools: GitHub Copilot, Windsurf. Run 'opsx init' to add them."
- **THEN** the system SHALL NOT automatically add any new tools
- **THEN** the system SHALL proceed with update for currently configured tools only

#### Scenario: No new tool directories
- **WHEN** user runs `opsx update`
- **AND** no new tool directories are detected
- **THEN** the system SHALL NOT display any tool detection message

### Requirement: Update requires an OPSX project

update 命令 SHALL 仅在已初始化 OPSX 项目内运行。

#### Scenario: 项目外运行 update

- **WHEN** 用户运行 `opsx update`
- **AND** 当前工作目录不存在 `.opsx/` 目录
- **THEN** 系统 SHALL 显示："未找到 OPSX 项目。运行 'opsx init' 进行设置。"
- **THEN** 系统 SHALL 以状态码 1 退出

### Requirement: Extra workflows synchronized to the fixed workflow set

The update command SHALL remove managed skill workflow files that are no longer part of the fixed workflow set.

#### Scenario: Extra workflows outside the fixed set

- **WHEN** user runs `opsx update`
- **AND** project has managed skill workflows not in the fixed workflow set
- **THEN** the system SHALL delete those managed skill workflow files
- **AND** the system SHALL keep only workflows currently selected by the fixed manifest
- **AND** SHALL NOT delete command workflow files

#### Scenario: Delivery change with extra workflows

- **WHEN** user runs `opsx update`
- **AND** global config contains a removed `delivery` field
- **AND** project has extra managed skill workflows not in the fixed workflow set
- **THEN** the system SHALL delete only managed skill files for extra workflows
- **AND** SHALL NOT delete command files because delivery cleanup is not supported

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

该命令 SHALL 固定更新 workflow manifest 中声明的工作流，无需读取 profile 配置。

#### Scenario: 固定更新工作流

- **WHEN** 用户运行 `opsx update`
- **THEN** 系统 SHALL 为所有检测到的工具固定更新 workflow manifest 中声明的工作流 skills
- **AND** 系统 SHALL NOT 读取全局配置中的 `profile` 或 `workflows` 字段
- **AND** 系统 SHALL 删除不在固定 5 个工作流列表中的 skill 文件

#### Scenario: 清理 expanded 工作流残留

- **WHEN** 项目中存在已废弃的 expanded 工作流 skill 文件
- **THEN** 系统 SHALL 删除以下 skill 目录：
  - `opsx-new-change`
  - `opsx-continue-change`
  - `opsx-ff-change`
  - `opsx-verify-change`
  - `opsx-sync-specs`
  - `opsx-bulk-archive-change`
  - `opsx-onboard`
- **AND** 输出清理摘要："已清理 7 个废弃工作流"

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
