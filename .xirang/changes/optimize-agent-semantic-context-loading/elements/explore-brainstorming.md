---
entity: element-declaration
identity: explore-brainstorming
kind: element
parent: design-exploration
title: Explore Brainstorming
definition: Explore Brainstorming 定义 Explore 的只读设计澄清流程：6 步 brainstorming checklist、一次一问的提问纪律、2-3 方案对比、分段设计确认、Design Summary 生成、范围检查与拆解建议、捕获边界路由以及主代理只读边界。
---

## MODIFIED Requirements

### Requirement: Explore 主代理保持只读

Explore main agent SHALL 保持只读：检查文件、搜索代码、运行只读 CLI、提问、比较方案并生成只存在于对话中的 Design Summary；SHALL NOT 创建、编辑、删除、格式化、重新生成或 patch 项目文件和 artifacts。当 Explore 需要影响面发现时，main agent SHALL 先使用 `xirang arch search` 浏览 Formal Semantic Model 并选择一个或多个 focus Element identities，再使用 identity-only `xirang arch impact` 获取 refinement、Relationships 与 canonical paths，最后通过 batch `xirang arch query` 只读取判断所需 identities 的完整 Definitions 与 Contracts。

#### Scenario: Explore 不写入制品

- **WHEN** 对话已形成确定的设计方向
- **THEN** main explore agent SHALL 将结果保留在对话状态中
- **AND** SHALL 生成只存在于对话中的 `Design Summary`
- **AND** SHALL 在需要生成 artifacts 时指示用户调用 propose workflow

#### Scenario: Explore 直接获取 semantic impact context

- **WHEN** explore 需要定位新概念或确认 proposal readiness
- **THEN** main explore agent SHALL 使用 `xirang arch search` 定位候选 focus Element identities
- **AND** SHALL 使用 `xirang arch impact` 读取 Formal Semantic Model 的相关 identities、refinement context、Relationships 与 canonical paths
- **AND** SHALL 使用 batch `xirang arch query --contract --json` 读取所选 identities 的完整语义
- **AND** SHALL 使用独立代码工具获取 implementation evidence，并自行判断影响，不得把 Relationship adjacency 自动解释为修改结论

#### Scenario: Explore 不从 identity-only impact 猜测语义

- **WHEN** impact 返回相关 identity 但 Agent 不清楚其 Definition 或 Contract
- **THEN** Agent SHALL 重新 query 该 identity
- **AND** SHALL NOT 根据 title、identity、残余上下文或实现代码补全缺失语义

#### Scenario: Explore skill 声明只读阶段边界表格

- **WHEN** 生成 `xirang-explore` skill 内容
- **THEN** 输出 SHALL 在正文首个章节包含 `## Workflow Stage` 表格
- **AND** 表格 SHALL 包含 Stage 行标记为 `EXPLORE` 并说明为只读头脑风暴阶段
- **AND** 表格 SHALL 包含 Forbidden 行声明禁止创建、编辑、删除任何文件或 artifact
- **AND** 表格 SHALL 位于 `## Required References` 等其他章节之前
