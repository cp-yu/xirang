# xirang

## 0.2.7

### Patch Changes

- Explore/Propose 工作流提示词更新：Explore 设计循环要求主动理解意图/路线混合输入、澄清影响问题定义的关键缺口，以证据同等审视用户与自身方案，并按证据决定可行性实验（不再机械强制）；实验受阻或结果不明确时必须披露剩余疑点及其对决策影响。Propose 直接入口与成文自查要求补足目标、约束与语义就绪判断，不以确认替代可行性证据。
- Neovim 变更审阅支持目标模型微调写回：`xirang delta writeback <change> --source <path>` 从 stdin 将审阅投影中的 Expected Semantic Model 修改写回 Delta 源文件；补齐该命令的补全类型声明。
- Reviewer 委派调度指引集中化；Neovim 审阅修复差量条目归属、排队保存与写回正文细节。

## 0.2.6

### Minor Changes

- **BREAKING**：Quality Review 意见升级为 schemaVersion 4：`reviewId` 与自由文本 `scope` 退出，改用 `reviewKind`（`full-change`/`incremental`/`supplemental`）区分审查类别，意见绑定既有 Git commit；旧 schemaVersion 3 的 `.quality.json` 明确报不支持并保持原样，不迁移、不隐式导入。Seal 门禁仍要求最新 full-change Review 通过、无未解决失败与显式 Opt 处置。
- Reviewer 委派协议重写：Reviewer 从 checkout HEAD 自取审查目标、从 `.apply-isolation.json` 读取 `baseCommit`，按 baseCommit→HEAD 累计差异独立取证；调用方不再传目标 commit，委派输入错误或审查期间 HEAD 移动不产生意见，由主 Agent 修正后重新委派。主 Agent 在所需测试通过后按非冲突质量维度并行委派并汇总为一条意见。
- 解除 Reviewer 固定工具白名单：Claude/Pi/OpenCode/Codex 投影不再限制可用工具或硬性禁止编辑，只读责任保留在 Reviewer 指令中；Pi Reviewer 专属 Agent 声明后台运行以加载环境扩展，并由调用方等待完整结果后再汇总。

### Patch Changes

- Apply/Archive 指令、references 与生成面同步 reviewKind 语义；修复 Apply 模板 Step 3 引用路径投影；Reviewer 严格性测试改为直接校验生产生成的 Pi 指令而非本地模拟器。

## 0.2.5

### Patch Changes

- Propose 来源交接时序调整：审阅期间保持活动 Design Record，正式 `record coverage` 提前到用户接受最终 Change 之前；只有用户接受与当前覆盖结果对应的确切 Change 后才执行 `record consume`。consume 复核来源版本、目标指纹与结构，不重跑逐项覆盖，避免用户审阅报告后再修改时记录已被删除。
- Change 的 `record coverage` 在写入结果前将记录 `structure` 与 Expected Semantic Model 逐字段比对，结构不一致时拒绝且不替换已有结果；Candidate/Build 的结构门禁仍保持在 consume 执行。

## 0.2.4

### Minor Changes

- **BREAKING**：Quality 记录替换为单个 Git 跟踪的 JSON 文件（`.quality.json`）：仅保留 commit 绑定的 Review 意见、Opt 交付意见或显式 not_performed 处置、以及主 Agent 的 Seal 声明；`xirang quality` 只保留 `review/opt/seal/status` 子命令，0.2.3 的 delegation/verification/conclusion/checkpoint 命令不再存在。旧快照/日志/证据存储不读取、不迁移、不清理；Archive 仅校验 Seal 提交对象存在，不再比较工作区新鲜度。
- 新增 Neovim Change 审阅：`xirang show <change> --review --json` 提供只读投影（每个 Delta source 的当前/目标完整模型文本、ADDED/REMOVED 空侧、实际存在的 Plan 原文、valid 与 diagnostics）；仓库新增可复制的 `integrations/nvim` 插件，提供独立 tab、四分区分组列表、双栏只读 diff、Plan 单栏呈现、真实源文件跳转、保存与文件系统变更自动刷新及 generation 防乱序；Windows CI 安装 Neovim 并执行四个 headless 检查。

