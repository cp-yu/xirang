---
element: cap.ai.explore-brainstorming
---

## MODIFIED Requirements

### Requirement: Explore 主代理保持只读

Explore main agent SHALL 保持只读。生成的 explore skill 内容 SHALL 在正文开头通过 `## Workflow Stage` 表格声明只读边界，包含 Stage、Allowed、Forbidden 三行。它 SHALL 检查文件、搜索代码、运行只读 Xirang CLI、提问、比较方案并生成只存在于对话中的 `Design Summary`；它 SHALL NOT 创建、编辑、删除、格式化、重新生成或 patch 项目文件和 Xirang artifacts。

当 Explore 需要影响面发现时，main agent SHALL 先使用 `xirang arch search <query> --json` 浏览 Formal Semantic Model 并选择一个或多个 focus Elements，再使用 `xirang arch impact <elementIds...> --depth 2 --json` 获取 refinement、Relationships、canonical paths 与完整 Element Contracts。实现证据 SHALL 通过 CodeGraph、ACE、`rg`、`read` 或其他独立代码工具收集。Main agent SHALL 联合语义上下文、实现证据和用户意图自行判断影响，不得把 Relationship adjacency 自动解释为修改结论。

#### Scenario: Explore 不写入制品

- **WHEN** 用户调用 `xirang-explore`
- **AND** 对话已形成确定的设计方向
- **THEN** main explore agent SHALL 将结果保留在对话状态中
- **AND** SHALL 生成只存在于对话中的 `Design Summary`
- **AND** SHALL 在需要生成 artifacts 时指示用户调用 `xirang-propose`

#### Scenario: Explore 直接获取 semantic impact context

- **WHEN** explore 需要定位新概念或确认 proposal readiness
- **THEN** main explore agent SHALL 使用 `xirang arch search` 定位候选 focus Elements
- **AND** SHALL 使用 `xirang arch impact` 读取 Formal Semantic Model impact context
- **AND** SHALL 使用独立代码工具获取 implementation evidence
- **AND** SHALL 自行判断 `mustChange`、`mustVerify`、context、unknown 与 architecture drift
- **AND** SHALL NOT 读取 active Change 作为 `arch impact` 输入

#### Scenario: Explore skill 声明只读阶段边界表格

- **WHEN** 生成 `xirang-explore` skill 内容
- **THEN** 输出 SHALL 在正文首个章节包含 `## Workflow Stage` 表格
- **AND** 表格 SHALL 包含 Stage 行标记为 `EXPLORE` 并说明为只读头脑风暴阶段
- **AND** 表格 SHALL 包含 Forbidden 行声明禁止创建、编辑、删除任何文件或 artifact
- **AND** 表格 SHALL 位于 `## Required References` 等其他章节之前

### Requirement: Explore 通过 referenceFiles 暴露 superpowers 行为引导

`xirang-explore` SHALL 通过 `referenceFiles` 暴露 Superpowers 风格的行为引导手册，作为主 instructions 的权威行为展开版。Reference 内容 SHALL 以原始 Superpowers `brainstorming` skill 的设计前置纪律为行为来源，并适配 Xirang Explore 的只读边界和 `xirang-propose` 路由。

Reference 内容 SHALL 覆盖：实现前 hard gate、项目上下文探索、just-in-time visual companion 判断、一次一问、2-3 方案对比、分段设计确认、conversation-only `Design Summary`、Design Summary 自检、用户审查 gate、以及进入 `xirang-propose` 的交接。Reference 内容 SHALL 将写 design doc、commit、user review、writing-plans 交接语义映射到 conversation-only `Design Summary` 和 `xirang-propose` workflow，不得暗示 Explore 可直接创建或更新 artifacts。

Reference 内容 SHALL 与只读边界、direct semantic impact navigation 和 Design Summary 路由机制保持一致。Reference SHALL NOT 包含工具特定调用语法，也 SHALL NOT 重复 CLI impact protocol 或 Future Capture Target 路由表。Reference MAY 概述 brainstorming checklist，但 MUST NOT 复制主 instructions 的 Xirang-specific mechanics。

Reference 文件 SHALL 声明为 `references/explore-supperpowers-style.md` 并物化到 `.xirang/references/xirang-explore-supperpowers-style.md`，满足 `skill-template-length-check` 的 ≤500 行限制。主 SKILL.md instructions SHALL 保留入口、只读边界、Required Context、Semantic Impact 与唯一 Brainstorming Checklist，并通过 Required References 指向该物化 reference；主 instructions SHALL NOT 重新构建 Superpowers 行为内容。

#### Scenario: explore 声明 supperpowers-style reference

- **WHEN** `getExploreSkillTemplate()` 生成 explore skill
- **THEN** 返回对象 SHALL 包含 `referenceFiles` 数组
- **AND** 该数组 SHALL 包含一项 `{ path: 'references/explore-supperpowers-style.md', ... }`
- **AND** 该 reference 内容 SHALL 覆盖 Superpowers hard gate、context exploration、just-in-time visual companion、one-question discipline、2-3 approaches、section-by-section design approval、Design Summary self-review、user review gate、xirang-propose handoff

#### Scenario: reference 内容路由到 propose 而非直接写入

- **WHEN** reference 内容涉及 artifact 生成或更新
- **THEN** SHALL 使用 `xirang-propose` 逻辑 workflow 名称路由
- **AND** SHALL NOT 包含暗示 Explore 直接写入 artifact 或进入 implementation planning 的表述

#### Scenario: reference 保留 Superpowers 设计前置纪律

- **WHEN** agent 读取 `.xirang/references/xirang-explore-supperpowers-style.md`
- **THEN** reference SHALL 明确在设计确认完成前不得实现
- **AND** SHALL 明确简单变更仍需要设计确认，但只确认适用章节，最低集合为 problem、impact scope、approach 与 verification method
- **AND** SHALL 明确用户审查通过 `Design Summary` 后才能路由到 `xirang-propose`

#### Scenario: reference 不重复主 instructions 机制

- **WHEN** 生成 reference 内容
- **THEN** SHALL NOT 包含 `arch search`、`arch impact` 的编排协议或 Future Capture Target 路由表
- **AND** SHALL 聚焦 Superpowers brainstorming 行为纪律及其 Xirang 适配

#### Scenario: 主 instructions 保持精简并指向 reference

- **WHEN** 生成 explore 主 SKILL.md instructions
- **THEN** 主 instructions SHALL 保留只读边界、Semantic Impact、Brainstorming Checklist
- **AND** SHALL 包含指向 `.xirang/references/xirang-explore-supperpowers-style.md` 的 Required References 引用，且 SHALL 使用“必须阅读”级措辞
- **AND** SHALL 将该 reference 声明为 Superpowers 行为引导的权威来源，不在主 instructions 中重新构建该行为内容
- **AND** 主 SKILL.md SHALL 满足 ≤200 行限制
