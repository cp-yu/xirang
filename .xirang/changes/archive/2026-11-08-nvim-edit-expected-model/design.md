## Context

Neovim 当前通过 `xirang show <change> --review --json` 取得 Delta 源文件对应的完整 Current 与 Expected 模型文件文本，在内存缓冲区显示并由 `diffthis` 计算行差异。CLI 的 JSON 目前按源文件列出条目，但条目各自携带相同模型文件文本，Neovim 再做文本去重。右侧 Expected 文本已可编辑并在会话内保留草稿，但没有结构化写回接口。

完整 Expected 文件包含未变更内容，适合用户微调；它不是 Delta 文件格式，不能直接覆盖 Delta。当前 Change Delta 的语义粒度已支持 Element Declaration 与 Section entries，因此 CLI 可将支持的目标态差异重新编译成这些 entries。

## Goals / Non-Goals

**Goals:**

- 让 CLI 直接返回按 Delta 源文件聚合的完整前后模型文本，使一个源文件只产生一个文件列表项和一份左右文档。
- 提供 CLI 结构化写回操作，由 Neovim 传递完整右侧文本，由 CLI 更新对应 Delta。
- 只写回 Element `definition` 与 Contract Sections 的变化；忽略其它字段并将忽略项反馈给 Neovim。
- 保存成功后刷新现有审阅视图且保留焦点与位置；失败时保留草稿。

**Non-Goals:**

- 不允许编辑左侧 Current Semantic Model，不直接修改 Formal Semantic Model。
- 不把完整 Expected 模型文本直接写入 Delta 文件，不创建 Neovim `/tmp` 投影文件。
- 不支持通过该入口修改 identity、title、kind、parent、Metamodel、Relationship 或 Authored View 语义。
- 不执行并发版本比较或冲突拒绝；最后一次成功写入生效。
- 不改变 Change Formation、Semantic Delta identity 规则或当前 Change 的源文件导航能力。

## Decisions

1. **CLI 负责投影聚合与 Delta 转换。** `show --review --json` 对每个 Delta 源文件返回一份完整 `before` / `after` 文档及该源文件关联的 entity、identity、operation 列表。Neovim 移除逐条 before/after 文本去重，只按源文件显示并交给 `diffthis`。两份完整文件文本保留同一文件中未变更 Sections 和其它上下文。

2. **使用独立写回操作，输入完整目标文本。** 新增 `xirang delta writeback <change> --source <source-path> --json`，从 stdin 读取所选源文件对应的完整 Expected Semantic Model 文本。`--source` 只能选择该活动 Change 的审阅投影返回的 Delta 源文件；CLI 使用 Node.js path APIs 与 containment 校验定位源文件，不接受目录逃逸或符号链接路径。JSON 结果包含写回状态、诊断和 `ignoredChanges`，供 Neovim 更新视图和显示 status bar 提示。

3. **以 Formal Model 为 Delta 比较基准，保留已有目标字段。** CLI 先编译当前 Change，取得当前 Formal Model 与 Expected Model。对 Element 单元，提交文本中的 `definition` 与 Sections 是可写字段；Declaration 的 `identity`、`title`、`kind`、`parent` 等使用当前 Expected Model 的值，不接受编辑器覆盖。CLI 将合成后的目标 Declaration 与 Formal Declaration 比较：Definition 或其它既有 Declaration Delta 仍有差异时写入完整 `MODIFIED` target；完全回到 Formal 值时移除该 Declaration Entry。Sections 按 Section identity 与 Formal Contract 比较，重建该 Element 的 Section Entries，同时保留源文件中的其它语义对象 entries。

4. **按 Section identity 推导操作。** 同名 Section 内容变化（包括 Acceptance Cases）产生 `MODIFIED`；新标题产生完整 `ADDED`；整节消失产生 `REMOVED`；标题改名产生旧标题 `REMOVED` 与新标题 `ADDED`。仅删除 Section 中的部分文本不构成 Section `REMOVED`。Section 操作始终由完整目标 Section 内容表达，不创建独立 Acceptance Case Entry。

5. **忽略未支持编辑但不丢弃同次支持修改。** CLI 比较提交内容与现有 Expected 文件，分离支持字段和不支持字段；只应用 `definition` 与 Sections 修改，返回被忽略字段清单。若仅有不支持编辑，Delta 不变并返回成功与忽略清单；若支持修改导致完整 Expected Model 或 Change 无效，则拒绝整次写回，原 Delta 文件保持不变。Neovim 展示忽略清单并在成功刷新后呈现实际已接受的目标态。

6. **完整校验后原子替换单个 Delta 源文件。** CLI 在内存中构造候选 Delta，使用现有 Delta parser、Change compiler 和 combined validator 校验完整活动 Change；错误时不触碰现有文件。通过后复用 Node.js 文件系统和模型事务中已有的同目录临时文件、替换及清理模式，仅替换所选 Delta 源文件；Formal Model 与其它 Change 文件不变。跨平台路径使用 `path.join`、`path.resolve`、`path.relative` 等 API，不拼接分隔符假设；Windows 路径和替换行为需测试覆盖。

7. **将 Neovim 内存缓冲区作为普通文本编辑载体。** 左侧 buffer 始终只读，右侧 Expected buffer 可编辑；保存事件把完整右侧文本通过 stdin 交给 CLI。Plan 仍单栏只读。CLI 错误时 Neovim 保留 buffer 草稿并呈现诊断；成功后重新请求 review projection，复用当前 tab 与 buffers，按 Delta source path 恢复焦点文件，恢复两侧焦点、光标和 viewport、列表展开状态与宽度，并将超出新文本长度的光标限制到有效位置。GUI 扩展与临时文件不参与保存。

替代方案“将投影原文写入对应 Delta 文件”被拒绝，因为一份完整模型文件可能承载多个独立 Delta entries，且文件记法与 Delta 目标态格式不同。替代方案“由 Neovim 解析 Markdown/YAML 并自行转换”被拒绝，因为语义解析、操作推导和完整 Change 校验属于 CLI 确定性边界。

## Risks / Trade-offs

- [编辑器文本中混合支持与不支持字段] → CLI 只应用允许的字段并返回明确忽略项；Neovim 在 status bar 呈现，不静默声称所有文本都已保存。
- [Section 解析、identity 或业务 Contract 校验失败] → 先完整校验候选 Change；失败不替换 Delta，Neovim 保留草稿与诊断。
- [最后写入覆盖较早写入] → 这是确认的最后写入生效策略；不提供版本冲突门禁。
- [Windows 路径与原子替换差异] → 使用平台适配路径 API 与既有替换工具，并将 Windows 行为纳入验证。
