---
entity: element-declaration
identity: project-tooling-configuration
kind: "element"
parent: "cli"
title: "Project and Tooling Configuration"
definition: "Project and Tooling Configuration 是 CLI 中建立和维护息壤项目及其工具环境的能力。它通过相应 CLI commands 初始化和更新息壤工作区，读取和管理项目配置，选择、安装、刷新与同步 Agent 工具集成，并维护息壤托管的 Agent 工作面及其 instructions、templates 与 references。"
---

## MODIFIED Sections

### Section: 管理项目与 Agent 工作面

Project and Tooling Configuration SHALL 建立和维护息壤工作区、项目配置与所选 Agent 工具集成，并持续管理息壤托管的 Agent 工作面。工作面 SHALL 提供公共前置 skill 与六个阶段 skills：用户可只加载公共 skill 后用自然语言表达阶段或工作意图，由 Agent 读取相应阶段指导；也可直接加载阶段 skill，由 Agent 补齐公共指导。阶段确认与验证门禁 SHALL 继续适用。

公共基础、阶段职责与专项指导 SHALL 分别组织，同一完整规则只在一个位置维护。指导 SHALL 按需加载；同一 Agent、同一项目中仍有效且可用的指导跨阶段复用，新 Agent、必要上下文丢失或指导更新时重新取得所需内容。静态指导复用 SHALL NOT 取消当前 Record、模型、配置、Git 或 Quality 状态的适用检查。

- **建立新项目**：用户选择项目与 Agent 工具后，CLI 建立工作区、项目配置与对应工具集成，公共及阶段指导均可达。
- **自然语言入口**：用户只加载 common 后说“探索一下这个需求”，Agent 读取 Explore 指导；用户直接加载 Explore 时补齐缺少的 common，保留已选阶段，不循环加载。

### Section: 投影共享 Element Contract 语义

Project and Tooling Configuration SHALL 从单一共享生成源向项目级 reference 交付 Element Definition 与 Element Contract 的边界及写作规则。Build、Explore、Propose 与 Snack SHALL 在涉及相应语义编写时通过明确入口读取该指导，并复用仍有效的已加载内容；阶段正文 SHALL NOT 承载同一完整规则。存储记法 SHALL 保持独立并按完整模型或 Delta 的当前编写需要读取。

- **刷新 Agent 工作面**：四个入口指向可达的一致语义写作指导；普通阶段切换不重新注入完整正文。
