---
element: cap.cli.init
---

# CLI Init Specification

## Purpose

The `opsx init` command SHALL create a complete OPSX directory structure in any project, enabling immediate adoption of OPSX conventions with support for multiple AI coding assistants.
## Requirements
### Requirement: OPSX Setup SHALL 创建可用的 formal skeleton
`opsx setup` SHALL 创建或保留 `.opsx` durable core、project configuration、versioned formal LikeC4 skeleton 和 empty Specs directory，且不得声称 Project Build 已完成。

#### Scenario: 新项目 setup
- **WHEN** project 中不存在 `.opsx/` workspace
- **THEN** setup SHALL 创建 `.opsx/config.yaml`、`.opsx/architecture/`、`.opsx/specs/`、`.opsx/changes/` 和 `.opsx/references/`
- **AND** SHALL 创建 `specification.c4`、`model.c4`、`relations.c4` 和 `views.c4`
- **AND** SHALL NOT 从 project evidence 推断 Candidate semantics

#### Scenario: Existing project setup
- **WHEN** `.opsx/` 已存在
- **THEN** setup SHALL 保留 existing formal Architecture、Specs、configuration 和 user content
- **AND** 仅在用户明确选择工具后刷新 managed Agent surfaces

### Requirement: OPSX Setup SHALL 安装固定 Agent workflow 集合
`opsx setup` 与 `opsx update` SHALL 安装 fixed workflow set：`propose`、`explore`、`apply`、`archive`、`build` 和 `snack`。Build workflow SHALL 使用 skill name 与 directory `opsx-build`，并 SHALL NOT 生成 slash-command artifacts。

#### Scenario: 安装 Build workflow
- **WHEN** configured tool 支持 skills
- **THEN** setup SHALL 生成 `opsx-build`
- **AND** SHALL NOT 生成 `opsx-bootstrap-arch`

### Requirement: OPSX Setup SHALL 支持跨平台与 non-interactive 运行
Setup SHALL 对所有 workspace paths 使用 Node.js path APIs，并 SHALL 提供显式 non-interactive tool selection。

#### Scenario: Windows setup
- **WHEN** setup 在 Windows、macOS 或 Linux 上运行
- **THEN** generated workspace paths 与 formal source content SHALL 等价
- **AND** filesystem operations SHALL 使用 path-aware APIs

#### Scenario: Non-interactive setup
- **WHEN** setup 在无 prompts 环境中运行
- **THEN** SHALL 要求显式 supported `--tools` value
- **AND** invalid values SHALL 返回 actionable diagnostics

## Why

Manual creation of OPSX structure is error-prone and creates adoption friction. A standardized init command ensures:
- Consistent structure across all projects
- Proper AI instruction files are always included
- Quick onboarding for new projects
- Clear conventions from the start
