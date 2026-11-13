## Goals

- [x] G1: 用户能发现并理解项目配置入口及可配置能力
  - Contract: `config-command` / Section "Business Logic"
  - Contract: `workspace-init` / Section "Business Logic"
  - Contract: `project-config-management` / Section "Business Logic"
  - Verify: setup、顶层帮助、配置说明和 YAML 提供一致字段含义、默认值、示例及作用域；未初始化时仍可查看通用说明且不创建文件，全局工具设置不被误认为项目写入入口。

- [x] G2: 用户能详细检查配置有效性、来源和作用范围
  - Contract: `config-command` / Section "Business Logic"
  - Contract: `project-config-management` / Section "Business Logic"
  - Verify: 正常、缺失、损坏、未知嵌套字段、非法值、退役字段及不可读引用均产生对应结果；独立问题聚合，错误退出 1、仅警告退出 0；JSON 可解析，文本同义，配置与引用文件不被修改，双扩展名不被合并。

- [x] G3: 项目配置按有限迁移历史可靠演进并保护用户内容
  - Contract: `project-config-management` / Section "Business Logic"
  - Contract: `workspace-update` / Section "Business Logic"
  - Contract: `project-config-loading` / Section "Business Logic"
  - Verify: 基线版本 1 与软件版本区分；完整的最近 10 次迁移链能成功，超窗口或缺链报告所需版本范围；缺失、非法或较新版本不猜测，步骤、最终校验或写入失败均保留原文件和版本；成功原子写回，陈旧内容仅按明确清单清理并提示，重复 update 无重复变化，缺失/损坏文件不恢复。

- [x] G4: Agent 从 common 按作用域读取配置并按用户授权修改
  - Contract: `skill-generation` / Section "Business Logic"
  - Contract: `agent` / Section "按用户意图修改项目配置"
  - Contract: `references-home` / Section "Business Logic"
  - Verify: common 后读取 context、未变可复用、修改后重新读取；规则和操作配置仅在适用时取得；修改协议按需可达，长期/仅本次/模型建议被正确区分，更新已有对应字段且保留无关内容；旧 use 文件及加载入口同步退出，无悬空引用，不授予只读角色写权限。

- [x] G5: 有效配置与模型总览使用统一名称并退出无效优化开关
  - Contract: `project-tooling-configuration` / Section "Business Logic"
  - Contract: `arch-outline` / Section "Business Logic"
  - Contract: `project-config-loading` / Section "Business Logic"
  - Contract: `apply-quality-integration` / Section "配置驱动优化控制"
  - Contract: `agent-prompt-guidance` / Section "简单变更快速路径识别"
  - Contract: `apply-quality-integration` / Section "以委托交付推进优化"
  - Verify: definitionDepth 默认为 2、零深度和本次命令覆盖符合完整层级语义，配置与 outline JSON 不返回旧别名；项目/全局配置及 setup/update 不生成 optimization，它不再控制 Opt，主 Agent 的可选优化与必需质量门禁保持一致。

- [x] G6: 配置发现、检查和演进在各平台保持一致
  - Contract: `project-config-management` / Section "Business Logic"
  - Contract: `workspace-update` / Section "Business Logic"
  - Contract: `references-home` / Section "Business Logic"
  - Verify: Windows CI 与 macOS/Linux 的配置和引用定位、双扩展名选择、迁移内容保护及受管文件清理结果一致；平台分隔符、含空格路径与换行差异不改变逻辑行为。入口说明与完整生命周期完成一次性最终检查，普通说明文字不形成逐句长期约束。

- [x] G7: 工作面按统一职责完整交付公共与阶段指导
  - Contract: `agent-workbench-projection` / Section "Business Logic"
  - Contract: `skill-generation` / Section "Business Logic"
  - Contract: `references-home` / Section "Business Logic"
  - Verify: setup/update 的六工作流、common、内部 Agent 和 references 交付一致；工具适配确定且不改变语义，200/500 长度约束逐文件覆盖所有变体；Snack 保留全部证据来源、条件调和及无任务清单边界，专项指导入口可达，角色权限和用户 model 设置保持。

- [x] G8: Semantic Delta 的制品身份和配置规则在全部消费入口一致
  - Contract: `artifact-graph` / Section "Semantic Model 制品图"
  - Contract: `artifact-workflow-commands` / Section "Semantic Delta 制品查询"
  - Contract: `instruction-loader` / Section "向工作面交付静态制品指导"
  - Contract: `change-artifacts` / Section "制品语义边界"
  - Contract: `change-artifacts` / Section "制品定义先行写作"
  - Contract: `config-command` / Section "Business Logic"
  - Contract: `skill-generation` / Section "Business Logic"
  - Contract: `references-home` / Section "Business Logic"
  - Verify: schema、依赖、状态、模板、authoring help、rules.semantic-delta 与生成指导均使用 semantic-delta；原有项目规则原文有效且不泄漏到其他制品；仅关系或 View 的差量可完成，无差量用 .delta-noop，完全缺失保持未完成并阻塞依赖；四分区和模板载体不变，源指导、生成文件及受管清理同步，无悬空引用。
