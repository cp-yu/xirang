## Context

`parseSemanticModelFiles` 按 UTF-8 字节序解析四分区单元（`elements/` 先于 `metamodel/`，`views/` 后于 `elements/`），`createModelIndex` 以 `identity` 单键建 `Map`，后解析者覆盖先解析者。`writeMinimal` 的 element / element-kind / relationship-kind / view 四个循环都经 `moduleOf(identity)` 取 module，于是跨类型同名时单元被写入另一类型的路径，随后被对应循环覆盖，`buildManifest` 对原单元生成 `delete`，sync 以退出码 0 完成删除。已复现两个案例：element+element-kind 同名 → `delete elements/implementation.md`；element+authored view 同名 → `delete elements/overview.md`。

已确认语义前提：identity 唯一性按实体类型命名空间分域（Elements、Kinds（Element Kind 与 Relationship Kind 共用）、Views 各自独立），跨类型同名合法。所有语义引用点（`parent`、`kind`、source/target、delta `entity`）都是带类型的，因此索引与定位必须使用同一种 (entity type, identity) 键；当前行为方向依赖路径排序巧合，是必须消除的隐式耦合。

同类派生缺陷：`src/commands/validate.ts` 的 contract 定位与 `src/core/change-compiler.ts` 的 `locate` 也只用 identity 查索引，碰撞模型下诊断 path 会指向另一类型的单元。

## Goals / Non-Goals

**Goals:**

- 索引与所有定位消费方按 (entity type, identity) 解析存储单元
- 跨类型同名模型下 sync 不丢失、不覆盖、不删除任何仍存在于 Target Semantic Model 的单元
- 两个单元映射同一目标路径时在写入前显式失败，Formal Semantic Model 零改动
- 无碰撞的合法模型加载语义与 sync 输出保持不变（未触及单元仍复用原字节）

**Non-Goals:**

- 不禁止跨类型同名，不新增冲突诊断码
- 不改变 partition 组织约定与 `ENTITY_PARTITION_MISMATCH` warning 语义
- 不做存储迁移，不新增 CLI 命令或选项
- 不改动 candidate、likec4 生成与 Browser 投影

## Decisions

1. **索引以 (entity type, identity) 为键**  
   `createModelIndex` 以 `entry.declared` 与 identity 构成键（`${declared}\u0000${identity}`），`moduleOf(entity, identity)` 必填 entity。备选：按 (partition, identity) 建键——kind 合法寄存在 `elements/` 时仍会碰撞，且 partition 无规范语义；改为全局 identity 唯一并禁止同名——破坏 Edera 式自然建模且需要迁移。选 entity type：它是唯一带规范语义的命名空间。

2. **sync-writer 每个集合显式传入自己的 entity type**  
   element、element-kind、relationship-kind、view 四个循环分别传 `element-declaration`、`element-kind`、`relationship-kind`、`authored-view`，不从集合内容推导；`emit` 增加 entity 参数。备选：在 `emit` 内按 defaultPath 前缀猜测类型——引入新的路径耦合。

3. **诊断携带实体类型，定位改为实体精确**  
   `ModelDiagnostic` 增加可选 `entity`（`EntityType | 'requirement' | 'relationship'`），在 validator 与 delta apply 的生成点填实；`change-compiler` 的 `locate` 按 entity 查索引，requirement 归 host element，relationship 保持 entries/容器 fallback。备选：只改 `moduleOf` 调用、locate 保留按 identity 猜测——碰撞时输出错误路径，且需要一个"忽略实体类型"的查询 API，该语义本不应存在。

4. **目标路径冲突显式失败**  
   `writeMinimal` 维护目标路径认领表，两个不同单元映射同一路径时抛错。冲突发生在 manifest 生成与事务应用之前，因此 Formal Semantic Model 零改动。备选：自动挑选备用文件名——静默漂移且名字无规范依据；保持 last-wins 覆盖——即当前缺陷本身。

5. **不新增同名冲突诊断**  
   跨类型同名是合法模型，warning 会形成噪声；同类型重复 identity 仍由既有 `DUPLICATE_IDENTITY` 与 `DUPLICATE_KIND_IDENTITY` 拒绝，索引 last-wins 仅存在于随后即判定失败的路径上。

6. **测试策略**  
   最便宜边界是 `test/core/model/` 的 index 与 sync-writer 单元测试，加上 `test/core/change-compiler.test.ts` 的定位用例；沿用既有"target tree reparses 回 expected model"的用例模式扩展碰撞案例，不为该修复新增 CLI e2e。既有诊断对象断言（validator、change-compiler 等）随 `entity` 字段更新形状，仍只锁定可观察行为。一次性验证为 build 后以临时模型执行 `xirang sync` 冒烟。

## Risks / Trade-offs

- [Risk] 诊断新增 `entity` 字段触及多处既有 `toEqual` 断言 → Mitigation：只加字段、不改诊断码与消息；断言更新属形状变更，测试继续锁定行为。
- [Risk] 路径冲突失败会让 mismatch 寄放场景要求用户移动既有单元文件 → Mitigation：错误信息报告冲突路径与两个单元 owner；该场景本身是模型的存储组织问题，显式失败优于静默覆盖。
- [Risk] 未来新增实体类型时索引遗漏 → Mitigation：类型来自 `EntityType`/`DEFAULT_PARTITION` 单点定义，`moduleOf` 必填 entity 使遗漏成为编译错误。
- [Risk] 个别诊断生成点漏填 `entity` 导致定位回退不精确 → Mitigation：validator 与 delta apply 全部生成点填实，并加碰撞模型的定位回归用例。

## Migration Plan

无需存储迁移：合法模型的加载与写回结果不变；存在跨类型同名模型的仓库在修复后按当前 Formal snapshot 正常 sync 即可。回滚即回退本次提交，不涉及数据迁移。
