---
operation: MODIFIED
entity: element-declaration
identity: workspace-init
kind: element
parent: workspace-init-update
title: "Workspace Init"
definition: "Workspace Init 是 setup 创建完整息壤工作区的能力。它创建或保留 .xirang durable core、model 四分区骨架、changes、references 及固定 Agent workflow 集合，支持跨平台和非交互使用；后续 Project Build 通过工作面指导衔接，不以初始化完成代替模型构建。Element Declaration 与 Contract 共用 elements 单元，不存在独立 Contract store。"
---

## MODIFIED Sections

### Section: Setup success guidance SHALL 暴露 Project Build

Setup 交付的工作面 SHALL 通过按需读取的工具适配指导暴露 Project Build invocation，不在无结果成功回执中重复整套 onboarding。指导 SHALL 使用当前工具的 xirang-build invocation，不引用退役 bootstrap workflow。

### Section: Setup output messaging

Setup SHALL 在无必要结果的成功操作后保持 stdout 为空，--json 同样适用；不得默认列出全部生成路径、工具名或成功摘要。真实警告与错误 SHALL 写入 stderr。用户显式请求的交互选择与帮助 SHALL 保留，成功静默不改变工作区和受管制品的实际创建职责。
