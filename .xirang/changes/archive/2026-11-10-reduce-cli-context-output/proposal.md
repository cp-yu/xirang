## Why

Xirang CLI 的重复调用、成功回执、默认差异预览和重复提示词持续占用 Agent 上下文。需要在整个 CLI 及其工作流中减少实际进入上下文的字节，同时保留当前决策所需的完整语义、诊断与后续操作凭据。

## What Changes

- **BREAKING**：统一默认与 JSON 模式的输出边界。无必要结果的成功操作静默，查询及必要交付结果保留，警告与错误进入 stderr；非交互调用取消进度与成功装饰。
- **BREAKING**：将静态制品指导与模板归并到按需读取的 skill/reference；动态配置与状态由 `config project`、`status --change`、`quality status` 承接，完成替代后移除 `instructions` 命令。
- **BREAKING**：Record 以文件名寻址，取消调用方抄传 sourceVersion，保留 CLI 局部编辑、内部内容指纹、coverage 与 consume 的交接门禁。
- 按需展开 Change 差异、Candidate 比较统计、Quality 历史和 Record 更新差异；工作流按消费目的选择完整且紧凑的文本或 JSON。
- 同步调整 Neovim 保存、诊断及刷新，并核对整个 CLI 的查询、写入、校验、初始化、更新、归档与辅助命令。
- 用相同样本测量单次及工作流累计 stdout、stderr 和实际辅助文件读取字节；不以文件搬移、固定文本快照或未经测量的 token 数宣称收益。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `cli`：统一通道、静默成功和必要结果边界，保持完整审阅查询与写回信息。
- `deterministic-operations`：按需差异、Candidate 比较、Record 身份及内部交接校验，并保留完整请求语义。
- `artifact-workflow-commands`：动态状态承接 Apply 判断，静态指导退出命令返回，非交互输出收敛。
- `status-command`：空查询与错误通道。
- `quality-aware-instructions`：集成 Quality 的推进状态由 Change status 提供。
- `quality-cli-gate`：当前结论与历史分开读取，保留 revision，精简写入回执与失败诊断。
- `config-command`：归一化配置选择读取、即时反映修改及静默写入。
- `config-projection`：配置数据与静态遵循规则分离，保持语言、context、rules 和运行时配置语义。
- `project-config-management`：以有效配置查询和共享指导服务工作流。
- `instruction-loader`：制品定义、模板及动态路径状态分别供文件指导和状态查询消费。
- `validation-commands`：默认仅报告问题，显式请求差异，取消重复汇总及修复页脚。
- `candidate-commands`：校验保留 reviewDigest，比较和统计按需获取。
- `arch-validate`：无问题校验静默。
- `schema-commands`：校验输出遵循问题优先及显式详细请求。
- `design-record-operations`：文件名身份、局部编辑、选择读取、按需差异、内部覆盖指纹和安全交接。
- `confirmed-design-record`：文件名身份与当前内容，保留模型基准及形成历史。
- `design-record`：按需完整重载、CLI 操作纪律和内部覆盖门禁。
- `agent-workbench-projection`：静态指导唯一来源与按需交付。
- `workflow-templates`：减少重复调用和读取，选择适合消费者的完整表示。
- `propose-workflow`：从共享文件读取制品指导，显式请求最终差异审阅。
- `apply-workflow`：消费 Change status 的推进状态。
- `snack-workflow`：文件指导与显式差异审阅。
- `workspace-init`：成功输出收敛，Project Build 指导归入按需工作面。
- `workspace-update`：精简成功输出，保留实际警告与必要生效提示。
- `change-sync`：成功及无变化操作不输出确认消息。
- `change-archive`：精简成功摘要，Git handoff 由 workflow 指导承载。
- `completion-command`：保留脚本及必要生效信息，精简安装卸载回执。
- `feedback-command`：保留提交结果和手工提交材料，诊断通道一致。
- `neovim`：空 stdout 保存成功、ignoredChanges 提示及 stderr 失败诊断。
- `show-command`：保留活动 Change 查询数据，编译错误与警告遵循 stderr 通道。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `cli`、`deterministic-operations`：配置与状态查询、静态指导投影的职责表述不再依赖 instructions 命令。
- `artifact-workflow-commands`、`quality-aware-instructions`：状态职责由现有 status 入口承接，保留语义 identity。
- `config-command`、`config-projection`、`project-config-management`：归一化配置与工作流规则的消费边界。
- `instruction-loader`：保留制品定义、模板与上下文加载职责，调整交付边界。
- `validation-commands`：差异呈现为显式请求能力。
- `design-record-operations`：记录寻址与内部校验边界。
- `workspace-init`、`change-archive`：静态后续流程指导归于工作流。
- `show-command`：查询数据与执行诊断的职责表述一致。

#### Removed Elements

None

#### Architecture Relations

None。沿用现有 hierarchy、Kinds、Relationships 与 Views；命令删除不等同于删除仍承担相关职责的语义对象。

## Impact

涉及 CLI 命令输出及错误处理、artifact graph 状态投影、配置投影、Record 文档与交接协议、工作流与 references 生成源及受管生成面、Neovim 消费者、帮助与补全、现有行为测试。旧命令、Record 调用参数及回执结构不要求兼容；仓库内调用方随同更新。

本次不引入统一 context 命令、配置覆盖体系、Record 修订号或新的并发服务，不改变正式语义 identity、Quality revision、Candidate digest 与用户授权门禁。完整 Contract、snapshot 和 review projection 不因节省输出而被摘要或截断。
