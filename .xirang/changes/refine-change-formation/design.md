## Context

Explore 与 Propose 继续作为形成完整 Change 的两个阶段。当前记录只有 nature、没有决策状态，Propose 被禁止修订记录；Explore 主工作面及 OpenCode/Codex 内部角色生成还存在统一只读约束。现有 record 的受控路径、局部 patch、sourceVersion、字段差异、覆盖指纹和原子交接已经可用，本次沿用这些机制。

目标语义由 elements/ 中的 Delta 定义。Experimenter 是唯一新增 Element，沿已确认的 internal-agents 角色维度与 Reviewer、Optimizer 并列；其 parent 表达层级，不增加新实验活动树或用户 workflow。

## Goals / Non-Goals

**Goals:**

- 让 Explore 通过专门实验角色完善中间设计，再由 Propose 交互式组织 Change。
- 使记录能保存当前状态，并保持用户确认权、读取效率和收尾覆盖完整性。
- 沿用现有安装、工具渲染及测试边界，落实角色权限和简洁 Contract 写作。

**Non-Goals:**

- 不设计 Neovim/Web 的具体差异呈现，不执行本 Change 的正式项目实现。
- 不规定实验必须使用某种目录或 worktree，不新增实验 skill、用户 workflow 或记录兼容层。
- 不改写 Build 的 Candidate 审查、digest 确认、promotion 与 history 流程。

## Decisions

### 记录使用显式新格式，局部更新协议继续复用

payload schemaVersion 采用 4。条目固定为 identity、nature、decision、content；nature 使用 normative/informative，decision 使用 pending/accepted/excluded。复用 document、workspace、diff 和 validator 的既有链路，扩充条目解析、差异及状态概况，不另建会话日志或条目版本系统。结构部分继续使用已确认目标形状，未确认结构保留在 pending 自由文本中。

这是用户要求 breaking 格式的具体编码；拒绝 schemaVersion 3 及缺少 decision 的输入，沿用既有不支持格式诊断，不加转换、默认 accepted 或兼容分支。保留实体 discriminator confirmed-design-record 与语义 identity，面向用户名称使用中间设计记录，避免仅为命名重建身份。

确认授权由 Agent 协议落实；CLI 能验证格式、枚举和记录版本，不能证明用户在自然语言中同意。accepted/excluded 的变更、删除、降级及结构撤回不得被 Agent 用来绕过已有确认权。

### 选择读取只缩小响应，不新建版本或写入口

在现有 show 加可重复的 --entry <identity>。未提供选项保持完整响应；提供时投影记录身份、当前 sourceVersion 与所选完整条目，不携带无关内容和 baseline。未知 identity 使用稳定诊断，避免看似成功却遗漏必要条目。沿用 entries.upsert/remove 和记录级 sourceVersion；选择读后发生其他更新，写入仍按整份记录版本拒绝过期请求。

Propose 开始和收尾完整读取，编写中需要时才按条目核对。不为每个章节强制插入读取步骤，不以选择读替代完整收尾核对。

### 覆盖门禁保留原子细节，只对适用的已采纳义务要求落位

在现有 coverage 结果上增加状态化 disposition：需落实的 accepted normative 使用 covered 及现有 details；非当前目标项使用 not-applicable 并给 reason；pending 条目用 pending 结果显式报告 affectsTarget，false 必须给 reason，true 阻塞。excluded、informative 不要求细节位置，检查者仍阅读其必要依据。具体结果字段可沿现有类型命名风格实现，必须满足 Delta 中的分类与拒绝条件。

这个分类是已确认“性质、确认状态及是否需要落实”的实现展开，不新增记录条目的范围字段。适用性由 Agent 判断并说明，CLI 校验声明、必需结果、类型及摘录；不把自然语言相关性检测伪装成确定性功能。不适用声明不能解除已确认承诺，最终语义复核仍需验证依据。

保留当前位置摘录、结构逐字段比对、sourceVersion/目标指纹绑定和精确快照。source 或目标变化后旧覆盖失效；consume 不另做第二套状态判断，复用有效覆盖结果与既有原子交接。Build 和 Change 消费同一规则，避免只升级 Change 路径后破坏 Candidate 形成。

### Experimenter 复用既有显式注册及工具原生权限

新增 workflows/experimenter.ts 中的内部角色模板，并在 INTERNAL_SUBAGENT_TEMPLATES 显式加入 xirang-experimenter；不加入 workflow manifest。Explore 只提供问题、约束和背景，模板要求实验者自行选择方法、执行并交付可复现证据及限制。实验位置由执行者判断；正式实现与用户确认仍由相应阶段负责。

