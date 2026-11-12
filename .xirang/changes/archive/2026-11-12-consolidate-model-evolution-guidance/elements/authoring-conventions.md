---
entity: element-declaration
identity: authoring-conventions
kind: element
parent: agent-workbench-projection
title: "Authoring Conventions"
definition: "Authoring Conventions 定义契约与变更写作规范：Section 结构与自由载体、behavior-first 边界、稳态命名、progressive rigor、Header 即 identity、verb-first CLI 与 structure token/填充 prose 区分。其中项目目录结构语义已被 Semantic Model 四分区存储吸收，不在此重复。"
---

## MODIFIED Sections

### Section: 精简 Contract 表达

Contract SHALL 只写宿主 Element 在自身层级的职责、保证、约束与行为。Scope 写本 Element 的职责边界，Non-goals 只澄清必要职责排除，不罗列所有不负责的事情；整个 Change 范围属于 proposal，实现取舍与影响设计理解的理由属于 design。

- pi-native-markdown-preview 的“自研 HTTP 预览服务”是实现方案排除，应放 design.md，放入该 Element Contract 的 Scope and Non-goals 属于错误路由。

SHALL 直接写条件、行为和结果，删除不增加含义的解释。表达对照：“系统 MUST 对提交的来源版本进行严格校验，以确保更新始终基于最新记录，避免过期操作对现有内容造成覆盖。”可精简为“来源版本过期时，MUST 拒绝更新，记录保持不变。”

同层同一规则 SHALL 集中表达，其他位置补充不同信息：Scope 不复述完整管线，Business Logic 讲机制，异常部分补异常条件与结果，验收用具体输入和结果验证，不换措辞重复正文。父子 Contract 在不同抽象层级的必要覆盖保持完整，不为去重使父级依赖 children 才能理解承诺。

已有表达在目标模型中仍准确且适当时 SHALL 尽量沿用，只调整受影响内容，不顺带润色整段；用户已确认且清楚的表达不为正式文档化重新包装，条件、数值、例外与时序完整保留。

## ADDED Sections

### Section: 模型演进中的目标表达

模型发生变化时，Agent SHALL 在目标模型上下文中联合审视受影响 Elements 的 Declaration 与 Contract，按需修订，使语义一致，并在各自抽象层级表达完整、合适的语义，避免重复。该要求覆盖持续开发中的增长、精化、重构和精简，不仅适用于新增功能，也不以有限场景清单限制适用范围。

内容 MAY 在适当的抽象层级间迁移、改写，Sections MAY 调整、拆分、合并或消失；原文、Section 数量或位置保持不变不是语义保持的判据。增加子 Element 本身不减少父级职责：父 Contract 仍须独立表达本层完整承诺，子级进一步精化，不要求逐项复制子级细节。声明、Contract 和关系须在同一目标模型中联合判断。

Element 或 Section 消失时 SHALL 判断其承载的语义是被适当位置保留，还是确实移除；实现重构或文件删除不自动授权取消业务承诺。真正改变已确认承诺时遵循当前工作流的用户决策规则。

- **增长后形成父子**：起初一个 Element 足以讲清楚的内容，随开发需要父子 Elements 表达；细节可以移入子级，父级原 Section 可以改写或重新组织，但父级仍独立表达其本层保证。
- **重构后精简**：重构后某些 Element 或 Section 不再存在，内容更精简；仍有效的承诺由目标模型中的适当位置完整承载，不能仅因节点消失就认定承诺已取消。
- **去重时保留精化**：父级表达整体保证、子级表达具体条件与实现该保证的行为；两层必要语义均保留，同层没有换措辞重复同一条规则。
- **无关内容**：调整一个 Element 的内容归属时，仅检查和修改其实际影响范围，不顺带润色其他 Elements。
