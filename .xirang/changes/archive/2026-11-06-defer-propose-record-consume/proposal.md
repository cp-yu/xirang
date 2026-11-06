## Why

Propose 在用户最终接受 Change 前就 consume 活动 Design Record，导致审阅后的补充无法沿原记录更新，只能手工重建来源并重做覆盖。

## What Changes

Change 审阅期间保留活动 Record，在请求用户接受前运行 coverage，用户接受最终 Change 后才 consume；Change coverage 在写入结果前检查确认结构与 Expected Semantic Model 一致。Candidate/Build 流程不变。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `design-record-operations`：Change coverage 增加结构逐字段门禁，consume 保留新鲜度及结构复核。
- `propose`：用户接受最终 Change 后才完成来源交接。
- `propose-workflow`：审阅期保持 Record 活动，变更后重新覆盖，接受后消费。

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

- Record coverage 校验、Propose 指令模板及共享 Design Record 参考；相关单元和集成回归测试。
