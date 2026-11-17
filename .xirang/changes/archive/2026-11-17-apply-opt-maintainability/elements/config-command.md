---
entity: element-declaration
identity: config-command
kind: capability-specification
parent: cli
title: Config Command
definition: Config Command 是息壤配置说明、查询、检查与管理的命令族。它以 config 介绍项目配置、以 project 查询有效数据、以 check 只读诊断可用性和作用范围，并保留全局工具设置的 path、list、get、set、unset、reset、edit。它区分项目配置和全局工具配置，不编写用户意图或重复交付工作流静态提示词。
---

## MODIFIED Sections

### Section: Business Logic

`config project --artifact semantic-delta --select rules` SHALL 返回项目 `rules.semantic-delta` 的有效原文，保持制品匹配与选择语义；config check SHALL 将 semantic-delta 识别为合法规则名。

命令族 SHALL 按项目读取与全局管理的作用域交付数据、诊断和操作结果。

#### 项目入口

无子命令的 `xirang config` SHALL 展示配置路径、全部受支持字段、用途、默认值、合法值或示例及作用范围；未初始化也可查看，不创建文件。说明与 YAML 来自同一字段定义，可使用英文。顶层 help 与 config --help SHALL 区分 config、config project、config check 和全局管理命令。

`config project` SHALL 读取当前磁盘并返回共享归一化数据，完整查询包含适用的 configVersion、proseLanguage、context、decomposition、architecture、apply、git、rules、stageRules。可重复 --select 按点路径选择并保留原嵌套结构；--artifact 先限定 rules，再投影选择字段，其他选中有效字段不因制品过滤而丢失。合法未配置可选字段省略，无字段时返回 {}。匹配规则为空时返回空 rules。

文本以紧凑 YAML-like 表达，JSON 只返回所请求数据；context/rules 原文、换行及特殊字符在解码后相同，不附 prompt fragments、compiledLines 或重复静态指导。git 保持 commitMessage、merge.strategy、branch.deleteAfterArchive 结构，语言、背景、制品规则和操作配置遵守共享消费范围。

`config check` SHALL 只读详细检查 YAML、嵌套字段名、类型/取值、当前 schema 的 rules 制品名、版本元数据，以及有效 decomposition 和选用模板引用的存在性/可读性。报告实际路径、最终有效值、显式/默认来源、忽略与回退内容、作用阶段/制品/操作、问题原因与修正建议；支持 --json，不提供精简模式或专用筛选，Agent 可自行处理 JSON。独立可检查部分须全部完成，不能解析的部分说明不可检查，不伪造值。检查不证明自然语言规则已执行。

文件选择 SHALL 为 .yaml 优先、.yml 回退，同时存在时标明 .yml 未采用，不合并。请求数据写 stdout，警告/错误写 stderr，JSON 模式诊断结构化；跨平台定位和判断一致。

#### 全局入口

全局 path/list/get/set/unset/reset/edit SHALL 使用实际 JSON camelCase 键及点路径，帮助明确标注全局作用域。其 --scope 默认为 global，只支持 global；项目读取使用 project/check 的显式入口。

| 命令 | 行为 |
|---|---|
| path | 返回全局配置绝对路径，退出 0 |
| list | 返回全部有效配置，文本为缩进 YAML-like，--json 为纯 JSON 数据 |
| get <key> | 返回原始标量；对象用 JSON；支持 featureFlags.someFlag 等嵌套路径 |
| set <key> <value> | true/false 转布尔，合法整数/浮点转数字，其余为字符串；--string 强制字符串；必要时创建中间对象，写入前校验 |
| unset <key> | 移除覆盖后采用默认；不存在则保持文件不变并退出 0 |
| reset --all | 确认后删除全局文件或重置默认；-y 跳过本次确认 |
| edit | 使用 EDITOR 或 VISUAL 打开全局配置，缺失时以默认值创建，等待 editor 关闭 |

无返回数据且无警告的成功写操作 SHALL 使 stdout/stderr 均为空，以退出 0 表示完成。set 默认拒绝未知键，--allow-unknown 只允许普通未知键，不能绕过字段值校验或已知禁止路径。

stageRules SHALL 可通过既有 --select 点路径查询，例如 config project --select stageRules.explore --json 保留 stageRules.explore 嵌套结构并只交付该阶段规则。--artifact 只过滤 rules，不将制品名解释为阶段名；--select stageRules 返回有效映射。config 说明、注释示例与 check 使用同一六阶段定义，说明其作用域、空值和内部角色边界；不增加专用查询命令。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 非项目目录查看说明

未 setup 的目录运行 config，能看到字段、默认值、范围与三个入口，磁盘不产生项目配置。

#### Acceptance Case: 项目组合查询

--select proseLanguage --select rules --artifact proposal 只返回有效语言和 proposal 规则，不返回 semantic-delta 规则。修改语言后再次查询，返回新值。

#### Acceptance Case: Semantic Delta 规则贯通

rules.semantic-delta 为 ["保持完整目标内容"] 且 rules.proposal 为 ["说明动机"] 时，`config project --artifact semantic-delta --select rules --json` 只返回 ["保持完整目标内容"] 对应的规则，proposal 查询只返回自己的规则；check 不把 semantic-delta 判为未知制品。

#### Acceptance Case: 有效空查询与拼写错误

合法可选字段未配置时返回 {} 且退出 0；拼错选择路径时 stdout 不冒充空结果，stderr 诊断且非零退出。

#### Acceptance Case: 独立问题聚合

apply.defaultIsolaton 与 rules.unknown 同时存在：两项均被定位，check 退出 1，原文件不变。

#### Acceptance Case: 警告与可选缺失

其他配置合法且含 optimization 时，check 警告列出节点、有效值不包含它、退出 0；未配置 context 不产生背景义务。

#### Acceptance Case: 双扩展名与引用

同时有 .yaml/.yml 时只检查 .yaml 并列出 .yml 未采用；活动配置引用不存在文件时报具体路径并退出 1，不修改配置。

#### Acceptance Case: 全局类型与保护

set featureFlags.newFlag true 保存布尔并保持成功静默；set someFutureKey 123 默认拒绝，--allow-unknown 可保存数字；该选项不能保存 propose.smartRouting 或 optimization，也不能接受非法 featureFlags 值。

#### Acceptance Case: 全局读取与编辑

get 不存在键时退出 1 且 stdout 空；unset 不存在键退出 0 且文件不变。配置 EDITOR 且全局文件缺失时 edit 可创建全局默认文件，不创建项目配置。

#### Acceptance Case: 阶段点路径与制品命名空间

配置 stageRules.explore、stageRules.apply 与 rules.design：--select stageRules.explore 只返回 Explore 规则；--artifact design --select stageRules.apply --select rules 同时保留 Apply 阶段规则与 design 制品规则，不交付 Explore 规则。合法未配置 stageRules.snack 是空查询，stageRules.optimizer 为非法选择路径而报错，check 对非法配置键也报告错误。
