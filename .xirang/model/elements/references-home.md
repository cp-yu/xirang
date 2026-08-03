---
entity: element-declaration
identity: references-home
kind: element
parent: agent-workbench-projection
title: References Home
definition: References Home 定义内置 reference 物化到 `.xirang/references/` 目录的行为：唯一物理位置、`xirang-` 前缀所有权边界、文件名唯一与工具中立校验，以及 `git.commitMessage` 路径覆盖路由。
---

## Requirements

### Requirement: 内置 reference 物化到 .xirang/references 目录

系统 SHALL 将全部 skill reference 文件以受管前缀命名物化到项目级 `.xirang/references/` 目录，作为唯一物理位置；各工具 skill 目录 SHALL NOT 再包含 `references/` 子目录。生成的 SKILL.md 中对该目录的引用 SHALL 附带显式 project-root 标记。

#### Scenario: update 物化全部内置 reference

- **WHEN** 用户在已配置工具的项目中运行 `xirang update`
- **THEN** `.xirang/references/` SHALL 包含全部模板声明的 reference 文件，文件名为受管前缀形式
- **AND** 每个文件内容 SHALL 与对应模板常量一致
- **AND** 各工具 skill 目录 SHALL NOT 包含 `references/` 子目录

#### Scenario: skill 指令引用项目级路径

- **WHEN** 读取生成的 skill 中对 reference 的引用
- **THEN** 引用路径 SHALL 为 `.xirang/references/xirang-<name>.md` 形式
- **AND** SHALL NOT 引用 skill 目录相对的 `references/<name>.md` 路径

#### Scenario: 内联引用附带 project-root 标记

- **WHEN** 生成的 skill 指令内联引用某个 `.xirang/references/xirang-<name>.md` 文件
- **THEN** 引用 SHALL 以 `project-root file` 前缀标注该文件位于项目根
- **AND** SHALL NOT 按工具 skill 目录相对路径解析该引用

#### Scenario: update 清理 skill 目录残留 references

- **WHEN** 项目中存在旧布局生成的 skill 目录内 references 残留
- **AND** 用户运行 `xirang update`
- **THEN** 系统 SHALL 按生成清单显式删除这些受管残留
- **AND** SHALL NOT 删除生成清单之外的用户文件

### Requirement: xirang 前缀作为 update 写入所有权边界

`xirang update` 对 `.xirang/references/` 目录 SHALL 只逐文件覆盖生成清单内的受管前缀文件，SHALL NOT 执行目录级删除，SHALL NOT 触碰任何非受管前缀文件。

#### Scenario: 用户自定义模板在 update 后幸存

- **WHEN** `.xirang/references/` 中存在用户创建的非受管文件
- **AND** 用户运行 `xirang update`
- **THEN** 用户文件 SHALL 原样保留
- **AND** 受管前缀文件 SHALL 被覆盖为最新模板内容

#### Scenario: 用户改动的受管文件被覆盖

- **WHEN** 用户手动修改了受管 reference 文件
- **AND** 用户运行 `xirang update`
- **THEN** 该文件 SHALL 被覆盖为最新模板内容

### Requirement: reference 生成校验文件名唯一与工具中立

生成管线 SHALL 在写入前校验全部 reference 文件名全局唯一，并校验 reference 内容工具中立；任一校验失败 SHALL 抛出带可定位信息的错误且不写入。

#### Scenario: 文件名冲突时生成失败

- **WHEN** 两个 skill 模板声明了相同的 reference 文件名
- **THEN** 生成 SHALL 抛出错误并指明冲突的文件名与来源 skill
- **AND** SHALL NOT 写入任何 reference 文件

#### Scenario: 含工具特定语法的内容生成失败

- **WHEN** 某个 reference 模板内容包含需要 per-tool 转换的调用语法
- **THEN** 生成 SHALL 抛出错误并指明违规的 reference 与匹配内容
- **AND** SHALL NOT 写入该 reference 文件

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
- **THEN** 主 `SKILL.md` SHALL 保留 archive 流程、verify gate、sync、CLI archive、agent git 流程与 references 读取步骤
- **AND** 主 `SKILL.md` SHALL NOT 内联 commit message 格式的完整说明
