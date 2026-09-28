---
entity: element-declaration
identity: framework-identity
kind: element
parent: semantic-objects
title: Framework Identity
definition: Framework Identity 定义息壤开发框架的统一产品身份：唯一 `xirang` CLI 可执行入口、隐藏 `.xirang` durable workspace 与无兼容层合同。它是项目级身份不变量，可直接在 Project Root 下独立演进，不依赖实现结构。
---

## Specification

### Section: CLI 可执行命令 SHALL 为 xirang

息壤 CLI 的唯一可执行命令 SHALL 为 `xirang`，不提供其他命令别名。

- **运行 CLI 命令**

  - 用户在终端执行 `xirang --help`
  - 系统 SHALL 显示息壤 CLI 帮助信息
  - 帮助信息 SHALL 包含 `xirang` 作为命令名称

- **尝试使用其他命令名称**

  - 用户尝试通过其他命令名称调用本框架
  - 系统 SHALL 报告命令不存在
  - SHALL NOT 自动路由到 `xirang`

- **Shell completion**

  - 用户安装 shell completion
  - 补全脚本 SHALL 为 `xirang` 命令注册
  - SHALL NOT 为其他命令名称注册

### Section: 项目工作区 SHALL 为 .xirang

目标项目的息壤 durable workspace SHALL 位于项目根目录 `.xirang/`。Project Setup、Candidate 与 history 均 SHALL 使用该唯一 workspace，且 SHALL NOT 回退或双写其他目录。

- **Setup 新项目**

  - 用户运行 `xirang setup`
  - 系统 SHALL 创建 `.xirang/` durable core
  - SHALL NOT 创建 non-hidden legacy workspace

- **跨平台路径处理**

  - CLI 在 Windows、macOS 或 Linux 构建 `.xirang/` 路径
  - SHALL 使用 `path.join()` 或 `path.resolve()`
  - SHALL NOT 硬编码路径分隔符

### Section: 工作区目录结构 SHALL 完整

`.xirang/` SHALL 包含 formal Semantic Model、change-local deltas、Agent references 和配置，并 MAY 按操作需要物化一个 active Candidate 与 durable history。

- **标准工作区结构**

  - 初始化息壤项目
  - durable core SHALL 包含四分区模型、`changes/`、`references/` 和 `config.yaml`
  - Project Build MAY 物化 `.xirang/candidate/`
  - promotion 和 retired workspace cleanup MAY 物化 `.xirang/history/`
  - SHALL NOT 物化 active bootstrap 或 migration workspaces

- **History 不是 fallback source**

  - CLI 读取 formal model
  - SHALL 只读取 `.xirang/model/`
  - SHALL NOT 从 `.xirang/history/` 自动恢复或补全 source

### Section: CLI 命令引用 SHALL 一致

所有 active user-facing documentation、generated workflow templates、Agent instructions、skills、prompts 和 active Element Contracts SHALL 仅引用当前 `xirang --help` 暴露的命令与当前 managed skill names。

- **Project Build command references**

  - active surface 描述 setup 或 Project Build
  - SHALL 使用 `xirang setup`、`xirang candidate init|status|validate|promote` 与 `xirang-build`
  - SHALL NOT 使用退役命令名或 bootstrap 工作流名称

- **Archive history 残留**

  - stale references 仅存在于 `.xirang/changes/archive/**` 或 `.xirang/history/**`
  - MAY 将其保留为历史证据
  - active surfaces SHALL NOT 从这些文件生成 guidance

### Section: 不提供迁移兼容层

息壤 SHALL NOT 提供其他命令别名、non-hidden legacy workspace 回退或自动迁移工具。

- **无命令别名**

  - CLI 注册可执行命令
  - 系统 SHALL 仅注册 `xirang`
  - SHALL NOT 注册其他别名

- **无目录双读**

  - CLI 读取项目配置、模型或 changes
  - 系统 SHALL 仅从 `.xirang/` 读取
  - SHALL NOT 回退到 non-hidden legacy workspace 或提示迁移

- **无自动迁移工具**

  - 用户在仅含 non-hidden legacy workspace 的项目运行 `xirang` 命令
  - 系统 SHALL 报告未找到 `.xirang/` 项目
  - SHALL NOT 自动迁移该 workspace

### Section: Telemetry command identity SHALL 为 xirang
Telemetry events SHALL 使用 `xirang` 作为 executable identity，并使用当前 command path 作为 command property。

- **记录 setup**
  - 用户执行 `xirang setup`
  - telemetry SHALL 记录 command `setup`
  - SHALL NOT 记录 `init`

- **记录 Candidate subcommand**
  - 用户执行 `xirang candidate validate`
  - telemetry SHALL 记录完整 command path `candidate:validate`
  - SHALL NOT 记录 Candidate paths、digest 或项目内容

### Section: Package.json bin entry SHALL 为 xirang

npm package 的 bin entry SHALL 为 `xirang`。

- **npm 安装后可执行**

  - 用户通过 npm 安装框架
  - 系统 SHALL 在 PATH 中创建 `xirang` 可执行链接
  - SHALL NOT 创建其他框架命令链接
