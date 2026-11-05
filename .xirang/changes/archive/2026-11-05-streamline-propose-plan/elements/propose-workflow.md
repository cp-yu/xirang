---
entity: element-declaration
identity: propose-workflow
kind: element
parent: propose
title: Propose Workflow
definition: Propose Workflow 定义 propose workflow 创建 change、分离 behavior/architecture source impact、生成完整制品并执行轻量验证的行为：semantic readiness 门禁、Design Summary 复用、制品定义先行写作、架构范围 reconcile、post-propose validation 一致性验证门禁与状态输出收敛。
---

## MODIFIED Sections

### Section: Propose smart routing

Propose SHALL 优先复用 conversation 中已确认的 `Design Summary`，忠实文档化已确认设计。它 MAY 在既定范围内自主处理细枝末节、组织案例和目标及修正表达或推导错误，不得自主大量扩写实质设计；新发现的重大决策点 SHALL 先说明选项与推荐，再一次一问等待用户确认。小范围内容与方案调整可在 Propose 内交互确认并维护记录；需要重新设计实验判断可行性或大幅重做设计时返回 Explore；完成披露不能代替决策前确认。没有 Summary 时 SHALL 依据 problem、impact scope、approach、verification method 与未决 Source decisions 判断 semantic readiness，不得使用输入长度或技术关键词评分。Readiness 与 override 结果 SHALL 只存在于对话状态，不得写入 artifacts。

- **复用 Design Summary**
  - conversation 包含已确认的 Design Summary
  - Propose 说明正在复用，向 proposal、Delta、design 与 tasks 分发适用的确认内容
  - SHALL NOT 重新执行字符数或 detail score 判断

- **Semantic readiness 不完整**
  - 任一 readiness 项缺失或 Source decision 未决
  - Propose 在对话中列出具体缺口；孤立决策可就地询问，大幅设计工作建议 Explore
  - readiness 通过或被明确 override 前 SHALL NOT 创建 change 或写入制品
  - 新决策确认前 SHALL NOT 将依赖它的内容写成确定方案

- **用户显式 override**
  - Propose 已报告 readiness 缺口且用户明确要求直接生成
  - Propose 接受 override 但 SHALL NOT 猜测影响 behavior 或 architecture 的关键决策；必要确认无法取得时报告阻碍

- **无 Summary 的最低就绪条件**
  - problem、impact scope、approach 与 verification method 均明确且不存在影响 Source 的未决决策
  - Propose 说明就绪并继续，不因涉及多个 subsystem 就强制返回 Explore

- **测试安排分发**
  - 已确认测试策略含过时测试原因或一次性验证
  - 过时原因写入 design；tasks 只记录对应目标与要验证的结果，包括删除后的缺失结果，不预定测试文件、动作或一次性命令
  - Apply 在实施时判断具体测试更新、删除与一次性验证，不制造多余持久测试

- **Routing decision 不污染 artifacts**
  - Propose 报告 readiness、缺失项或 override
  - 这些运行过程信息 SHALL 只保留在对话，不写入 Change 制品

### Section: Propose 状态输出保持收敛

Propose SHALL 默认只在 readiness、blocker 与 final summary 节点输出流程状态；用户要求交互模式时 SHALL 在按机制展示草稿的审阅节点与用户讨论，而不逐制品播报进度。需要用户决定时 SHALL 一次询问一个问题。

- **Readiness 状态**
  - Propose 完成 semantic readiness 判断
  - SHALL 报告 Design Summary reuse、readiness 或具体 gap

- **最终总结**
  - Propose 完成 artifacts、validation 与 report generation
  - SHALL 汇总 artifacts、errors/warnings、effective diff review 与 ready-for-apply 状态
  - SHALL 区分沿用的确认、合理推导细节及依据和位置、Propose 内新确认决策与未决事项；无补充或新决策时明确说明
  - SHALL 区分实际 CLI 结果、Agent 语义检查与证据缺口，不以制品数量或引用合法代替实际覆盖，不另建补充台账
  - 影响目标或方案的未决决策 SHALL 阻塞 ready-for-apply

- **Blocker 状态**
  - identity、source decision、validation 或 effective diff 阻塞流程
  - SHALL 报告必要 blocker，需用户决定时一次问一个问题

### Section: Propose 按 TDD 闭环划分 Tasks

Propose 生成 `tasks.md` 时 SHALL 按用户能审阅的目标行为而非代码文件、组件或规范条目数量组织任务；每个目标 SHALL 说明需要验证的行为、边界和预期可观察结果，并指向相应 Contract，而不复制完整规范或提前选择测试边界、动作、文件与命令。相关提示词、受管生成面及实现由 Apply 在同一目标下形成可验证闭环。Propose SHALL 对照已确认来源、目标 Contract 和任务目标/验证方向检查语义覆盖，不能仅核对引用存在；缺少目标行为时先修正 Contract。只有用户指定的实施次序 SHALL 排列为任务先后并在 design 或 proposal 至少一处说明；普通技术依赖由 Apply 在现场判断。

- **跨组件目标**
  - 多个实现面交付同一行为
  - Propose SHALL 作为同一目标与验证方向呈现，不按文件类型拆分

- **边界与例外**
  - 目标 Contract 含适用条件、例外或时序
  - Propose SHALL 确认任务的验证方向包含相应可观察结果，不为每个 Acceptance Case 机械建立 Check

- **用户指定先后次序**
  - 用户要求 A 完成后才能推进 B
  - tasks SHALL 把 A 放在 B 前，design 或 proposal 至少一处说明依据；业务时序或数据状态约束 SHALL 由 Delta Contract 表达

- **就绪复核**
  - 目标语义已确定，Propose 准备声明可实施
  - SHALL 检查每个待实现目标有可理解的任务与验证方向，未规定普通任务必须预先达成独立 GREEN 或列出全部实际依赖

### Section: 按复杂度组织交互审阅

Workflow SHALL 默认引导 Propose 在材料决策齐备时连续编写完整 Change 后集中审阅；只有用户明确要求交互推进时 SHALL 按一项机制或一组相关 Elements 的实际草稿及其目标、验证方向分段审阅，反馈后继续。简单变更可只有一组，不按 Element 数量或 artifact 写作顺序机械停顿。两种模式下，新发现的重大缺口都 SHALL 及时提出并等待裁决，批量模式不授予 Agent 猜测未确认决策的权力。
