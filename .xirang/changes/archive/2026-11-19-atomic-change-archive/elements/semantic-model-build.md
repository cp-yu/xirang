---
entity: element-declaration
identity: semantic-model-build
kind: element
parent: realization-process
title: Semantic Model Build
definition: Semantic Model Build 是 Realization 推进过程中构建或重建 Semantic Model 的过程。它在用户授权的探索范围与声明的权威依据下，由 Agent 编写完整的 Candidate Semantic Model，由 CLI 做只读确定性校验并给出 review digest，用户确认后由 CLI 原子提升为 Semantic Model 并保留必要 history；本过程不通过 Semantic Delta 演进模型，也不落实单次 Change 的项目改动。
---

## MODIFIED Sections

### Section: 从 legacy 文档恢复语义需 agent 选择归属

Semantic Model Build 从 legacy 文档或正式模型恢复仍适用的行为时，SHALL 由 Agent 确定每段内容归属于哪个 Element、哪个层级、哪个 Contract Section。内容归属是语义选择，需要 model 理解能力，不得由文件名称、标题匹配或程序化映射自动决定。

- **纯复制可直接做**

  - 恢复内容可直接复制且无需改写
  - Agent MAY 直接复制

- **非复制改写必须通过 subagent**

  - 恢复内容需要改写或词汇迁移（如 `spec` → `contract`、`architecture-delta.c4` → 四分区 Semantic Delta、`.opsx` → `.xirang`）
  - Agent SHALL 通过 subagent 完成（有 subagent 时）
  - SHALL 使用初始阶段用户选择的模型

- **已覆盖内容不重复添加**

  - Candidate 已有内容覆盖 legacy 文档的同义行为
  - Agent SHALL 跳过该内容

- **退役行为不复活**

  - legacy 文档包含已明确排除的退役行为（如 architecture-delta.c4 持久化、Spec store/registry/frontmatter、`xirang change/spec/diff` 命令组、独立 `xirang sync` 或 `--no-sync`、impact-sweeper、operation label 接受）
  - Agent SHALL NOT 将该行为写入 Candidate
  - SHALL 在 `build.md` 中记录 covered、added 与 retired 的 sources
