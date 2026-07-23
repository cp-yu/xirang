---
element: cap.cli.view
---

# cli-view Specification

## Purpose

The `opsx view` command provides a comprehensive dashboard view of the OPSX project state, displaying specifications, changes, and progress metrics in a unified, visually appealing format to help developers quickly understand project status.
## Requirements
### Requirement: Dashboard Display

系统 SHALL 提供 `view` 命令启动内置 Web 浏览器，并通过统一 selector 展示 Formal Architecture 或任一 active change 的 runtime Target Semantic Model、Specs 与 semantic diff。

#### Scenario: 启动 Web 浏览器
- **WHEN** 用户运行 `opsx view`
- **THEN** 系统 SHALL 从当前目录或其祖先寻找最近的 `.opsx/` 项目根
- **AND** SHALL 启动内置 LikeC4 Web 服务器
- **AND** SHALL 默认打开 `Current / Formal Architecture`
- **AND** SHALL 输出服务器地址

#### Scenario: 自定义端口
- **WHEN** 用户运行 `opsx view --port 8080`
- **THEN** 系统 SHALL 在端口 8080 启动服务器
- **AND** SHALL 输出 `http://localhost:8080`

#### Scenario: 项目根发现
- **WHEN** 用户从 `.opsx/changes/some-change/` 子目录运行 `opsx view`
- **THEN** 系统 SHALL 向上查找并定位项目根目录
- **AND** SHALL 使用该项目根的 Formal source 与 active changes

#### Scenario: 未找到项目
- **WHEN** 用户在不包含 `.opsx/` 的目录运行 `opsx view`
- **THEN** 系统 SHALL 显示错误信息 `未找到 OPSX 项目`
- **AND** SHALL 退出并返回非零状态码

#### Scenario: Active change selector
- **WHEN** 项目包含一个或多个 `.opsx/changes/<name>/` active changes
- **THEN** selector SHALL 在 formal entry 后按 change ID 确定性列出每个 active change
- **AND** 每个 change entry SHALL 独立 materialize `Formal + selected change`

#### Scenario: Archive change 不显示
- **WHEN** change 位于 `.opsx/changes/archive/`
- **THEN** selector SHALL NOT 显示该 change

#### Scenario: Specs-only change 显示
- **WHEN** active change 包含 contract delta 但没有 `architecture-delta.c4`
- **THEN** selector SHALL 仍显示该 change
- **AND** Architecture 区域 SHALL 显示无 semantic graph change

#### Scenario: Full context 与 Diff only
- **WHEN** 用户查看 active change Architecture
- **THEN** SHALL 提供 `Full context` 与 `Diff only`
- **AND** `Diff only` SHALL 保留 changed elements/relationships、relationship endpoints、ancestor containers 与必要上下文
- **AND** unchanged context SHALL NOT 计入 diff counts

#### Scenario: 分区 diagnostics
- **WHEN** selected change 的 Specs 或 Architecture 一侧无法解析或 validation
- **THEN** 对应区域 SHALL 显示 diagnostics
- **AND** 另一侧 SHALL 继续展示可计算内容
- **AND** change selector SHALL 保留该 invalid change

#### Scenario: Active change 热更新
- **WHEN** selected change 的 Specs、Architecture delta 或 Formal dependencies 变化
- **THEN** 系统 SHALL 定向失效对应 runtime cache
- **AND** SHALL 通过 HMR 更新当前 view
- **AND** Specs-only 修改 SHALL NOT 强制重新计算无关 Architecture layout

#### Scenario: 跨平台路径处理
- **WHEN** 在 Windows、macOS 或 Linux 查找项目、active changes 或监听 source files
- **THEN** 系统 SHALL 使用 Node.js path API 与 normalized project-relative paths
- **AND** SHALL NOT 假设路径分隔符

