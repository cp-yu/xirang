## Context

当前测试工厂由四层提示词与 Reviewer 覆盖规则共同驱动。已确认 Design Summary：通用纪律用 3+1，锁词只做本仓库项目适配，不改全库测试。

## Goals / Non-Goals

**Goals:**

- 让后续 Change 的测试产生、修改、删除服从可泛化品质。
- 保留严格 TDD 与 one-time verification。
- 只清理本次触及 Contract 对应的低价值锁词测试。

**Non-Goals:**

- 全库重写 `test/`。
- 强制运行 mutation-testing 工具。
- 新增 `rules.tests` 配置节点。
- 改变 CLI 对 fixture 的 parse / validate / sync 测试。

## Decisions

### Decision 1: 共享片段而非四层各写一套

**选择**：`TEST_QUALITY_GUIDANCE` 作为单一 exported constant，Explore / Propose / Apply / Reviewer 复用。

**备选**：只在 Explore 加一段。否决：Reviewer 1:1 仍会打回。

**备选**：四层复制。否决：必然漂移。

### Decision 2: 3+1 而不是六条并列

测试品质三条：可重复隔离、锁行为不锁结构、单一失败原因。难测先改设计是编码纪律，不是测试属性。Fast 收在可重复隔离的反馈环要求中，不单列。

### Decision 3: 变异作为思考实验

默认问「翻转比较或删除关键赋值是否会红」。不把 Stryker 等工具写入通用提示词；项目若需要，用配置启用。

### Decision 4: 慢测试可以持久化，但不进 TDD 内环

跨边界行为无法由更便宜测试证明时，允许持久化 integration / e2e。Apply 内环仍先跑定向快速测试。

### Decision 5: 本仓库锁词走 `rules.tasks`

生成面只锁协议 token、fail-closed、禁止操作、退役 token。不把锁词政策写入 `TEST_QUALITY_GUIDANCE`。

### Decision 6: 实现落在模板与项目配置

语义由上述 Element Contracts 表达。代码只改 fragment、workflow templates、本仓库 `config.yaml` 与对应测试。不新增 Semantic Model Element。

## Risks / Trade-offs

- [Agent 仍按 Scenario 开测试] → 四阶段都给动作，不只写理念；Reviewer 改覆盖口径。
- [取消 1:1 后漏测] → 行为无证据或弱断言杀不死合理变异仍 CRITICAL。
- [把不同行为塞进一条测试] → 单一失败原因限制合并。
- [必要 e2e 被降成 one-time] → 无法由便宜层证明的跨边界行为允许持久化慢测试。
- [自举清理扩大] → 只改本次触及文件与其直接锁词测试。

## Migration Plan

模板随 skill 生成面更新。已有测试不批量删除；仅当本次修改的模板测试变成机械锁词时合并或删除。Rollback：还原 fragment 与四个 workflow 模板。
