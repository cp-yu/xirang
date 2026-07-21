## MODIFIED Requirements

### Requirement: Update requires an OPSX project

update 命令 SHALL 仅在已初始化 OPSX 项目内运行。

#### Scenario: [ADDED] 项目外运行 update

- **WHEN** 用户运行 `opsx update`
- **AND** 当前工作目录不存在 `.opsx/` 目录
- **THEN** 系统 SHALL 显示："未找到 OPSX 项目。运行 'opsx init' 进行设置。"
- **THEN** 系统 SHALL 以状态码 1 退出

#### Scenario: [REMOVED] Update outside a project
- **WHEN** user runs `opsx update`
- **AND** no `opsx/` directory exists in the current working directory
- **THEN** the system SHALL display: "No OPSX project found. Run 'opsx init' to set up."
- **THEN** the system SHALL exit with code 1

### Requirement: Migrate project config defaults

`opsx update` SHALL 在现有 OPSX 项目中迁移项目配置默认值，通过在 `.opsx/config.yaml` 或 `.opsx/config.yml` 中物化缺失的功能性默认值（不覆盖用户值），并移除过时的 `git.merge.messageFrom`、`git.autoCommit`、`git.archive.commitMessage.convention` 和 `git.merge.commitMessage.convention` 字段。

#### Scenario: [ADDED] 配置缺失时创建

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

#### Scenario: [ADDED] 添加缺失的顶层默认值

- **WHEN** `.opsx/config.yaml` 存在，包含有效 YAML 对象内容，但缺少 `optimization`、`apply` 和 `git`
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 添加 `optimization` 默认节点
- **AND** 命令 SHALL 添加 `apply` 默认节点
- **AND** 命令 SHALL 添加 `git` 默认节点
- **AND** 命令 SHALL 保留现有字段如 `schema`、`docLanguage`、`context` 和 `rules`
- **AND** 命令 SHALL 保留插入默认值之外的用户值

#### Scenario: [ADDED] 添加缺失的嵌套默认值而不覆盖现有值

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

#### Scenario: [ADDED] 移除过时的 git 字段

- **WHEN** `.opsx/config.yaml` 包含 `git.merge.messageFrom`、`git.autoCommit`、`git.archive.commitMessage.convention` 或 `git.merge.commitMessage.convention` 中的任何一个
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 移除这些过时字段
- **AND** SHALL NOT 将其值映射到任何新字段
- **AND** SHALL 物化缺失的新 git 默认值
- **AND** SHALL 保留其他用户值 `git` 字段，包括 `git.commitMessage.*` 路径覆盖

#### Scenario: [ADDED] 迁移 config.yml 别名

- **WHEN** `.opsx/config.yaml` 不存在
- **AND** `.opsx/config.yml` 存在且包含有效 YAML 对象内容
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 迁移 `.opsx/config.yml`
- **AND** SHALL NOT 创建第二个 `.opsx/config.yaml`

#### Scenario: [ADDED] 跳过无效配置而不阻塞工具刷新

- **WHEN** `.opsx/config.yaml` 包含无效 YAML 或非对象 YAML 文档
- **AND** 用户运行 `opsx update`
- **THEN** 命令 SHALL 保持该配置文件不变
- **AND** 命令 SHALL 警告项目配置默认值迁移被跳过
- **AND** 命令 SHALL 继续进行已配置工具的 artifact 刷新

#### Scenario: [ADDED] Windows 上迁移项目配置路径

- **WHEN** `opsx update` 在 Windows 上迁移 `.opsx/config.yaml` 或 `.opsx/config.yml`
- **THEN** 命令 SHALL 使用 Node.js path 工具构建配置路径
- **AND** SHALL 移除过时 git 字段并添加新默认值，行为与 Unix 系统一致

#### Scenario: [REMOVED] Create config when missing

