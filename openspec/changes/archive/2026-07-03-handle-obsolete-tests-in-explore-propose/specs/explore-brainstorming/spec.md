## MODIFIED Requirements

### Requirement: 分段设计呈现

系统 SHALL 将设计分段呈现，每段后询问用户是否正确。系统 SHALL 在单方案讨论中发现过度规格化时，用一行指出 ponytailladder 简化方式。在 Testing Strategy 阶段，当架构变更影响现有测试时，系统 SHALL 识别过时测试（更新/删除/新增）、确定权威测试套件位置，并在 Design Summary 中记录。

#### Scenario: 逐段确认

- **WHEN** 系统准备呈现完整设计
- **THEN** 系统先呈现架构方案，询问"这个方向对吗？"
- **THEN** 用户确认后，呈现核心组件，询问"组件划分合理吗？"
- **THEN** 用户确认后，呈现数据流，询问"数据流清晰吗？"
- **THEN** 依次呈现技术栈、测试策略、风险和权衡

#### Scenario: 用户要求修改

- **WHEN** 用户在某一段提出修改意见
- **THEN** 系统修改该段内容
- **THEN** 重新呈现修改后的内容，等待确认
- **THEN** 确认后继续下一段

#### Scenario: 单方案中发现过度规格化

- **WHEN** 系统在讨论单个设计决策（如数据模型、API 设计、组件层次），且 ponytailladder 发现该设计引入了不必要的抽象、新依赖或已有平台能力可覆盖的实现
- **THEN** 系统 SHALL 用一行指出简化方式
- **AND** 系统在 ponytailladder 无特别发现时自然跳过，不强制输出

#### Scenario: Testing Strategy 阶段识别过时测试

- **WHEN** 设计涉及架构变更、API 重构或数据布局调整
- **THEN** 系统 SHALL 读取相关测试文件并识别假设与新设计冲突的测试
- **AND** 系统 SHALL 将过时测试分类为更新（断言适配新 API）、删除（行为已废弃）、新增（缺少覆盖）
- **AND** 若项目存在多个测试目录，系统 SHALL 确定哪个测试套件是反映当前契约的权威套件

### Requirement: Design Summary 生成

系统 SHALL 在设计确认后生成结构化的 Design Summary。当识别到过时测试时，Testing Strategy 部分 SHALL 包含 Test Maintenance 子节。

#### Scenario: Design Summary 格式

- **WHEN** 所有设计段落都确认完成
- **THEN** 系统生成 Design Summary，包含以下部分：
  - 架构方案（选定的方案 + 理由）
  - 核心组件（组件列表 + 职责 + 接口）
  - 数据流（关键数据流描述）
  - 技术栈（具体技术选择）
  - 测试策略（单元测试 + 集成测试覆盖范围；当架构变更影响现有测试时，包含 Test Maintenance 子节）
  - 风险和权衡（已知风险 + 缓解措施）

#### Scenario: Design Summary 存储

- **WHEN** Design Summary 生成完成
- **THEN** 系统将其存储在对话上下文中（不写入文件）
- **AND** 系统 SHALL 将 Design Summary 内容作为一个可见的内容块先行呈现
- **THEN** 系统在同一个消息末尾附上："Design Summary complete. Review the above design. If confirmed, call `/opsx:propose <change-name>` generate artifacts."
- **AND** 在此消息后系统 SHALL STOP，不主动提供任何工作流运行、不提出任何追问
- **AND** 只有用户能触发下一个工作流

#### Scenario: Test Maintenance 子节格式

- **WHEN** Design Summary 包含过时测试信息
- **THEN** Testing Strategy 部分 SHALL 包含 "Test Maintenance" 子节
- **AND** 该子节 SHALL 列出待删除测试及原因、待更新测试及原因
- **AND** 若存在权威测试套件，SHALL 注明其位置和通过用例数
- **AND** 若变更不影响现有测试假设，SHALL 省略此子节

### Requirement: Explore 捕获边界保持 specs 为可观察行为

Explore 在已有 change 上发现 insight 时 SHALL 先判断 insight 类型，并将其分类为 future capture target。只有可观察行为需求或可观察行为变化的 future capture target 才是 `specs/<capability>/spec.md`。Explore SHALL NOT 在当前 workflow 中更新这些制品。

#### Scenario: 可观察行为进入 specs

- **WHEN** explore 发现新的可观察行为需求或现有可观察行为变化
- **THEN** 系统 SHALL 将 future capture target 分类为 `specs/<capability>/spec.md`
- **AND** 分类文案 SHALL 表明这是 observable behavior，而不是泛化的 "new requirement"
- **AND** SHALL 将该分类纳入 conversation-only `Design Summary`

#### Scenario: 重构和实现决策进入 design

- **WHEN** explore 形成 refactor rationale、rejected path、implementation strategy 或不再使用旧路径的决策
- **THEN** 系统 SHALL 将 future capture target 分类为 `design.md`
- **AND** SHALL NOT 将这些非行为内容分类到 `specs/<capability>/spec.md`
- **AND** SHALL NOT 在 explore 中更新 `design.md`

#### Scenario: 其他 insight 路由到对应制品

- **WHEN** explore 发现 scope change、new work、verification work、OPSX graph intent change 或 invalidated assumption
- **THEN** scope change SHALL 分类到 `proposal.md`
- **AND** new work 或 verification work SHALL 分类到 `tasks.md`
- **AND** OPSX graph intent change SHALL 分类到 `opsx-delta.yaml`
- **AND** invalidated assumption SHALL 分类到相关制品
- **AND** 制品写入 SHALL 由 `/opsx:propose <change-name>` 或合适的非-explore workflow 执行

#### Scenario: 过时测试的 future capture target

- **WHEN** explore 发现架构变更导致现有测试过时
- **THEN** 系统 SHALL 将测试需要更新或删除分类到 `tasks.md` + `design.md`
- **AND** 具体操作（哪个测试文件、更新还是删除）SHALL 进入 `tasks.md`
- **AND** 过时原因（哪个架构变更导致）SHALL 进入 `design.md`
