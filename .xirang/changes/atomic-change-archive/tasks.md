## Goals

- [x] G1: 统一默认交付与显式免 Seal 交付入口
  - Contract: `change-archive` / Section "Business Logic"
  - Verify: 默认缺少有效 Seal 不写入；quick 仍拒绝非法 Delta、尊重未完成任务的取消，仅对合法目标完成交付。互斥选项和已退役命令、选项不改变项目状态。
- [x] G2: 在同次调用内一致地更新模型并封存
  - Contract: `change-sync` / Section "Edge Cases and Exception Handling"
  - Verify: 目标已同步时不重复写入；基线过期或同 identity 的冲突拒绝交付。写入后移动失败恢复原模型及活动目录；成功后丢失回执只返回已有归档，不重复处理。
- [x] G3: 保留放弃的方案而不交付实现
  - Contract: `change-archive` / Section "Key Acceptance Cases"
  - Verify: 无 Seal、无任务或 Delta 不完整仍可放弃；已有 2/5 个目标勾选时先提示事实，取消保持活动，显式确认或 --yes 仅原样封存，不改动模型或实现，不执行 Git 提交、合并或清理。
- [x] G4: 在受管 Agent 工作面正确区分交付、放弃和只读预览
  - Contract: `archive-role` / Section "通过 CLI 编排 Closure"
  - Verify: 普通交付和 quick 均只需一个入口，后者不误报 Quality 通过；放弃不触发交付后的合并或清理；Snack 不再推荐拆分命令，Propose 不写模型。现行生成面与 CLI 帮助、补全不再引导使用退役协议。
- [x] G5: 在 Windows CI 与其他支持平台保持两种留档路径的结果一致
  - Contract: `change-archive` / Section "Key Acceptance Cases"
  - Verify: 默认与 quick 保留日期目录，放弃保留 abandoned 子目录，跨平台解析、返回与再次查找对应已有路径时均不重写原始制品或覆盖同名冲突目标。

## Required Corrections

- [x] [code_fix] 拒绝空 Section operation block 和 RENAMED 记法，非法 Delta 不得封存。
- [x] [code_fix] 有实际 Delta 但无正式模型时拒绝交付，不以 Delta 初始化模型。
- [x] [code_fix] 在实际文件系统上检测大小写别名引起的目标碰撞，冲突时保留两侧状态。
- [x] [code_fix] 交付失败且补偿也失败时，文本与 JSON 均保留原始故障和补偿故障。
- [x] [code_fix] JSON 交互归档的选择与确认不能污染机器可读回执。
- [x] [artifact_fix] 未指定放弃对象时，使用不读取 Quality 的选择流程并保留用户授权。
- [x] [code_fix] 补充回执写入失败后的事务边界证据，确认模型与归档不撤回且可再次读取。
- [x] [code_fix] 拒绝可被标准记法校验发现的空 Section 正文和重复 operation 标题。
- [x] [code_fix] 绑定实际归档的 Delta 输入快照，确认或移动期间输入变化时不交付。
- [x] [code_fix] 独占取得目标路径，拒绝其他归档在预检后先取得的同名位置。
- [x] [code_fix] 跨设备复制保留符号链接原始目标，失败恢复也采用相同规则。
- [x] [artifact_fix] 无名 quick 不依赖 Quality 列表，非 Git 项目不进入 Git 交接。
- [x] [code_fix] 默认交付的 Seal 失败保留具体诊断并指引回 Apply。
- [x] [code_fix] CLI 解析阶段拒绝互斥归档选项。
- [x] [code_fix] 验证 quick 拒绝确认时不写入实际 Delta，放弃时进度先于询问且不受 --yes 隐藏。
