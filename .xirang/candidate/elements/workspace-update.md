---
entity: element-declaration
identity: workspace-update
kind: capability
parent: workspace-init-update
title: Workspace Update
definition: Workspace Update 定义 `xirang update` 刷新项目受管表面与迁移配置的行为：根据全局配置刷新 skills 指令、清理过时配置字段、迁移项目配置默认值、同步固定 workflow 集合、归档退役 workspace 并报告新检测工具。
---

## Requirements

### Requirement: Update Behavior

该命令 SHALL 根据全局配置刷新项目中的受管 skills 指令文件。

#### Scenario: 刷新现有工具制品

- **WHEN** 项目中已配置 AI 工具
- **THEN** 检测已安装的工具 skills 目录
- **AND** 为检测到的每个工具重新生成固定 workflow skills
- **AND** 显示更新摘要，列出刷新的工具
- **AND** SHALL NOT refresh slash command workflow artifacts

#### Scenario: 清理过时配置字段

- **WHEN** 全局配置包含 `profile`、`workflows` 或 `delivery` 字段
- **THEN** 自动删除这些字段并保存清理后的配置
- **AND** 输出警告："Obsolete config fields detected (profile/workflows/delivery), auto-cleaning..." 与 "Obsolete fields auto-cleaned."

### Requirement: Prerequisites
Update command SHALL 要求现有 `.xirang/` workspace，才能刷新 managed surfaces。

#### Scenario: Workspace 缺失
- **WHEN** `.xirang/` 不存在
- **THEN** update SHALL 失败，并指引运行 `xirang setup`
- **AND** SHALL NOT 创建 partial workspace
#### Scenario: 在 Xirang 项目外运行
- **WHEN** `.xirang/` directory 不存在
- **THEN** update SHALL 报告 Xirang project 缺失，并提供 `xirang setup` Required Corrections
- **AND** SHALL 以非零状态退出
### Requirement: Core Files Always Updated
The update command SHALL always refresh the managed workflow skill files for configured tools and display an ASCII-safe success message。

#### Scenario: Successful update
- **WHEN** the update completes successfully
- **THEN** 刷新受管 workflow skill 文件
- **AND** 显示 `✓ Updated: <tools> (v<version>)` 汇总
#### Scenario: 替换受管 skill 文件
- **WHEN** update 成功完成
- **THEN** 以最新模板整体替换受管 workflow skill 文件
- **AND** 显示 "Restart your IDE or current session for refreshed skills to take effect."
#### Scenario: Updating files
- **WHEN** updating files
- **THEN** refresh managed workflow skill files for each configured tool via the shared ArtifactSyncEngine
- **AND** 显示 `Tools: <tools>` 受影响工具列表
- **AND** SHALL NOT 管理或改写根级 AGENTS 指令 stub
### Requirement: 工具感知的更新提示

`xirang update` SHALL 使用已刷新 workflow skills 的调用语义来展示 onboarding 与 restart guidance。

#### Scenario: 无精确 skill 调用语法时使用中性文案

- **WHEN** `xirang update` 为没有精确 skill invocation metadata 的工具输出 onboarding guidance
- **THEN** guidance SHALL 使用中性 skill invocation 文案
- **AND** SHALL reference the explicit `skillDirName`
- **AND** SHALL NOT fall back to command syntax
#### Scenario: 刷新 Codex skills 时显示精确的 skill 调用名
- **WHEN** `xirang update` 刷新或新配置了受管的 Codex workflow skills
- **THEN** 所有 getting-started 或 onboarding guidance SHALL 使用精确的受管 Codex skill 调用名：`$xirang-propose`、`$xirang-explore`、`$xirang-apply-change`、`$xirang-archive-change`、`$xirang-build` 与 `$xirang-snack`（由 WorkflowManifestRegistry 的 `skillDirName` 派生）
- **AND** 显示给用户的 Codex 引用 SHALL 使用 workflow 的 `skillDirName`，而不是 command slug
- **AND** SHALL NOT tell the user to run `/xirang:*`
#### Scenario: skills-only 重启提示避免 slash-command 文案
- **WHEN** `xirang update` 完成时刷新了 workflow skills
- **THEN** 所有 restart guidance SHALL 描述为刷新的 skills 或 workflow files 生效
- **AND** SHALL NOT mention slash commands taking effect
### Requirement: Update respects removed workflow-selection config

The update command SHALL refresh the fixed workflow skill set and SHALL ignore removed workflow-selection settings。

#### Scenario: Update with no changes needed

- **WHEN** installed skills match the fixed workflow set
- **AND** all templates are current
- **THEN** 系统 SHALL 显示 "Already up to date."

#### Scenario: Workflow drift with current templates

- **WHEN** workflow templates 对已安装 skills 为最新
- **AND** global config 包含退役的 profile、workflows 或 delivery 字段
- **THEN** 系统 SHALL 将 stale config cleanup 视为需要更新状态
#### Scenario: Update summary output
- **WHEN** update 完成且有变化
- **THEN** 系统 SHALL 显示新增或更新 skills 的摘要
- **AND** SHALL 列出受影响的工具
- **AND** 摘要 SHALL NOT 报告 command files 被生成、刷新或移除
#### Scenario: Update adds missing workflows from config
- **WHEN** user runs `xirang update`
- **AND** global config specifies workflows not currently installed in the project
- **THEN** the system SHALL ignore the removed workflows setting
- **AND** generate missing fixed workflow skill files
- **AND** display added skill workflows when applicable
#### Scenario: Fixed workflow refresh
- **WHEN** update 在 configured project 中运行
- **THEN** SHALL 收敛到 `xirang-propose`、`xirang-explore`、`xirang-apply-change`、`xirang-archive-change`、`xirang-build`、`xirang-snack`
- **AND** SHALL NOT 创建 bootstrap slash commands
#### Scenario: Update refreshes existing workflows
- **WHEN** user runs `xirang update`
- **AND** workflows are already installed in the project
- **THEN** the system SHALL refresh those workflow skill files with latest templates
- **AND** display refreshed workflow names when applicable
### Requirement: Update detects configured tools from skills only

