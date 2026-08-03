---
entity: element-declaration
identity: workspace-init-update
kind: element
parent: project-tooling-configuration
title: 工作区初始化与更新
definition: 工作区初始化与更新是 CLI 中初始化和更新息壤工作区的能力。它通过 `xirang setup` 与 `xirang update` 创建或保留 `.xirang` durable workspace、安装固定 Agent workflow 集合、刷新受管 Agent surfaces，并维护配置默认值与退役 workspace 的迁移。
---

## Requirements

### Requirement: 初始化完整工作区

`xirang setup` SHALL 创建或保留 `.xirang` durable core、项目配置、formula Semantic Model skeleton 与 Agent workflow 集合，且不得声称 Project Build 已完成。

#### Scenario: 新项目 setup

- **WHEN** 项目不存在 `.xirang/` workspace
- **THEN** setup SHALL 创建 config、四分区模型骨架、changes 与 references，并安装固定 workflow 集合
- **AND** SHALL NOT 从项目证据推断 Candidate 语义

#### Scenario: 既有项目 setup

- **WHEN** `.xirang/` 已存在
- **THEN** setup SHALL 保留 existing formal source、配置与用户内容，并仅在用户明确选择工具后刷新 managed Agent surfaces

### Requirement: 安装固定 Agent Workflow 集合

`xirang setup` 与 `xirang update` SHALL 安装固定 workflow 集合：propose、explore、apply、archive、build 和 snack。

#### Scenario: 安装 Build workflow

- **WHEN** configured tool 支持 skills
- **THEN** setup SHALL 生成 `xirang-build`
- **AND** SHALL NOT 生成退役的 bootstrap workflow artifacts

### Requirement: 支持跨平台与 non-interactive 运行

Setup SHALL 对所有 workspace paths 使用 Node.js path APIs，并 SHALL 提供显式 non-interactive tool selection。

#### Scenario: Windows setup

- **WHEN** setup 在 Windows、macOS 或 Linux 上运行
- **THEN** generated workspace paths 与 formal source 内容等价，且 filesystem operations 使用 path-aware APIs

#### Scenario: Non-interactive setup

- **WHEN** setup 在无 prompts 环境中运行
- **THEN** SHALL 要求显式 supported `--tools` value，invalid values 返回可操作 diagnostics

### Requirement: 更新受管工作面

`xirang update` SHALL 根据全局配置刷新项目中的受管 skills 指令文件，SHALL NOT 刷新退役的 slash-command workflow artifacts。

#### Scenario: 刷新现有工具制品

- **WHEN** 项目中已配置 AI 工具
- **THEN** 检测已安装的工具 skills 目录并为每个检测到的工具重新生成固定 workflow skills

#### Scenario: 无变化时保持稳定

- **WHEN** installed skills 匹配固定 workflow 集合且所有模板为最新
- **THEN** update SHALL 显示 "Already up to date."

### Requirement: 迁移配置默认值

`xirang update` SHALL 以 missing-only 方式在 `.xirang/config.yaml` 或 `.xirang/config.yml` 中物化缺失的功能性默认值，且 SHALL NOT 覆盖用户已设置的值。

#### Scenario: 配置缺失时创建

- **WHEN** 项目没有 config 文件且用户运行 `xirang update`
- **THEN** 命令创建包含 `schema`、`optimization`、`apply` 与 `git` 默认节点的 config 文件
- **AND** 不写入退役的 git 字段（`git.autoCommit`、`commitMessage.convention` 等）

#### Scenario: 缺失嵌套默认值补齐

- **WHEN** config 包含部分用户值且缺少 `optimization.optRetries` 等默认值
- **THEN** 命令保留用户值并补齐缺失默认值

### Requirement: 清理退役工作区

当 update 或 setup 发现退役 workspace 时，SHALL 在用户确认后将其移动到显式 `.xirang/history/legacy-<timestamp>/` entry。

#### Scenario: Retired workspace cleanup

- **WHEN** 检测到退役 workspace 且用户确认 cleanup
- **THEN** 完整移动该 directory 并用 manifest 记录原始相对路径，runtime 不再读取旧 active path

#### Scenario: 用户拒绝 cleanup

- **WHEN** 用户拒绝 cleanup
- **THEN** setup/update 失败且不删除或部分移动退役 workspace
