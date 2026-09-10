# xirang

## 0.1.0

### Minor Changes

- 命令面 `xirang verify` 重构为 `xirang quality`。四个入口 `review` / `optimize` / `status` / `seal` 取代相位编号与 `--type` 判别；状态由"当前代码与历史 Review 记录的 evidence fingerprint 关系"唯一决定（`clean` / `dirty`）；优化以轮为单位提交方向台账，方向 ID 由 CLI 分配并回显，收口终态由 `stopReason` 推导；记录拆分为 `.quality-state.json` 快照与 append-only `.quality-log.jsonl`；协议说明由实现常量单源投影到 help 与 skill reference。配置项 `optimization.optRetries` 由 `optimization.directionLimit` 与 `optimization.directionRetries` 取代。

  旧命令族 `xirang verify`、`--type`、相位编号、`PENDING_VERIFICATION` 与 `.verify-result.json` 全部退役，不提供兼容别名。

## 0.0.1

Xirang 是独立的 Agent 驱动项目开发框架，本版本为其独立命名的初始发布。
