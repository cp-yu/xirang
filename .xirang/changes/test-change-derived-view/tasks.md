## Goals

- [ ] G1: 确认本 Change 的 Semantic Delta 在 Change-derived View 中正确呈现四类 ADDED 条目
  - Contract: `test-entity` / Section "被 Change-derived View 正确识别"
  - Verify: `xirang validate --change test-change-derived-view --json` 返回 `valid: true`，entries 包含 element-declaration、element-kind、relationship-kind 与 relationship 四类实体的 ADDED 条目。

- [ ] G2: 确认伪代码形式的 Acceptance Case 正文被接受
  - Contract: `test-entity` / Section "支持伪代码形式的 Acceptance Case 正文"
  - Verify: `xirang validate --change test-change-derived-view --json` 返回 `valid: true`，伪代码正文（如 `if a[j] < a[i]: swap(a[i], a[j])`）不产生正文格式错误。
