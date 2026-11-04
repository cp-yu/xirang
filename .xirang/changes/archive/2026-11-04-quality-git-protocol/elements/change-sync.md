---
operation: MODIFIED
entity: element-declaration
identity: change-sync
kind: element
parent: change-closure
title: Change Sync
definition: Change Sync 定义将 Change 的四分区 Semantic Delta 同步到正式 Semantic Model 的行为：从 immutable Formal snapshot 物化完整 Target Semantic Model、联合验证、原子写入与回滚、幂等判定及 `xirang sync` 命令面的选择与门禁行为。Sync 的 Quality 前置条件是已记录且 commit 对象仍存在的 Seal；Sync 不写 Quality record、不执行或关联测试，也不比较 Seal commit 与当前工作区。
---

## MODIFIED Sections

### Section: 同步执行
`xirang sync` SHALL 在 Quality Seal gate 通过后，从 immutable Formal snapshot 将 change-local 四分区 operations materialize 为一个完整 Target Semantic Model，执行 combined validation 与 Formal fingerprint freshness check，再原子写入干净 formal modules。Sync SHALL NOT 生成 Review metadata、改写 Quality JSON、执行测试或将测试和 Review 证据重新关联到同步后的代码。

- **Quality Seal gate 失败**：新格式 Quality JSON 缺失、没有 Seal 或 Seal commit 对象无法解析时，Sync SHALL 非零退出并给出具体诊断。Gate 不比较 HEAD、工作区 clean 状态或工作区内容与 Seal commit。
- **Quality Seal gate 通过**：JSON 中存在 Seal 且其 Git commit 对象可解析时，Sync MAY 构造 Target Semantic Model 与内部 Diff IR；validation 与 Formal fingerprint recheck 通过后 SHALL 原子写入 formal 分区。
- **`--no-verify` 跳过 Quality gate**：用户使用 `--no-verify` 时 SHALL 跳过 Quality Seal gate，但 MUST NOT 跳过 syntax、identity、integrity、Formal fingerprint 与 target validation。
- **不修改 Change Quality record**：Sync SHALL NOT 更新、创建或删除 Change 的 `.quality.json`，也 SHALL NOT 写入 Review metadata、测试结果或 Sync association。
- **Sync 不生成持久化 Review 输出**：effective diff 仅由只读 `xirang validate --change` 提供。

## REMOVED Sections

- sync 完成后刷新 evidence fingerprint
