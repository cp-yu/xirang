## Why

计划一致性复核被放在 Apply，而其输入在 Change Formation 时已冻结，缺陷只能在实现阶段被发现，造成跨阶段回写 Formation 制品；同时确定性校验由 Agent 手工执行、未接入 CLI 门禁，Propose 的 ready-for-apply 声明缺一道收尾一致性验证。

## What Changes

- 计划一致性复核与收尾确定性验证移入 Propose，成为 `propose-workflow` 之下的 `post-propose-validation` 门禁；Apply 不再承担 Pre-flight。
- 任务计划结构校验（文件冲突、依赖顺序、anchor 匹配）由 CLI 确定性操作承担，接线进 `xirang validate --change`。
- 消除 `definition-first authoring` 术语歧义，统一改名为"制品定义先行写作"。

## Source Impact

### Behavior Source

#### New Specs

- `post-propose-validation`: 计划一致性复核与收尾确定性验证门禁的可观察行为：检测 `tasks.md` 与 change-local 目标语义的矛盾、自行修正或就用户意图不对齐提请裁决、在最终制品上执行确定性校验并以其报错阻塞 Apply 就绪声明。

#### Modified Specs

- `validation-commands`: 新增任务计划结构校验要求——跨任务文件冲突检测、任务依赖顺序检测、Check 锚点与 Scenario 标题匹配。
- `task-decomposition`: 非隔离流程步骤与隔离方法引用场景移除 Pre-flight Scan、同步新步骤编号。
- `propose-workflow`: 移除 Requirement "Post-propose validation 使用分级 gate"，其职责迁至 `post-propose-validation`；Requirement "Propose 使用 definition-first authoring" 改名为制品定义先行写作。
- `change-artifacts`: Requirement "Definition-first authoring" 改名为制品定义先行写作，正文术语同步。
- `snack-workflow`: Requirement "Snack 使用 definition-first authoring" 改名为制品定义先行写作。
- `workflow-templates`: Requirement "Agent definition-first authoring" 改名为制品定义先行写作，相关 Scenario 文本同步。
- `skill-generation`: "片段排除操作规则" Scenario 文本同步新术语。

### Architecture Source

#### Added Elements

- `artifact-authoring`: 定义 Propose 生成完整 change 制品的行为，挂于 `propose-workflow` 之下。
- `post-propose-validation`: 定义 Propose 收尾的一致性验证门禁，挂于 `propose-workflow` 之下。

#### Removed Elements

- `preflight-scan`: 目标模型不再在 Apply 下建模预检，其语义复核职责迁入 `post-propose-validation`，确定性职责迁入 `validation-commands`。

#### Modified Elements

- `propose-workflow`: Definition 中的 `definition-first authoring` 术语更新为制品定义先行写作。
- `snack-workflow`: Definition 术语同步更新。
- `workflow-templates`: Definition 术语同步更新。

#### Architecture Relations

- 新增 `post-propose-validation` --[invokes]--> `deterministic-operations`：收尾门禁的确定性校验由 CLI 确定性操作承担。

## Impact

- `src/core/parsers/task-structure.ts`: 新增跨任务文件冲突与依赖顺序检测。
- `src/core/validation` 接线: combined `xirang validate --change` 输出任务结构校验结果。
- `src/core/templates/workflows/apply-change.ts` 与 `src/core/templates/workflows/propose.ts`: 流程模板移除/改写 Pre-flight 与收尾门禁表述。
- `src/core/templates/fragments/xirang-fragments.ts`: 模板片段术语与检查措辞同步。
- `.xirang/references/xirang-apply-step-2-preflight-scan.md`: 删除；apply 流程引用同步清理。
- `.pi/skills/xirang-apply-change/SKILL.md` 与 `.pi/skills/xirang-propose/SKILL.md`: 由模板生成更新。
