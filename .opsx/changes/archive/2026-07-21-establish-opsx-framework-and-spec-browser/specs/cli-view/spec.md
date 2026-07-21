## MODIFIED Requirements

### Requirement: Dashboard Display

系统 SHALL 提供 `view` 命令启动内置 Web 浏览器，展示项目架构与 Specs。

#### Scenario: [ADDED] 启动 Web 浏览器

- **WHEN** 用户运行 `opsx view`
- **THEN** 系统 SHALL 从当前目录或其祖先寻找最近的 `.opsx/` 项目根
- **AND** SHALL 启动内置 LikeC4 Web 服务器
- **AND** SHALL 在浏览器中打开项目架构与 Specs 交互式视图
- **AND** SHALL 输出服务器地址（如 `http://localhost:3000`）

#### Scenario: [ADDED] 自定义端口

- **WHEN** 用户运行 `opsx view --port 8080`
- **THEN** 系统 SHALL 在端口 8080 启动服务器
- **AND** SHALL 输出 `http://localhost:8080`

#### Scenario: [ADDED] 项目根发现

- **WHEN** 用户从 `.opsx/changes/some-change/` 子目录运行 `opsx view`
- **THEN** 系统 SHALL 向上查找并定位项目根目录
- **AND** SHALL 使用该项目根的 `.opsx/architecture/` 启动服务器

#### Scenario: [ADDED] 未找到项目

- **WHEN** 用户在不包含 `.opsx/` 的目录运行 `opsx view`
- **THEN** 系统 SHALL 显示错误信息 "未找到 OPSX 项目"
- **AND** SHALL 退出并返回非零状态码

#### Scenario: [ADDED] 跨平台路径处理

- **WHEN** 在 Windows、macOS 或 Linux 查找 `.opsx/` 项目根
- **THEN** 系统 SHALL 使用 Node.js `path` 模块构建路径
- **AND** SHALL NOT 假设路径分隔符

#### Scenario: [REMOVED] Basic dashboard display

- **WHEN** user runs `opsx view`
- **THEN** system displays a formatted dashboard with sections for summary, active changes, completed changes, and specifications

#### Scenario: [REMOVED] No OPSX directory

- **WHEN** user runs `opsx view` in a directory without OPSX
- **THEN** system displays error message "✗ No opsx directory found"

## REMOVED Requirements

### Requirement: Summary Section

移除旧终端 dashboard 的 summary 显示行为。

**Reason**: `opsx view` 改为启动 Web 浏览器，不再在终端显示 dashboard。

**Migration**: Summary 信息通过 Web UI 中的架构图和 Specs 浏览呈现。

### Requirement: Active Changes Display

移除旧终端 dashboard 的 active changes 显示行为。

**Reason**: `opsx view` 改为启动 Web 浏览器，不再在终端显示 dashboard。

**Migration**: 用户通过 `opsx list` 查看 changes 列表。

### Requirement: Completed Changes Display

移除旧终端 dashboard 的 completed changes 显示行为。

**Reason**: `opsx view` 改为启动 Web 浏览器，不再在终端显示 dashboard。

**Migration**: 用户通过 `opsx list` 或文件系统查看归档 changes。

### Requirement: Specifications Display

移除旧终端 dashboard 的 specs 列表显示行为。

**Reason**: `opsx view` 改为启动 Web 浏览器，Specs 通过 Web UI 浏览。

**Migration**: 用户通过 Web UI 中元素详情的 `Specs` 标签页查看 Spec 内容。

### Requirement: Visual Formatting

移除旧终端 dashboard 的 visual formatting 行为。

**Reason**: `opsx view` 改为启动 Web 浏览器，不再在终端渲染格式化内容。

**Migration**: Web UI 提供更丰富的视觉呈现。

### Requirement: Error Handling

移除旧终端 dashboard 的 error handling 行为。

**Reason**: `opsx view` 改为启动 Web 浏览器，错误处理逻辑由 Web 服务器和 UI 承担。

**Migration**: 文件系统错误和无效数据通过 Web UI 或服务器日志报告。

### Requirement: Draft Changes Display

移除旧终端 dashboard 的 draft changes 显示行为。

**Reason**: `opsx view` 改为启动 Web 浏览器，不再在终端显示 dashboard。

**Migration**: 用户通过 `opsx list` 查看 draft changes。
