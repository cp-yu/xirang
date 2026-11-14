---
operation: MODIFIED
entity: element-declaration
identity: "authoring-conventions"
kind: "element"
parent: "references-home"
title: "共享语义写作指导"
definition: "共享语义写作指导是息壤 Declaration、Contract、Change 与相关交互表达的写作契约。它独立承载抽象层级完整性、目标状态表达、Section 身份与自由载体、规范标记、制品职责分工及精简规则，并由业务规格标准进一步细化专用格式；生成路径与加载入口由共享 Reference 交付负责。"
---

## MODIFIED Sections

### Section: 变更内 Contract 表达目标稳态

Change-local Section Entries SHALL 使用 ADDED、MODIFIED、REMOVED。ADDED/MODIFIED 携带目标状态下成立的完整内容；正文不承载相对其他状态的变更叙述，MODIFIED 保留该目标中仍成立的案例及 exact Section title。REMOVED 只声明所移除 Section 的 identity，不携带正文、理由或迁移安排；这些安排属于 Change Plan。

Acceptance Cases 是宿主 Section 的内部结构，不独立携带修改语。目标中不存在的案例在完整目标 Section 中省略；呈现层可根据两状态派生案例差异，不把派生操作写回源。

- 删除一个 Section：REMOVED 只含其标题；Expected Model 不保留该 Section 或删除叙述。
- 修改一个 Section 并取消其中一个案例：目标正文直接表达仍成立的承诺和案例。
- 改名 Section：REMOVED 声明旧身份，ADDED 声明新身份及完整目标内容。

### Section: semantic-model instruction 区分结构 token 和填充 prose

写作指导 SHALL 区分解析所需的 canonical tokens 与作者填充的自然语言。`### Section:`、`#### Acceptance Case:`、修改语、identity、schema keys、路径、命令及代码标识保持原文；自然语言遵循有效 proseLanguage。业务规格的四个固定标题保持英文，MODIFIED Section 保持 exact title。

tasks.md SHALL 以 `## Goals`、稳定的 G<n> checkbox、Contract 引用与 Verify 方向组织目标。目标内容使用配置语言，具体实现文件、测试动作及执行日志由 Apply 根据项目证据安排，不写成任务制品的固定格式。

- 中文目标正文可包含 canonical 英文标记；标记不得为迎合 proseLanguage 而翻译。
- 任务引用精确指向 Element 与 Section，验证方向说明条件和可观察结果。

### Section: Proposal 格式

Proposal SHALL 说明发起 Change 的原因、变化范围、来源影响及实施影响，区分 Contract 影响与 Declaration、Relationship、Metamodel、View 的结构影响。说明须足以让用户理解当前问题、目标及破坏性影响，完整目标语义由 Semantic Delta 承载，关键决策由 design.md 承载。

### Section: Verb–Noun CLI Command Structure

CLI 命名指导 SHALL 优先采用动作明确的顶层命令；具有内聚生命周期的持久资源可使用稳定名词命名空间，命名空间只聚合该资源的相关操作。

- setup 表达工作区初始化动作。
- candidate init/status/validate/promote 聚合 Candidate 生命周期。
- 未注册命令应报告不存在，不隐式转发到其他操作。
