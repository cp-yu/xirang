---
entity: element-declaration
identity: references-home
kind: capability-specification
parent: agent-workbench-projection
title: 共享 Reference 交付
definition: 共享 Reference 交付是息壤完整专项指导的项目级交付契约。它按指导主题组织唯一内容来源，承载语义写作与质量协作等独立指导，维护项目根引用、文件唯一性、工具中立、按需加载和用户模板路由；公共基础与阶段流程由 skills 承担，物理同步由工作面整体执行。
---

## Specification

### Section: Scope and Non-goals

共享 Reference 交付 SHALL 在项目级提供工具中立、按主题唯一维护的完整专项指导，并支持按需读取和用户模板路由。公共基础与阶段流程由 skills 承担，实际角色执行由 Agent 承担。

### Section: Business Logic

四分区差量的 Definition、Guidance、Template SHALL 从 schema 中的 semantic-delta 制品投影到项目根 `.xirang/references/xirang-artifact-semantic-delta.md`，文件名与工作面入口一致，Windows、macOS、Linux 上均可按项目根定位。

内置 reference SHALL 唯一物化于项目根 .xirang/references/，文件使用显式登记的 xirang-<name>.md 名称；各工具 skill 目录不保存副本。生成入口标明 project-root file，以项目根解析路径。内容与规范生成源一致，同一完整规则只在一个位置维护。

同步 SHALL 逐文件覆盖清单内的受管文件，不做目录级删除；清理只作用于显式登记及受管依据可确认的对象，不按名称模式猜测所有权。用户修改的受管文件按源模板重新交付，自定义方法和模板使用独立文件。

完整专项指导 SHALL 覆盖模型导航、语义写作及业务规格、结构分解及方法编写、测试质量、配置修改、Design Record、Quality 与恢复。共享语义写作指导规定当前状态、Declaration/Contract 边界、Section/Acceptance Case 与源意图忠实性；质量协作指导规定证据、角色委派、意见、Seal 与恢复。common 直接承载基本配置使用规则，用户修改请求按需读取 xirang-configuration-edit.md。

默认结构分解指导 SHALL 可通过默认 decomposition 值解析读取，按领域概念、能力或用户目标形成任意深度结构，区分有语义边界的 Perspective 与仅呈现的 View，使用类型化 Relationships 表达跨视角联系，在 Kind 不足时扩展元模型；不限制 C4 或固定层数。用户显式项目方法优先，框架身份、父子精化、MECE、广度优先与确认纪律由共享语义写作/工作流承担。本项目方法保留 semantic-objects/realization 及 realization-process/collaboration-structure 维度，项目专属划分不成为所有项目默认要求。

指导 SHALL 按实际工作需要读取，当前有效可用时复用，换项目、正文丢失或指导变化时重读；common 不预加载全部 references。业务规格写作前加载完整标准，Apply 仅消费 Contract 时不额外加载 4+N 编写规则。

Git 提交模板 SHALL 支持 git.commitMessage.boundary/archive/merge 的用户路径覆盖，路径为项目根相对 POSIX 字符串。已配置时读取用户文件，否则分别读取 xirang-boundary-commit-message.md、xirang-archive-commit-message.md、xirang-merge-summary-message.md；Agent 生成相应提交前读取对应模板，不在主 skill 内联完整格式，不以 archive CLI 的推荐文字替代读取。boundary 模板说明 subject、Why、Changes、Implementation footer 及信息来源；archive 模板说明 subject/Why/Changes；merge 模板说明 merge/squash 汇总格式。Windows、macOS、Linux 的物理定位使用平台路径解析，声明路径保持 POSIX 记法。

### Section: Edge Cases and Exception Handling

写入前 SHALL 校验全部 reference 文件名全局唯一及内容工具中立。文件名冲突须报告文件与来源且不写入；包含需专门转换的工具语法时报告 reference 与匹配内容，不写入该 reference。未登记用户文件保持原样，受管前缀本身不证明可删除。

非法 Git 模板路径（绝对路径、.. 上溯、反斜杠或非字符串）SHALL 告警并省略覆盖，回退内置模板；合法路径在实际读取时不可用则报告读取问题，不假称指导已取得。配置选中的结构分解指导不可读时停止结构工作，不替换方法。

### Section: Key Acceptance Cases

以下 Acceptance Cases SHALL 验证本 Contract 的机制、边界及可观察结果。

#### Acceptance Case: 唯一物理位置

不同工具生成的 skill 都用项目根标记指向 .xirang/references，同一指南只有一个项目级文件，skill 目录没有 references 副本。

#### Acceptance Case: 保护用户内容

存在自定义方法及用户模板：update 后原样保留；被编辑的受管 reference 按模板刷新，显式 decomposition 配置不被替换。

#### Acceptance Case: 默认和用户分解方法

默认方法文件可读并支持任意深度语义精化；配置其他合法方法路径时入口读取该路径，不用默认内容覆盖。

#### Acceptance Case: 配置修改按需入口

普通 context 读取直接遵循 common；用户要求修改配置时，common 指向可读 edit reference，包含授权、范围、字段选择、保留内容、重读校验与报告协议。

#### Acceptance Case: 文件名与工具中立校验

两个模板声明同名 reference 时，生成报告冲突且不写入；reference 含未转换工具语法时定位该文件并拒绝写入。

#### Acceptance Case: 用户提交模板路由

git.commitMessage.archive: .xirang/references/my-boundary.md 指向合法用户文件时，归档制品提交前读取该文件，不读内置 archive 模板；未配置时读取对应内置文件。

#### Acceptance Case: 跨平台与非法路径

Windows/POSIX 均能按项目根定位同一 reference；commitMessage 为绝对路径或含 .. 时省略覆盖并用内置路由，不影响其他合法配置。
