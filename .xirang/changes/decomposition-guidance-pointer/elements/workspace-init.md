---
entity: "element-declaration"
identity: "workspace-init"
kind: "element"
parent: "workspace-init-update"
title: "Workspace Init"
definition: "Workspace Init 定义 `xirang setup` 创建完整工作区的行为：创建或保留 `.xirang` durable core、`model/{metamodel,elements,relationships,views}` 四分区 Semantic Model skeleton、changes 与 references、固定 Agent workflow 集合，支持跨平台与 non-interactive 运行，并在成功后暴露 Project Build 引导。Element Contract 与 Element Declaration 共用同一 `elements/` 单元，不存在独立的 Contracts store。"
contract: "optional"
---

## MODIFIED Requirements

### Requirement: Setup 物化默认结构拆分方法
`xirang setup` SHALL 通过共享 project config default materialization contract 在新工作区配置中写入 `decomposition: xirang-semantic-refinement.md`，并 SHALL 保留 existing workspace 中用户已配置的 `decomposition` 值。

#### Scenario: 新项目获得显式默认指导文件
- **WHEN** setup 创建新的 `.xirang/config.yaml`
- **THEN** 配置包含 `decomposition: xirang-semantic-refinement.md`

#### Scenario: Existing project 保留用户配置
- **WHEN** existing workspace 配置包含 `decomposition: .pi/skills/xirang-project-decomposition/SKILL.md` 或其他合法字符串值
- **THEN** setup 保留该值
- **AND** 不添加默认指导文件

#### Scenario: 跨平台 setup 写入相同默认值
- **WHEN** setup 在 Windows、macOS 或 Linux 上创建项目配置
- **THEN** 使用 Node.js path API 定位配置文件
- **AND** 写入语义相同的 `decomposition: xirang-semantic-refinement.md`

#### Scenario: 显式 C4 仍被保留
- **WHEN** existing workspace 明确配置 `decomposition: c4`
- **THEN** setup 保留该选择，不用默认指导文件替换用户值。
