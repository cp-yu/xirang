---
entity: element-declaration
identity: project-tooling-configuration
kind: element
parent: cli
title: Project and Tooling Configuration
definition: Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。
---

## Specification

### Section: 管理项目与 Agent 工作面

Project and Tooling Configuration SHALL 建立和维护息壤工作区、项目配置与所选 Agent 工具集成，并持续管理息壤托管的 Agent 工作面。工作面 SHALL 提供公共前置 skill 与六个阶段 skills：用户可只加载公共 skill 后用自然语言表达阶段或工作意图，由 Agent 读取相应阶段指导；也可直接加载阶段 skill，由 Agent 补齐公共指导。阶段确认与验证门禁 SHALL 继续适用。

公共基础、阶段职责与专项指导 SHALL 分别组织，同一完整规则只在一个位置维护。指导 SHALL 按需加载；同一 Agent、同一项目中仍有效且可用的指导跨阶段复用，新 Agent、必要上下文丢失或指导更新时重新取得所需内容。静态指导复用 SHALL NOT 取消当前 Record、模型、配置、Git 或 Quality 状态的适用检查。

- **建立新项目**：用户选择项目与 Agent 工具后，CLI 建立工作区、项目配置与对应工具集成，公共及阶段指导均可达。
- **自然语言入口**：用户只加载 common 后说“探索一下这个需求”，Agent 读取 Explore 指导；用户直接加载 Explore 时补齐缺少的 common，保留已选阶段，不循环加载。

### Section: 保持配置一致

Project and Tooling Configuration SHALL 通过 CLI 维护项目配置和 Agent 工具集成的一致状态。

- **更新已配置项目**

  - 用户请求维护现有项目配置与工具集成
  - CLI 依据当前配置刷新息壤托管的工作面

### Section: 投影共享 Element Contract 语义

Project and Tooling Configuration SHALL 从单一共享生成源向项目级 reference 交付 Element Definition 与 Element Contract 的边界及写作规则。Build、Explore、Propose 与 Snack SHALL 在涉及相应语义编写时通过明确入口读取该指导，并复用仍有效的已加载内容；阶段正文 SHALL NOT 承载同一完整规则。存储记法 SHALL 保持独立并按完整模型或 Delta 的当前编写需要读取。

- **刷新 Agent 工作面**：四个入口指向可达的一致语义写作指导；普通阶段切换不重新注入完整正文。

### Section: 以 Project Definition 初始化根 Element

Project and Tooling Configuration SHALL 在建立新 Xirang 工作区时收集 Project Definition，并以该完整 Definition 初始化 Project Root Declaration，SHALL NOT 将紧凑 summary 作为根 Element 的规范性概念表述。

- **跨平台初始化项目**

  - 用户在 macOS、Linux 或 Windows 上建立新项目
  - CLI 通过平台路径 API 写入包含 `definition` 的 Project Root 单元，且结果不依赖路径分隔符

### Section: 管理 Outline Element Definition 深度配置

Project and Tooling Configuration SHALL 将 `architecture.outline.elementDefinitionDepth` 作为项目级 functional configuration 管理。该字段 SHALL 为非负整数，缺失时有效默认值 SHALL 为 `2`；默认值 SHALL 由同一配置常量用于 setup/update 磁盘物化、resilient parsing 后的 effective config、normalized projection 与 `arch outline` command resolution。

- **新项目物化默认值**

  - `xirang setup` 或 config default migration 创建项目配置
  - `.xirang/config.yaml` SHALL 包含 `architecture.outline.elementDefinitionDepth: 2`
  - SHALL 使用现有 functional default materialization path，而不是独立硬编码

- **既有项目补充缺失默认值**

  - update 或 default migration 处理未声明 outline config 的既有 `.yaml` 或 `.yml` 配置
  - CLI SHALL 只补充缺失的 nested mapping keys
  - SHALL NOT 覆盖用户已有的合法 `elementDefinitionDepth`

- **读取合法配置值**

  - 项目配置包含 `architecture.outline.elementDefinitionDepth: 4`
  - normalized project config 与未显式覆盖的 `arch outline` SHALL 使用值 `4`
  - SHALL NOT 将该值解释为模型结构裁剪深度

- **非法配置回退有效默认值**

  - 配置值为负数、非整数或 nested shape 非法
  - resilient parser SHALL 输出 field-specific warning
  - effective normalized projection 与 `arch outline` SHALL 使用默认值 `2`
  - 其他有效项目配置字段 SHALL 继续可用

- **config project 显示有效值**

  - 用户运行 `xirang config project --json`
  - normalized output SHALL 包含有效 `architecture.outline.elementDefinitionDepth`
  - 缺失 raw config 时 SHALL 仍显示默认值 `2`

- **Agent config projection 显示有效值**

  - CLI 为 Agent-facing artifact instructions 构建 `configProjection.prompt.fragments`
  - projection SHALL 包含 `architecture` fragment 与 `architecture.outline.elementDefinitionDepth: <effective value>`
  - fragment SHALL 只投影有效值，不重复静态 Semantic Model 恢复协议

- **跨平台配置路径一致**

  - 在 Windows、macOS 或 Linux 上读取、创建或迁移 `.xirang/config.yaml` 或 `.xirang/config.yml`
  - CLI SHALL 使用 Node.js path utilities
  - 两种扩展名 SHALL 产生相同 outline configuration semantics

### Section: 投影共享 Design Record 协议

Project and Tooling Configuration SHALL 从 Xirang-owned 单一生成源向 Build、Explore、Propose 及共享 references 投影同版本 Design Record 协议与默认 semantic-refinement 指导，不运行时依赖用户级 problem-framing skill。受管生成面的新增、更新和删除 SHALL 按显式 manifest 名单定位，不按名称模式扫描替换；更名后不再投影的旧 Definition Framing reference SHALL 作为受管生成面被删除，用户专用拆分 skill 不受覆盖。

- **共享协议在三入口可用**

  - CLI 同步所选 Agent 工具集成
  - Build、Explore、Propose 指向同版本可达的 Design Record reference，入口包含适用的读取与重读条件。

- **旧受管 reference 被清理**

  - 工作区中存在由框架投影的旧 Definition Framing reference
  - 同步后该文件被删除，新 Design Record reference 可达，用户自有文件不受影响。

- **受管同步不覆盖用户内容**

  - 刷新受本 Change 影响的模板、reference 与生成面
  - 只按登记名单更新相关工作面，保留用户 skill 与未登记内容，不直接修改生成文件代替源模板。
