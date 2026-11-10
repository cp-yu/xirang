---
entity: element-declaration
identity: workspace-update
kind: element
parent: workspace-init-update
title: "Workspace Update"
definition: "Workspace Update 定义 `xirang update` 刷新项目受管表面与迁移配置的行为：根据全局配置刷新 skills 指令、清理过时配置字段、迁移项目配置默认值、同步固定 workflow 集合、归档退役 workspace 并报告新检测工具。"
---

## MODIFIED Sections

### Section: Update Behavior

该命令 SHALL 根据全局配置刷新项目中的受管 skills 指令文件。

- **刷新现有工具制品**

  - 项目中已配置 AI 工具
  - 检测已安装的工具 skills 目录
  - 为检测到的每个工具重新生成固定 workflow skills
  - 成功无必要结果时静默，不重复列出刷新的工具
  - SHALL NOT refresh slash command workflow artifacts

- **清理过时配置字段**

  - 全局配置包含 `profile`、`workflows` 或 `delivery` 字段
  - 自动删除这些字段并保存清理后的配置
  - 在 stderr 报告具体被清理的过时字段，不重复输出开始与完成回执

### Section: Core Files Always Updated

update SHALL 通过共享 ArtifactSyncEngine 以最新模板整体替换已配置工具的受管 workflow skills，不管理或改写根级 AGENTS stub。成功且无必要结果时 SHALL 静默，不输出 Updated、版本或 Tools 汇总。

刷新需要重启 IDE 或当前 session 才生效时，SHALL 保留简短、具体的生效提示，不将重启必要性混入成功装饰。真实配置迁移警告进入 stderr；查询/交互请求与必要交付结果遵循统一通道。
