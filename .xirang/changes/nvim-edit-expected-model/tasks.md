## Goals

- [x] G1: 按 Delta 源文件提供唯一、完整的审阅前后文
  - Contract: `cli` / Section "提供 Neovim Change 审阅投影"
  - Verify: 同一源文件含多个 Entries 时投影只含一份完整 before/after 文档，未变更 Section 仍可见，Relationship 容器保持完整。

- [x] G2: 将支持的目标文本微调安全地编译为 Change Delta
  - Contract: `cli` / Section "写回 Neovim 的目标模型微调"
  - Verify: Definition 与 Section 的修改、增删和改名得到对应 Delta 操作；不支持字段被忽略并报告；无效目标不改变 Delta；Windows 下源路径解析与 containment 结果保持一致。

- [x] G3: 通过 Neovim 保存目标模型微调并保留失败草稿
  - Contract: `neovim` / Section "保存 Expected Semantic Model 微调"
  - Verify: 左侧及 Plan 不可编辑，右侧保存委托 CLI；支持内容写回、不支持字段得到提示，CLI 拒绝无效目标时右侧草稿仍保留。

- [x] G4: 刷新审阅时保持用户当前上下文
  - Contract: `neovim` / Section "定位源文件并刷新审阅"
  - Verify: 保存成功后最新投影可见且当前文件、焦点、光标、视口与列表状态恢复；越界光标落在有效位置。

## Required Corrections
