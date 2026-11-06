---
entity: element-declaration
identity: neovim
kind: element
parent: interaction-surfaces
title: Neovim
definition: Neovim 是面向 Xirang 用户的编辑器内文本交互界面，独立建模以承载在 Neovim 中审阅活动 Change 的交互职责。它包含 Change Delta 文件的模型前后对比、Change Plan 阅读及返回源文件编辑的导航；不负责 Semantic Delta 编译、模型持久化或 Web 的图形化浏览，也不构成规范性语义来源。它与提供确定性操作的 CLI、提供浏览器可视化浏览的 Web 相区别。
---

## MODIFIED Sections

### Section: 对比 Semantic Delta 对应的完整模型内容

Neovim SHALL 将 Delta 源文件对应的模型内容呈现为左右两栏：左侧是当前 Semantic Model 对应的完整内容且只读，右侧是应用整个 Change 后 Expected Semantic Model 对应的完整内容且可编辑，并自动执行文本 diff。两侧 SHALL 使用一致的展示规范化。Delta 文件自身的差量内容 SHALL NOT 被误作完整目标模型内容。Plan 文件 SHALL 单栏只读呈现。

- Relationship Delta 文件与其它 Delta 文件使用相同对比方式；关系文件包含多条操作时，两侧呈现对应的完整关系容器。
- ADDED 对象的当前侧为空，REMOVED 对象的目标侧为空。
- Expected Semantic Model 使用 Neovim 内存缓冲区承载编辑；临时投影不直接覆盖 Delta 源文件，Formal Semantic Model 不接受写入。

### Section: 定位源文件并刷新审阅

用户 SHALL 能从审阅条目跳转至对应的真实 Change 源文件编辑。Change 源文件保存或当前 Semantic Model 变化后，Neovim SHALL 自动重新取得审阅投影并更新文件列表与对比内容。通过右侧 Expected Semantic Model 保存成功后，Neovim SHALL 在现有审阅 tab 内刷新投影，并保留当前 Delta 源文件、焦点窗格、左右光标与视口位置、列表展开状态及宽度；重新呈现后的光标位置 SHALL 限制在有效范围内。首次打开时 Change 无效，Neovim SHALL 不创建审阅 tab，仅在消息区域提示无效；已打开的审阅在重新计算发现无效时 SHALL 撤下旧对比并提示无效，不得继续显示过期结果。

- 跳转编辑的目标是 Change 中对应的真实 Delta 或 Plan 文件，而非临时展示内容。
- 当前 Change 或模型发生变化后，较早开始的异步投影结果 SHALL NOT 覆盖更新的结果。
- 写回失败时，Neovim 保留右侧编辑草稿，不以旧投影覆盖它。

## ADDED Sections

### Section: 保存 Expected Semantic Model 微调

用户 SHALL 能通过保存右侧完整 Expected Semantic Model 文本请求 CLI 写回当前 Delta 源文件。Neovim SHALL 只允许编辑右侧目标模型，左侧当前模型与 Plan 保持只读。CLI 报告被忽略的不支持字段时，Neovim SHALL 在 status bar 提示用户；受支持的 `definition` 与 Contract Section 修改仍 SHALL 正常保存。写回失败时 SHALL 保留草稿供继续编辑或重试。

- **修改 Definition**

  - 用户修改可见 Element 的 `definition` 并保存
  - CLI 将完整目标 Definition 写回对应的 Element Declaration `MODIFIED` Entry

- **微调或删除 Section 内容**

  - 用户修改 Section 正文、Acceptance Cases 或删除 Section 中部分内容并保存
  - CLI 将该 Section 写为 `MODIFIED`

- **增加、删除或改名 Section**

  - 用户新增完整 Section、删除整个 Section，或修改现有 Section 标题并保存
  - 新 Section 写为 `ADDED`，删除的 Section 写为 `REMOVED`，标题修改写为旧 Section `REMOVED` 与新标题 Section `ADDED`

- **混合支持与不支持编辑**

  - 用户同时修改 `definition` 或 Contract Sections，以及 `identity`、`title`、`kind`、`parent` 或其它不支持内容
  - CLI 保存支持的修改，忽略其它修改
  - Neovim 在 status bar 提示被忽略的修改，成功刷新后显示 CLI 接受的目标内容

- **保存无效目标**

  - CLI 拒绝写回并返回错误诊断
  - Neovim 保留用户的右侧草稿，左侧仍不可编辑
