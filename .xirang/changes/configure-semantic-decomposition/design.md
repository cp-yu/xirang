## Context

Xirang 目前通过 `.xirang/config.yaml` 向 workflow 暴露语言、项目上下文、artifact rules、Git 与 Apply 策略，但没有项目级结构拆分选择。Build 与 Definition Framing 只规定单维度、MECE 和 BFS 等一致性规则，不能确定应选择 C4、领域能力或项目自有 Perspective 等哪一种分解坐标系。配置和 workflow 均需扩展，但 CLI 不应成为方法论知识库。

## Goals / Non-Goals

**Goals:**

- 以一个互斥 tagged union 表达由 Agent 已知方法或用户自有 skill 提供的结构拆分指导。
- 默认向新建和未个性化项目提供字面量 `c4`，同时保留已有用户选择。
- 让 Build、Explore、Propose 与 Snack 在真正形成结构时消费同一份 guidance。
- 为本仓库提供项目自有拆分 skill，保持现有多 Perspective 语义模型方法。

**Non-Goals:**

- 不在 CLI 中登记、解释、展开或验证 C4 等拆分方法论。
- 不管理用户自有 skill 的跨工具安装、复制或版本同步。
- 不让 Apply、Verify、Review 或 Optimization 重新裁决已确认结构。
- 不增加 Semantic Model 的 Element、Relationship、Metamodel 或 View 结构。

## Decisions

### 1. 使用 `method | skill` tagged union

项目配置只接受以下两个互斥形态之一：

```yaml
decomposition:
  method: c4
```

```yaml
decomposition:
  skill: xirang-project-decomposition
```

两个值都在 trim 后要求非空。拒绝 raw string、同时出现两个键、未知子键与空值。选择 tagged union 而不是字符串路径或自动猜测，是为了让 Agent 明确区分内建知识调用与用户自有 workflow 调用。

### 2. `method` 保持 opaque，`skill` 由 Agent 解析

配置加载与 projection 只原样保留方法名或 skill 名。CLI 不维护 allowlist，不注入 C4 教程，也不检查 Agent 是否安装了 skill。结构形成 workflow 收到 `method` 后依赖当前模型已有知识；不能明确理解时一次询问用户。收到 `skill` 后调用该逻辑名称；找不到、调用失败或结果不足时停止结构形成。

拒绝新增 `xirang config decomposition` 命令，因为现有 `xirang config project --json` 已提供稳定 normalized config 表面。拒绝由 `xirang update` 把 custom skill 复制到每个工具目录，因为这会扩大为新的用户 skill 管理子系统。

### 3. 区分缺失默认与非法配置

`PROJECT_CONFIG_FUNCTIONAL_DEFAULTS` 增加 `decomposition.method: c4`。setup 和 update 通过现有 shared materialization 与 missing-only migration 写入该默认值；已有 `method` 或 `skill` mapping 整体保留。

字段缺失使用默认 C4；字段存在但非法时告警并从 normalized projection 中省略，结构形成 workflow 因缺少有效选择而 fail closed，不得把非法用户输入静默降级为 C4。`.yaml` 与 `.yml` 沿用现有优先级和 Node.js path 处理，不新增文件路径字段。

### 4. 从单一共享片段投影 workflow guidance

在 canonical 模板 fragment 中定义 `STRUCTURAL_DECOMPOSITION_GUIDANCE`，由 Build、Explore、Propose 与 Snack 复用。片段规定：

- 拆分选择只决定 hierarchy 使用的分解坐标系，不覆盖用户意图、Contracts、Relationships、Formal Semantic Model 或证据权威。
- 每个 sibling set 继续满足单维度、MECE 和 BFS；配置决定选择哪个维度，既有规则检查是否一致执行。
- Build 在 Modeling Decision Gate 和 Candidate semantic review 中使用。
- Explore 仅在 Definition Framing 或其他结构设计发生时使用，并保持 Explore 的只读与显式确认边界。
- Propose 仅在没有已确认 Change Structural Definition 且需要形成结构 Delta 时使用；已确认结构必须忠实编译。
- Snack 仅在授权证据要求新增或重组结构时使用，不重排无关 Formal 模型。

Apply、Archive、Verify 和 internal reviewer/optimizer 模板不注入该片段。

### 5. 本仓库使用用户自有拆分 skill

本仓库将 `.xirang/config.yaml` 配置为 `decomposition.skill: xirang-project-decomposition`，并在 `.pi/skills/xirang-project-decomposition/SKILL.md` 提供项目自有规则。该 skill 说明 Project Root 先区分 `semantic-objects` 与 `realization`，`realization` 再按推进过程与协作结构形成互补 Perspective；每个 sibling set 只回答一个分解问题，跨 Perspective 协作使用 Relationships，代码路径和调用关系只作为实现证据。

该 skill 是用户自有项目制品，不进入 Xirang managed workflow manifest；其他 Agent 工具缺少同名 skill 时由用户负责安装。

### 6. 使用 TDD 覆盖配置和生成表面

先扩展 project config、config command、setup/update 与四个 workflow template tests，再实现 schema、projection、default migration 与共享 fragment。模板措辞测试、parity hashes 和长度限制必须同步更新；现有“共享 Build fragment 不包含本项目 Perspective 名称”断言继续保留。

## Risks / Trade-offs

- [不同 LLM 对同一 `method` 的知识不同] → 不理解时 fail closed 并询问用户，不由 CLI 猜测或补充教程。
- [custom skill 在当前工具不可用] → workflow 停止结构形成并报告逻辑名称；跨工具安装由用户负责。
- [custom skill 指令与 Xirang workflow 冲突] → 用户确认、Formal Semantic Model、证据权威与当前 workflow 读写边界优先。
- [既有项目 update 后获得 C4 默认] → missing-only 写入使选择显式可见，用户可改为另一个方法或 skill；已有选择不被覆盖。
- [共享 guidance 增加 skill 模板长度] → 保持片段精简并执行现有 200 行限制测试。

## Migration Plan

1. 先以失败测试定义 tagged union、默认值、非法输入、normalized output 与四个 workflow guidance。
2. 实现配置 schema、field-by-field parsing、functional defaults、projection 与 setup/update missing-only migration。
3. 实现共享 guidance 并注入 Build、Explore、Propose、Snack canonical templates，刷新所有 managed tool surfaces。
4. 添加本仓库用户自有 decomposition skill，并将项目配置从默认 C4 改为该 skill。
5. 运行目标 Vitest、完整 typecheck、template parity/length 与 config command 验证。

回滚时移除新配置字段、共享 fragment 和项目自有 skill，并恢复对应默认值与测试；不涉及 Semantic Model 结构迁移。

## Open Questions

None
