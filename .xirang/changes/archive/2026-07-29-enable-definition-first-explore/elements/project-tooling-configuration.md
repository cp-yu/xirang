---
entity: element-declaration
identity: project-tooling-configuration
kind: capability
parent: cli
title: Project and Tooling Configuration
definition: 建立和维护工作区、项目配置与所选 Agent 工具集成。
---

## ADDED Requirements

### Requirement: 投影共享 Definition Framing 协议
Project and Tooling Configuration SHALL 从 Xirang 托管的单一生成源向 Explore skill 与 `.xirang/references/xirang-definition-framing.md` 投影 Definition Framing 规则，SHALL NOT 运行时依赖用户级 `problem-framing` skill 或直接编辑 generated artifacts。

#### Scenario: 刷新 Explore 工作面
- **WHEN** CLI 同步所选 Agent 工具集成
- **THEN** generated Explore skill 引用同版本 Xirang-owned Definition Framing reference
