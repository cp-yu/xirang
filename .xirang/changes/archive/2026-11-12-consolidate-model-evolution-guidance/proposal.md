## Why

模型持续演进时，现有形成指导容易把局部模型组织当作必须提前确认的实质决策，且在多个步骤重复相同的提问、暂停与分解规则。需要明确 Explore 与 Propose 的分工，并集中承载框架规则，使 Agent 能在保留用户决定权和语义完整性的前提下组织模型。

## What Changes

- Explore 澄清影响目标、范围和方案的边界；Propose 结合已确认意图完成具体模型组织，按语义影响决定是否先询问，并在草稿审阅中呈现结构变化。
- 在目标模型上下文中联合检查受影响 Elements 的 Declaration 与 Contract，支持内容增长、细化、迁移、合并和精简；父级保留本层承诺，避免重复表达。
- 明确项目分解方法在框架的父子精化、同层 MECE 与 BF 内定制，BF 不构成逐层用户审批。
- 集中提示词规则的维护与实际加载，删除纯重复提醒；将方法加载保留为阶段短入口，框架基础并入语义写作指导，提供按需读取的自定义方法创建指导。
- CLI 允许直接发布不兼容变更，不承诺旧用法可继续使用；升级适配由用户与 Agent 协作完成，不为本次退役入口新增 CLI 兼容或自动清理逻辑。
- 同步默认与本项目分解方法及受管生成面，以生成回归和实际 Agent 行为分别验证交付与交互结果。

## Source Impact

### Behavior Source

#### New Specs

None

#### Modified Specs

- `explore`：概念边界澄清与 Design Summary 的交接范围。
- `propose`：局部模型组织、目标表达联合审查及结构变化审阅。
- `propose-workflow`：结构形成、就绪判断和源影响调和的决策边界。
- `authoring-conventions`：模型演进中的目标表达合适性与语义保持。
- `skill-generation`：框架分解纪律、配置加载短入口及自定义方法创建指导的交付。
- `workflow-templates`：默认方法与项目方法的职责边界、提示词单一规则承载及效率验证依据。
- `agent-workbench-projection`：共享指导组织、旧 reference 直接退役与项目文件保留。
- `framework-identity`、`project.root`：CLI 向后兼容边界及项目级 CLI 稳定性表述。

### Architecture Source

None。复用现有 Element 身份、层级及概念边界；没有 Declaration、Relationship、Kind 或 Authored View Delta。

## Impact

涉及 Explore/Propose 与 common 模板、共享语义及分解指导、reference 同步清单，以及本项目配置的 `.pi/skills/xirang-project-decomposition/SKILL.md`。新增 `xirang-decomposition-authoring.md`，停止生成和引用 `xirang-decomposition-use.md`；不为既有文件增加自动删除逻辑，旧文件由用户与 Agent 按需处理。配置字段、路径解析机制和工作流集合保持现有定义；受管新文件按显式登记交付，并验证 macOS、Linux、Windows 的投影路径行为。
