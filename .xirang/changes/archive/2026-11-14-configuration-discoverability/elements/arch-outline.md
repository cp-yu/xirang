---
operation: MODIFIED
entity: element-declaration
identity: "arch-outline"
kind: "capability-specification"
parent: "deterministic-operations"
title: "Arch Outline"
definition: "Arch Outline 定义 `xirang arch outline` 的确定性模型结构总览能力：它为 Agent 的整体语义认知与遗忘恢复投影全部 Element identities 和 hierarchy、全部 persisted Relationships 及完整 Metamodel Kinds，并只在配置深度内携带完整 Element Definition；它不返回 Authored Views、Element Contracts、实现证据或 Agent 判断，也不维护跨调用状态。"
---

## ADDED Sections

### Section: Scope and Non-goals

Arch Outline SHALL 只读投影当前 Formal Semantic Model 的完整层级及显式选择的语义展开，供导航与认知恢复。它不返回 Authored Views、Contracts、Sections 或 Acceptance Cases，不读取活动 Change、实现代码或 Git 证据。

### Section: Business Logic

默认输出 SHALL 包含全部 Elements 的 identity、kind、title、parent、children、depth 与规模统计，不返回 Relationships、Metamodel 或 Definitions。显式选择关系或元模型时返回全部持久 Relationships 及完整 Element/Relationship Kind 声明；关系保持 canonical source、kind、target。任何 projection 选择都不裁剪 hierarchy，展开的规范内容不摘要或截断。

Definition projection SHALL 使用有效 architecture.outline.definitionDepth，默认 2；Project Root depth 为 0。显式 --definition-depth 为当前调用选择并覆盖深度，不改项目配置。深度内返回完整 definition 和 definitionState: loaded，深处返回 unloaded 并省略 definition。未选择 Definitions 时省略 Definition 内容及顶层深度字段；选择时 canonical result 与 JSON 用 definitionDepth 表达实际深度。该配置不控制浏览器展开。

--format SHALL 支持 text、markdown、json，默认为 text；三者从同一 canonical result 生成，呈现完整层级、选定展开及统计，明确区分未加载 Definition。模型、配置和参数不变时集合与顺序确定。每次调用重新读取当前模型和配置，不创建 cache、fingerprint、session state、report 或项目文件；Windows、macOS、Linux 的身份及排序语义一致。

### Section: Edge Cases and Exception Handling

非法 --definition-depth（负数或非整数）SHALL 非零退出并说明合法值，不静默替换为默认。配置字段非法时按项目配置普通读取规则告警并回退 2。Formal Model 缺失或无效 SHALL 非零退出并报告模型错误，不以空 outline 代替完整模型。depth 0 是合法值，仅加载 Project Root Definition，全部 descendants 仍可发现，其他展开按各自选项返回。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 默认完整导航

运行 outline --format json，返回全部层级字段及统计，无 Definitions、Relationships 或 Metamodel，Contracts 和 Views 不出现。

#### Acceptance Case: 默认与显式深度

选择 Definitions 且无命令覆盖时，默认加载 depth 0、1、2，深于 2 的节点仍存在但 unloaded。配置值 4 时采用 4；显式 --definition-depth 1 时仅加载 0、1，后续调用默认不变。

#### Acceptance Case: 零深度

显式深度 0 只加载 Project Root；全部 descendants 保持导航可见，所选 Relationships/Metamodel 完整返回。

#### Acceptance Case: 非法深度与模型缺失

命令深度 -1 或非整数时失败；模型缺失时失败并诊断，均不输出伪造空模型。

#### Acceptance Case: 确定性与跨平台只读

相同模型、配置、选项重复执行，在 text/markdown/json 中保持相同规范内容及确定顺序；Windows/POSIX 定位差异不改变 logical identities，工作区无新文件。

## REMOVED Sections

### Section: arch outline SHALL 投影完整模型结构

### Section: arch outline SHALL 按深度加载 Element Definition

### Section: arch outline SHALL 支持确定性多格式输出

### Section: arch outline SHALL 保持无状态只读
