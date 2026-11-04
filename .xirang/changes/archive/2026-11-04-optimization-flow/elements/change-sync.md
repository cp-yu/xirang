---
operation: "MODIFIED"
entity: "element-declaration"
identity: "change-sync"
kind: "element"
parent: "change-closure"
title: "Change Sync"
definition: "Change Sync 定义将 Change 的四分区 Semantic Delta 同步到正式 Semantic Model 的行为：从 immutable Formal snapshot 物化完整 Target Semantic Model、联合验证、原子写入与回滚、幂等判定、同步输出与原验证证据的确定性关联，以及 `xirang sync` 命令面的选择与门禁行为。它保留原始测试与 Review 的执行状态，不以模型同步改写既有验证结果。"
---

## MODIFIED Sections

### Section: 同步执行

`xirang sync` SHALL 在 quality gate 通过后，从 immutable Formal snapshot 将 change-local 四分区 operations materialize 为一个完整 Target Semantic Model，执行 combined validation 与 fingerprint freshness check，再原子写入干净 formal modules。Sync SHALL NOT 生成 review metadata 或静默迁移记法版本。

- **quality gate 失败输出指引**

  - 基线 Review、委托交付/明确跳过、主 Agent 最终结论、当前所需通过验证或最终成功状态不满足
  - SHALL 输出 changed files、针对实际缺口的恢复与验证指引与 `--no-verify` option
  - exit code SHALL 非零

- **quality gate 通过后执行同步**

  - 当前完整质量完成条件通过且 archive compatible
  - SHALL 构造 Target Semantic Model 与内部 Diff IR
  - validation 与 Formal fingerprint recheck 通过后 SHALL 原子写入 formal 分区

- **--no-verify 跳过 gate**

  - 用户运行 `xirang sync <change> --no-verify`
  - SHALL 跳过 quality gate
  - MUST NOT 跳过 syntax、identity、integrity、fingerprint 与 target validation

- **sync 不修改 change review source**

  - sync prepares Semantic Delta
  - MUST NOT 修改 change-local source
  - MUST NOT 生成 review metadata

- **同步后 evidence fingerprint 刷新**

  - sync 成功写入 formal 单元
  - SHALL 仅关联实际 outputs 的确定性模型转换，不改写测试或 Review 原始执行时证据
  - SHALL 使用当前 `.xirang/model/` 路径

- **sync 不生成持久化 review 输出**

  - sync 成功写入 formal 单元
  - SHALL NOT 创建、更新或删除任何持久化 review 输出
  - effective diff 仅由只读 `xirang validate --change` 提供

- **Review 记录与当前代码一致**

  - archive sync 运行时存在关联当前状态的完整最终验证记录
  - system SHALL continue sync logic

- **--no-verify 开关**

  - 用户执行 `xirang sync my-change --no-verify`
  - `skipVerify` 设为 `true`
  - 不调用质量记录判定
  - 同步照常执行

- **Review 记录缺失或状态为 dirty**

  - archive sync 运行时不存在满足当前完整完成条件的验证记录
  - 系统 SHALL 停止并要求补齐所诊断的质量义务

### Section: sync 完成后刷新 evidence fingerprint

Sync 成功写入后 SHALL 关联本次实际输出与原完整验证结论之间的确定性模型转换，保留测试与 Review 原始执行时状态及结果，不把旧测试改绑为新状态。只处理实际输出重叠路径，无重叠或无质量记录不写无关记录。不支持旧格式时明确诊断，不自动转换；已提交模型事务后的关联失败须如实报告，不声称验证仍完整。

- **模型输出转换**：Sync 只修改已声明模型输出且关联完成，正常归档可识别该转换，不伪造新的测试通过。
- **外部代码变化**：Sync 后外部改写文件或新增/删除代码，后续门禁显示不一致，不能借 Sync 关联免除受影响验证。
- **跨平台与 Change 源**：Windows 反斜杠路径按同一项目相对 POSIX 路径关联，change-local Delta 未被 Sync 写入时其原证据不变。
