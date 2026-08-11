---
operation: MODIFIED
entity: element-declaration
identity: arch-snapshot
kind: element
parent: deterministic-operations
title: Arch Snapshot
definition: Arch Snapshot 定义 `xirang arch snapshot` 的完整模型导出行为：一次性输出全部 Element Declarations 及其完整 Definitions、全部 Relationships 与 Metamodel Kinds（含定义），不含 Element Contract；它以 text、markdown 与 json 三格式服务于完整检查、调试和离线处理，只读取 Formal Semantic Model，不承担 Agent workflow 的默认模型认知加载职责。
---

## REMOVED Requirements

### Requirement: snapshot SHALL 供 Agent 作为模型总览注入
