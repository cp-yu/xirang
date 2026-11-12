## Goals

- [x] G1: Explore 按重要语义选择交接设计，允许 Propose 完成局部模型组织
  - Contract: `explore` / Section "澄清 Element Definition 影响"
  - Verify: 目标、范围和方案已确认时，尚需局部组织或完整 Definition 不导致机械暂停；影响这些设计的重要未决选择仍先交用户裁决，记录与 Summary 保留已确认依据。

- [x] G2: Propose 自主组织模型并在必要时请求决策，完整呈现结构变化
  - Contract: `propose` / Section "查缺补漏与决策确认"
  - Verify: 多种均合理的局部组织可以有依据地形成草稿并说明理由；改变已确认承诺、结构决定或重大权衡时先询问；真实 blocker、override、结构审阅及最终接受门槛保持，受影响 Delta 与 Plan 一致。

- [x] G3: 模型演进后受影响 Elements 的表达完整、合适且避免重复
  - Contract: `authoring-conventions` / Section "模型演进中的目标表达"
  - Verify: 增加子级后可迁移细节并调整父级 Sections，父级本层承诺仍独立完整；合并或删除 Element/Section 时应保留的语义由适当位置承接；同层去重不删除必要跨层语义，也不扩大到无关改写。

- [x] G4: 项目分解方法在框架纪律内定制，创建指导按需可达
  - Contract: `skill-generation` / Section "项目分解方法创建指导"
  - Verify: 创建或修改方法时可取得创建指南与框架依据，日常使用不额外加载指南；配置方法仍服从父子精化、同层 MECE 与 BF，逐层形成不等于逐层审批；默认方法与本项目方法保留各自具体选择。

- [x] G5: 提示词集中承载规则并以实际结果评价精简
  - Contract: `workflow-templates` / Section "以行为门禁组织形成提示词"
  - Verify: 重复规则及无信息增量的引用被移除，各步骤的实际检查和独立入口所需指导仍可用；可比的重复与多样场景中，局部组织、实质确认、语义保持和加载行为可观察，运行成本及失败如实报告，不以文本缩短代替质量或收益证据。

- [x] G6: 各平台正确交付新指导并直接退役旧入口
  - Contract: `agent-workbench-projection` / Section "物化共享片段与 references"
  - Verify: Windows CI 及 macOS/Linux 的投影结果中新指南和共享语义指导可达，旧 decomposition-use 不再生成或引用；更新既有工作区时旧文件、用户方法与显式配置值不因本次调整被删除，平台路径分隔符不改变行为。未取得的平台证据明确披露。

- [x] G7: CLI 版本演进不承担旧用法兼容承诺
  - Contract: `framework-identity` / Section "CLI 向后兼容边界"
  - Verify: 不兼容的旧入口退役时，新 CLI 不依赖旧入口、转发别名或迁移支持才能工作；用户与 Agent 可处理旧工作区的适配，且跨平台路径正确性与用户文件保护不因此取消。
