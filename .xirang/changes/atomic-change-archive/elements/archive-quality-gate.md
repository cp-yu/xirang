---
operation: MODIFIED
entity: element-declaration
identity: archive-quality-gate
kind: capability-specification
parent: change-closure
title: Archive Quality Gate
definition: Archive Quality Gate 是默认交付归档消费 Quality Seal 的能力。它判定记录和绑定提交能否作为入口依据，并区分显式豁免和放弃留档；它不执行测试或代替 Apply 评估实现。
---

## ADDED Sections

### Section: Scope and Non-goals

归档的质量门禁 SHALL 只消费 Quality 证据，不伪造 Review、Opt 或 Seal，不在归档阶段补做独立审查。

### Section: Business Logic

默认交付 SHALL 检查 Quality JSON 中存在有效 Seal 且绑定的 Git commit 可解析，不比较 HEAD 或工作区、不要求 clean、不要求提前单独提交 Quality JSON。Review、Opt 与最终验证由 Apply/Quality 负责。显式 quick 不要求 Seal，结果为跳过而非通过；放弃留档不消费 Quality 证据。

### Section: Edge Cases and Exception Handling

默认模式下缺失、无效或不可解析的 Seal SHALL 阻止写入，给出诊断并交回 Apply；不读取为有效或迁移不支持的旧记录，不从中断的 Opt 推断 skip，不因 HEAD 变化重跑测试。

### Section: Key Acceptance Cases

下列结果 SHALL 不随工作区是否 clean 而变化。

#### Acceptance Case: 缺少 Seal

相同 Change 无 Seal：默认阻止；quick 继续模型与任务门禁但不写 Quality JSON；abandon 进入放弃确认。

#### Acceptance Case: 绑定提交存在

有效 Seal 的 commit 存在且不等于 HEAD：默认质量门禁通过，不声称本次执行过测试。

## REMOVED Sections

### Section: 归档前必须具备新鲜的完整验证记录

### Section: Freshness 基于显式验证证据判定

### Section: Archive rerun 使用 quality 执行模型

### Section: Archive 与 Sync 双重门禁
