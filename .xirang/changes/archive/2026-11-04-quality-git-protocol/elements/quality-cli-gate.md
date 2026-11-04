---
operation: MODIFIED
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: Quality CLI Gate
definition: Quality CLI Gate 是 Quality 的确定性接口与门禁，负责在单一 JSON record 中记录 Review opinions、可选 Opt opinions 或明确不做 Opt 的处置及 Seal 声明，并校验 commit identity 和流程关联。它提供只读状态诊断与 Archive Seal commit 检查；不执行测试、不比较工作区新鲜度、不自动修改 tasks.md，也不判断是否值得 Opt 或是否需要 Opt 后 Review。
---

## MODIFIED Sections

### Section: Review 记录入口
`xirang quality review <change-name>` SHALL 接受一条完整 Review opinion 并追加至 Change 的 Quality JSON，至少关联 scope、Git commit、result、summary 与 findings。CLI SHALL 验证 payload 结构、Review identity 唯一性及 commit 对象存在；Review 结果只对所关联 commit 和范围成立。基线 Review 只有 PASS 或 PASS_WITH_WARNINGS 可满足门槛。FAIL_NEEDS_CORRECTIONS 在后续不同 commit 上取得通过的 Review 前不得满足门槛。CLI 不解析 findings 的自然语言充分性，不回写 `tasks.md`。

### Section: Optimization 记录入口
`xirang quality opt <change-name>` SHALL 接受并记录以下一种 Opt 处置：至少一条交付 opinion，每条绑定 `baseCommit`、`resultCommit` 与意见文本；或带非空简短理由的 `not_performed`。CLI SHALL 校验 opinion identity 与两个 Git commit objects，追加 delivered opinions 并在并发 revision 冲突时拒绝写入且保留原 JSON。它不记录委托起点、进度、测试输出或恢复位置，不判断是否应执行 Opt、跳过理由或 opinion 文本是否充分，也不维护方向排序、选择、依赖队列、收益分级、重试或数量限制。

### Section: Seal 校验
`xirang quality seal` SHALL 要求至少一条通过的独立基线 Review、没有未解决的 Review failure、明确的 Opt 处置，以及 Seal payload。Seal SHALL 绑定一个 Git commit，并包含主 Agent 对该 commit 的 `canRun` 与 `testsExpectedToPass` 正向声明、适用测试范围和 assessment。CLI 验证 commit 对象存在并记录声明；不执行测试、不定义客观测试成功、不保存测试输出、不要求工作区 clean、不要求 commit 等于 HEAD 或与当前工作区匹配，也不要求在 Seal 或 Archive 前单独提交 Quality JSON。后续工作区或 HEAD 变化不单独使 Seal 失效。

### Section: Status 输出语义
`quality status` SHALL 只读解析新 Quality JSON，报告基线 Review、失败 Review 是否已有不同 commit 上的通过复审、Opt disposition、Seal 与可执行的下一步。没有通过基线 Review 时状态为 `needs_review`；基线通过但缺 Opt 处置或 Seal 时为 `needs_optimize`；Seal 及其 commit 有效且流程门槛成立时为 `all_done`。Status SHALL NOT 计算代码 manifest、比较 HEAD/工作区或因代码变化标记 dirty；无 JSON 时报告缺失，不从旧记录推断状态。

### Section: 协议说明的单一来源与投影
系统 SHALL 从实现使用的同一批协议常量和字段定义生成 Quality help 及 Apply/Archive references，覆盖 Review opinion、Opt disposition、Seal、commit 关联、最小合法 JSON 示例、CAS revision 和失败诊断。不维护平行手写 schema 或旧方向指令；CLI 只校验 JSON 结构、Git commit identity、声明的流程条件及关联，不运行测试或评分自然语言充分性。

### Section: 统一输出与诊断结构
所有 `xirang quality` 子命令 SHALL 使用统一输出形状。成功返回 `ok: true` 与 `allowedNextOperations`；门槛或关联不满足返回 `ok: false`、稳定 `code`、`diagnostics` 与 `allowedNextOperations`，并以 exit 1 退出；输入形状非法返回 `ok: false`、`code: INVALID_INPUT` 与 `diagnostics`，并以 exit 2 退出。`diagnostics` 条目 SHALL 包含字段路径 `path`、期待值 `expected`、当前值或状态 `actual` 以及修正方式 `fix`。

### Section: 拒绝退役协议
新实现 SHALL 只读取新单一 JSON schema，不读取、迁移、重写或兼容旧 snapshot、event log、evidence 文件或旧质量命令 payload。发现旧输入时 SHALL 给出明确的不支持诊断；不得将其转换为 Review、Opt 或 Seal。既有忽略规则、本地旧记录与历史归档保持原样，Quality CLI 不清理这些文件。

## REMOVED Sections

- 记录实际测试证据
- 记录主 Agent 最终结论
