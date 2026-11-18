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

Archive Role SHALL 在用户选择的模式下调用一次 archive，由 CLI 完成对应状态转换。默认要求 Seal；明确选择 quick 时不先补做 Quality，也不声称已通过；放弃时不因质量、制品或实现进度阻塞，提示实际文件进度并遵守确认。不得手动写模型。

### Section: 限定 Closure 制品处理范围

Archive Role SHALL 原样保留被选 Change 及其已有证据。放弃后只报告留档位置与已知进度，不进入交付后的 Git 提交、合并或清理；已交付后的业务修改走新 Change。
