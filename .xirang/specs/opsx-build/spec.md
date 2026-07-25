---
element: cap.architecture.project-build
---
# opsx-build Specification

## Purpose
This specification records behavior introduced by change project-opsx-build. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: Project Build SHALL 建立经过授权的 Candidate 范围
`xirang-build` SHALL 从已配置的 OPSX 项目开始，获取用户的探索范围和明确约束，并在编写 Candidate source 前将这些输入记录到 `.xirang/candidate/build.md`。

#### Scenario: 用户选择探索范围
- **WHEN** `xirang-build` 在没有 active Candidate 时启动
- **THEN** SHALL 询问用户选择 whole project、code and tests、documentation and current OPSX 或 custom paths and rules
- **AND** SHALL 将用户声明的 source-of-truth 约束保存在 `build.md`
- **AND** SHALL NOT 静默将代码、测试、文档、配置、Git history 或当前 OPSX 指定为 source of truth

#### Scenario: 证据冲突会改变目标语义
- **WHEN** 选中的证据发生冲突，且该冲突会改变目标 behavior 或 architecture
- **AND** 用户尚未明确解决冲突
- **THEN** Agent SHALL 向用户询问目标决策
- **AND** SHALL NOT 根据实现是否存在、测试是否通过、路径名称、import、call 或文档形式化程度进行推断

### Requirement: Project Build SHALL 显式选择 Candidate 起点
当当前 formal OPSX 存在时，`xirang-build` SHALL 展示当前 OPSX 概览，并在调用 `xirang candidate init` 前获得明确的 Candidate 起点选择。

#### Scenario: 用户选择基于当前 OPSX 构建
- **WHEN** 用户选择“基于当前 OPSX 构建”
- **THEN** skill SHALL 从当前 formal source 初始化 Candidate
- **AND** 在 digest-confirmed promotion 前，当前 formal source SHALL 保持不变

#### Scenario: 用户选择重新构建 OPSX
- **WHEN** 用户选择“重新构建 OPSX”
- **THEN** skill SHALL 初始化 clean Candidate skeleton
- **AND** 当前 formal source MAY 作为选定证据，但 SHALL NOT 被复制到 Candidate

#### Scenario: 用户指定构建起点
- **WHEN** 用户选择“使用指定内容作为起点”
- **THEN** skill SHALL 仅将用户批准的路径传给 Candidate initialization
- **AND** SHALL NOT 推断额外的 baseline 路径

### Requirement: Project Build SHALL 编写一个统一 Candidate
`xirang-build` SHALL 同时编写完整的 Candidate LikeC4 modules 和 singular element-bound Candidate Specs。`build.md` SHALL 只是临时 compilation scaffolding，不得定义 durable graph 或 contract facts。

#### Scenario: Candidate 同时包含 Architecture 和 Specs
- **WHEN** Agent 已解决所需的 semantic decisions
- **THEN** SHALL 编写 `.xirang/candidate/architecture/` 和 `.xirang/candidate/specs/`，使其共同组成一个 Candidate
- **AND** 每个 Candidate Spec SHALL 只绑定一个 stable element
- **AND** 一个 Candidate element MAY 拥有多个 Candidate Specs

#### Scenario: Required element 需要 contract
- **WHEN** Agent 编写 `contract required` 的 element kind
- **THEN** 每个 required element SHALL 至少拥有一个绑定 Spec
- **AND** Agent SHALL 将缺失 ownership 视为 decision gap，不得创建 catch-all owner

### Requirement: Project Build SHALL 保持探索和 review 由 Agent 驱动
`xirang-build` SHALL 允许 Agent 自由选择探索顺序和可选 subagents。Agent SHALL 使用 `xirang candidate validate` 的 diagnostics 修复 Candidate，并在 promotion 前直接向用户呈现 valid Candidate 和 review digest。

#### Scenario: 可选 subagent 加速探索
- **WHEN** 并行探索有助于 Agent 理解用户批准的项目范围
- **THEN** Agent MAY 使用 task-specific prompts 调用 subagents
- **AND** Candidate validation 与 promotion SHALL NOT 依赖 subagent availability 或固定 subagent role

#### Scenario: 用户授权 Candidate 版本
- **WHEN** `xirang candidate validate` 返回 valid 的 `reviewDigest`
- **THEN** Agent SHALL 向用户呈现 Candidate summary、formal diff、重要 decisions 和 digest
- **AND** 只有在用户确认该版本后，Agent 才 SHALL 调用 `xirang candidate promote --digest <reviewDigest>`

