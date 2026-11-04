---
operation: MODIFIED
entity: element-declaration
identity: archive-quality-gate
kind: element
parent: change-closure
title: Archive Quality Gate
definition: Archive Quality Gate 是 Change Closure 在归档前消费 Quality Seal 的门禁，只确认新 Quality JSON 中 Seal commit 对象仍存在。它不重新判断 Review/Opt 意见、不执行测试、不比较 HEAD 或工作区；归档移动、Sync、validation 与 task 门禁属于各自能力。
---

## REMOVED Sections

- 归档前必须具备新鲜的完整验证记录
- Freshness 基于显式验证证据判定

## MODIFIED Sections

### Section: Archive rerun 使用 quality 执行模型
Archive SHALL 对 Quality gate 缺失或无效的 Seal 给出具体诊断并交回 Apply 处理，不建立 archive-only 审查或修复流程。Opt 未执行或中断不通过 Archive 自动推断为 skip 或已交付；Opt 的决定和意见由主 Agent 在 Seal 前处理。Archive Quality gate 不重跑测试、不重新评估 Review/Opt 自然语言、不比较当前工作区与 Seal commit。Unsupported old records SHALL 保留并报告，不读取或迁移。

### Section: Archive 与 Sync 双重门禁
`xirang archive` SHALL 在执行归档前校验 Quality Seal 与 Sync 状态。默认强制执行，`--no-verify` 仍提供显式用户授权绕过通道。

- **Quality 与 Sync 均通过**：Quality JSON 中存在 Seal 且其 commit object 可解析，Sync 已完成；系统 SHALL 继续 validation 与 task gates。
- **门禁不通过**：Seal 缺失/commit 不存在或 Sync 未完成时，系统 SHALL 输出门禁状态并以 exit 1 退出，不移动 Change directory。
- **显式授权绕过**：现有 `--no-verify` 确认与授权行为保持不变；绕过不生成 Seal 或质量证据。
- Quality gate SHALL NOT 比较工作区 clean、HEAD 或工作区内容与 Seal commit；Semantic Delta、validation 和 task gates 仍独立执行。
