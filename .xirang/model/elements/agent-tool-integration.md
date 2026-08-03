---
entity: element-declaration
identity: agent-tool-integration
kind: element
parent: project-tooling-configuration
title: Agent 工具集成选择与维护
definition: Agent 工具集成选择与维护是 CLI 中为所选 Agent 工具选择、安装、刷新与同步生成制品的元数据能力。它维护各工具的 skillsDir/agentsDir/agentFormat 路径元数据与 workflow 引用的显式工具表面调用语法，使生成与更新行为在支持平台上保持一致。
---

## Requirements

### Requirement: 声明工具路径元数据

Agent 工具集成 SHALL 为每个受支持工具声明 skills 生成路径、subagent artifact 路径与格式等元数据。

#### Scenario: 查询工具元数据

- **WHEN** 系统按 tool ID 查找工具条目
- **THEN** 支持 skills 的工具暴露 `skillsDir`，支持 tool-native subagent artifact 的工具暴露 `agentsDir` 与 `agentFormat`

#### Scenario: 不支持的工具

- **WHEN** 工具未声明所需元数据
- **THEN** 对应生成行为明确失败或跳过，不使用回退猜测

### Requirement: 使用显式工具表面调用语法

workflow 引用 SHALL 通过共享 workflow surface 元数据渲染；缺少精确工具调用语法时使用中性 skill invocation 文案，而不是回退到 command syntax。

#### Scenario: 各工具精确语法

- **WHEN** guidance 需要引用另一个已注册 workflow surface
- **THEN** 渲染结果按工具使用显式注册的 `$<skillDirName>`、`/<skillDirName>`、`/skill:<skillDirName>` 或 command-backed 形式

#### Scenario: 无精确语法

- **WHEN** 工具没有精确 skill invocation metadata
- **THEN** 渲染结果使用中性 skill invocation 文案并包含显式 `skillDirName`

### Requirement: 跨平台路径处理

Agent 工具集成生成的路径 SHALL 使用 Node.js path APIs 构造，不硬编码路径分隔符。

#### Scenario: Windows 路径

- **WHEN** 在 Windows 上构造 skills 或 agents 路径
- **THEN** 使用 `path.join()` 且结果与 Unix 平台逻辑一致