### Patch Changes

- Quality 平台修复：兼容符号链接路径前缀；修正存储边界后缀计算并按平台跳过 Windows 符号链接往返；移除破坏 Windows CI 的硬编码 /tmp 调试日志。

## 0.2.3

### Patch Changes

- 优化流程从方向循环改为委托式执行：主 Agent 判断累计交付与验证范围，统一 `quality review/delegation/verification/conclusion/checkpoint/status/seal` 完成门禁；Opt 在受委托范围内实施、运行真实本地测试并按时点保存，同委托恢复不换 ID；失败与放弃尝试保留原因、处理与恢复证据。显式重新验证（revalidation）建立新活动关联并归档旧流程，历史记录、提交与 checkpoint 不重写、不静默迁移。
- 退役 `optimization.directionLimit`、`optimization.directionRetries`、`optimization.minImpactLevel`：有效/默认/投影配置仅含 `optimization.enabled`（默认 `true`），退役键只产生明确诊断，不建立兼容路径。
- Sync 仅把实际确定性模型输出关联到既有验证证据并保留原执行时 manifest；外部改动不能被该关联掩盖。Archive 前统一要求基线 Review、完整交付或显式 skip、适用验证、最终结论与 successful checkpoint。
- 生成面（agent/skill/reference）改为按角色原生工具权限与运行时协议投影：可写 Opt、只读 Reviewer；CLI help、输入示例与恢复指引由同一协议渲染，不再附加固定方向协议。

## 0.2.2

### Minor Changes

- **BREAKING**：`xirang record` 设计记录升级为 schemaVersion 4：每条条目显式携带 `nature`（normative/informative）与 `decision`（pending/accepted/excluded），旧格式（schemaVersion 3 或缺失 decision）直接拒绝，不自动迁移、不创建兼容副本；`.xirang/framing/` 不再被发现为有效记录，`xirang framing` 按未知命令处理。新增按条目选择读取 `xirang record show <explorationId> --entry <identity>`（可重复）；`record coverage` 与 `record consume` 改为状态化门禁：pending 条目影响当前目标即拒绝、不影响须给理由，不适用须理由，consume 前强制存在绑定 sourceVersion 与目标指纹的有效覆盖结果并逐字段比对结构目标，历史快照仅作 history 与 digest 参与，不再按活动记录格式重解析。

### Patch Changes

- 新增 Experimenter 内部角色（`xirang-experimenter`）：Explore 可委托最小可行性实验并取回命令、实际输出与限制证据；Reviewer/Optimizer 仍为只读评估角色，三角色按 Claude Code/Pi/OpenCode/Codex 原生权限注册安装，用户自定义 model 值在 update 时保留。
- Propose 交互化：按机制复杂度组织审阅（简单集中审阅、复杂按机制分段），允许小范围交互调整与必要实验回退 Explore；收尾按已采纳义务、待决问题、排除方案与说明材料分类，CLI 校验通过不替代语义就绪。
- Contract 写作标准：保留 4+N 结构，按局部职责、直接表达、同层去重与沿用准确文本精简表达；共享 business-specification-standard 与 authoring-conventions 指导更新，父级需在本层独立承载目标承诺。
- 性能：记录结构校验在单次调用内复用模型索引（模型集合遍历 12→4 次）；覆盖检查对同一 Element 位置只解析一次并复用文本做摘录匹配；记录概况改为单次遍历计数，不再分配筛选数组。

## 0.2.0

### Minor Changes

- **BREAKING**：`decomposition` 配置从 `{method}|{skill}` tagged union 收敛为单个字符串。含 `/` 的值作为项目根相对路径原样保留，裸名称解析为 `.xirang/references/<值>`（不以 `.md` 结尾时补 `.md`）；`xirang config project --json` 与 instructions 的 `configProjection.normalized` 改为输出解析后的指导文件路径。结构形成入口的指导读取收敛为单条无分支规则：按解析路径完整读取指导文件，缺失或不可读即停止结构形成，不再存在按方法名分派与「Agent 自有方法知识」两条分支——它们正是 Agent 在非默认分支下读取未选择指导文件的根因。功能性默认值改为 `xirang-semantic-refinement.md`。含 union 的 v0.1.x 均未发布到 npm（npm 仅有 0.0.1/0.0.2），故不提供旧格式迁移逻辑；既有 `decomposition` 值只保留不覆盖，非法值 warning 后省略该字段。共享 `STRUCTURAL_DECOMPOSITION_GUIDANCE` 片段统一为英文单一语言。

