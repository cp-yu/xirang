---
entity: element-declaration
identity: neovim
kind: element
parent: interaction-surfaces
title: Neovim
definition: Neovim 是面向 Xirang 用户的编辑器内文本交互界面，独立建模以承载在 Neovim 中审阅活动 Change 的交互职责。它包含 Change Delta 文件的模型前后对比、Change Plan 阅读及返回源文件编辑的导航；不负责 Semantic Delta 编译、模型持久化或 Web 的图形化浏览，也不构成规范性语义来源。它与提供确定性操作的 CLI、提供浏览器可视化浏览的 Web 相区别。
---

## Specification

### Section: 浏览 Change 内容

Neovim SHALL 为一个活动 Change 提供独立审阅 tab 与不影响全局 quickfix 列表的左侧文件列表。列表 SHALL 按 Delta 分区分组且可展开，列出 Change 中实际存在的全部 Delta 文件，并列出实际存在的 `proposal.md`、`design.md` 与 `tasks.md`。用户 SHALL 可通过 `<Tab>` 与 `<S-Tab>` 在列表条目间切换。

- Delta 文件按 `elements/`、`metamodel/`、`relationships/` 与 `views/` 分组。
- Plan 文件作为 Change 专属条目呈现，不混入全局 quickfix 或 Change 之外的内容。

### Section: 对比 Semantic Delta 对应的完整模型内容

Neovim SHALL 将 Delta 文件的模型对比只读呈现为左右两栏：左侧是当前 Semantic Model 对应的完整内容，右侧是应用整个 Change 后 Expected Semantic Model 对应的完整内容，并自动执行文本 diff。两侧 SHALL 使用一致的展示规范化。Delta 文件自身的差量内容 SHALL NOT 被误作完整目标模型内容。Plan 文件 SHALL 单栏只读呈现。

- Relationship Delta 文件与其它 Delta 文件使用相同对比方式；关系文件包含多条操作时，两侧呈现对应的完整关系容器。
- ADDED 对象的当前侧为空，REMOVED 对象的目标侧为空。
- 临时对比内容 SHALL 只用于只读呈现，不接受写入。

### Section: 定位源文件并刷新审阅

用户 SHALL 能从审阅条目跳转至对应的真实 Change 源文件编辑。Change 源文件保存或当前 Semantic Model 变化后，Neovim SHALL 自动重新取得审阅投影并更新文件列表与对比内容。首次打开时 Change 无效，Neovim SHALL 不创建审阅 tab，仅在消息区域提示无效；已打开的审阅在重新计算发现无效时 SHALL 撤下旧对比并提示无效，不得继续显示过期结果。

- 跳转编辑的目标是 Change 中对应的真实 Delta 或 Plan 文件，而非临时展示内容。
- 当前 Change 或模型发生变化后，较早开始的异步投影结果 SHALL NOT 覆盖更新的结果。
