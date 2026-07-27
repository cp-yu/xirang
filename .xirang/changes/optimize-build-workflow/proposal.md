## Why

当前 Semantic Model Build 缺少明确的 Requirement/Scenario 语义边界、中间建模决策门禁、独立语义审查和完整的确定性校验，导致结构有效的 Candidate 仍可能包含未经授权、粒度错误或不可追溯的语义，并在编写完成后产生大范围返工。

## What Changes

- 完善 Element Contract、Requirement 与 Scenario 的正式语义及 Agent 工作面投影。
- 将 Build 调整为显式初始化、条件式建模决策、例外 provenance、BFS 分层编写、确定性校验、clean-context 语义审查、digest 确认和 promotion 后检查的闭环。
- 扩充 Semantic Model Validator 的名称唯一性、Scenario、Kind、View 和错分区诊断。
- 让 Candidate validation 明确区分初始化来源与 Formal comparison availability，并在 Formal 存在时产生真实 promotion diff。
- 明确 Realization 推进过程与协作结构的双维度语义，并以 `responsible-for` 显式连接工作身份与其承担的活动。
- 不承诺 Build 或 promotion 保持 Git 状态不变。

## Source Impact

### Behavior Source

#### New Specs

- `requirement`: Element Contract 中可独立演进的规范性语义条目。
- `scenario`: Requirement 下具有约束力、非穷尽的条件化行为。

#### Modified Specs

- `element-contract`: 完整表达自身抽象层级语义，并允许 children 精化和跨层覆盖。
- `semantic-delta-entry`: 以 Requirement 而非整份 Contract 作为 Contract 差量单位。
- `semantic-model`: 扩充名称、Scenario、Kind/View 引用和错分区诊断保证。
- `semantic-model-build`: 规定初始化、决策门禁、分层编写、语义审查、comparison、digest 与 promotion 后检查。
- `deterministic-operations`: 提供完整 Candidate/Formal 校验与 Formal comparison availability 输出。
- `project-build-role`: 编排建模决策、clean-context subagent 审查和 promotion 后检查。
- `project-tooling-configuration`: 由单一 fragment 向 Build、Propose 与 Snack 投影 Element Contract 语义。
- `propose`: 按共享 Requirement 与 Scenario 语义编写 Contract Delta。
- `snack`: 按共享 Requirement 与 Scenario 语义调和 Contract Delta。
- `realization`: 明确推进过程与协作结构为允许语义覆盖的完整维度。

### Architecture Source

#### Added Elements

- `requirement`: Element Contract 的规范性语义条目。
- `scenario`: Requirement 的条件化规范组成。

#### Modified Elements

- `element-contract`: Declaration summary 与 children refinement 边界更新。

#### Removed Elements

None

#### Architecture Relations

- 新增 `responsible-for` Relationship Kind。
- 将 Project Build、Explore、Propose、Snack、Apply、Archive、Reviewer 与 Optimizer 工作身份连接到其承担的 Activity 或 Stage。

## Impact

- Build、Propose 与 Snack workflow templates 及共享 fragments。
- Semantic Model parser、validator、Candidate validator、CLI formatting 与 promotion 验证。
- Semantic diff 类型和 Candidate validation JSON contract。
- Model、Candidate、workflow template、CLI 和跨平台测试。
- `xirang-definition.md` 与正式 Semantic Model 的同步。
