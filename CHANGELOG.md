# xirang

## 0.1.1

### Patch Changes

- 修复 `xirang sync` / `xirang archive` 在跨实体类型同名 identity（如 element 与 element-kind、element 与 authored view 同名）时静默删除仍存在于 Target Semantic Model 单元的数据损失：identity source index 改为按 `(entity type, identity)` 定位，sync 目标树按实体类型保真路由；两个单元映射到同一目标路径时在写入前显式失败，Formal Semantic Model 保持不变。新增规范：identity 唯一性按实体类型命名空间分域，跨类型同名合法。

- change diff 与 contract 校验的诊断定位改为实体精确（碰撞模型下不再指向其他类型的存储单元）；`xirang validate --all/--contracts` 批量校验共享单次 formal 模型解析；`allowAlreadyApplied` 的 already-applied 判定改为实体精确匹配。


## 0.1.0

### Minor Changes

- 命令面 `xirang verify` 重构为 `xirang quality`。四个入口 `review` / `optimize` / `status` / `seal` 取代相位编号与 `--type` 判别；状态由"当前代码与历史 Review 记录的 evidence fingerprint 关系"唯一决定（`clean` / `dirty`）；优化以轮为单位提交方向台账，方向 ID 由 CLI 分配并回显，收口终态由 `stopReason` 推导；记录拆分为 `.quality-state.json` 快照与 append-only `.quality-log.jsonl`；协议说明由实现常量单源投影到 help 与 skill reference。配置项 `optimization.optRetries` 由 `optimization.directionLimit` 与 `optimization.directionRetries` 取代。

  旧命令族 `xirang verify`、`--type`、相位编号、`PENDING_VERIFICATION` 与 `.verify-result.json` 全部退役，不提供兼容别名。

## 0.0.1

Xirang 是独立的 Agent 驱动项目开发框架，本版本为其独立命名的初始发布。
