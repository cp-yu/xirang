---
entity: element-declaration
identity: project-tooling-configuration
kind: capability-specification
parent: cli
title: Project and Tooling Configuration
definition: Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。
---

## Specification

### Section: Scope and Non-goals

Project and Tooling Configuration SHALL 建立和维护工作区、配置及所选 Agent 工具集成，交付完整公共/阶段工作面和所需专项指导。它负责配置与交付的一致性，用户设计判断、Candidate 语义编写及项目实现由相应工作身份承担。

### Section: Business Logic

系统 SHALL 通过 setup 建立新工作区并保留已有用户内容，以用户提供的完整 Project Definition 初始化 Project Root Declaration，不用紧凑 summary 或实现推断代替规范定义；Project Build 负责后续完整模型。所选工具获得 common、六个阶段 skills、支持的内部 Agent 制品及共享 references。

工作面 SHALL 支持 common 的自然语言阶段入口与直接阶段入口。补齐缺少公共指导时保留已选阶段，不循环加载；公共基础、阶段流程、专项规则各有唯一来源，按需加载并在同项目有效上下文中复用。复用不取消模型、Record、配置、Git 或 Quality 状态检查。

语义写作、Design Record 和默认 semantic-refinement SHALL 由框架单一来源交付，Build/Explore/Propose/Snack 按工作触发读取，不运行时依赖用户级 problem-framing skill。受管新增/更新/删除按明确名单定位，保留用户方法、skill 和未登记内容。物理路径通过平台 API 定位，Windows、macOS、Linux 等价。

项目配置 SHALL 承载当前项目基础设置和作用域明确的偏好，AGENTS.md 承载普遍约定，全局工具设置单独管理。setup/help/config/YAML 使配置可发现；config project 返回有效值，config check 只读详细解释有效性、来源、范围与诊断；字段定义、说明和默认值一致。common 取得 context，修改协议按需加载，授权修改后重读验证，不自动保存模型建议。

architecture.outline.definitionDepth SHALL 为非负整数，默认 2，共享默认值用于 setup、有效数据和 outline；显式 Definition projection 使用该默认，--definition-depth 仅覆盖当前调用，不裁剪层级树或控制浏览器展开。

只有 setup SHALL 创建项目配置；update 对已有合法版本配置先验证完整链，仅保留最近 10 次迁移操作，全部成功后原子写回内容与版本。按明确清单补说明/结构、清理陈旧内容并报告，保护仍适用用户值、注释和排版，重复执行不重复修改。

### Section: Edge Cases and Exception Handling

配置缺失/损坏时 SHALL 由用户或委托 Agent 处理，查询/check/update 不恢复。版本缺失、非法、较新、链不完整或执行失败时原文件不变，不猜测或填 1；超窗口报告当前/目标/最低起始版本并提示旧 CLI 中转，不自动安装或跳步骤。

非法 definitionDepth 的普通读取 SHALL 告警并回退 2，check 报错误；其他合法配置可用。指导不可用、状态已变或正文丢失时须重新取得，不能用静态复用绕过适用门禁。受管同步只更新明确对象，不覆盖用户专用指导。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 项目与工具建立

用户提供 Project Definition 并选择工具后，建立模型骨架、配置和对应工作面；Root 使用完整 Definition，所有公共/阶段入口可达。

#### Acceptance Case: 自然语言与直接入口

只加载 common 后说“探索一下这个需求”时进入 Explore；直接加载 Explore 时补齐 common，已选阶段不变。

#### Acceptance Case: 默认深度与覆盖

配置 definitionDepth 为 4 时有效查询和未被参数覆盖的 Definitions 使用 4；缺失默认 2，非法值普通读取回退 2 且 check 报错，命令覆盖不改配置。

#### Acceptance Case: 版本演进与内容保护

已有合法版本配置升级成功后原子提交内容/版本，用户方法、注释、排版保留；缺链或步骤失败不改变原文件。

#### Acceptance Case: 跨平台受管交付

Windows、macOS、Linux 同步后，语义写作/Design Record/default refinement 引用指向可读同版本指导，用户文件不被覆盖。
