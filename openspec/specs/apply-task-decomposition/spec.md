# apply-task-decomposition Specification

## Purpose
定义 apply Phase 0 如何把 `tasks.md` 中的粗粒度任务转化为当前 Master agent 直接执行的实现工作。
## Requirements
### Requirement: Master agent 直接执行 pending task

Apply 阶段的 Master agent SHALL 读取 `tasks.md` 中的 pending task，并在当前上下文中按 Check 执行严格 TDD、证据收集和任务勾选。实现 specs 未覆盖的细节时，agent SHALL 按"删除 > 标准库 > 平台原生 > 已安装依赖 > 直接表达式 > 最小实现"优先顺序选择方案。Agent SHALL NOT 质疑或简化 specs 明确要求的行为。

Apply skill 的 `Implementation Discipline` 节 SHALL 以最多 8 条精简条目直接描述以上纪律，每条不超过两行。每个流程步骤（Preparation、Pre-flight Scan、Branch Isolation、Phase 1/2/3 verification、Output）SHALL 指向独立的 `openspec/references/openspec-apply-step-<N>-<name>.md` reference 文件，skill body 中该步骤只提供一行指引和文件路径。

Subagent 委托 SHALL 使用 "delegate to the clean-context `openspec-reviewer` agent" 表述。Skill instructions 以 OPSX Compilation Philosophy 开头，后接 Flow Outline。

#### Scenario: 实现纪律为精简条目

- **WHEN** apply skill 被加载
- **THEN** skill SHALL 以 `Implementation Discipline` 节列出编码纪律
- **AND** 每条 SHALL 使用中性术语，不使用外部框架名称

#### Scenario: 流程步骤指向 reference

- **WHEN** apply agent 执行到某个流程步骤
- **THEN** agent SHALL 读取对应的 `openspec/references/openspec-apply-step-<N>-<name>.md`
- **AND** skill body 中该步骤 SHALL 只提供一行描述和文件路径

### Requirement: Checks 是任务进度源

系统 SHALL 使用 `tasks.md` 的 Checks 和 Remediation 记录 apply Phase 0 的进度与恢复工作。

#### Scenario: 完成 Check 后勾选

- **WHEN** Check 的 red/green TDD 证据通过，或非运行时文本制品 Check 的最终证据通过
- **THEN** 系统在 `tasks.md` 中勾选对应 Check
- **AND** 系统 SHALL NOT 在缺少完成证据时勾选

#### Scenario: remediation 优先

- **WHEN** `tasks.md` 包含未完成的 `## Remediation` 项
- **THEN** 系统优先处理相关 `[code_fix]` 或 `[artifact_fix]`
- **AND** 系统在证据通过后勾选已解决项

#### Scenario: 跨平台命令兼容

- **WHEN** 系统执行或生成涉及路径的命令
- **THEN** 路径 SHALL 使用 Node.js path 模块处理
- **AND** 系统 SHALL NOT 硬编码平台特定路径分隔符

### Requirement: 任务执行失败处理

系统 SHALL 在 task 执行遇到非预期失败时先诊断再修复，每次修复只改变一个变量，并在同一 task 累计 3 次修复仍未解决时停止并呈现证据。连续 2 次相同 normalized error signature SHALL 保持快速 pause。补充上下文时，Agent SHALL 使用 change artifacts、formal Specs、OPSX v2 两文件语义导航、CLI relation query 与当前代码 evidence；MUST NOT 读取或要求 OPSX code-map。

#### Scenario: 任务需求不明确
- **WHEN** Master agent 发现 Goal 或 Requirements 过于模糊
- **THEN** SHALL 使用 proposal、design、change-local specs、tasks、formal Specs、OPSX project/domain/capability context 与相关项目文件补足上下文
- **AND** SHALL 对已知 node IDs 使用 `openspec opsx query <node-id...> --json` 获取 directed relations
- **AND** SHALL NOT 仅因首次发现模糊点就询问用户

#### Scenario: 项目上下文不足
- **WHEN** Master agent 无法找到相关现有代码或模式
- **THEN** SHALL 使用 OPSX 语义边界定位 capability，并使用 CodeGraph 或 ACE/`rg`/`read` 获取当前 implementation evidence
- **AND** MUST NOT 从 OPSX 读取 code paths 或 code-map
- **AND** SHALL 将缺失上下文转化为当前 task 的可验证探索或检查步骤

#### Scenario: 任务过于复杂
- **WHEN** Master agent 判断 task 过大
- **THEN** SHALL 在当前 task 内按最小可验证批次执行
- **AND** SHALL NOT 因可拆分而创建新的中间 artifacts

#### Scenario: 同一错误重复失败快速暂停
- **WHEN** 同一 task 的同一 normalized error signature 连续失败 2 次
- **THEN** 系统 SHALL pause
- **AND** pause 输出 SHALL 包含 task、check、command、failure kind、error summary 与已尝试 remediation

#### Scenario: 累计修复次数达到上限
- **WHEN** 同一 task 累计 3 次修复仍未解决
- **THEN** 系统 SHALL 停止修复并呈现已尝试路径、根因判断与怀疑方向
- **AND** SHALL 等待用户指导

