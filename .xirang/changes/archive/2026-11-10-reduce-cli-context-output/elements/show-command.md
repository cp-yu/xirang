---
operation: MODIFIED
entity: element-declaration
identity: show-command
kind: element
parent: deterministic-operations
title: "Show Command"
definition: "Show Command 是活动 Change 的只读展示入口。它支持无参数时交互选择活动 Change，文本呈现 proposal.md，JSON 呈现编译后的身份、概况和 entries，显式 review 模式交付完整审阅投影；执行诊断通过 stderr 提供。它不提供 Element 或 Contract 选择，也不将展示结果作为新的规范来源。"
---

## MODIFIED Sections

### Section: JSON 输出返回编译结果

show <change> --json SHALL 编译指定活动 Change，成功时向 stdout 返回 id、title、valid、实体级 summary 与以 entity kind 和稳定 identity 表达的 concise entries。compiler 警告 SHALL 在 stderr 返回；编译失败 SHALL 非零退出并在 stderr 返回具体结构化诊断，不将部分 entries 声称为有效目标。完整 review projection 由显式 --review 获取。
