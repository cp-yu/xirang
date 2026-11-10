---
entity: element-declaration
identity: workspace-init
kind: element
parent: workspace-init-update
title: Workspace Init
definition: Workspace Init 是 setup 创建完整息壤工作区的能力。它创建或保留 .xirang durable core、model 四分区骨架、changes、references 及固定 Agent workflow 集合，支持跨平台和非交互使用；后续 Project Build 通过工作面指导衔接，不以初始化完成代替模型构建。Element Declaration 与 Contract 共用 elements 单元，不存在独立 Contract store。
---

## Specification

### Section: Xirang Setup SHALL 创建可用的 formal skeleton

`xirang setup` SHALL 创建或保留 `.xirang` durable core、project configuration、versioned formal Semantic Model skeleton，且不得声称 Project Build 已完成。Setup SHALL 创建 `.xirang/model/{metamodel,elements,relationships,views}` 四个模型分区、`changes`、`references` 与 Project Root Declaration；无 Contract 的 optional Element SHALL 作为 `elements/` 中的 declaration-only 单元表达，不得创建 `.xirang/specs`、`contracts` 或其他平行 Contract store。

- **新项目 setup**

  - project 中不存在 `.xirang/` workspace
  - setup SHALL 创建 config、`model/{metamodel,elements,relationships,views}` 四分区、changes 与 references
  - SHALL 创建 Project Root Declaration 骨架
  - SHALL NOT 创建独立的 Contracts 目录或平行 Contract store
  - SHALL NOT 从 project evidence 推断 Candidate 语义

- **Existing project setup**

  - `.xirang/` 已存在
  - setup SHALL 保留 existing formal source、配置和用户内容
  - 仅在用户明确选择工具后刷新 managed Agent surfaces

- **First-run skeleton**

  - `xirang setup` 在没有 Xirang workspace 的项目中运行
  - SHALL 创建 `model/{metamodel,elements,relationships,views}` 四分区与 seed 单元（`metamodel/project.md`、`metamodel/element.md`、`metamodel/perspective.md`、`elements/project.root.md`）
  - SHALL 创建 Project Root 骨架
  - SHALL NOT 推断 project elements 或 Contracts
  - SHALL NOT 创建 `.c4` 文件或 `.xirang/architecture/`

- **初始化 Semantic Model 结构**

  - `xirang setup` runs
  - it SHALL create `model/{metamodel,elements,relationships,views}` 四分区与 `changes`、`changes/archive`、`references` 目录
  - SHALL 使用稳定 Project Root identity
  - MUST NOT 创建 legacy Xirang YAML 文件

- **Existing source preservation**

  - setup 在 existing workspace 中运行
  - existing model 分区、配置和用户内容 SHALL NOT 被覆盖

- **默认 Kind 不预设层级**

  - setup 创建默认 metamodel seed
  - project、element 与 perspective 表达语义类别，不要求固定层数或 C4 层级；除 Project Root 骨架外不推断项目 Elements 或 Contracts。

### Section: Xirang Setup SHALL 安装固定 Agent workflow 集合

`xirang setup` 与 `xirang update` SHALL 安装 fixed workflow set：propose、explore、apply、archive、build 和 snack。Build workflow SHALL 使用 skill name 与 directory `xirang-build`，并 SHALL NOT 生成 slash-command artifacts。

- **安装 Build workflow**

  - configured tool 支持 skills
  - setup SHALL 生成 `xirang-build`
  - SHALL NOT 生成退役的 bootstrap workflow

### Section: Xirang Setup SHALL 支持跨平台与 non-interactive 运行

Setup SHALL 对所有 workspace paths 使用 Node.js path APIs，并 SHALL 提供显式 non-interactive tool selection。

- **Windows setup**

  - setup 在 Windows、macOS 或 Linux 上运行
  - generated workspace paths 与 formal source content 等价
  - filesystem operations SHALL 使用 path-aware APIs

- **Non-interactive setup**

  - setup 在无 prompts 环境中运行
  - SHALL 要求显式 supported `--tools` value
  - invalid values SHALL 返回 actionable diagnostics

- **跨平台路径处理**

  - setup runs on POSIX or Windows
  - filesystem paths SHALL use `path.join()` or `path.resolve()`
  - generated model seed content SHALL 在平台上保持一致

### Section: Setup success guidance SHALL 暴露 Project Build

Setup 交付的工作面 SHALL 通过按需读取的工具适配指导暴露 Project Build invocation，不在无结果成功回执中重复整套 onboarding。指导 SHALL 使用当前工具的 xirang-build invocation，不引用退役 bootstrap workflow。

### Section: Setup output messaging

Setup SHALL 在无必要结果的成功操作后保持 stdout 为空，--json 同样适用；不得默认列出全部生成路径、工具名或成功摘要。真实警告与错误 SHALL 写入 stderr。用户显式请求的交互选择与帮助 SHALL 保留，成功静默不改变工作区和受管制品的实际创建职责。

### Section: Setup 物化默认结构拆分方法

`xirang setup` SHALL 通过共享 project config default materialization contract 在新工作区配置中写入 `decomposition: xirang-semantic-refinement.md`，并 SHALL 保留 existing workspace 中用户已配置的 `decomposition` 值。

- **新项目获得显式默认指导文件**

  - setup 创建新的 `.xirang/config.yaml`
  - 配置包含 `decomposition: xirang-semantic-refinement.md`

- **Existing project 保留用户配置**

  - existing workspace 配置包含 `decomposition: .pi/skills/xirang-project-decomposition/SKILL.md` 或其他合法字符串值
  - setup 保留该值
  - 不添加默认指导文件

- **跨平台 setup 写入相同默认值**

  - setup 在 Windows、macOS 或 Linux 上创建项目配置
  - 使用 Node.js path API 定位配置文件
  - 写入语义相同的 `decomposition: xirang-semantic-refinement.md`

- **显式 C4 仍被保留**

  - existing workspace 明确配置 `decomposition: c4`
  - setup 保留该选择，不用默认指导文件替换用户值。
