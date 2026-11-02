---
entity: element-declaration
identity: deterministic-operations
kind: element
parent: cli
title: Deterministic Operations
definition: Deterministic Operations 在 Realization 中提供结构化查询、状态管理、instructions 与 templates 投影、程序化校验、验证证据持久化及原子状态转换，使关键操作具有一致结果、可复现证据和明确失败语义。
---

## MODIFIED Sections

### Section: 对模型和 Change 提供结构化操作

Deterministic Operations SHALL 支持 Semantic Model 与 Change 的查询、搜索、影响分析、差异、验证与派生呈现，并以 identity 而非文件位置寻址语义对象。发现型命令 SHALL 默认返回完成其职责所需的最小投影；完整语义 SHALL 只在调用方显式提供 stable identity 后由 `arch query` 返回，完整 Contract SHALL 只在显式使用 `--contract` 时返回。CLI 不得以默认摘要、截断或改写替代完整 Definition 或 Contract。

- **渐进式模型读取**

  - Agent 尚不知道相关 identity
  - 使用 `xirang arch search <query> --limit <n> --json` 定位候选
  - 再按需使用 `arch outline` 或 `arch impact` 获取层级和关系范围，使用 `arch query` 获取选定 Declaration，最后使用 `arch query --contract` 获取选定完整 Contract

- **全局结构诊断**

  - Agent 需要恢复全局结构，或整体模型认知在上下文压缩、长会话或切换后丢失
  - 使用 `xirang arch snapshot` 获取完整 Declaration、Relationships 和 Metamodel
  - snapshot 不包含 Contract，普通探索不将其作为默认入口

- **显式完整读取**

  - Agent 已确定需要判断某个 Element 的完整语义
  - `arch query <identity> --json` 返回完整 Declaration，`--contract` 额外返回该 identity 自有的完整 Contract
  - 不从 impact、outline、旧摘要或实现证据猜测缺失语义

### Section: 完整处理 Element Definition

Deterministic Operations SHALL 在 IR、解析、校验、序列化、Semantic Delta、semantic diff、fingerprint、Candidate、Sync、查询、搜索与影响分析中保留完整 Element Definition，并 SHALL NOT 以展示 excerpt 替代或截断该规范文本。发现型 projection MAY 省略 Definition，但不得返回伪造摘要；显式 `arch query` 与 `arch query --contract` SHALL 返回选定 identity 的完整 Declaration 与 Contract。

- **发现与完整读取分离**

  - Agent 使用 search、outline 或 impact 定位范围
  - 这些发现 projection 可以只返回 identity、层级、匹配证据或关系摘要
  - Agent 对需要判断的 identity 使用 `arch query`，不得把发现结果当作完整语义

- **完整目标语义保持原样**

  - ADDED 或 MODIFIED Declaration、query、fingerprint、Candidate validation 与 Sync 需要 Definition
  - 使用完整 Definition 确定目标语义，不做摘要、截断或语义改写
