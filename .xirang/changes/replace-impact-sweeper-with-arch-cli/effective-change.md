# Effective Change

Change: replace-impact-sweeper-with-arch-cli
Status: Passed
Formal fingerprint: e3f4819d790b8eed4b858676a95d6b354f17be2b9afe4e4f638dc21ecc3305de
Change fingerprint: ccfdf53cccf31c15edb52b8cc583009e336907f87e7f70053a782cf3d450b1f1

## Summary

- Total: 62
- Specs: +11 ~9 -23
- Architecture: +9 ~3 -7

## Specs

- requirement ai-impact-sweeper#直接返回 canonical JSON report
- requirement ai-impact-sweeper#Evidence Protocol 使用 CLI 查询接口
- requirement ai-impact-sweeper#Impact sweeper description 提示 fast model
- requirement ai-impact-sweeper#Sweeper 全程只读
~ requirement ai-workflow-templates#内部 subagent 引用替换内联 fragment
  ~ property ai-workflow-templates#内部 subagent 引用替换内联 fragment.body
  ~ scenario ai-workflow-templates#内部 subagent 引用替换内联 fragment#Apply 模板 Phase 2 的 optimizer agent
~ requirement ai-workflow-templates#Workflow Skills 声明 Internal Subagents 约束
  ~ property ai-workflow-templates#Workflow Skills 声明 Internal Subagents 约束.body
  ~ scenario ai-workflow-templates#Workflow Skills 声明 Internal Subagents 约束#Apply skill 的 instructions 结构
  ~ scenario ai-workflow-templates#Workflow Skills 声明 Internal Subagents 约束#Explore skill 的 instructions 结构
+ requirement arch-impact-command#arch impact SHALL 返回 bounded Relationship subgraph
+ requirement arch-impact-command#arch impact SHALL 返回完整 Element Contracts
+ requirement arch-impact-command#arch impact SHALL 分离 refinement context
+ requirement arch-impact-command#arch impact SHALL 共享统一输出投影
+ requirement arch-impact-command#arch impact SHALL 接受 focus Elements
+ requirement arch-impact-command#arch impact SHALL 投影 canonical shortest paths
+ requirement arch-impact-command#arch impact SHALL 只处理 Formal Semantic Model
+ requirement arch-search-command#arch search SHALL 保持只读和跨平台路径一致
+ requirement arch-search-command#arch search SHALL 返回可解释的统一结果
+ requirement arch-search-command#arch search SHALL 检索 Formal Semantic Model
+ requirement arch-search-command#arch search SHALL 使用稳定匹配优先级
~ requirement explore-brainstorming#Explore 通过 referenceFiles 暴露 superpowers 行为引导
  ~ property explore-brainstorming#Explore 通过 referenceFiles 暴露 superpowers 行为引导.body
  ~ scenario explore-brainstorming#Explore 通过 referenceFiles 暴露 superpowers 行为引导#explore 声明 supperpowers-style reference
  ~ scenario explore-brainstorming#Explore 通过 referenceFiles 暴露 superpowers 行为引导#reference 不重复主 instructions 机制
  ~ scenario explore-brainstorming#Explore 通过 referenceFiles 暴露 superpowers 行为引导#reference 内容路由到 propose 而非直接写入
  ~ scenario explore-brainstorming#Explore 通过 referenceFiles 暴露 superpowers 行为引导#主 instructions 保持精简并指向 reference
~ requirement explore-brainstorming#Explore 主代理保持只读
  ~ property explore-brainstorming#Explore 主代理保持只读.body
  ~ scenario explore-brainstorming#Explore 主代理保持只读#Explore skill 声明只读阶段边界表格
  ~ scenario explore-brainstorming#Explore 主代理保持只读#Explore 不写入制品
  + scenario explore-brainstorming#Explore 主代理保持只读#Explore 直接获取 semantic impact context
  - scenario explore-brainstorming#Explore 主代理保持只读#Impact sweeper 保持只读
- requirement explore-terminology-decision#术语提问保持用户可读
- requirement explore-terminology-decision#术语问题服从 Explore 提问纪律
- requirement explore-terminology-decision#用户术语决策仅记录于当前对话
- requirement explore-terminology-decision#长术语列表正确截断
- requirement explore-terminology-decision#Explore 执行四态术语判断
~ requirement internal-subagent-generation#旧 internal skill 目录迁移 cleanup
  ~ property internal-subagent-generation#旧 internal skill 目录迁移 cleanup.body
  - scenario internal-subagent-generation#旧 internal skill 目录迁移 cleanup#Cleanup 使用显式列表
  + scenario internal-subagent-generation#旧 internal skill 目录迁移 cleanup#Cleanup 跨平台构造路径
  + scenario internal-subagent-generation#旧 internal skill 目录迁移 cleanup#用户同名文件保持不变
~ requirement internal-subagent-generation#Generated subagent artifact 编码 subagent-self-read 权限模型
  ~ property internal-subagent-generation#Generated subagent artifact 编码 subagent-self-read 权限模型.body
  - scenario internal-subagent-generation#Generated subagent artifact 编码 subagent-self-read 权限模型#Impact sweeper 全程只读
  + scenario internal-subagent-generation#Generated subagent artifact 编码 subagent-self-read 权限模型#Optimizer artifact 声明 read-only 权限
  ~ scenario internal-subagent-generation#Generated subagent artifact 编码 subagent-self-read 权限模型#Reviewer artifact 声明 read-only 权限
  ~ scenario internal-subagent-generation#Generated subagent artifact 编码 subagent-self-read 权限模型#权限模型与 subagent-self-read 一致
