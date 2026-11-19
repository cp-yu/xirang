---
entity: element-declaration
identity: quality-cli-gate
kind: element
parent: quality
title: Quality CLI Gate
definition: Quality CLI Gate 是 Quality 的确定性接口与门禁，独立负责单一记录中的 Review、Opt 处置及 Seal，校验 commit identity、共享写入序号、变更交付后的审查关联和失败状态。它提供状态诊断与 Archive Seal commit 检查；不执行测试、不比较工作区、不修改任务、不评价优化价值或选择 Review 范围。
---

## MODIFIED Sections

### Section: 协议说明的单一来源与投影

系统 SHALL 从实现使用的同一批协议常量和字段定义生成 Quality help 及 Apply 的 Quality 执行 references，覆盖 Review opinion、Opt disposition、Seal、commit 关联、最小合法 JSON 示例、CAS revision 和失败诊断。不维护平行手写 schema 或旧方向指令；CLI 只校验 JSON 结构、Git commit identity、声明的流程条件及关联，不运行测试或评分自然语言充分性。

Archive 工作面 SHALL NOT 投影 Apply 专属的 Quality 执行或恢复 references。默认交付时，Archive SHALL 仅通过归档 CLI 消费已记录的有效 Seal；Seal 被拒绝时转达具体诊断并交回 Apply，不在 Archive 中执行或恢复 Quality。
