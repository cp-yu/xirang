---
entity: element-declaration
identity: tdd-checkpoints
kind: element
parent: apply
title: TDD Checkpoints
definition: TDD Checkpoints 定义 Apply Phase 0 在任务实现循环中执行的 TDD 质量检查点：共享测试品质、接口可测试性与 Mock 边界，确保测试可重复隔离、锁行为不锁结构、失败原因单一，并在进入 RED/GREEN 前约束可测试性与 Mock 边界。
---

## Requirements

### Requirement: 接口设计可测试性检查

Apply Master Agent 在读取任务的 Goal、Files、Requirements、Checks 后，开始编写测试前，MUST 评估目标接口是否可测试：外部依赖可注入、结果可观察、职责可分离。若行为因隐式全局状态、混合职责或结果不可观察而难以测试，Agent MUST 先调整接口再写测试，不得用内部 mock 或结构耦合断言硬盖。

#### Scenario: 依赖注入检查通过

- **WHEN** Master Agent 读取任务后，发现目标函数通过参数接收所有外部依赖
- **THEN** Agent 继续进入测试编写阶段，不提出接口调整建议

#### Scenario: 依赖注入检查失败

- **WHEN** Master Agent 读取任务后，发现目标函数内部使用 `new` 创建依赖或直接调用全局对象
- **THEN** Agent MUST 先调整接口设计，将依赖改为参数注入，再继续后续步骤

#### Scenario: 副作用检查失败

- **WHEN** Master Agent 读取任务后，发现目标函数不返回值，而是直接修改外部状态
- **THEN** Agent MUST 先调整接口设计，改为返回值模式，再继续后续步骤

#### Scenario: 副作用检查通过

- **WHEN** Master Agent 读取任务后，发现目标函数返回计算结果而非直接修改全局状态或数据库
- **THEN** Agent 继续进入测试编写阶段

#### Scenario: 难测先改设计

- **WHEN** 目标行为因隐式全局状态、混合职责或结果不可观察而难以通过公共接口验证
- **THEN** Agent MUST 先改善接口
- **AND** SHALL NOT 通过测试私有状态或 mock 内部协作者继续

### Requirement: 测试质量标准验证

Apply Master Agent 在为 behavior/code Check 添加或更新测试后，运行 Check 前，MUST 验证测试符合共享测试品质：可重复隔离且足够快；通过公共接口锁行为、不锁结构；一条失败对准一个行为原因。Agent SHALL 先检查已有测试并优先修改，只在现有测试无法保护该行为时新增。若测试违反上述标准，Agent MUST 重写后再进入 RED 阶段。

#### Scenario: 优先修改已有测试

- **WHEN** 已有测试已经覆盖同一可观察行为
- **THEN** Agent SHALL 修改或扩展该测试
- **AND** SHALL NOT 再新增平行测试文件

#### Scenario: 私有方法测试失败

- **WHEN** Master Agent 编写的测试直接调用私有方法或访问内部状态
- **THEN** Agent MUST 重写测试，改为通过公共接口间接验证该行为

#### Scenario: 内部 mock 检查失败

- **WHEN** Master Agent 编写的测试 mock 了项目内部的类、模块或函数
- **THEN** Agent MUST 重写测试，移除内部 mock，改为真实调用或重构接口

#### Scenario: 独立行为才拆分测试

- **WHEN** Master Agent 编写的测试在一个 `it()` 块中验证了两个独立的用户行为
- **THEN** Agent MUST 拆分为两个独立测试

#### Scenario: 同一行为不因多句规格拆分

- **WHEN** 多个 Scenario 或规格句子描述同一行为与同一失败原因
- **THEN** Agent SHALL 用一条测试覆盖
- **AND** SHALL NOT 仅为对应每句话而拆分 `it()`

#### Scenario: 重构存活性检查

- **WHEN** Master Agent 编写的测试仅依赖公共接口和行为契约，不依赖实现细节、文档排版或模型散文
- **THEN** 该测试被标记为可在重构后存活，Agent 继续进入 RED 阶段

#### Scenario: 公共接口测试通过

- **WHEN** Master Agent 编写的测试通过调用公共方法并验证返回值或可观察副作用
- **THEN** Agent 继续进入 RED 阶段

#### Scenario: 单一失败原因通过

- **WHEN** Master Agent 编写的测试虽有多个 `expect()` 调用，但都在验证同一个用户行为的不同方面（如返回对象的多个字段）
- **THEN** Agent 继续进入 RED 阶段

#### Scenario: 变异思考实验失败则重写

- **WHEN** 翻转关键比较或删除关键状态更新后，测试仍会通过
- **THEN** Agent MUST 重写断言，使该合理行为变异失败
- **AND** SHALL NOT 仅断言对象不为 null 或文本包含某句说明性措辞

### Requirement: Mock 边界约束强制

Apply Master Agent 在实现使 Check 通过的最小化代码时，MUST 强制执行 Mock 边界约束：Mock 仅限系统边界（外部 API、数据库、时间源、文件系统）；禁止 mock 内部类、模块或项目控制的协作者；使用依赖注入模式将可 mock 的系统边界作为参数传入。若实现需要 mock 内部代码，Agent MUST 停止实现，重构接口以接受该依赖为参数。

#### Scenario: 外部 API mock 允许

- **WHEN** Master Agent 实现代码需要调用外部支付网关 API
- **THEN** Agent 允许在测试中 mock 该 API 客户端，并通过依赖注入传入

#### Scenario: 内部模块 mock 拒绝

- **WHEN** Master Agent 实现代码需要调用同项目的另一个服务类
- **THEN** Agent MUST 拒绝 mock，改为在测试中使用该服务类的真实实例

#### Scenario: 内部协作者 mock 拒绝触发重构

- **WHEN** Master Agent 发现实现需要 mock 内部类才能测试
- **THEN** Agent MUST 停止实现，重构接口将该内部类作为参数注入，然后继续

#### Scenario: 数据库 mock 允许

- **WHEN** Master Agent 实现代码需要查询数据库
- **THEN** Agent 允许在测试中 mock 数据库连接或使用测试数据库

#### Scenario: 时间源 mock 允许

- **WHEN** Master Agent 实现代码需要获取当前时间戳
- **THEN** Agent 将时间源（如 `() => Date.now()`）作为参数注入，允许测试传入固定值

#### Scenario: 文件系统 mock 允许

- **WHEN** Master Agent 实现代码需要读写文件
- **THEN** Agent 将文件系统操作（如 `fs` 模块包装）作为参数注入，允许测试 mock