- **WHEN** a project has an `opsx/` directory
- **AND** neither `.opsx/config.yaml` nor `.opsx/config.yml` exists
- **AND** the user runs `opsx update`
- **THEN** the command SHALL create `.opsx/config.yaml`
- **AND** the created file SHALL include `schema: spec-driven`
- **AND** the created file SHALL include `optimization.enabled: true`
- **AND** the created file SHALL include `optimization.optRetries: 2`
- **AND** the created file SHALL include `apply.defaultIsolation: ask`
- **AND** the created file SHALL include `git.merge.strategy: no-ff`
- **AND** the created file SHALL include `git.branch.deleteAfterArchive: false`
- **AND** the created file SHALL NOT include `git.autoCommit`
- **AND** the created file SHALL NOT include `git.archive.commitMessage.convention`
- **AND** the created file SHALL NOT include `git.merge.commitMessage.convention`
- **AND** the created file SHALL NOT include `git.merge.messageFrom`

#### Scenario: [REMOVED] Add missing top-level defaults

- **WHEN** `.opsx/config.yaml` exists with valid YAML object content that lacks `optimization`, `apply`, and `git`
- **AND** the user runs `opsx update`
- **THEN** the command SHALL add the `optimization` default node
- **AND** the command SHALL add the `apply` default node
- **AND** the command SHALL add the `git` default node
- **AND** the command SHALL preserve existing fields such as `schema`, `docLanguage`, `context`, and `rules`
- **AND** the command SHALL preserve user-authored values outside the inserted defaults

#### Scenario: [REMOVED] Add missing nested defaults without overwriting existing values

- **WHEN** `.opsx/config.yaml` contains `optimization.enabled: false`
- **AND** contains `apply.defaultIsolation: worktree`
- **AND** contains `git.merge.strategy: squash`
- **AND** lacks `optimization.optRetries` and `git.branch.deleteAfterArchive`
- **AND** the user runs `opsx update`
- **THEN** the command SHALL keep `optimization.enabled: false`
- **AND** the command SHALL keep `apply.defaultIsolation: worktree`
- **AND** the command SHALL keep `git.merge.strategy: squash`
- **AND** the command SHALL add `optimization.optRetries: 2`
- **AND** the command SHALL add `git.branch.deleteAfterArchive: false`

#### Scenario: [REMOVED] Remove obsolete git fields

- **WHEN** `.opsx/config.yaml` contains any of `git.merge.messageFrom`, `git.autoCommit`, `git.archive.commitMessage.convention`, or `git.merge.commitMessage.convention`
- **AND** the user runs `opsx update`
- **THEN** the command SHALL remove those obsolete fields
- **AND** SHALL NOT map their values to any new field
- **AND** SHALL materialize missing new git defaults
- **AND** SHALL preserve other user-authored `git` fields including `git.commitMessage.*` path overrides

#### Scenario: [REMOVED] Migrate config.yml alias

- **WHEN** `.opsx/config.yaml` does not exist
- **AND** `.opsx/config.yml` exists with valid YAML object content
- **AND** the user runs `opsx update`
- **THEN** the command SHALL migrate `.opsx/config.yml`
- **AND** SHALL NOT create a second `.opsx/config.yaml`

#### Scenario: [REMOVED] Skip invalid config without blocking tool refresh

- **WHEN** `.opsx/config.yaml` contains invalid YAML or a non-object YAML document
- **AND** the user runs `opsx update`
- **THEN** the command SHALL leave that config file unchanged
- **AND** the command SHALL warn that project config default migration was skipped
- **AND** the command SHALL continue with configured tool artifact refresh

#### Scenario: [REMOVED] Migrate project config paths on Windows

- **WHEN** `opsx update` migrates `.opsx/config.yaml` or `.opsx/config.yml` on Windows
- **THEN** the command SHALL build config paths with Node.js path utilities
- **AND** SHALL remove obsolete git fields and add new defaults with the same behavior as Unix systems
