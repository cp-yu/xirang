## Goals

- [x] G1: 整个 CLI 按请求交付必要结果并分离诊断
  - Contract: `cli` / Section "统一结果与诊断通道"
  - Verify: 无必要结果的成功写入真实改变状态且两条输出流为空，默认与 JSON 模式一致；有效空查询仍有数据，新身份、Quality revision、Candidate digest、导出位置、脚本和反馈结果不丢失；有数据伴随警告时分流，失败非零退出且诊断可定位；非交互调用无进度或成功装饰，初始化、更新、同步、归档及辅助命令遵循同一边界。

- [x] G2: 按需查询当前配置与 Change 推进状态
  - Contract: `cli` / Section "提供一致可复现的操作"
  - Verify: 配置选择保持完整字段原义和匹配制品规则，合法未配置与非法路径可区分，磁盘修改后的下一次查询立即生效；缺失制品、无效目标清单、未完成目标和各 Quality 门禁分别产生正确状态及缺口，不回传任务正文；Quality 默认给当前结论与 revision，显式历史保留完整意见，CAS 和同类失败解决规则不变。

- [x] G3: 以文件名维护 Record 并保留覆盖交接保护
  - Contract: `design-record-operations` / Section "门禁化交接确认来源"
  - Verify: 文件名可用于完整及条目选择读取、局部编辑与交接，无需外部 sourceVersion；未提及内容保持，显式差异正确区分修改、补充与撤回；coverage 后来源仍存在，来源内容或目标模型变化使 consume 拒绝，只改 Plan 不使模型指纹失效；成功按先保存原始字节、验证、删除来源的顺序交接，失败及冲突快照保留来源，同字节快照可重验恢复。Windows、macOS 与 Linux 的文件名寻址及受控路径行为一致；Windows CI 提供实际路径行为证据，路径逃逸或 symlink 被拒绝而不写目标。

- [x] G4: 完整校验默认仅报告问题，详情显式展开
  - Contract: `validation-commands` / Section "Change validation effective preview"
  - Verify: 未请求预览时仍执行全部适用校验，成功无问题静默，错误及严格模式 warning 正确影响退出码；显式预览给出真实完整范围的 concise entries，不生成持久展示制品；Candidate 默认保留必要 digest，详情能区分 Formal 缺失和有效比较，读操作不改字节且 digest 绑定规则保持。

- [x] G5: 静态指导与动态查询协同减少工作流读取
  - Contract: `workflow-templates` / Section "按消费目的控制上下文读取"
  - Verify: 受管工作面按需交付单一制品指导与模板，动态配置、状态和 Quality 由对应入口提供，instructions 活跃入口及调用消失；Agent Record 操作仍要求 CLI，完整读取触发条件及交接门禁保留，普通读取不固定三连；适合阅读的紧凑文本保留请求语义，程序字段消费正常。相同样本的单次及累计 stdout、stderr、实际辅助文件读取字节可比较，结果说明省去内容和必要信息去向，不以迁移文件或未经测量的 token 数声称收益。受管生成面按显式注册清单更新且保留用户文件；一次性构建、类型检查和生成一致性提供实际证据，不把未执行检查视为通过。

- [x] G6: Neovim 在精简 CLI 协议下可靠保存与审阅
  - Contract: `neovim` / Section "保存 Expected Semantic Model 微调"
  - Verify: 退出码 0 且 stdout 为空的保存正常刷新，混合支持与忽略修改仍提示 ignoredChanges 并显示 accepted 内容；失败从 stderr 取得具体诊断并保留草稿。Change 选择与完整前后模型、Plan 查询可用，异步旧响应不覆盖新结果，刷新保持现有视图状态。
