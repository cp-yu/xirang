## Why

`xirang verify` 的措辞、命令面与状态值描述的不是它实际做的事：它评估并改进代码质量，由 Review 与 Optimization 两个活动组成，却按 `phase1/phase2` 编号、用 `--type` 重复判别输入类别，并把"优化尚未收口"编码成 `PENDING_VERIFICATION`。协议规则只存在于实现分支中，Agent 组织合法输入只能读源码或反复试错，而唯一的手写说明已经与实现漂移（模型仍要求已删除的 `--files` 与 `FILES_REQUIRED`，文档仍描述 `git stash` checkpoint）。

## What Changes

- 命令面收敛为 `xirang quality` 的四个入口：`review`、`optimize`、`status`、`seal`；`--type`、`phase1`、`phase2` 与 `PENDING_VERIFICATION` 全部退役。**BREAKING**
- 状态由代码状态定义：存在未经 Review 的代码变更即 `dirty`，当前代码已通过 Review 即 `clean`。活动选择只依据该状态，不再依据相位编号。
- Optimization 以"轮"为单位记录一份判断台账；方向选择由 Optimizer 判断、CLI 按既有优先级实现选择；撤销判断必须带理由与证据。
- 两级计数：方向数上限与同一方向的失败上限，均为配置项。
- 收口随时允许（含找无可优化点与用户拒绝），并记录必填的 `stopReason`；终态由台账推导。
- 统一输出与诊断契约：成功、入口条件不满足、payload 非法、seal 四类形状与退出码 0/1/2，诊断携带字段路径、期待值、当前状态与修正方式。
- 协议说明只有一个来源，并投影到 `quality` 命令的 help 与 apply/archive skill 的 reference 文档，不再手抄。
- 记录载体拆分：门禁读取的状态快照改名为 `.quality-state.json`；新增 append-only 的 `.quality-log.jsonl` 保存跨轮历史。
- 9 个 Element identity 随之改名（`verify` → `quality`，其余 `verify-*` / `*-verify-*` 同步收敛）。**BREAKING**
- 不提供兼容层：不保留 `verify`、`--type` 或旧状态值别名。

## Source Impact

### Behavior Source

#### New Specs

- `quality`: 以代码状态驱动 Review 与 Optimization 交替推进、并以仍然有效的 Review 证据确认可进入 Change Closure 的环节。
- `quality-cli-gate`: `xirang quality` 四个入口的输入契约、入口条件、收口推导、统一输出与诊断结构、退出码语义，以及机器可读协议说明的投影。
- `quality-execution-model`: quality 与 archive 复用的 subagent-orchestrated 执行模型骨架。
- `quality-freshness`: `tasksFileHash` 与 `evidenceFingerprint` 计算、按当前代码匹配记录得到的 `clean/dirty` 判定、归档兼容判定、gate 失败输出与 sync 后指纹刷新。
- `quality-orchestration`: quality 工作流提示词的编排契约（coordinator 角色、mode 标签、显式委派、等待规则、checkpoint 协议、语言一致性）。
- `quality-writeback`: CRITICAL 不一致回写 `tasks.md`、Required Corrections 清单生成，以及状态快照与 append-only 日志的持久化语义。
- `quality-aware-instructions`: `xirang instructions apply` 依据 quality 状态判定 change 的 `state`。
- `archive-quality-gate`: 归档前必须具备新鲜的 Review 记录与已收口的 Optimization。
- `apply-quality-integration`: Apply 与 quality 的集成契约（先写回再持久化、优化循环、失败方向记录、角色分工与配置驱动控制）。

#### Modified Specs

