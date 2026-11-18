---
operation: MODIFIED
entity: element-declaration
identity: change-sync
kind: capability-specification
parent: change-closure
title: Change Sync
definition: Change Sync 是交付归档内部将四分区 Semantic Delta 应用于正式模型的能力。它编译完整目标、验证并只写实际变化的模型单元，在本次调用内与封存共同回滚；它不提供独立 CLI 入口，也不管理 Quality 记录。
---

## ADDED Sections

### Section: Scope and Non-goals

同步 SHALL 仅作为默认及 quick 交付的内部操作，不单独选择 Change，不提供独立命令；不执行测试、不改绑测试或 Review、不改写 Quality 记录。

### Section: Business Logic

同步 SHALL 从同一正式模型快照解析四分区 operation，物化完整目标、构建 identity 索引与差异、联合校验 syntax、identity、contract policy、引用及目标完整性，写入前复核正式模型指纹。只写有差异的单元；不同实体类型的同名 identity 分开路由。未提及的分区不变，无 operation 不写。合法且目标已完全体现在正式模型（包括 REMOVED 已不存在）时无需重写；不能用 identity 相同掩盖内容冲突。

按完整 Section target 与 normalized identity 查找应用 ADDED/MODIFIED/REMOVED，不把冲突 ADDED 当修改；MODIFIED 不保留目标未包含的 Acceptance Case。拒绝 RENAMED，引导移除旧项并新增。按方向和 kind 识别 Relationship，仅允许新增或移除并检查端点。创建 Contract 时保留投影的语言策略、规范标题、关键词、identity 与代码记号，不向无关 Section 注入内容。

### Section: Edge Cases and Exception Handling

同步 SHALL 在正式基线变化、目标路径冲突、存在悬空引用、实际 Delta 无正式模型、空 operation block、非法记法或联合校验失败时阻止交付，指出语义单元与路径，不部分写入。Delta 的 Section 标题必须非空，不得附加与标题以空格分隔的 Markdown 闭合井号，以免将排版误作 identity。不同平台均基于原路径组件准备与恢复模型单元。在同一次调用内，写入及其后的封存若失败，撤销已写部分；成功时可由目标重建索引。仅输出真实警告和错误，JSON 模式输出结构化诊断。

### Section: Key Acceptance Cases

目标一致性与写入边界 SHALL 可从正式模型及活动目录检查。

#### Acceptance Case: 旧版已同步

旧版已应用 ADDED 单元、目标内容相同而 Change 仍活动：通过其他交付门禁后只归档，不重写正式文件。若同一新增 identity 内容不同则报告冲突，不封存。

#### Acceptance Case: 基线被改写

准备后正式模型指纹变化：拒绝所有写入，保留当前模型及活动 Change，提示重新校验。

#### Acceptance Case: 路径碰撞

同名 Element 与 Kind 目标路径不同时分别保留；若两个实体实际映射到同一路径则写入前报出两者及路径。

## REMOVED Sections

### Section: Change 选择

### Section: 同步执行

### Section: 不触发归档

### Section: 幂等性

### Section: 按实际 Semantic Delta operations 判断同步需求

### Section: 拒绝非 canonical 空 delta

### Section: Semantic Delta SHALL 原子提升

### Section: Sync-created contracts SHALL 使用 runtime projection

### Section: 同步 Section Operations

### Section: Sync diagnostics 可操作

### Section: sync 完成后刷新 evidence fingerprint

### Section: 保持 Target 单元完整

### Section: 拒绝目标路径冲突

### Section: 同步成功仅交付必要结果
