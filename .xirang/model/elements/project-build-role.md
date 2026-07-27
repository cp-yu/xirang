---
entity: element-declaration
identity: project-build-role
kind: capability
parent: agent
title: "Project Build Role"
summary: "构建或重建完整 Semantic Model 的 Agent 工作身份。"
---

## Requirements

### Requirement: 在授权边界内写入 Candidate
Project Build Role MAY 在用户授权范围与权威依据下写入 Candidate Semantic Model 与临时 `build.md`。

#### Scenario: Project Build 需要编译语义
- **WHEN** Agent 已获得范围和依据授权
- **THEN** 它只在 Candidate 工作区写入构建制品

### Requirement: 呈现 Candidate 并请求确认
Project Build Role SHALL 向用户呈现 valid Candidate、完整审查信息与 review digest，并请求用户确认精确版本。

#### Scenario: Candidate 校验通过
- **WHEN** CLI 返回有效 digest
- **THEN** Agent 请求确认而不自行作出授权决定

### Requirement: 通过 CLI 推进确定性门禁
Project Build Role SHALL 使用 CLI 执行 Candidate 校验与经授权的 promotion，SHALL NOT 手工重做这些确定性操作。

#### Scenario: 用户确认当前 Digest
- **WHEN** Agent 获得精确版本授权
- **THEN** 它调用 CLI promotion