The update command SHALL treat a tool as configured only when it has generated skill files。

#### Scenario: Commands-only installation

- **WHEN** 某工具已生成 command files 但没有 skill files
- **THEN** 该工具 SHALL NOT 被当作已配置（仅凭 command files）
- **AND** 系统 SHALL NOT 刷新或删除那些 command files

### Requirement: Update detects new tool directories
Update command SHALL 报告新检测到的 AI tool directories，并指引用户运行 `xirang setup` 进行配置。

#### Scenario: 检测到新工具
- **WHEN** supported tool directory 存在但没有 managed skills
- **THEN** update SHALL 报告该工具
- **AND** SHALL NOT 静默配置该工具
- **AND** SHALL 指引用户运行 `xirang setup`

### Requirement: Extra workflows synchronized to the fixed workflow set
Update SHALL 使用显式 managed-name list 删除不属于 propose、explore、apply、archive、build、snack 的 managed skill artifacts。

#### Scenario: Retired Build skill
- **WHEN** managed 退役 build skill 存在
- **THEN** update SHALL 删除该 skill
- **AND** SHALL 生成或刷新 `xirang-build`
- **AND** SHALL NOT 删除 user-authored skills

### Requirement: Migrate project config defaults

`xirang update` SHALL 在现有项目中迁移项目配置默认值：物化缺失的功能性默认值（不覆盖用户值），并移除过时的 git 字段。

#### Scenario: 配置缺失时创建

- **WHEN** 项目包含 `.xirang/` 目录且 config 文件不存在
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 创建 `.xirang/config.yaml`
- **AND** 创建的文件 SHALL 包含 `schema`、`optimization`、`apply` 与 `git` 默认节点
- **AND** SHALL NOT 包含退役的 git 字段

#### Scenario: 添加缺失的嵌套默认值而不覆盖现有值

- **WHEN** config 包含部分用户值且缺少其他默认值
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 保留用户值并补齐缺失默认值

#### Scenario: 移除过时的 git 字段

- **WHEN** config 包含退役的 git 字段
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 移除这些过时字段
- **AND** SHALL NOT 将其值映射到任何新字段
- **AND** SHALL 保留其他用户 git 字段

#### Scenario: 迁移 config.yml 别名

- **WHEN** `.xirang/config.yaml` 不存在且 `.xirang/config.yml` 存在且有效
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 迁移 `.xirang/config.yml`
- **AND** SHALL NOT 创建第二个 `.xirang/config.yaml`
#### Scenario: 项目配置默认值迁移
- **WHEN** 项目 `.xirang/config.yaml` 缺少功能性默认值
- **THEN** 以 missing-only 方式补齐默认值
- **AND** SHALL NOT 覆盖用户已设置的值
- **AND** 删除陈旧的 `git.merge.messageFrom`, `git.autoCommit` 与 `commitMessage.convention` 节点
- **AND** 补齐新的 git 功能性默认结构
#### Scenario: Windows 上迁移项目配置路径
- **WHEN** `xirang update` 在 Windows 上迁移 `.xirang/config.yaml` 或 `.xirang/config.yml`
- **THEN** 命令 SHALL 使用 Node.js path 工具构建配置路径
- **AND** SHALL 移除过时 git 字段并添加新默认值，行为与 Unix 系统一致
#### Scenario: 添加缺失的顶层默认值
- **WHEN** `.xirang/config.yaml` 存在，包含有效 YAML 对象内容，但缺少 `optimization`、`apply` 和 `git`
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 添加 `optimization` 默认节点
- **AND** 命令 SHALL 添加 `apply` 默认节点
- **AND** 命令 SHALL 添加 `git` 默认节点
- **AND** 命令 SHALL 保留现有字段如 `schema`、`docLanguage`、`context` 和 `rules`
- **AND** 命令 SHALL 保留插入默认值之外的用户值
#### Scenario: 跳过无效配置而不阻塞工具刷新
- **WHEN** `.xirang/config.yaml` 包含无效 YAML 或非对象 YAML 文档
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 保持该配置文件不变
- **AND** 命令 SHALL 警告项目配置默认值迁移被跳过
- **AND** 命令 SHALL 继续进行已配置工具的 artifact 刷新
### Requirement: Update SHALL 归档退役的 legacy workspace
当 update 或 setup 发现退役 workspace 时，SHALL 在用户确认后将其移动到显式 `.xirang/history/legacy-<timestamp>/` entry。

#### Scenario: Retired workspace cleanup
- **WHEN** 检测到退役 workspace 且用户确认 cleanup
- **THEN** SHALL 完整移动该 directory，并用 manifest 记录原始 relative path
- **AND** runtime SHALL 不再读取旧 active path

#### Scenario: 用户拒绝 cleanup
- **WHEN** 用户拒绝 cleanup
- **THEN** setup/update SHALL 失败
- **AND** SHALL NOT 删除或部分移动退役 workspace
#### Scenario: 文件权限错误
- **WHEN** 文件写入失败
- **THEN** 让错误自然冒泡并携带文件路径
#### Scenario: 缺失 AI 工具文件
- **WHEN** AI 工具配置文件不存在
- **THEN** 跳过更新该文件且不创建它
#### Scenario: 自定义目录名不支持
- **WHEN** 考虑自定义目录名
- **THEN** 本次不支持，默认目录名 `xirang` SHALL 被使用
