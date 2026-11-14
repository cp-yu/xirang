---
entity: element-declaration
identity: agent-workbench-projection
kind: capability-specification
parent: project-tooling-configuration
title: Agent 工作面投影与同步
definition: Agent 工作面投影与同步是息壤按工具能力交付可用工作指导的能力。它按交付对象区分公共与阶段 skills、内部 Agent 制品和共享 references，并承担跨对象的登记、工具适配、确定性生成、受管同步与一致性验证；具体角色执行和用户语义决策由对应 Agent 承担。
---

## Specification

### Section: Scope and Non-goals

Agent 工作面投影与同步 SHALL 按 tools 能力交付公共/阶段 skills、内部 Agent 制品和共享 references，并承担跨制品的登记、确定性生成、受管同步及一致性验证。具体角色执行、用户设计判断和项目实现由对应 Agent 承担。

### Section: Business Logic

工作面 SHALL 从统一登记按工具能力生成各类指导，并在同步中保持内容一致性、用户边界及文件长度约束。

#### 统一登记与交付

setup/update SHALL 使用同一清单和共享生成流程交付 common、六个阶段 skills、适用内部 Agent 制品及 references。阶段 ID 与 skill 名称/目录对应为 propose→xirang-propose、explore→xirang-explore、apply→xirang-apply-change、archive→xirang-archive-change、build→xirang-build、snack→xirang-snack，每个阶段登记一次。common 是公共入口，Reviewer/Optimizer/Experimenter 是内部角色，不形成额外阶段；成员不由 profile 选子集，不生成平行 command 工作面。

受管新增、覆盖、替换和删除 SHALL 按显式登记名称及受管依据定位，保留用户文件，不按前缀、glob 或名称模式猜所有权。工具能力、安装路径和格式由显式元数据提供；跨平台通过路径 API 定位逻辑等价的文件。

工具特有改写 SHALL 在共享管线按制品类型、适用条件、阶段和优先级确定性执行。支持 skills 的工具直接生成 skills，skill 变换不调用 command adapter；生成入口不独立实现隐式改写。

#### 内容分工与一致性

common SHALL 提供 Philosophy、统一语义依据、identity 基本约束、阶段选择、加载复用、配置使用规则及 context 查询。用户可从 common 选择阶段，也可直接进入阶段并补齐 common；保留已选阶段，不循环加载。阶段 skills 承担各自入口和推进，内部角色制品承担完整角色定义，references 承担完整专项指导。

内置 references SHALL 唯一交付于项目根 .xirang/references，各工具目录不复制内容。语义写作、默认分解方法、方法编写、测试质量、配置修改、Design Record 和 Quality 指导各有唯一来源。动态数据分别通过 config project、status --change、quality status 查询；静态复用不取消模型、Record、配置、Git 或 Quality 的适用状态检查。

同 Agent、同项目、当前仍有效可用的指导可复用，新 Agent、上下文丢失或指导变化时重读，不无条件预加载全部指导。配置修改 reference 为 xirang-configuration-edit.md，common 在用户修改请求时引导加载。更新保留项目方法、用户文件及显式 decomposition 值。

同一规范内容的工具投影 SHALL 行为等价，源模板与生成面同步。验证检查工作流登记、目录、导出、入口、公共依赖、读取路由、停止条件、权限和交接；普通散文或标题顺序不替代行为依据。

#### 文件长度

生成的每个 workflow SKILL.md SHALL 不超过 200 行，每个 reference 不超过 500 行，逐文件计算、覆盖所有已定义工具变体。超限诊断按文件与变体报告实际行数、限值和超出量，按最大行数降序；同文件同长度变体合并，不同长度分别列出。拆分/精简保持协议及可达入口，长度通过不证明行为改善。

### Section: Edge Cases and Exception Handling

生成与同步 SHALL 对工具配置和能力定义不匹配给出可操作错误。未支持内部 Agent 制品的工具不生成该类型，但仍交付支持的 skills/references，Project Build 不因缺少 subagent 制品受阻。未登记或缺少受管依据的用户文件不得删除或覆盖；同名不构成所有权。不可用或失效指导不能凭已加载的历史记录替代，应重新取得所需内容。超限文件须明确报告，不能以目录总行数掩盖单文件问题。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 统一固定工作面

对同一工具配置执行 setup/update，得到 common 和六个精确 skill 名称，包括 xirang-apply-change、xirang-archive-change；支持内部 Agent 的工具另有三个角色，入口均可解析。

#### Acceptance Case: 工具变换与用户文件

同输入及工具定义生成同内容；匹配变换不影响其他工具。目录中同名非受管用户文件保持原样，自定义 decomposition 值不变。

#### Acceptance Case: Reference 唯一与按需加载

普通读取配置直接使用 common；用户要求修改时加载项目根 edit reference。各工具均定位同一个可读 reference，不产生目录内副本。

#### Acceptance Case: 独立文件限值

skill 180 行、reference 501 行，只报告 reference 超 500 行限制，不把两文件相加。

#### Acceptance Case: 变体分组

Explore 的 default/claude/codex 均为 541 行时合并报告，超 200 行限值 341 行；Propose 的 claude/codex 为 604、default 为 580 时分别报告超 404 与超 380。

#### Acceptance Case: 不支持内部 Agent 的工具

工具只支持 skills：仍交付公共和阶段指导，Build 可通过 Candidate 编写、校验、确认与提升推进。
