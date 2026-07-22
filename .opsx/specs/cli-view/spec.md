---
element: project.root/domain.cli/cap.cli.architecture-navigation
---

# cli-view Specification

## Purpose

The `opsx view` command provides a comprehensive dashboard view of the OPSX project state, displaying specifications, changes, and progress metrics in a unified, visually appealing format to help developers quickly understand project status.
## Requirements
### Requirement: Dashboard Display

系统 SHALL 提供 `view` 命令启动内置 Web 浏览器，展示项目架构与 Specs。

#### Scenario: 启动 Web 浏览器

- **WHEN** 用户运行 `opsx view`
- **THEN** 系统 SHALL 从当前目录或其祖先寻找最近的 `.opsx/` 项目根
- **AND** SHALL 启动内置 LikeC4 Web 服务器
- **AND** SHALL 在浏览器中打开项目架构与 Specs 交互式视图
- **AND** SHALL 输出服务器地址（如 `http://localhost:3000`）

#### Scenario: 自定义端口

- **WHEN** 用户运行 `opsx view --port 8080`
- **THEN** 系统 SHALL 在端口 8080 启动服务器
- **AND** SHALL 输出 `http://localhost:8080`

#### Scenario: 项目根发现

- **WHEN** 用户从 `.opsx/changes/some-change/` 子目录运行 `opsx view`
- **THEN** 系统 SHALL 向上查找并定位项目根目录
- **AND** SHALL 使用该项目根的 `.opsx/architecture/` 启动服务器

#### Scenario: 未找到项目

- **WHEN** 用户在不包含 `.opsx/` 的目录运行 `opsx view`
- **THEN** 系统 SHALL 显示错误信息 "未找到 OPSX 项目"
- **AND** SHALL 退出并返回非零状态码

#### Scenario: 跨平台路径处理

- **WHEN** 在 Windows、macOS 或 Linux 查找 `.opsx/` 项目根
- **THEN** 系统 SHALL 使用 Node.js `path` 模块构建路径
- **AND** SHALL NOT 假设路径分隔符
