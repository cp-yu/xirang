---
entity: element-declaration
identity: propose-workflow
operation: MODIFIED
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
---

## MODIFIED Requirements

### Requirement: Propose 按 TDD 闭环划分 Tasks

Propose 生成 `tasks.md` 时 SHALL 以可独立实现与验证的完整闭环划分 task 边界，SHALL NOT 按 component、module、directory、file type、Requirement 数量或 Scenario 数量机械拆分；SHALL 按共享测试品质判断每个 Check 的语义价值，将同一可观察行为与同一失败原因的 Scenario 归入一个 Check；声明 ready-for-apply 前 SHALL 交叉检查所有 task 边界与 Check 价值，并 reconcile 违反独立验证或制造低价值持久化测试的划分。

#### Scenario: 按行为闭环而非组件划分

- **WHEN** 多个组件共同交付一个行为
- **THEN** Propose SHALL 将它们放入同一 task

#### Scenario: Requirement 数量不构成拆分理由

- **WHEN** 一个 task 的 Requirements 超过上限
- **THEN** Propose SHALL 合并细节或将验证细节下沉到 Checks
- **AND** SHALL NOT 仅因数量拆分 task

#### Scenario: Scenario 数量不构成拆分理由

- **WHEN** 一个 Requirement 含多个描述同一行为与同一失败原因的 Scenario
- **THEN** Propose SHALL 将它们编译进同一个 Check
- **AND** SHALL NOT 为每个 Scenario 各创建一个 persistent test Check

#### Scenario: Propose 必须判断 Check 价值

- **WHEN** Propose 编译 `tasks.md` Checks
- **THEN** SHALL 应用共享测试品质：优先 reuse 或 modify 已有测试，只在现有测试无法保护该行为时 add
- **AND** SHALL 把不值得持久化的证据编译为 one-time Check
- **AND** SHALL NOT 以「不得判断 Check 是否语义足够」为由保留机械测试

#### Scenario: 新增边界必须指向独特缺陷

- **WHEN** Propose 为同一行为增加额外边界 Check 或测试
- **THEN** SHALL 写明该边界能捕获、已有测试捕获不到的合理缺陷
- **AND** 无法指出独特缺陷时 SHALL 不创建该 Check

#### Scenario: ready-for-apply 前边界自检

- **WHEN** Propose 准备声明 Change ready-for-apply
- **THEN** SHALL 交叉检查 Goals、Files、Requirements 与 Checks
- **AND** 发现 task 依赖后续 task、Check 按 Scenario 1:1 机械拆分或假防护测试时 SHALL reconcile 后再声明

### Requirement: Propose 使用制品定义先行写作

每个 artifact 写入前，workflow SHALL 读取 resolved definition，按 content boundaries 路由语义，再执行 artifact instruction 与 template。Delta Contracts SHALL 只包含 canonical unlabeled target-state Requirements 与 Scenarios；Scenario SHALL 描述特定条件下的可观察行为，SHALL NOT 规定实现结构、文档排版、说明性措辞、标题顺序或测试拆分，除非该精确表示本身就是可观察契约；完成 artifacts 后 SHALL 使用统一 change compiler 审阅 effective changes。

#### Scenario: Scenario operations 通过 diff 审阅

- **WHEN** Agent 已完成 delta Contracts、design、结构目标与 combined validation
- **THEN** Agent MUST NOT 手写或生成 Scenario operation labels
- **AND** SHALL 审阅 validate concise preview
- **AND** 非预期 operation SHALL 阻塞 ready-for-apply 并要求修正 source

#### Scenario: Specs 按 Behavior Source 生成

- **WHEN** propose 创建 change-local Contracts
- **THEN** SHALL 只消费 proposal Behavior Source 中的 Element identities
- **AND** SHALL 读取 Formal Contract 的 exact Requirement titles 后 author delta

#### Scenario: Specs boundary 不重复定义

- **WHEN** workflow 生成 Contracts
- **THEN** SHALL 依赖 `xirang instructions specs --change "<name>" --json` 返回的 definition（Element-owned Contract delta authoring 指导）
- **AND** SHALL NOT 在 workflow template 维护竞争的 behavior boundary

#### Scenario: Scenario 写行为而非排版

- **WHEN** Propose 编写或修改 Scenario
- **THEN** Scenario SHALL 描述条件与可观察结果
- **AND** SHALL NOT 把生成文档标题、段落顺序或完整例句当作行为，除非该精确 token 本身是对外协议
