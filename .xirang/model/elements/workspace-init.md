---
entity: element-declaration
identity: workspace-init
kind: capability-specification
parent: workspace-init-update
title: Workspace Init
definition: Workspace Init 是 setup 创建完整息壤工作区的能力。它创建或保留 .xirang durable core、model 四分区骨架、changes、references 及固定 Agent workflow 集合，支持跨平台和非交互使用；后续 Project Build 通过工作面指导衔接，不以初始化完成代替模型构建。Element Declaration 与 Contract 共用 elements 单元，不存在独立 Contract store。
---

## Specification

### Section: Scope and Non-goals

Workspace Init SHALL 通过 setup 创建可用工作区骨架、带说明的项目配置及所选工具工作面，并保留已有用户内容。它不推断项目的完整 Elements/Contracts，不把 setup 完成等同 Project Build 完成。

### Section: Business Logic

新工作区 SHALL 包含 .xirang/model/{metamodel,elements,relationships,views}、changes、changes/archive、references；seed 为 project、element、perspective Kind 及稳定 identity 的 project.root Declaration。Root 采用完整 Project Definition，optional 且无 Contract 的 Element 以 declaration-only 单元表达；Contract 与 Declaration 共用 elements 单元，不建独立 Contract store。默认 Kinds 不预设固定层数或 C4 层级。

setup SHALL 为显式选择的工具交付 common、六个阶段 skills 和适用内部角色/共享 references。Project Build 使用 xirang-build，调用指导由工具适配按需提供，不在无必要结果的回执中重复整套 onboarding。所有路径使用平台 API，非交互场景要求显式合法 --tools。

setup SHALL 创建带完整字段说明、功能性默认值和可选注释示例的项目配置，configVersion 为 1，definitionDepth 为 2，decomposition 为 xirang-semantic-refinement.md；可选项不为介绍而启用。仅 setup 创建项目配置，其他命令不恢复缺失或损坏文件。

已有工作区 SHALL 保留模型、配置及用户内容；有 .yml 时沿用，不另造 .yaml。保留用户明确 decomposition（包括 c4 或自定义路径），只在用户明确选择工具后刷新受管工作面，不把重跑 setup 当隐式配置迁移。

完成后 SHALL 给出简短配置引导：实际位置、文档语言、项目背景与制品规则、分解指导、实现隔离、Git 合并策略与归档后分支保留，以及 config/config project/config check 入口。可用英文；必要引导、警告与错误写 stderr，无其他请求结果时 stdout 为空，JSON 模式不混入请求数据流，不输出泛化成功装饰或全部生成路径。

### Section: Edge Cases and Exception Handling

非法或缺少必需的非交互 tools 选择 SHALL 给出可操作诊断，不能猜测安装对象。已有模型与用户文件不因初始化被覆盖；配置文件存在时保留原内容，损坏文件交由用户或授权 Agent 处理。路径分隔符差异不得改变 seed 语义。发现需要迁移的非活动 workspace 时遵循明确名单和用户确认边界，不未经确认删除或部分移动。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 新项目骨架

无 .xirang 时 setup 创建四分区、changes/archive、references、默认 Kinds 和 project.root；不产生独立 Contracts 目录、.c4 或平行模型 store，不推断项目语义。

#### Acceptance Case: 新配置与发现入口

新 YAML 有 configVersion 1、definitionDepth 2、默认分解文件及完整说明，可选内容为注释示例；完成提示含实际路径、代表性能力和三个配置入口。

#### Acceptance Case: 保留已有配置

已有 .yml 及 decomposition: c4 或 .pi/skills/xirang-project-decomposition/SKILL.md：原样保留，不另造 .yaml、不覆盖为默认方法。

#### Acceptance Case: 工具选择与调用

合法非交互 --tools 交付固定六阶段和 common，Build invocation 使用工具适配的 xirang-build；非法值有可操作错误。

#### Acceptance Case: 跨平台及输出通道

Windows、macOS、Linux 获得等价逻辑骨架与默认值；必要配置引导进入 stderr，无请求数据时 stdout 空，JSON 不混成功装饰。
