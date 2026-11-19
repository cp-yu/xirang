---
operation: MODIFIED
entity: element-declaration
identity: archive-role
kind: element
parent: agent
title: Archive Role
definition: Archive 是 Agent 按用户决定编排 Change 交付或放弃留档的工作身份。它协调 CLI 消费门禁并执行状态转换，按实际结果报告；它不重判目标语义或替 CLI 写模型。
---

## MODIFIED Sections

### Section: 通过 CLI 编排 Closure

Archive Role SHALL 在用户选择的模式下调用一次 archive，由 CLI 完成对应状态转换。交付前通过 `xirang status --no-quality` 查询制品，不提前读取或评估 Quality；默认 Seal 只由 Archive CLI 校验，quick 不声称 Quality 已通过。放弃时不因质量、制品或实现进度阻塞，提示实际文件进度并遵守确认；未指定目标时若有交互终端，由 Archive CLI 选择，否则向用户询问确切名称。不得手动写模型。

### Section: 限定 Closure 制品处理范围

Archive Role SHALL 原样保留被选 Change 及其已有证据。放弃后只报告留档位置与已知进度，不进入交付后的 Git 提交、合并或清理；已交付后的业务修改走新 Change。
