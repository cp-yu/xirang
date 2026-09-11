## Why

当模型存在跨实体类型同名 identity（如 element 与 element-kind 同名、element 与 authored view 同名）时，加载器的 `identity → source module` 索引把四个实体命名空间压成一维，`xirang sync` 会把单元写入错误路径并静默删除仍存在于 Target Semantic Model 的单元（已复现：`delete .xirang/model/elements/implementation.md`，退出码 0、无告警），归档随后的校验才以 `MISSING_PARENT` 暴露损坏。同名并存是自然建模（顶层轴元素与其 kind 同名、view 与其焦点 element 同名），因此根因是索引与定位没有按实体类型分域，而不是模型不合法。

## What Changes

- 加载器与所有定位消费方改为按 (entity type, identity) 解析存储单元；`sync` 目标树按实体类型保真路由，跨类型同名单元 SHALL NOT 丢失、覆盖或删除。
- Target Semantic Model 的两个单元映射到同一目标路径时，`sync` SHALL 在写入前显式失败，Formal Semantic Model 保持不变。
- 模型语义明确：identity 唯一性按实体类型命名空间独立，跨实体类型复用同一 identity 合法且不得报告冲突。
- change diff 与 contract 校验诊断的单元定位改为实体精确（诊断 path 在碰撞模型下不再指向其他类型的单元）。
- 不同步修改 Element 层级、Metamodel、Relationships 或 Authored Views；不改变合法模型的加载语义与既有输出。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `semantic-model`：Identity Source Index 语义改为 (entity type, identity) 定位；新增 identity 命名空间分域规范（跨类型同名合法，引用按实体类型解析）
- `change-sync`：新增 Target 单元保真物化要求（跨类型同名单元不得丢失、覆盖或删除）与目标路径冲突的显式失败语义

### Architecture Source

#### Added Elements

None

#### Modified Elements

None

#### Removed Elements

None

#### Architecture Relations

None

## Impact

- `src/core/model/index-map.ts`：索引键与 `moduleOf` API 改为按实体类型分域
- `src/core/model/sync-writer.ts`：单元路由传各自 entity；新增目标路径冲突守卫
- `src/core/model/types.ts`、`src/core/model/validator.ts`、`src/core/model/delta.ts`：诊断携带实体类型并保持现有诊断码与消息
- `src/core/change-compiler.ts`、`src/commands/validate.ts`：诊断与 contract 定位改用实体精确查找
- 测试：`test/core/model/index-map.test.ts`、`test/core/model/sync-writer.test.ts`、`test/core/model/parser.test.ts`、`test/core/model/validator.test.ts`、`test/core/change-compiler.test.ts` 及既有诊断断言更新
