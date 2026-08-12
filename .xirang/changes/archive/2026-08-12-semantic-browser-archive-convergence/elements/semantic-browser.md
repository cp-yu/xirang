---
entity: element-declaration
identity: semantic-browser
kind: element
parent: interaction-surfaces
title: Semantic Browser
definition: Semantic Browser 是以 Views 可视化浏览项目语义的 Interaction Surface。它独立建模以提供面向用户的层级浏览与差异审查，包含 Semantic Model、active Candidate 与 active Changes 派生视角中的 Metamodel、Elements、Element Contracts、Relationships 与 Authored Views；不负责规范语义持久化、Candidate promotion 或 Change Closure。
---

## MODIFIED Requirements

### Requirement: 原子刷新基础 LikeC4 缓存

Semantic Browser 服务端 SHALL 在受管 Semantic Model、Authored View、Relationship、Metamodel、Contract、Candidate 或活动 Change source 变化时合并连续事件，依据显式生成文件清单完整重建基础 `.cache-likec4` 内容，并在临时目录校验成功后以保留 live 目录身份的方式原子发布：每个生成文件先写入 live 目录内的同目录临时文件再 rename 覆盖，SHALL NOT 整体 rename 或删除被监听的 live 目录；发布后失效旧 fingerprint 对应的 runtime projections。发布失败时 SHALL 从 last-known-good 备份恢复 live 内容、发布结构化 diagnostics，并在源修复后自动重试；恢复也失败时 SHALL 保留备份目录并报告包含发布与恢复错误的复合失败。

#### Scenario: 模型变化后刷新 Browser

- **WHEN** 一个受管模型 source 发生变化且完整缓存重建成功
- **THEN** 服务端原子替换基础缓存、重建 manifest、失效旧 projections 并发送一次 HMR 更新
- **AND** Browser 无需重启即可呈现新模型

#### Scenario: 发布保持被监听目录稳定

- **WHEN** 服务端在递归 watcher 监听 live 目录期间重建基础缓存
- **THEN** 发布以 live 目录内逐文件临时文件 rename 完成，SHALL NOT 整体 rename 或删除被监听目录
- **AND** watcher 不因 backup 目录被清理而报未处理错误

#### Scenario: 重建失败

- **WHEN** 新 source 无法解析、验证或生成完整 LikeC4 cache
- **THEN** 当前 last-known-good cache 保持可用
- **AND** Browser 显示结构化 diagnostics，且不读取半成品

#### Scenario: 跨平台处理缓存路径

- **WHEN** watcher 在 Windows、macOS 或 Linux 返回 source path
- **THEN** 服务端使用 Node.js path API 与 normalized project-relative key 定位显式缓存依赖
- **AND** 不假设路径分隔符或通过模糊 pattern 删除生成文件

## ADDED Requirements

### Requirement: 活动 Change 生命周期变化时收敛状态

当当前选中的活动 Change 被归档或移除时，Semantic Browser SHALL 检测其生命周期变化并收敛状态：服务端 SHALL 将活动 Change 目录自身事件、`changes/archive` 侧事件以及缺少 filename 的 watcher 事件视为重建 manifest 的信号，使该 Change 不再出现在 Change Selection；Browser 收到不含该 Change 的 manifest 后 SHALL 清空 Change Selection、将 Presentation Mode 回到 `complete`，并清除来自被移除 Change projection 的 expanded set，旧 Change 的 diff 状态与投影 SHALL NOT 残留。

#### Scenario: 查看中的 Change 被归档

- **WHEN** 用户正在浏览一个活动 Change 且该 Change 被移到 `changes/archive/`
- **THEN** Change Selection 移除该 Change，Presentation Mode 回到 `complete`
- **AND** 不残留该 Change 的 diff overlay 或就地展开状态

#### Scenario: 活动 Change 目录被移除

- **WHEN** 一个活动 Change 目录被整体移动或删除
- **THEN** 服务端重建 manifest 且该 Change 不再可选
- **AND** Browser 收敛到无 Change 状态

#### Scenario: 缺少 filename 的 watcher 事件

- **WHEN** watcher 返回缺少 filename 的事件或 `changes/archive` 侧事件
- **THEN** 服务端触发一次完整重建，使活动 Change 列表与磁盘当前状态一致
