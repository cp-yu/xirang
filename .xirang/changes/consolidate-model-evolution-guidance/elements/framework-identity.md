---
entity: element-declaration
identity: framework-identity
kind: element
parent: semantic-objects
title: "Framework Identity"
definition: "Framework Identity 定义息壤开发框架的统一产品身份：唯一 `xirang` CLI 可执行入口、隐藏 `.xirang` durable workspace 与无兼容层合同。它是项目级身份不变量，可直接在 Project Root 下独立演进，不依赖实现结构。"
---

## ADDED Sections

### Section: CLI 向后兼容边界

息壤 CLI 的版本演进 MAY 直接改变既有用法，SHALL NOT 承诺旧版本用法在新版本中继续可用；不得仅因旧用法存在就要求 CLI 提供兼容层。升级后的适配由用户与 Agent 协作完成，CLI 不承担为旧用法提供兼容支持的义务。此边界不要求每次更新都破坏兼容性，也不撤销跨平台路径正确性和用户文件所有权保护。

- **不兼容入口退役**：新版本不再提供旧入口时，用户与 Agent 处理既有工作区的适配；CLI 不必为该旧入口提供别名或自动迁移工具。
