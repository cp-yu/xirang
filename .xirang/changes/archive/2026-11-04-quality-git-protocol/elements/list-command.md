---
entity: element-declaration
identity: list-command
kind: element
parent: deterministic-operations
title: List Command
definition: List Command 定义 xirang list 的行为：扫描活动 changes，统计任务完成度，并支持 --json（含 qualityStatus）、--long 与 --sort 输出；它只表达当前 active-change 表面，不提供 Contract 扫描或 Contract JSON listing。
---

## MODIFIED Sections

### Section: list --json 输出包含 quality 状态
`xirang list --json` SHALL 为每个 Change 包含 `qualityStatus` 字段，该字段只反映新 Quality JSON 与 Seal 状态，不反映代码新鲜度。

- **Seal 有效**：新 JSON 中存在 Seal 且其 Git commit object 可解析时，`qualityStatus` SHALL 为 `clean`。
- **记录存在但 Seal 不可用**：新 JSON 存在但缺少 Seal 或其 commit object 无法解析时，`qualityStatus` SHALL 为 `dirty`。
- **新记录不存在**：`.quality.json` 不存在时 `qualityStatus` SHALL 为 `MISSING`；旧 snapshot/log/evidence 不作为新协议记录。
- **不比较实现状态**：HEAD 或工作区内容与 Seal commit 不同、工作区非 clean，均不得单独改变 `qualityStatus`。
- **原 status 字段不变**：输出的 `status` 字段 SHALL 保持与原有逻辑一致（基于 task count）。
