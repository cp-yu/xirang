---
entity: element-declaration
identity: project-config-loading
kind: capability-specification
parent: project-config-management
title: 项目配置
definition: 项目配置是单个息壤项目的配置读取与使用契约。它独立承载项目配置文件选择、字段校验、安全回退、有效值与默认值、语言和规则作用域、引用解析及版本元数据，为 CLI、运行时和 Agent 提供一致的项目配置；用户意图授权与实际规则执行由对应 Agent 和操作承担。
---

## Specification

### Section: Scope and Non-goals

项目配置 SHALL 承担单个项目配置的文件选择、字段校验、归一化、默认值、引用解析和消费作用域，为 CLI、运行时与 Agent 提供一致数据。普通读取不修改文件；配置整体诊断、版本迁移、用户授权和实际执行由对应能力承担。

### Section: Business Logic

项目规则 SHALL 使用当前 schema 的制品 ID。四分区差量的规则键为 `rules.semantic-delta`，它作用于 semantic-delta 制品的完整内容；`--artifact semantic-delta` SHALL 选择该规则，proposal/design/tasks 查询不混入该规则。

项目配置 SHALL 经文件选择、字段解析和归一化形成有效值，再按字段作用域供对应工作消费。

#### 文件与有效数据

读取 SHALL 优先 `.xirang/config.yaml`，缺失时选用 `.xirang/config.yml`，不合并；Windows、macOS、Linux 通过平台路径解析定位。每次 CLI 查询读取当前磁盘内容。字段独立校验，合法值经共享管线归一化，消费者不重解 raw YAML。解析层 schema 可省略；有效值为非空合法字符串。

新配置功能性默认值 SHALL 为 configVersion: 1、schema: semantic-model、decomposition: xirang-semantic-refinement.md、architecture.outline.definitionDepth: 2、apply.defaultIsolation: ask、git.merge.strategy: no-ff、git.branch.deleteAfterArchive: false。可选 context、rules、语言覆盖和 git.commitMessage 路径以注释示例介绍。setup 使用这些默认值；适用版本迁移只补缺失的必要字段，保留仍适用值、嵌套内容、注释和排版。

configVersion SHALL 是不小于 1 的整数，由 setup/update 管理，与 CLI 软件版本和工作流 schema 区分；普通解析保留真实合法值，不为无效或缺失值制造 1。Apply 未配置隔离方式时采用 ask，已有 worktree 等合法值保持。

#### 语言、背景与规则

有效语言 SHALL 优先 proseLanguage；未配置时使用 docLanguage 的有效字符串读取别名，不改写磁盘。两者均未配置时不产生覆盖。新写或改写的自然语言标题、描述、理由、目标、风险及总结遵循有效语言；SHALL/MUST、结构及模板标题、IDs、schema keys、relation types、paths、commands 和代码标识保留原文。业务规格四个固定标题保持英文，MODIFIED Section 使用 exact title。英文项目术语可嵌入目标语言，普通句子不能被示例语言覆盖。

context SHALL 为不超过 50KB 的字符串，原样保留换行、Markdown、URL、<、>、& 和引号；JSON 转义不改变解码内容。Agent 加载 common 后通过 `xirang config project --select context --json` 获取并读取背景。同 Agent、同项目、内容仍可用且未变时复用；切换项目、上下文丢失或自行修改相关配置后重读。用户外部编辑不触发文件监听或 session 自动刷新。缺失 context 不生成背景义务，重新读取核对不证明自然语言规则已执行。

rules SHALL 为按制品名组织的非空字符串数组，内容、Markdown 与换行原样保留，多行规则不拆分。有效配置按当前 schema 合法 artifact IDs 校验键；每个未知 ID 单独告警并列出合法 IDs，同一进程同一警告只交付一次。`config project --artifact <id>` 只返回匹配规则，空、缺失或不匹配时返回空 rules；规则是内置 Definition、Guidance、Template 之外的附加要求，不替代它们。

proseLanguage/context 作用于所有适用制品；rules 仅作用于匹配制品，缺失 context 或空/不匹配规则不产生附加义务。Apply 按需读取 apply.defaultIsolation；Archive 按需读取 git.merge.strategy、git.branch.deleteAfterArchive 和 git.commitMessage.*。非结构工作不加载分解方法，不相关工作面不取得无关操作要求。配置使用规则由 common 统一交付，修改协议由 edit reference 按需提供；已知未变配置不逐制品重复查询，不要求逐制品英文散文扫描。查询交付数据，静态指导单独承载规则。

#### 指导与 Git 路径

decomposition SHALL 为非空字符串。含 `/` 时保留为项目根相对路径；否则裸名称限于 `[A-Za-z0-9._-]+`，解析到 `.xirang/references/<值>`，仅在未以 .md 结尾时补后缀。字段缺失采用默认方法；加载不维护方法名单、不解释方法内容、不检查文件存在性，消费端在指导不可读时停止相关工作，check 检查引用可用性。