- `optimization`: 定义与 Requirement 中的宿主环节引用改为 `quality`，并表达两轮驱动语义。
- `optimization-execution`: 执行协议改为以入口条件与收口推导驱动，替换 reconciliation 与 `optRetries` 单层预算。
- `optimizer-findings`: 方向数据合约、稳定标识分配、状态集合、优先级与选择、失败计数与收口。
- `optimizer-protocol`: 输入合约、避重协议与失败上限引用。
- `review`: 入口条件表述改为由代码状态驱动，并保留 checkpoint 与结论绑定语义。
- `checkpoint`: 宿主环节引用与 Checkpoint 隔离状态的判定措辞。
- `reviewer-protocol`: 角色与输入合约中的相位措辞与记录文件名。
- `reviewer-cleanliness`: reviewer 与 optimizer 的职责边界措辞。
- `apply-workflow`: 步骤名称、`needs_verify`/`needs_seal` 分支与 clean-context 入口。
- `change-archive`: 归档门禁措辞、`--no-verify` 绕行、freshness 路由与摘要字段。
- `change-sync`: verify gate 措辞、`.verify-result.json` 引用与指纹刷新。
- `project-config-loading`: `optimization` 配置节点默认值与校验。
- `workspace-init-update`: 迁移默认值中的 optimization 节点字段。
- `list-command`: `--json` 输出中的 quality 状态字段。
- `completion-introspect`: 命令面反射示例。
- `workflow-templates`: 模板契约中的 quality 引用与内部 subagent 代称。
- `agent-prompt-guidance`: 共享 quality 指引片段的组成与内容。
- `config-projection`: workflow surface 列表中的 quality。
- `references-home`: 主 `SKILL.md` 保留步骤中的 quality gate。
- `command-reference-consistency`: 命令引用一致性中的 gate 名称。
- `scenario-pseudocode-authoring`: 稳定 identity 示例。
- `task-decomposition`: Apply 流程步骤名称。
- `skill-template-length`: 行数校验示例中的 skill 目录名。

### Architecture Source

#### Added Elements

- `quality`: 取代 `verify` 作为 Change Implementation 中评估并改进代码质量的环节。
- `quality-cli-gate`: 取代 `verify-cli-gate`。
- `quality-execution-model`: 取代 `verify-execution-model`。
- `quality-freshness`: 取代 `verify-freshness`。
- `quality-orchestration`: 取代 `verify-orchestration`。
- `quality-writeback`: 取代 `verify-writeback`。
- `quality-aware-instructions`: 取代 `verify-aware-instructions`。
- `archive-quality-gate`: 取代 `archive-verify-gate`。
- `apply-quality-integration`: 取代 `apply-verify-integration`。

#### Modified Elements

- `checkpoint`: parent 由 `verify` 改为 `quality`。
- `optimization`: parent 与 Definition 中的宿主环节引用改为 `quality`。
- `optimization-execution`: parent 改为 `quality`，Definition 表述改为入口条件驱动的执行协议。
- `optimizer-findings`: parent 改为 `quality`，Definition 表述改为方向台账与收口。
- `review`: parent 改为 `quality`，Definition 中的宿主环节引用改为 `quality`。
- `optimizer-smells`: Definition 中的宿主环节措辞改为 `Quality` 优化活动。

#### Removed Elements

- `verify`: 目标模型以 `quality` 表达同一环节，不再保留按相位编号描述的环节。
- `verify-cli-gate`、`verify-execution-model`、`verify-freshness`、`verify-orchestration`、`verify-writeback`: 由对应 `quality-*` identity 取代。
- `verify-aware-instructions`: 由 `quality-aware-instructions` 取代。
- `archive-verify-gate`: 由 `archive-quality-gate` 取代。
- `apply-verify-integration`: 由 `apply-quality-integration` 取代。

#### Architecture Relations

- `validates` 关系的 source 由 `verify` 改为 `quality`，target 保持 `change-implementation`。
- `precedes` 关系中 `snack` 指向的 target 由 `verify` 改为 `quality`。
- 其余 Relationship 与 Authored View 不受影响。

## Impact

- CLI：`xirang verify` 命令族与 `src/core/verify/` 模块更名为 `quality`；`sync`、`instructions`、`list`、archive gate 等调用方随之更新。
- 配置：`optimization.optRetries` 拆分为方向数上限与方向失败上限两个键；项目配置默认值与迁移逻辑同步更新。
- 记录文件：`.verify-result.json` 改名为 `.quality-state.json`，新增 `.quality-log.jsonl`。
- 生成面：workflow skill 模板、reference 文档、内部 subagent 提示与 help 文案随之更新。
- 文档与测试：`docs/cli.md`、`test/commands/verify.test.ts`、`test/core/verify/*` 等随之改写或删除。
- 迁移：两个活动 change（`unify-candidate-change-modes`、`browser-candidate-review`）的旧 `.verify-result.json` 不再被读取，需按新流程重新取得 Review 记录；二者当前 freshness 已为 `STALE`。
