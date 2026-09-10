---
entity: element-declaration
identity: references-home
kind: element
parent: agent-workbench-projection
title: References Home
definition: References Home 定义内置 reference 物化到 `.xirang/references/` 目录的行为：唯一物理位置、`xirang-` 前缀所有权边界、文件名唯一与工具中立校验，以及 `git.commitMessage` 路径覆盖路由。
---
## MODIFIED Requirements

### Requirement: git.commitMessage 路径覆盖路由

项目配置 SHALL 支持可选的 `git.commitMessage.boundary`、`git.commitMessage.archive`、`git.commitMessage.merge` 字符串字段，取值为项目根相对 POSIX 路径，指向用户自有 commit message 模板；已配置时消费方 SHALL 读取用户文件，未配置时 SHALL 读取 `.xirang/references/` 下对应内置模板。

#### Scenario: 配置路径覆盖时读取用户模板

- **WHEN** config 包含 `git.commitMessage.archive` 且指向用户文件
- **AND** archive 流程需要生成归档制品 commit message
- **THEN** agent 指令 SHALL 路由到读取用户文件
- **AND** SHALL NOT 读取对应的内置模板

#### Scenario: 非法路径被拒绝并回退

- **WHEN** `git.commitMessage.merge` 为绝对路径、包含 `..` 上溯或使用反斜杠分隔
- **THEN** 配置加载 SHALL 输出 warning 指明非法路径
- **AND** SHALL 丢弃该字段并回退到内置模板路由

#### Scenario: 未配置时读取内置模板
- **WHEN** config 不含 `git.commitMessage.archive`
- **AND** archive 流程需要生成归档制品 commit message
- **THEN** agent 指令 SHALL 路由到读取 `.xirang/references/` 下对应内置模板

#### Scenario: boundary commit 模板路由
- **WHEN** agent 生成 semantic boundary commit message
- **THEN** agent SHALL 在生成前读取 `git.commitMessage.boundary` 指向的用户模板，未配置时读取 `.xirang/references/xirang-boundary-commit-message.md`
- **AND** 主 `SKILL.md` SHALL NOT 内联 boundary commit body 的格式规则

#### Scenario: agent 处理 merge message
- **WHEN** agent 后续 git 流程需要创建 merge 或 squash commit message
- **THEN** agent SHALL 在生成 message 前读取 `git.commitMessage.merge` 指向的用户模板，未配置时读取 `.xirang/references/xirang-merge-summary-message.md`
- **AND** SHALL NOT 使用 archive CLI 输出的推荐 message

#### Scenario: boundary 提交读取 boundary reference
- **WHEN** 生成 `xirang-archive-change` skill
- **THEN** 主 `SKILL.md` SHALL 要求 agent 在创建 semantic boundary commit 前读取 `git.commitMessage.boundary` 指向的模板，未配置时读取 `.xirang/references/xirang-boundary-commit-message.md`
- **AND** `.xirang/references/xirang-boundary-commit-message.md` SHALL 说明 boundary commit 的 subject、`## Why`、`## Changes` 与 `Implementation:` footer 格式及其信息来源

#### Scenario: boundary 覆盖路由到用户模板
- **WHEN** config 包含 `git.commitMessage.boundary: .xirang/references/my-boundary.md`
- **AND** 消费方流程需要生成 implementation boundary commit message
- **THEN** agent 指令 SHALL 路由到读取 `.xirang/references/my-boundary.md`
- **AND** SHALL NOT 读取对应的内置模板

#### Scenario: Windows 上路径行为一致
- **WHEN** 在 Windows 上解析 `git.commitMessage.*` 配置与物化 `.xirang/references/` 文件
- **THEN** 系统 SHALL 通过 Node.js path 工具构建实际文件路径
- **AND** 配置值与 skill 指令中的路径 SHALL 保持 POSIX 正斜杠形式
- **AND** 行为 SHALL 与 Unix 系统一致

#### Scenario: archive 制品提交读取 archive reference
- **WHEN** 生成 `xirang-archive-change` skill
- **THEN** 主 `SKILL.md` SHALL 要求 agent 在创建 Xirang/docs 归档制品 commit 前读取 `git.commitMessage.archive` 指向的模板，未配置时读取 `.xirang/references/xirang-archive-commit-message.md`
- **AND** `.xirang/references/xirang-archive-commit-message.md` SHALL 说明归档制品 commit 的 subject、`## Why` 与 `## Changes` 格式

#### Scenario: merge 步骤读取 merge summary reference
- **WHEN** 生成 `xirang-archive-change` skill
- **THEN** 主 `SKILL.md` SHALL 要求 agent 在创建 merge 或 squash commit message 前读取 `git.commitMessage.merge` 指向的模板，未配置时读取 `.xirang/references/xirang-merge-summary-message.md`
- **AND** `.xirang/references/xirang-merge-summary-message.md` SHALL 说明 merge summary 的 subject、`## Why` 与 `## Changes` 格式

#### Scenario: 主 skill 保留流程边界
- **WHEN** 生成 `xirang-archive-change` skill
- **THEN** 主 `SKILL.md` SHALL 保留 archive 流程、quality gate、sync、CLI archive、agent git 流程与 references 读取步骤
- **AND** 主 `SKILL.md` SHALL NOT 内联 commit message 格式的完整说明
