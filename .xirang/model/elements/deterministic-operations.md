---
entity: element-declaration
identity: deterministic-operations
kind: capability
parent: cli
title: Deterministic Operations
definition: 为查询、校验、证据与原子状态转换提供一致结果的 CLI 操作集合。
---

## Requirements

### Requirement: 对模型和 Change 提供结构化操作

Deterministic Operations SHALL 支持 Semantic Model 与 Change 的查询、搜索、影响分析、差异、验证与派生呈现，并以 identity 而非文件位置寻址语义对象。

#### Scenario: 查询 Element

- **WHEN** Agent 按稳定 identity 查询 Element
- **THEN** CLI 返回其语义上下文

### Requirement: 原子提升 Candidate

Candidate promotion SHALL 在用户确认精确版本后原子整体替换正式模型。

#### Scenario: Promotion 失败

- **WHEN** 原子替换无法完成
- **THEN** 正式模型不进入部分提升状态

### Requirement: 在 Sync 前完整验证

Delta sync SHALL 在应用前完整验证 Semantic Delta 与 Expected Semantic Model。

#### Scenario: Delta 无效

- **WHEN** Sync 准备阶段发现验证错误
- **THEN** 正式模型保持不变

### Requirement: 最小重写 Sync 单元

Delta sync SHALL 只重写 Semantic Delta 实际影响的存储单元。

#### Scenario: Delta 只影响一个 Element

- **WHEN** Sync 应用该 Delta
- **THEN** 无关模型单元保持原字节不变

### Requirement: Sync 失败完整回滚

Delta sync 任一环节失败时 SHALL 完整回滚到应用前状态。

#### Scenario: Sync 中途失败

- **WHEN** 任一目标单元无法写入
- **THEN** 正式模型恢复到应用前状态

### Requirement: 持久化验证证据

Deterministic Operations SHALL 持久化 Verify 与 Change Closure 使用的可复现验证证据。

#### Scenario: Closure 检查验证入口

- **WHEN** Change 请求进入 Closure
- **THEN** CLI 提供已持久化证据供入口判断

### Requirement: 序列化是 IR 的确定性函数

模型序列化 SHALL 是当前 IR 的确定性函数，相同 IR SHALL 产生逐字节相同输出。

#### Scenario: 重复序列化相同 IR

- **WHEN** 系统两次序列化相同 IR
- **THEN** 两次输出逐字节一致

### Requirement: 固定 Frontmatter 键顺序

模型序列化 SHALL 以固定键顺序输出 frontmatter。

#### Scenario: 序列化 Markdown 单元

- **WHEN** 系统写入同类实体
- **THEN** frontmatter 字段顺序保持确定

### Requirement: 排序 Relationship Entries

模型序列化 SHALL 按 `source`、`kind`、`target` 依次排序 Relationship entries。

#### Scenario: 输入容器顺序不同

- **WHEN** IR 包含相同 Relationship 集合
- **THEN** 序列化列表顺序一致

### Requirement: 验证序列化往返属性

测试层 SHALL 以属性测试验证 `parse(serialize(ir))` 与原 IR 相等，并覆盖转义、多行文本、空集合与缺省字段。

#### Scenario: 序列化边界输入

- **WHEN** 属性测试生成有效边界 IR
- **THEN** 序列化后重新解析得到语义相等 IR

### Requirement: 规范化无权威顺序集合

语义比较 SHALL 将 Elements、Relationships、Kinds、Authored Views 及 `parents`、`children`、`sourceKinds`、`targetKinds`、`include` 作为无序集合规范化后比较。

#### Scenario: 仅集合排列变化

- **WHEN** 两个模型只在无权威顺序的排列上不同
- **THEN** diff 不报告语义变化

### Requirement: 保留 Contract 条目顺序

Element Contract 内 Requirement 顺序与 Requirement 内 Scenario 顺序 SHALL 保留并参与语义比较。

#### Scenario: Requirement 顺序变化

- **WHEN** 同一 Contract 的 Requirements 被重排
- **THEN** diff 报告语义变化

### Requirement: 规范化散文比较

散文比较 SHALL 只规范化行尾与文件末尾空白后逐字比较。

#### Scenario: 散文仅行尾不同

- **WHEN** 两份散文只存在行尾编码差异
- **THEN** diff 不报告语义变化

### Requirement: 排除非语义存储信息

