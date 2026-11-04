---
operation: MODIFIED
entity: element-declaration
identity: workflow-templates
kind: element
parent: agent-workbench-projection
title: Workflow Templates
definition: Workflow Templates 定义 workflow 模板的生成契约：模板不内联 subagent 角色定义、Quality 模板对 subagent 使用明确 delegation 指令、Review/可选 Opt/Seal 状态投影、统一 CLI 查询接口、固定 workflow 集合、内部 subagent 引用替换与制品定义先行写作。
---

## MODIFIED Sections

### Section: 模板不内联 subagent 角色定义
quality/apply/archive 模板 SHALL NOT 在模板 body 中内联 reviewer 或 optimizer 的完整角色定义、验证协议、判断标准或输出格式。这些内容归对应的 generated internal subagent artifact 所有。模板 SHALL 保留 orchestration 职责描述：依据 Git commit 组装证据、subagent delegation、opinion payload 校验、Quality JSON 持久化、主 Agent 处置与 Seal；MUST NOT 要求 Quality checkpoint、自动 task writeback 或 freshness manifest。

## REMOVED Sections

- checkpoint state machine 使用表格格式

## ADDED Sections

### Section: Quality flow 使用 Review、Opt 与 Seal 表格
Quality workflow template SHALL 以表格呈现以下门槛：每个 Change 先取得通过的独立基线 Review；之后由主 Agent 决定执行 Opt 或记录不做 Opt 的理由；Seal 绑定 commit 并记录主 Agent 的可运行及测试预期声明。Opinion 与 commit identity 由 CLI 关联，代码恢复由 Git 承载，Archive 只确认 Seal commit 对象存在。
