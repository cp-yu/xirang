## Why

Propose 的 readiness、change identity、validation 与 scenario label 编排分散在重复 Specs 和历史配置/CLI surface 中，当前字符评分、全量 warning-only gate 与重复 preflight 会产生错误路由并允许不可编译的 semantic source 进入 Apply。需要将行为收敛到单一 workflow contract，并移除不再提供独立价值的配置和命令。

## What Changes

- Propose 复用已确认的 `Design Summary`；否则依据 problem、impact scope、approach、verification method 与 unresolved source decisions 判断 semantic readiness。
- 明确 new change、existing change 与 ID 冲突的 identity 规则；readiness 通过或用户显式 override 前不得创建 change。
- 将 post-propose gate 收敛为 scaffolding 结构检查、一次 combined semantic-source delta validation，以及 preview-first scenario label review；ERROR 阻塞 ready-for-apply，WARNING 不阻塞。
- 将 Propose routing、authoring、validation 与 summary 行为统一归入 `propose-workflow`，删除重复 formal Specs。
- **BREAKING** 删除 `propose.smartRouting` 与 `propose.requireExplore`；旧 project/global 配置静默忽略这些字段，新配置不再接受它们。
- **BREAKING** 删除 `openspec check-delta` CLI；Requirement header 交叉检查继续由最终 change validation 承担。
- 路由判断只存在于对话，不写入 `proposal.md`；状态输出只保留 readiness、blocker 与最终总结。

## Source Impact

### Behavior Source

#### New Specs

None.

#### Modified Specs

- `propose-workflow`: 统一 semantic readiness、change identity、artifact generation、validation、scenario labels 与 final summary 行为。
- `propose-smart-routing`: 删除全部旧字符评分、配置开关、routing comment 与独立 routing 合同。
- `opsx-propose-skill`: 删除与 `propose-workflow` 重复的 post-propose validation 合同。
- `cli-check-delta`: 删除全部 `openspec check-delta` CLI 行为。
- `config-loading`: 旧 project config `propose` 节点静默忽略且不进入配置投影。
- `global-config`: 旧 global config `propose` 节点静默忽略且不进入返回配置或默认值。
- `config-project-query`: normalized project config 不再输出 `propose`。
- `cli-config`: `config set` 不再接受 `propose` 路径。

### Architecture Source

#### Added OPSX Nodes

None.

#### Modified OPSX Nodes

- `cap.ai.propose-smart-routing`: 职责收敛为 semantic readiness、change identity、definition-first artifact generation、blocking combined validation 与 preview-first scenario labels。

#### Removed OPSX Nodes

- `cap.cli.check-delta`: 删除重复 formal Requirement header comparison 的独立 CLI capability。

#### Architecture Relations

- 保留 `cap.ai.propose-smart-routing consumes cap.ai.explore-brainstorming` 与 `belongs_to dom.ai-integration`。
- 删除 `cap.cli.check-delta invokes cap.validation.spec-section-type-cross-check` 与 `belongs_to dom.cli`。

## Impact

- Propose template source、generated Pi Skill、template parity 与 workflow tests。
- Project/global config schemas、loaders、defaults、normalized projection、config query 与 config tests。
- CLI registration、command introspection/completion surfaces 与 `check-delta` tests。
- Formal Specs、Spec registry coverage、formal OPSX node/relations 与 sync behavior。
- `openspec/changes/archive/**` 保持历史原样。
