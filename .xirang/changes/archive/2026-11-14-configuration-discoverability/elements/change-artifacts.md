---
entity: element-declaration
identity: "change-artifacts"
kind: "element"
parent: "change-plan"
title: "Change Artifacts"
definition: "Change Artifacts 定义 Change 制品集合的结构化语义：proposal/design/tasks 作为 compilation scaffolding，四分区 Semantic Delta 作为 behavior/architecture source；effective diff 仅由只读 `xirang validate --change` 以 ephemeral text/JSON 输出提供，不存在持久化 review artifact；Validation commands 保持只读，generated write behavior 由显式 workflow command 持有。"
---

## MODIFIED Sections

### Section: 制品语义边界

Change 的语义来源 SHALL 由 semantic-delta 制品承载，它是 elements、metamodel、relationships、views 四分区的完整 Semantic Delta；elements 单元携带 Declaration 与 Section Entries，其余分区携带相应 Kind、Relationship 和 Authored View Entries。proposal、design、tasks 为辅助制品，不独立定义目标语义。

semantic-delta SHALL 按实体身份表达目标内容，不包含派生 diff。effective diff 由当前 Formal Model 与 Change 确定性派生，通过只读 validate --change 或 Browser 呈现，不作为持久语义输入。

- 仅 Relationship 或 Authored View 变化：对应分区完整表达变化，不伪造 Element Contract 差量或 .delta-noop。
- 所有语义对象均无变化：使用 .delta-noop 完成标记，不生成空差量单元。
- 某分区无变化：该分区可为空；其余真实差量仍共同推导目标模型。
- 查看差异：从当前正式模型及差量派生，不以历史 review 文档作为规范来源。

### Section: 制品定义先行写作

工作面 SHALL 以制品 Definition、Guidance、Template 的顺序交付静态写作依据。semantic-delta 的指导完整说明四分区对象、修改语与完整目标内容；项目 proseLanguage、context 和匹配的 rules 由 config project 独立查询，不改变制品 purpose、compilationRole、content boundary 或 writePolicy。

制品依赖与完成状态通过 status 查询。依赖尚未完成时，静态定义仍可读取，但不得把指导可读当作依赖已完成。通用静态制品指导不编排 sync 或 archive 等状态转换。

- Agent 编写 semantic-delta：先读取对应静态 reference，再查询 --artifact semantic-delta 的项目规则；规则作为附加要求，不覆盖定义。
- Change 尚缺 proposal：可读取差量定义，status 仍按制品图报告 blocked。