派生字段、文件路径与文件名 SHALL NOT 参与语义比较。

#### Scenario: 单元只改变文件位置

- **WHEN** 实体内容与 identity 不变
- **THEN** diff 不报告语义变化

### Requirement: 以实体身份输出差异

差异输出 SHALL 以 entity type 与 identity 为键，SHALL NOT 携带存储分区信息。

#### Scenario: 输出模型差异

- **WHEN** CLI 报告变化实体
- **THEN** 使用 entity type 与 identity 定位条目

### Requirement: 区分初始化来源与 Formal Comparison

Candidate validation SHALL 将 `candidate.yaml.baseline` 的初始化来源与当前 Formal Semantic Model 的 comparison availability 分别表达。

#### Scenario: Clean Candidate 面对现有 Formal Model

- **WHEN** Candidate 从 clean 初始化且当前 Formal Model 存在
- **THEN** validation 仍以当前 Formal Model 作为 comparison baseline

### Requirement: Formal 缺失时报告 Diff 不可用

当前 Formal Semantic Model 不存在时，Candidate validation SHALL 返回 `comparison.baseline: absent`、`comparison.diff: unavailable` 与 `reason: formal-model-absent`，SHALL NOT 构造无效空 diff 或假设空 Formal Model。

#### Scenario: 构建首个 Formal Model

- **WHEN** 有效 Candidate 没有可比较的当前 Formal Model
- **THEN** validation 仍返回 review digest 且 comparison 明确不可用

### Requirement: Formal 存在时生成 Promotion Diff

当前 Formal Semantic Model 存在且有效时，Candidate validation SHALL 返回 `comparison.baseline: formal`、`comparison.diff: available`、Formal fingerprint 与从当前 Formal 到 Candidate 的真实 semantic diff。

#### Scenario: Candidate 改变正式语义

- **WHEN** validation 比较有效 Formal Model 与 Candidate
- **THEN** diff entries 完整表达 promotion 将产生的 ADDED、MODIFIED 与 REMOVED 语义

### Requirement: Comparison 不参与 Review Digest

Candidate comparison availability 与 diff 输出 SHALL NOT 参与 review digest；digest SHALL 只绑定 Candidate 的审查内容。

#### Scenario: Formal 状态在 Candidate 不变时变化

- **WHEN** 相同 Candidate 针对不同 comparison availability 进行校验
- **THEN** Candidate review digest 保持不变

### Requirement: 通过 Validation 呈现 Change 差异

Deterministic Operations SHALL 通过 `xirang validate --change <name>` 提供 Change 的只读文本差异预览与 JSON summary、entries 和 diagnostics，SHALL NOT 注册独立 `xirang diff` command 或将该差异持久化为 Change artifact。

#### Scenario: 校验 Change 并查看文本差异

- **WHEN** 用户或 Agent 运行 `xirang validate --change sample`
- **THEN** CLI 在校验结果中呈现当前 Semantic Model 与 Expected Semantic Model 的差异且不创建文件

#### Scenario: 获取结构化校验结果

- **WHEN** 用户或 Agent 运行 `xirang validate --change sample --json`
- **THEN** CLI 返回 validation status、summary、concise entries 与 diagnostics

#### Scenario: 调用已删除的 Diff command

- **WHEN** 用户或脚本运行 `xirang diff --change sample`
- **THEN** CLI 以 unknown command 失败且不修改 Change directory

### Requirement: 完整处理 Element Definition

Deterministic Operations SHALL 在 IR、解析、校验、序列化、Semantic Delta、semantic diff、fingerprint、Candidate、Sync、查询、搜索与影响分析中保留完整 Element Definition，并 SHALL NOT 以展示 excerpt 替代或截断该规范文本。

#### Scenario: 查询和搜索 Element

- **WHEN** Agent 通过 CLI query、search 或 impact 操作读取一个 Element
- **THEN** text 与 JSON 结果均返回完整 `definition`，search evidence 使用 `definition` 字段

#### Scenario: 比较和同步 Definition 变化

- **WHEN** ADDED 或 MODIFIED Declaration 携带完整目标 Definition
- **THEN** diff、fingerprint、Candidate validation 与 Sync 均以该完整文本确定目标语义

### Requirement: 拒绝 Legacy Declaration Summary