复用 SubagentTemplate 的 tools 与 mode 等语义字段，不新建按名称猜测的权限层。Claude 补齐 write/edit 到 Write/Edit 的映射，Pi 输出实验角色的可写工具；OpenCode 从角色能力生成 edit allow/deny，保留既有 bash 授权处理；Codex 为 Experimenter 使用 workspace-write，评估角色维持 read-only。Reviewer、Optimizer 的 Bash 禁写、Pi foreground 提示、模型继承和 TOML 转义继续保留。现有安装器枚举显式模板，沿用跨平台 path.join、ownership 校验和用户 model 保留。

不采用只新增 prompt 却保留工具统一 deny 的方案，这无法完成实际实验；也不把实验写入能力扩展给评估角色。

### 共享 reference 统一确认边界，Propose 按复杂度组织成文

在 Explore 模板中的共享 Design Record reference 更新条目状态、授权、局部读取及覆盖规则，Build/Explore/Propose 继续引用同一来源。Explore 主指令、行为 reference 与角色权限同时调整，消除“唯一例外只能记录已确认内容”的冲突。记录捕获当前设计可减少探索反复时重写完整 Change 的成本。

Propose 模板允许自主维护 pending 和用户允许的确认内容变化。保留已确认 Summary 复用、readiness 与确定性门禁；简单变更完整草稿后集中审阅，复杂变更按机制或相关 Elements 分段。小范围讨论及记录修订不强制回 Explore，需要实验重新判断方向时返回 Explore。细枝末节可放权，不保留鼓励大量自主扩写的指令。

写作规则放共享 Element Contract 片段与业务规格 reference：4+N 不变，局部职责、直接条件/行为/结果、同层规则集中、准确文本沿用。HTTP 预览服务的排除作为 design 路由的反例，来源版本两句话作为表达对照；两者用于说明写作行为，不发展为当前项目新增业务能力，也不建立锁定例句的持久化测试。

### 验证优先扩展已有行为测试

- 在现有 record 解析、属性、workspace、diff、命令和 JSON 测试中升级 fixture，验证显式状态、旧格式拒绝、部分更新、过期版本及选择响应。选择读取测试比较响应实际包含的信息，不测帮助文字排版。
- 在 coverage/consume 和现有 record-workflow 集成测试中验证 accepted/pending/excluded/informative、适用性、摘录、指纹失效及 Build/Change 两条交接。集成测试使用已构建 CLI，先 build 再运行。
- 在既有 subagent-generation、workflow-installation 测试中验证三角色安装与原生权限、用户 model 保留、非受管文件保护；替换“恰好两个角色”的过时断言。保留 Reviewer、Optimizer 权限回归。
- 更新共享 record reference 中因协议改变而过时的精确文本断言；持久化精确断言只保护协议 token、fail-closed 门禁、禁止及退役操作，不新增对解释文字、标题顺序、例句的锁定。
- 对交互路由、实验委托、用户确认边界与精简写作用一次性行为演练和生成面审阅提供证据，不以全文字符串快照代替行为判断。

## Risks / Trade-offs

- [旧活动记录无法继续读取] → 按已确认 breaking 决定直接报告格式不支持，由用户重新形成当前记录；不自动覆盖原文件。已交接的 record-source.md 只作历史，不由新运行时重新解析。
- [Agent 把实验成功或 not-applicable 当作绕过确认的理由] → 共享协议明确事实与决定的边界，收尾语义复核检查理由；CLI 不声称证明用户授权。
- [生成面仍残留旧只读限制或只升级某种工具] → 在同一实验行为闭环内验证四工具权限与 Explore 工作面，保留两种评估角色回归。
- [长记录反复占用上下文] → 开始/结束完整读，过程中按需选择读；仍用整份记录版本防止过期写入。
- [精简造成父级语义或具体条件丢失] → 共享规则明确保留不同抽象层级的完整承诺和具体数字、例外、时序，用一次性对照核查而非新增格式门禁。

## Migration Plan

先完成新记录格式、命令、状态化覆盖及共享协议的闭环；再接入 Experimenter 与 Explore；最后完成 Propose 交互和共享写作投影。各任务在自身终点可独立验证，只依赖此前 GREEN 的任务。新格式不兼容旧记录，实施前先识别旧活动记录并告知，不能自动迁移或丢弃。当前 Change 的 record-source.md 是形成历史，保留原始字节。

使用现有 build/update/sync 入口刷新受管工作面，不手改生成文件。若需回退实现，应整体回退相关格式与消费实现并保留用户记录文件；新格式数据不能假装可由旧解析器读取。本次 Propose 不执行更新、同步或发布。

## Open Questions

无影响当前目标、范围或实施方案的未决设计问题。schemaVersion、枚举、重复 --entry 及状态化覆盖结果编码是既定设计的实施展开；实验环境选择保留给执行 Agent。
