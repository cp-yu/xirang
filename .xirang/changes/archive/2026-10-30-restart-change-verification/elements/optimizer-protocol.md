---
entity: element-declaration
identity: optimizer-protocol
kind: element
parent: optimization
title: Optimizer Protocol
definition: Optimizer Protocol 定义 Optimizer 角色与硬约束、输入合约、优化原则与禁止项、Failed Directions 避重协议、一层依赖展开与 finding JSON 输出合约。
---

## MODIFIED Sections

### Section: Optimizer 输入合约

顶层 agent MUST 传入合法 `changeName`、绝对 `changeDir` 和绝对 `projectRoot`。Optimizer SHALL 自主读取 quality 状态记录与历史日志、change artifacts、方向台账与失败方向、项目 optimization config、base scope 最终代码和一层关联上下文。`baseCommit` 缺失或 Git 无法解析时 SHALL fail closed。

- **后续轮次读取持久台账**

  - quality 状态记录已包含方向台账与轮次历史
  - optimizer SHALL 读取全部非终态方向及历史结果
  - SHALL 基于当前文件内容生成该轮方向判断

- **缺少 Review 记录**

  - `changeDir/.quality-state.json` 不存在
  - optimizer SHALL 返回 `Review record not found — cannot optimize without a passing Review`
  - SHALL NOT 推断代码状态

- **Git evidence baseline 缺失**

  - `.apply-isolation.json.baseCommit` 缺失或无效
  - optimizer SHALL fail closed
  - SHALL NOT 从 `originalBranch` 或远程默认分支推断 scope

- **区分当前与历史轮次**：当前 Change 存在质量历史目录时，Optimizer SHALL 按共享恢复 reference 读取旧判断、失败原因与重启原因，并基于当前代码重新评估。活动根目录的 Review、方向台账和计数是本轮执行依据；不得将旧轮次 PASS、已完成结论、方向状态、已用额度或失败次数导入本轮台账。新轮次仍须先有新通过的 Review，历史 PASS 不能满足缺少活动 Review 的前提。

### Section: Failed Directions 避重协议

Optimizer SHALL 读取方向台账与失败方向记录。同一目标、优化类型和实现边界构成同一失败方向；当前活动轮次内，optimizer MUST NOT 通过改写措辞重复已达 `optimization.directionRetries` 的方向。未达上限时 MAY 提供实质不同的关键设计。

- **失败方向达到上限**

  - 某方向失败次数达到 `optimization.directionRetries`
  - optimizer SHALL 在台账中把该方向置为 `rejected` 并给出理由与证据
  - SHALL 继续评估其他方向

已轮换历史中的失败计数不占用新轮次额度，也不直接恢复为新轮次 rejected 状态；旧失败证据仍 SHALL 作为判断参考，不能以新轮次从零计数为由忽略其设计边界或声称旧失败方案已经验证成功。
