---
capabilities:
  - cap.opsx.framework-identity
---
# opsx-framework-identity Specification

## Purpose

定义 OPSX 开发框架的统一产品身份、CLI 可执行命令、durable workspace 和无兼容层迁移合同。

## ADDED Requirements

### Requirement: CLI 可执行命令 SHALL 为 opsx

OPSX CLI 可执行命令 SHALL 为 `opsx`，不提供 `opsx` 别名。

#### Scenario: 运行 CLI 命令

- **WHEN** 用户在终端执行 `opsx --help`
- **THEN** 系统 SHALL 显示 OPSX CLI 帮助信息
- **AND** 帮助信息 SHALL 包含 `opsx` 作为命令名称

#### Scenario: 尝试使用旧命令

- **WHEN** 用户执行 `opsx` 命令
- **THEN** 系统 SHALL 报告命令不存在
- **AND** SHALL NOT 自动路由到 `opsx`

#### Scenario: Shell completion

- **WHEN** 用户安装 shell completion
- **THEN** 补全脚本 SHALL 为 `opsx` 命令注册
- **AND** SHALL NOT 为 `opsx` 注册

### Requirement: 项目工作区 SHALL 为 .opsx

目标项目的 OPSX durable workspace SHALL 位于项目根目录 `.opsx/`，不回退或双写 `opsx/`。

#### Scenario: 项目发现

- **WHEN** CLI 从任意子目录向上查找项目根
- **THEN** 系统 SHALL 寻找最近的 `.opsx/` 目录
- **AND** SHALL NOT 回退到 `opsx/` 目录

#### Scenario: 初始化新项目

- **WHEN** 用户运行 `opsx init`
- **THEN** 系统 SHALL 创建 `.opsx/` 目录结构
- **AND** SHALL NOT 创建 `opsx/` 目录

#### Scenario: 跨平台路径处理

- **WHEN** CLI 在 Windows、macOS 或 Linux 构建 `.opsx/` 路径
- **THEN** 系统 SHALL 使用 Node.js `path.join()` 或 `path.resolve()`
- **AND** SHALL NOT 硬编码斜杠分隔符

### Requirement: 工作区目录结构 SHALL 完整

`.opsx/` SHALL 包含 architecture、specs、changes、references、bootstrap、config 和运行缓存。

#### Scenario: 标准工作区结构

- **WHEN** 初始化或操作 OPSX 项目
- **THEN** 工作区 SHALL 包含以下目录和文件：
  ```
  .opsx/
  ├── architecture/        # LikeC4 架构语义与 Spec 索引
  ├── specs/               # Durable behavior source
  ├── changes/             # Change-local 编译脚手架与 delta
  ├── references/          # Agent workflow 参考协议
  ├── bootstrap/           # Agent bootstrap 工作区
  ├── bootstrap-history/   # Bootstrap audit history
  ├── config.yaml          # 项目级框架配置
  └── .cache/              # 运行时缓存（默认忽略）
  ```

#### Scenario: 版本控制

- **WHEN** 用户提交 OPSX 项目到 Git
- **THEN** `.opsx/architecture/`、`.opsx/specs/`、`.opsx/changes/` SHALL 纳入版本控制
- **AND** `.opsx/.cache/` SHALL 默认忽略

### Requirement: CLI 命令引用 SHALL 一致

所有 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active specs SHALL 仅引用 `opsx` 命令和 `.opsx/` 路径。

#### Scenario: Workflow skill 引用

- **WHEN** 生成 workflow skill SKILL.md
- **THEN** 文件内容 SHALL 引用 `opsx` 命令
- **AND** SHALL 引用 `.opsx/` 路径
- **AND** SHALL NOT 引用 `opsx` 命令或 `opsx/` 路径

#### Scenario: Subagent artifact 引用

- **WHEN** 生成 subagent artifact
- **THEN** artifact 内容 SHALL 引用 `opsx` 命令
- **AND** SHALL 引用 `.opsx/` 路径

#### Scenario: Project config 引用

- **WHEN** 系统加载或生成项目配置
- **THEN** 配置文件路径 SHALL 为 `.opsx/config.yaml`
- **AND** 配置中 reference 路由路径 SHALL 使用 `.opsx/references/` 前缀

#### Scenario: Archive history 残留

- **WHEN** 审计 CLI 命令引用
- **THEN** `.opsx/changes/archive/**` 下的历史归档 SHALL 允许保留旧命令引用
- **AND** active surfaces SHALL NOT 包含旧命令引用

### Requirement: 不提供迁移兼容层

OPSX SHALL NOT 提供 `opsx` 命令别名、`opsx/` 目录回退或自动迁移工具。

#### Scenario: 无命令别名

- **WHEN** CLI 注册可执行命令
- **THEN** 系统 SHALL 仅注册 `opsx`
- **AND** SHALL NOT 注册 `opsx` 或其他别名

#### Scenario: 无目录双读

- **WHEN** CLI 读取项目配置、Specs、Architecture 或 changes
- **THEN** 系统 SHALL 仅从 `.opsx/` 读取
- **AND** SHALL NOT 回退到 `opsx/` 或提示迁移

#### Scenario: 无自动迁移工具

- **WHEN** 用户在含 `opsx/` 的项目运行 `opsx` 命令
- **THEN** 系统 SHALL 报告未找到 `.opsx/` 项目
- **AND** SHALL NOT 自动将 `opsx/` 迁移到 `.opsx/`

### Requirement: Telemetry command identity SHALL 为 opsx

遥测事件 SHALL 使用 `opsx` 作为 command identity。

#### Scenario: 记录命令执行

- **WHEN** 用户执行 `opsx init`
- **THEN** 遥测事件 SHALL 记录 `opsx` 为命令标识
- **AND** SHALL NOT 记录 `opsx`

### Requirement: Package.json bin entry SHALL 为 opsx

npm package 的 bin entry SHALL 为 `opsx`。

#### Scenario: npm 安装后可执行

- **WHEN** 用户通过 npm 安装框架
- **THEN** 系统 SHALL 在 PATH 中创建 `opsx` 可执行链接
- **AND** SHALL NOT 创建 `opsx` 链接