git.merge.strategy 接受 no-ff、ff-only、squash；branch.deleteAfterArchive 为布尔值。commitMessage.boundary/archive/merge 为可选项目根相对 POSIX 路径，无默认覆盖值；Archive 按场景读取已配置用户模板，否则读取 references 中对应内置模板。路径字符串不改写，平台差异仅影响物理定位。

### Section: Edge Cases and Exception Handling

字段解析 SHALL 保留其他合法值，并将可定位诊断交付 stderr；check 对相同非法输入按其错误规则处理。

| 条件 | 普通读取结果 |
|---|---|
| 文件不存在 | 空读取/安全默认，不创建 |
| YAML 无法解析 | 警告并安全回退，不修复 |
| schema 为数字或空串，context/语言为错误类型 | 警告并省略对应字段；schema 缺失在解析层不告警 |
| context 大于 50KB | 报实际大小与限值并省略；恰好 50KB 接受 |
| 某制品 rules 不是数组 | 告警该项，保留其他制品规则 |
| rules 数组含非字符串或空字符串 | 告警并只保留有效非空字符串 |
| 未知 artifact ID | 对每项告警，不阻断其他合法规则；显式 --artifact 参数非法则拒绝查询 |
| decomposition 非字符串、空串、绝对路径、反斜杠、.. 穿越或非法裸名 | 告警并省略，不回退默认方法；其他字段可用 |
| git 路径为绝对路径、.. 上溯、反斜杠或非字符串 | 告警并省略该覆盖，采用内置模板路由 |
| merge.strategy 非法或 branch.deleteAfterArchive 非布尔 | 分别告警并回退 no-ff 或 false |
| definitionDepth 负数或非整数 | 告警并回退 2；其他合法字段可用 |
| configVersion 缺失或非法 | 不伪造版本，不阻断其他合法字段；迁移另行拒绝 |
| context 查询失败 | 报告失败，不声称已加载，也不阻断获取诊断或编辑指导 |

加载 SHALL 忽略 profile、workflows、delivery、propose、optimization 及其子项；前三者给出可操作警告，propose 静默忽略。git.autoCommit、git.archive.commitMessage.convention、git.merge.commitMessage.convention 告警并省略；git.merge.messageFrom 不进入有效值。普通读取不改写磁盘，check 对明确忽略名单逐项警告并建议删除，仅有此类问题且其他配置合法时退出 0。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 独立解析字段与规则

schema 为 semantic-model、context 为 123、rules.semantic-delta 为 ["Valid"]：返回 schema 和 semantic-delta 规则并对 context 告警。rules.proposal 为 "not an array" 时不影响 semantic-delta；为 ["Valid rule",123,""] 时仅保留 Valid rule。

#### Acceptance Case: 语言优先与规范标记

proseLanguage: 中文 与 docLanguage: zh-CN 同时存在时使用中文；仅 docLanguage: zh-CN 时有效语言为 zh-CN。中文 prose 可写“生成 artifact 的 workflow 调用 propose”；普通英文说明不符合覆盖，canonical 标记及四个业务规格标题不翻译。

#### Acceptance Case: Context 大小与原文

1KB 及恰好 50KB 的 context 均保留；51KB 被省略并报告大小/限值。包含 Markdown、URL、<、>、&、引号及多行内容时，JSON 解码后内容相同。

#### Acceptance Case: 背景复用与自行修改

common 后进入 Explore 取得 context；切换 Apply 且背景未变、仍可用时复用，并按需读取隔离配置。Agent 修改 context 后重新查询新值；外部修改不触发自动刷新。

#### Acceptance Case: 规则匹配与附加性

proposal 有 Rule 1、Rule 2 时，proposal 查询完整保留两条，design 查询不接收它们。proposal 规则要求 rollback plan 时，与内置要求同时执行，不改变 design；无匹配规则返回空 rules。

#### Acceptance Case: 默认值与用户值

新配置含 configVersion 1、definitionDepth 2、apply.defaultIsolation ask 和 Git 默认值。已有隔离值 worktree、自定义 decomposition 及注释时，适用迁移保留它们，不恢复缺失配置文件。

#### Acceptance Case: 分解路径解析

decomposition 为 c4 时解析为 .xirang/references/c4.md；为 xirang-semantic-refinement.md 时不重复补 .md；为 .pi/skills/xirang-project-decomposition/SKILL.md 时原样保留项目根相对路径。

#### Acceptance Case: 非法分解路径

decomposition 为绝对路径或含 .. 穿越时告警并省略，不隐式注入默认方法；缺失字段则使用默认方法。

#### Acceptance Case: Git 混合默认与非法值

只配置 merge.strategy: ff-only 时保留 ff-only，分支保留值为 false，commitMessage 无覆盖。rebase 或字符串 "true" 分别回退 no-ff、false；非法模板路径被省略。

#### Acceptance Case: 版本与忽略输入

configVersion: 1 保留真实整数；字符串 "1"、0 或缺失不变成 1。optimization 输入不进入有效值，仅有此问题时 check 警告并退出 0，文件不变。
