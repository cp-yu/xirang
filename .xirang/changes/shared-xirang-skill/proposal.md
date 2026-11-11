## Why

多个 Xirang skills 和 references 重复承载完整公共规则，阶段切换会重复加载，分散维护还产生了 tasks 测试安排的口径冲突。提供公共前置 skill 与自然语言阶段入口，使同一规则有唯一维护位置，指导按需取得并跨阶段复用。

## What Changes

- 交付 `xirang-common` 公共辅助 skill，保留六个阶段工作流；支持先加载 common 后表达阶段意图，以及直接加载阶段 skill 后补齐 common 两种入口。
- 公共基础、阶段职责与专项 references 分别承载规则；补读保留已选阶段，避免循环与重复加载。
- 同一 Agent、同一项目内复用有效指导，指导失效或进入独立 Agent 时重新取得所需内容；当前数据和各阶段门禁继续适用。
- 统一 tasks 只表达目标、Contract 引用和验证方向的指导，测试动作由 Apply 动态决定。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `project-tooling-configuration`：父层完整表达公共入口、按需读取与共享语义指导交付。
- `agent-workbench-projection`：公共 skill 的受管安装同步、规则分布、读取复用及跨平台可达性。
- `skill-generation`：Philosophy 公共交付、阶段及独立 Agent 的依赖入口、结构分解指导按需加载。
- `workflow-templates`：双向阶段入口、阶段切换与门禁、公共依赖和专项指导消费、tasks 指导一致性。
- `tool-invocation-references`：公共与阶段 skills 的显式定位、工具中立加载入口和跨平台路径。

`tasks-document` 与 `task-decomposition` 的现行 Contracts 已要求具体测试动作由 Apply 决定，本 Change 以其为验证依据，不生成重复 Delta。`references-home` 已规定项目级唯一位置、显式清单和用户文件保护，保持现有承诺。

### Architecture Source

#### Added Elements

None

#### Modified Elements

- `skill-generation`：完整 Definition 表达公共与阶段 skill 的生成职责及与安装、阶段执行的边界。
- `agent-workbench-projection`：完整 Definition 包含公共前置 skill 的交付范围。

#### Removed Elements

None

#### Architecture Relations

None。保留现有 hierarchy、Kinds、Relationships 与 Views；common 的交付由现有 Elements 表达。

## Impact

涉及共享模板片段、workflow 与 internal agent 模板、受管 skill 安装同步、跨工具引用、专项 references、相关生成及行为验证。调整当前要求完整内联的模型约定和对应验证，沿用 TypeScript/Node.js 与现有显式清单。作用于所有支持的工具表面，包含 Windows、macOS、Linux；不实现阶段自动推进状态机，不改变设计确认、Quality 或 Closure 门禁。