~ requirement internal-subagent-generation#Internal subagent 模板注册
  ~ property internal-subagent-generation#Internal subagent 模板注册.body
  - scenario internal-subagent-generation#Internal subagent 模板注册#Internal subagent 不进入 workflow manifest
  + scenario internal-subagent-generation#Internal subagent 模板注册#Internal subagents 不进入 workflow manifest
  - scenario internal-subagent-generation#Internal subagent 模板注册#显式注册三个 internal subagent
  + scenario internal-subagent-generation#Internal subagent 模板注册#显式注册两个 internal subagents
  ~ scenario internal-subagent-generation#Internal subagent 模板注册#源模型字段为语义字段
~ requirement internal-subagent-generation#Per-tool subagent artifact 渲染
  ~ property internal-subagent-generation#Per-tool subagent artifact 渲染.body
  ~ scenario internal-subagent-generation#Per-tool subagent artifact 渲染#Claude renderer 输出 Markdown agent 文件
  ~ scenario internal-subagent-generation#Per-tool subagent artifact 渲染#Codex renderer 输出 TOML
  ~ scenario internal-subagent-generation#Per-tool subagent artifact 渲染#OpenCode renderer 输出 subagent mode 与 permission
  + scenario internal-subagent-generation#Per-tool subagent artifact 渲染#Pi renderer 输出 foreground guidance
  - scenario internal-subagent-generation#Per-tool subagent artifact 渲染#Pi renderer 输出含 name 的 Markdown agent 文件
  ~ scenario internal-subagent-generation#Per-tool subagent artifact 渲染#TOML multiline 安全转义
  ~ scenario internal-subagent-generation#Per-tool subagent artifact 渲染#显式设置 model 时输出 model 字段
~ requirement internal-subagent-generation#Subagent artifact 写入路径
  ~ property internal-subagent-generation#Subagent artifact 写入路径.body
  + scenario internal-subagent-generation#Subagent artifact 写入路径#Codex artifact 使用 toml 扩展名
  - scenario internal-subagent-generation#Subagent artifact 写入路径#Codex artifact 写入 .toml 扩展名
  + scenario internal-subagent-generation#Subagent artifact 写入路径#Markdown artifact 使用 md 扩展名
  - scenario internal-subagent-generation#Subagent artifact 写入路径#Markdown artifact 写入 .md 扩展名
  + scenario internal-subagent-generation#Subagent artifact 写入路径#Windows 上 reviewer 路径一致
  - scenario internal-subagent-generation#Subagent artifact 写入路径#跨平台路径一致
- requirement opsx-impact-sweeper-architecture#Impact sweeper SHALL 使用 LikeC4 导航架构
- requirement subagent-self-read#Impact Sweeper 保持只读
- requirement sweeper-terminology-extraction#复合术语处理
- requirement sweeper-terminology-extraction#术语提取触发条件
- requirement sweeper-terminology-extraction#术语提取失败时的降级行为
- requirement sweeper-terminology-extraction#术语统计与分布追踪
- requirement sweeper-terminology-extraction#语义相近术语识别
- requirement sweeper-terminology-extraction#Prompt 指令规范
- requirement sweeper-terminology-reporting#向后兼容性保证
- requirement sweeper-terminology-reporting#字段省略规则
- requirement sweeper-terminology-reporting#foundInSpecs 数组排序规则
- requirement sweeper-terminology-reporting#JSON Schema 扩展文档
- requirement sweeper-terminology-reporting#specs 数组去重与排序
- requirement sweeper-terminology-reporting#terminologyObservations 字段结构

## Architecture

- element cap.ai.explore-terminology-decision
- element cap.ai.impact-sweeper
~ element cap.ai.internal-subagent-generation
  ~ property cap.ai.internal-subagent-generation.summary
- element cap.ai.sweeper-terminology-extraction
- element cap.ai.sweeper-terminology-reporting
+ element cap.cli.arch-impact
+ element cap.cli.arch-search
~ element project.root/domain.ai_integration
~ element project.root/domain.cli
+ relationship cap.ai.explore-brainstorming|invokes|cap.cli.arch-impact
+ relationship cap.ai.explore-brainstorming|invokes|cap.cli.arch-search
- relationship cap.ai.explore-terminology-decision|consumes|cap.ai.sweeper-terminology-reporting
- relationship cap.ai.impact-sweeper|invokes|cap.ai.sweeper-terminology-extraction
- relationship cap.ai.sweeper-terminology-reporting|consumes|cap.ai.sweeper-terminology-extraction
+ relationship cap.cli.arch-impact|invokes|cap.architecture.likec4-reader
+ relationship cap.cli.arch-impact|invokes|cap.spec.registry
+ relationship cap.cli.arch-query|invokes|cap.spec.registry
+ relationship cap.cli.arch-search|invokes|cap.architecture.likec4-reader
+ relationship cap.cli.arch-search|invokes|cap.spec.registry

## Diagnostics

None.
