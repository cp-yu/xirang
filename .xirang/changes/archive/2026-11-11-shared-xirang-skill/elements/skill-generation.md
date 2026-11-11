---
operation: MODIFIED
entity: element-declaration
identity: skill-generation
kind: "element"
parent: "agent-workbench-projection"
title: "Skill Generation"
definition: "Skill Generation 是息壤公共与阶段 skill 的生成能力。它独立承载公共基础、专项指导入口和合法 frontmatter 的交付边界，供各工作流在需要时获得同源规则；阶段业务流程与用户决策由对应工作身份承担，工具安装与同步由工作面投影承担。"
---

## MODIFIED Sections

### Section: Xirang Philosophy 注入 workflow skill 模板

Skill Generation SHALL 将完整 `XIRANG_PHILOSOPHY` 交付于 `xirang-common`，六个阶段 skills SHALL 声明公共前置依赖，正文不内联该完整片段。common SHALL 承载统一语义依据、identity 等基本约束，以及阶段选择、按需加载和复用规则；专项细则通过单一 reference 提供。

用户可以只加载 common 后通过自然语言选择阶段，也可以直接加载任一阶段 skill；Agent SHALL 在开展该阶段工作前取得缺少的公共指导，已加载且仍有效时复用。单独加载 common SHALL NOT 无条件加载全部阶段或专项指导。

- **common 入口**：只加载 common 后说“进入 Explore”，Agent 读取 Explore 并按其职责工作。
- **阶段入口**：直接加载 Explore 且 common 尚不可用，Agent 补读 common 后继续 Explore；不得要求用户先手动调用 common。

### Section: Xirang Philosophy 注入 internal subagent 模板

Reviewer 与 Optimizer 的生成角色指导 SHALL 引用公共 skill 取得 Philosophy 和适用的公共基础，不内联其完整副本。每个独立 Agent SHALL 从自己的有效上下文判断是否已取得指导，主 Agent 已加载不代表子 Agent 已加载。加载公共 skill SHALL 保留受托角色与范围，不重新选择用户阶段，也不改变独立取证和角色权限。

其他 internal surfaces SHALL 只加载自身职责实际需要的指导，不因公共 skill 存在而预加载全部协议。公共内容生成源 SHALL 显式记录使用方与适用边界。

- **独立 Reviewer**：主 Agent 已读 common，fresh Reviewer 仍取得自身需要的公共指导，再按只读审查角色取证。
- **恢复上下文**：必要指导已不可用时，子 Agent 补读对应内容，角色与委托范围保持不变。

### Section: 共享生成结构拆分 guidance

Skill Generation SHALL 从一个 canonical 生成源向项目级 reference 交付英文结构拆分配置消费规则。Build、Explore、Propose 与 Snack SHALL 仅在形成或重组 hierarchy 时读取该指导，复用仍有效的内容：读取 normalized `decomposition` 解析出的完整指导文件，缺失或不可读即停止结构形成，不以其他方法替代。各入口保留适用时机，不内联相互漂移的解析逻辑。

- **结构形成入口**：四个入口指向同一配置消费规则，规则不含 method/skill 分支。
- **无结构需求**：Contract-only 工作与 Apply、Archive、Reviewer、Optimizer 不因公共依赖而加载分解方法或重建 hierarchy。
- **项目指导优先**：本仓库专属分解规则由用户指导文件承载，不进入公共规则正文。
- **生成约束**：各工具投影语义一致，skills 与 references 遵守既有长度约束。
