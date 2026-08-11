---
entity: element-declaration
identity: workspace-update
kind: element
parent: workspace-init-update
title: Workspace Update
definition: Workspace Update 定义 `xirang update` 刷新项目受管表面与迁移配置的行为：根据全局配置刷新 skills 指令、清理过时配置字段、迁移项目配置默认值、同步固定 workflow 集合、归档退役 workspace 并报告新检测工具。
---

## MODIFIED Requirements

### Requirement: Migrate project config defaults

`xirang update` SHALL 在现有项目中迁移项目配置默认值：物化缺失的 `decomposition.method: c4` 与其他功能性默认值（不覆盖用户值），并移除过时的 git 字段。

#### Scenario: 配置缺失时创建

- **WHEN** 项目包含 `.xirang/` 目录且 config 文件不存在
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 创建 `.xirang/config.yaml`
- **AND** 创建的文件 SHALL 包含 `schema`、`decomposition`、`optimization`、`apply` 与 `git` 默认节点
- **AND** `decomposition` SHALL 为 `{ method: c4 }`
- **AND** SHALL NOT 包含退役的 git 字段

#### Scenario: 添加缺失的嵌套默认值而不覆盖现有值

- **WHEN** config 包含部分用户值且缺少其他默认值
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 保留用户值并补齐缺失默认值
- **AND** 已存在 `decomposition.method` 或 `decomposition.skill` 时 SHALL NOT 添加另一分支

#### Scenario: 移除过时的 git 字段

- **WHEN** config 包含退役的 git 字段
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 移除这些过时字段
- **AND** SHALL NOT 将其值映射到任何新字段
- **AND** SHALL 保留其他用户 git 字段

#### Scenario: 迁移 config.yml 别名

- **WHEN** `.xirang/config.yaml` 不存在且 `.xirang/config.yml` 存在且有效
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 在该 `.xirang/config.yml` 中补齐 `decomposition.method: c4` 与其他缺失默认值
- **AND** SHALL NOT 创建第二个 `.xirang/config.yaml`

#### Scenario: 项目配置默认值迁移

- **WHEN** 项目 `.xirang/config.yaml` 缺少功能性默认值
- **THEN** 以 missing-only 方式补齐 `decomposition.method: c4` 与其他默认值
- **AND** SHALL NOT 覆盖用户已设置的值
- **AND** 删除陈旧的 `git.merge.messageFrom`, `git.autoCommit` 与 `commitMessage.convention` 节点
- **AND** 补齐新的 git 功能性默认结构

#### Scenario: Windows 上迁移项目配置路径

- **WHEN** `xirang update` 在 Windows 上迁移 `.xirang/config.yaml` 或 `.xirang/config.yml`
- **THEN** 命令 SHALL 使用 Node.js path 工具构建配置路径
- **AND** SHALL 添加与 Unix 系统相同的 `decomposition.method: c4` 默认值
- **AND** SHALL 移除过时 git 字段并添加其他新默认值

#### Scenario: 添加缺失的顶层默认值

- **WHEN** `.xirang/config.yaml` 存在，包含有效 YAML 对象内容，但缺少 `decomposition`、`optimization`、`apply` 和 `git`
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 添加 `decomposition.method: c4`
- **AND** 命令 SHALL 添加 `optimization` 默认节点
- **AND** 命令 SHALL 添加 `apply` 默认节点
- **AND** 命令 SHALL 添加 `git` 默认节点
- **AND** 命令 SHALL 保留现有字段如 `schema`、`docLanguage`、`context` 和 `rules`
- **AND** 命令 SHALL 保留插入默认值之外的用户值

#### Scenario: 跳过无效配置而不阻塞工具刷新

- **WHEN** `.xirang/config.yaml` 包含无效 YAML 或非对象 YAML 文档
- **AND** 用户运行 `xirang update`
- **THEN** 命令 SHALL 保持该配置文件不变
- **AND** 命令 SHALL 警告项目配置默认值迁移被跳过
- **AND** 命令 SHALL 继续进行已配置工具的 artifact 刷新
