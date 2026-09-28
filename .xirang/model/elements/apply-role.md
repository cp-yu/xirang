---
entity: element-declaration
identity: apply-role
kind: element
parent: agent
title: Apply Role
definition: Apply 是 Agent 落实 Change 所描述项目改动的工作身份。它以 Expected Semantic Model 为目标，结合 Change Plan 与当前项目状态修改项目；在存在执行安排时按安排推进，并处理 Verify 返回的 Required Corrections 与已确认优化事项。
---

## Specification

### Section: 写入项目实现
Apply Role SHALL 在 Change Implementation 范围内修改项目文件。

- **Apply 识别待落实改动**
  - 当前状态不符合 Expected Semantic Model
  - Agent 写入实现所需修改

### Section: 接收 Verify 返回事项
Apply Role SHALL 接收 Required Corrections 与已确认优化事项，并再次执行 Apply。

- **Verify 返回工作**
  - 当前状态需要修正或优化
  - Agent 将事项带回写入活动

### Section: 交付状态与证据
Apply Role SHALL 将 Apply 产出的项目状态与可复现证据交付给 Verify。

- **一轮写入完成**
  - Agent 完成当前实现工作
  - 它组织独立 Review
