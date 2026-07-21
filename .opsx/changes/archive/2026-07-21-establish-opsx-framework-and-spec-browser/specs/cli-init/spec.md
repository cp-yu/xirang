## MODIFIED Requirements

### Requirement: Directory Creation

该命令 SHALL 创建 OPSX 目录结构与配置文件。

#### Scenario: [ADDED] 创建 OPSX 结构

- **WHEN** 执行 `opsx init`
- **THEN** 创建以下目录结构：
```
.opsx/
├── config.yaml
├── specs/
└── changes/
    └── archive/
```
- **AND** 使用当前功能性项目配置默认值写入 `.opsx/config.yaml`
- **AND** 生成的配置 SHALL 包含 `optimization.enabled: true`
- **AND** 生成的配置 SHALL 包含 `optimization.optRetries: 2`
- **AND** 生成的配置 SHALL 包含 `apply.defaultIsolation: ask`
- **AND** 生成的配置 SHALL 将 apply default 行渲染为 `defaultIsolation: ask  # ask / branch / worktree / none`
- **AND** 生成的配置 SHALL 包含 `git.merge.strategy: no-ff`
- **AND** 生成的配置 SHALL 包含 `git.branch.deleteAfterArchive: false`
- **AND** 生成的配置 SHALL NOT 包含 `git.autoCommit`
- **AND** 生成的配置 SHALL NOT 包含 `git.archive.commitMessage.convention`
- **AND** 生成的配置 SHALL NOT 包含 `git.merge.commitMessage.convention`
- **AND** 生成的配置 SHALL NOT 包含 `git.merge.messageFrom`

#### Scenario: [ADDED] 在 Windows 创建 OPSX 结构

- **WHEN** 在 Windows 平台执行 `opsx init`
- **THEN** 使用 Node.js path 工具构建 `.opsx/config.yaml` 路径
- **AND** 写入与 Unix 系统相同的默认 YAML 字段

#### Scenario: [REMOVED] Creating OPSX structure

- **WHEN** `opsx init` is executed
- **THEN** create the following directory structure:
```
opsx/
├── config.yaml
├── specs/
└── changes/
    └── archive/
```
- **AND** write `.opsx/config.yaml` using the current functional project config defaults
- **AND** the generated config SHALL include `optimization.enabled: true`
- **AND** the generated config SHALL include `optimization.optRetries: 2`
- **AND** the generated config SHALL include `apply.defaultIsolation: ask`
- **AND** the generated config SHALL render the apply default line as `defaultIsolation: ask  # ask / branch / worktree / none`
- **AND** the generated config SHALL include `git.merge.strategy: no-ff`
- **AND** the generated config SHALL include `git.branch.deleteAfterArchive: false`
- **AND** the generated config SHALL NOT include `git.autoCommit`
- **AND** the generated config SHALL NOT include `git.archive.commitMessage.convention`
- **AND** the generated config SHALL NOT include `git.merge.commitMessage.convention`
- **AND** the generated config SHALL NOT include `git.merge.messageFrom`

#### Scenario: [REMOVED] Creating OPSX structure on Windows

- **WHEN** `opsx init` is executed on Windows
- **THEN** build the `.opsx/config.yaml` path using Node.js path utilities
- **AND** write the same default YAML fields as on Unix systems

### Requirement: Safety Checks

该命令 SHALL 执行安全检查以防止覆盖现有结构并确保适当权限。

#### Scenario: [ADDED] 检测已有初始化

- **WHEN** `.opsx/` 目录已存在
- **THEN** 通知用户 OPSX 已初始化，跳过重建基础结构，进入扩展模式
- **AND** 继续进入 AI 工具选择步骤，以便配置额外工具
- **AND** 仅当用户拒绝添加任何 AI 工具时显示已存在初始化错误信息

#### Scenario: [REMOVED] Detecting existing initialization
- **WHEN** the `opsx/` directory already exists
- **THEN** inform the user that OPSX is already initialized, skip recreating the base structure, and enter an extend mode
- **AND** continue to the AI tool selection step so additional tools can be configured
- **AND** display the existing-initialization error message only when the user declines to add any AI tools

### Requirement: Success Output

该命令在成功后 SHALL 显示简洁的摘要，描述已创建的内容及下一步操作。

#### Scenario: [MODIFIED] 显示成功摘要

- **WHEN** 初始化成功完成且至少配置一个 AI 工具
- **THEN** 显示摘要，包括：
  - OPSX 结构创建确认
  - 已配置的 AI 工具列表
  - 为每个工具生成的 skills
- **AND** 显示固定的 getting started 引导块，使用 skill invocation guidance 作为第一步
- **AND** SHALL NOT 将 `/opsx:*` 作为 getting started 入口
- **AND** SHALL NOT 展示 commands 或 both 作为生成制品类型

#### Scenario: 未配置工具的成功摘要

- **WHEN** 初始化成功完成但未配置 AI 工具
- **THEN** 输出 SHALL 确认 `.opsx/` durable core 已创建
- **AND** SHALL 提示用户再次运行 `opsx init` 配置 workflows
- **AND** SHALL NOT 输出任何 workflow invocation

#### Scenario: Bootstrap workflow 引导

- **WHEN** `bootstrap-arch` workflow 包含在固定工作流中、非 extend 模式且至少配置一个 AI 工具
- **THEN** 成功输出 SHALL 在 getting started 区块之后包含该工具适配的 bootstrap skill invocation

### Requirement: Config File Generation

该命令 SHALL 创建 OPSX 配置文件与 schema 设置。

#### Scenario: [ADDED] 创建 config.yaml

- **WHEN** 初始化完成
- **AND** config.yaml 不存在
- **THEN** 创建 `.opsx/config.yaml` 并使用默认 schema 设置
- **AND** 在输出中显示配置位置

#### Scenario: [ADDED] 保留已有 config.yaml

- **WHEN** 初始化在 extend 模式运行
- **AND** `.opsx/config.yaml` 已存在
- **THEN** 保留现有配置文件
- **AND** 在输出中显示 "(exists)" 指示器

#### Scenario: [REMOVED] Creating config.yaml

- **WHEN** initialization completes
- **AND** config.yaml does not exist
- **THEN** create `.opsx/config.yaml` with default schema setting
- **AND** display config location in output

#### Scenario: [REMOVED] Preserving existing config.yaml

- **WHEN** initialization runs in extend mode
- **AND** `.opsx/config.yaml` already exists
- **THEN** preserve the existing config file
- **AND** display "(exists)" indicator in output
