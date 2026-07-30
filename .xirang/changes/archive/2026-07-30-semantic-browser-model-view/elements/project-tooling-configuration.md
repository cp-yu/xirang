---
entity: element-declaration
identity: project-tooling-configuration
kind: capability
parent: cli
title: Project and Tooling Configuration
definition: 建立和维护工作区、项目配置与所选 Agent 工具集成。
---

## ADDED Requirements

### Requirement: 维护内置 Perspective Kind

Project and Tooling Configuration SHALL 通过与 Model skeleton 共享的显式受管文件清单，在新项目、clean Candidate 与既有项目 setup/update 中维护 `metamodel/perspective.md`；所有路径 SHALL 由平台路径 API 构造，且缺失声明可补齐但冲突内容 SHALL NOT 被覆盖。

#### Scenario: 跨平台建立新模型

- **WHEN** 用户在 macOS、Linux 或 Windows 上建立项目或 clean Candidate
- **THEN** CLI 通过共享清单和平台路径 API 写入相同语义的 `perspective` Kind 单元

#### Scenario: 更新缺失内置 Kind 的旧项目

- **WHEN** setup/update 处理未声明且未使用 `perspective` 的旧模型
- **THEN** CLI 按受管清单补齐声明且不修改其他模型单元

#### Scenario: 更新存在冲突声明的项目

- **WHEN** setup/update 发现 identity 为 `perspective` 的内容与内置定义不同
- **THEN** CLI 报告冲突并停止该文件更新，且保留原始内容