- 新增 `optimization.minImpactLevel` 配置（取值 `high`/`medium`/`low`，默认 `low`），声明可选取的最低优化收益等级。低于门槛的方向不再被报告，也不得被标注为 deferred 或通过抬高 `impactLevel` 越过门槛；当全部待选方向均低于门槛时该轮以 `NO_ACTIONABLE` 收口（终态 `NOT_NEEDED`），使「没有值得做的事」成为正当结论。门槛同时由 CLI 选择器确定性过滤与 Optimizer 的 admission gate 自我约束两处执行。默认值 `low` 为最宽门槛，既有项目行为与改动前一致。

- Definition Framing 从「可选增强」改为必须落定的记录决策：形成过程只要产生 normative 确认，就必须在交接前落定恰好一种终态——持久化记录、用户明确授予的豁免（连同理由写入 Design Summary 与 provenance）、或声明本次无 normative 内容。三者皆缺即阻塞，静默跳过不再是合法路径。`snack` 仍不产出该决策。

- 记录写入的确认改为按设计段落聚合：一个设计段落结束后一次性展示本段全部待写条目并取得该批决策，不再逐条打断；聚合只改变确认时机，不减少一次创建或更新所需的独立授权，未被用户在该批中处理并确认的条目不算已确认。

- 覆盖检查从叙事式自查改为逐条打钩：规范性条目须逐条标记落位于 Declaration、Contract、Relationship、Metamodel 或 Authored View，未标记即计为未覆盖并阻塞 ready-for-apply / promotion。原落位枚举遗漏 Authored View，会使合法的 View 条目被迫判为未覆盖，该缺口已修复。`propose` 与 Build 遇到无记录来源时必须要求其声明记录决策，未声明即阻塞并退回 Explore，不得当作隐式豁免。

- Agent 面文本统一为英文单一语言（含 `ELEMENT_DEFINITION_SEMANTICS`、`ELEMENT_CONTRACT_SEMANTICS`），并清除共享片段中的方法名分派表述。

## 0.1.1

### Patch Changes

- 修复 `xirang sync` / `xirang archive` 在跨实体类型同名 identity（如 element 与 element-kind、element 与 authored view 同名）时静默删除仍存在于 Target Semantic Model 单元的数据损失：identity source index 改为按 `(entity type, identity)` 定位，sync 目标树按实体类型保真路由；两个单元映射到同一目标路径时在写入前显式失败，Formal Semantic Model 保持不变。新增规范：identity 唯一性按实体类型命名空间分域，跨类型同名合法。

- change diff 与 contract 校验的诊断定位改为实体精确（碰撞模型下不再指向其他类型的存储单元）；`xirang validate --all/--contracts` 批量校验共享单次 formal 模型解析；`allowAlreadyApplied` 的 already-applied 判定改为实体精确匹配。


## 0.1.0

### Minor Changes

- 命令面 `xirang verify` 重构为 `xirang quality`。四个入口 `review` / `optimize` / `status` / `seal` 取代相位编号与 `--type` 判别；状态由"当前代码与历史 Review 记录的 evidence fingerprint 关系"唯一决定（`clean` / `dirty`）；优化以轮为单位提交方向台账，方向 ID 由 CLI 分配并回显，收口终态由 `stopReason` 推导；记录拆分为 `.quality-state.json` 快照与 append-only `.quality-log.jsonl`；协议说明由实现常量单源投影到 help 与 skill reference。配置项 `optimization.optRetries` 由 `optimization.directionLimit` 与 `optimization.directionRetries` 取代。

  旧命令族 `xirang verify`、`--type`、相位编号、`PENDING_VERIFICATION` 与 `.verify-result.json` 全部退役，不提供兼容别名。

## 0.0.1

Xirang 是独立的 Agent 驱动项目开发框架，本版本为其独立命名的初始发布。