Deterministic Operations SHALL 对当前 Semantic Model、Candidate 或活动 Change 中 Element Declaration 的 legacy `summary` 返回明确 ERROR，SHALL NOT 将其作为 alias、fallback 或未知字段静默删除。

#### Scenario: Parser 遇到 Legacy Summary

- **WHEN** 当前输入的 `element-declaration` 包含 `summary`
- **THEN** 加载失败并指出应迁移为 `definition`

### Requirement: 管理 Change Structural Definition Lifecycle

Deterministic Operations SHALL 通过 `xirang framing create|list|show|status|validate|update|rename|consume|discard` 管理非空 Change Structural Definition 的完整 lifecycle，并以 exploration identity 而非路径寻址。

#### Scenario: 首次持久化确认结构

- **WHEN** create 接收合法 slug 与完整 payload
- **THEN** CLI 生成 explorationId、捕获 baseline 并返回实际 managed path

### Requirement: 返回结构校验与设计影响

Framing validation SHALL 分别返回 structural validity、Semantic Model drift diagnostics 与 Contract、View 等 downstream impacts，SHALL NOT 代替 Agent 或用户作语义决策。

#### Scenario: 新 Element 需要 Contract

- **WHEN** 结构目标有效且其 Kind 要求 Contract
- **THEN** validation 保持结构有效并在 impacts 中报告后续设计工作

### Requirement: 隔离受控文件路径

Framing lifecycle SHALL 仅操作 canonical `.xirang/changes/` direct-child managed regular files，并通过合法名称、`lstat` 类型、symlink 拒绝、filename/frontmatter 一致性及 containment checks fail closed。

#### Scenario: Managed path 是 symlink

- **WHEN** 任一 framing command 定位到 symlink 而非 regular file
- **THEN** CLI 返回稳定路径错误且不跟随链接

#### Scenario: Windows 路径分隔符不同

- **WHEN** framing 在 Windows project root 下构造 managed path
- **THEN** CLI 使用 Node.js path API 保持 containment，并仅在 JSON presentation 中转换为 project-relative POSIX path

### Requirement: 提供稳定 Framing JSON Contract

每个 `xirang framing` command SHALL 在 `--json` mode 向 stdout 输出唯一的 versioned envelope，区分 `ok`、`invalid` 与 `error` 并提供稳定 diagnostics 与 error codes。

#### Scenario: Validation 发现相关 Drift

- **WHEN** command 成功读取对象但 relevant normalized context 已变化
- **THEN** JSON status 为 invalid、exit code 为 1 且不输出 spinner、颜色或 stack trace

### Requirement: 确定性消费结构来源

Framing consume SHALL 在 Change validation、relevant drift 与四类 Delta coverage 通过后，将源字节冻结为 `change-structural-definition.md`，并以相同副本恢复或相异副本冲突规则完成幂等 copy-then-delete。

#### Scenario: 上次消费在复制后中断

- **WHEN** 隐藏源与 frozen copy 同时存在且字节相同
- **THEN** CLI 重新校验后删除源而不覆盖副本

### Requirement: 通过 Show 与 List 呈现 Change 编译结果

Deterministic Operations SHALL 从当前 Semantic Model 与 Change 的四分区 Semantic Delta 编译 `show` JSON 和列表 Delta 数量，SHALL NOT 将 Change Plan 或 change-local `specs/` 作为 Semantic Delta 来源。

#### Scenario: 获取 Change JSON

- **WHEN** 用户或 Agent 运行 `xirang show sample --json`
- **THEN** CLI 返回 `id`、`title`、`valid`、实体级 `summary`、以 entity kind 和稳定 identity 表达的 concise `entries` 及 compiler `diagnostics`

#### Scenario: 列出 Change Delta 数量

- **WHEN** 用户或 Agent 请求包含 Delta 数量的 Change 列表
- **THEN** `deltaCount` 等于 compiler diff 的实体级 `summary.total`

#### Scenario: Change 编译失败

- **WHEN** 四分区 Semantic Delta 无法形成有效 Expected Semantic Model
- **THEN** JSON 返回 `valid: false` 与结构化 `diagnostics`，且消费者不得将返回的 `entries` 视为有效目标状态

#### Scenario: 忽略旧 Change 语义来源

- **WHEN** Change Plan 含有旧式 Delta 描述或 Change 目录含有 change-local `specs/`
- **THEN** Show 与 List 只使用四分区 Semantic Delta 和当前 Semantic Model 推导结果
