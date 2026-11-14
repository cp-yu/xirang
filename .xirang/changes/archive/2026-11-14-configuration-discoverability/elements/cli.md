---
entity: "element-declaration"
identity: "cli"
kind: "element"
parent: "interaction-surfaces"
title: "CLI"
definition: "CLI 是息壤的配置与确定性操作界面。它建立和维护息壤工作区、项目配置与所选 Agent 工具集成，提供模型与 Change 查询、状态管理、程序化校验、验证证据持久化及原子状态转换，并投影供 Agent 按需读取的工作指导、模板与 references。它负责可复现的操作和明确的结果与诊断，不替代用户授权或 Agent 的语义判断。"
---

## ADDED Sections

### Section: 配置发现与只读检查

CLI SHALL 从 setup 完成引导、顶层 help 及 config 命令提供项目配置入口；config 说明可独立于已初始化项目使用，config project 返回有效值，config check 详细检查并解释配置来源和作用范围。配置检查 SHALL 支持 JSON、聚合独立问题，错误返回 1，仅忽略字段警告返回 0；不修改文件，也不证明 Agent 已执行自然语言要求。

只有 setup 创建项目配置。update SHALL 按有版本的完整迁移链演进已有文件，最近 10 次迁移操作支持范围外提示旧 CLI 分段迁移；缺失/损坏/非法版本或迁移失败不修复、猜测或部分写回。成功迁移原子提交内容与版本，明确清单清理陈旧项并提示，保留仍适用用户内容。必要配置引导与迁移改动提示属于使用结果，不作为泛化成功装饰；stdout SHALL 交付请求数据，stderr SHALL 交付警告、错误及必要引导。

### Section: Semantic Delta 制品身份

CLI SHALL 以 semantic-delta 统一标识 semantic-model schema 的四分区语义差量制品；状态、依赖、模板映射、authoring help 与项目规则选择使用同一身份。help authoring semantic-delta SHALL 从该制品取得定义及模板，config project --artifact semantic-delta SHALL 取得 rules.semantic-delta；只读查询不改写模型、Change 或配置。
