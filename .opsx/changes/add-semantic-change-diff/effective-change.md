# Effective Change

Change: add-semantic-change-diff
Status: Passed
Formal fingerprint: ee71ddb58aeb6df6b81d8ad2a82cb68b63eae1d95038516bb8f320a70ddcb6f6
Change fingerprint: 308833ae070eb3bc0af69a3018df7e33cff7d5f4bd157b91c90ce83c2788c263

## Summary

- Total: 70
- Specs: +13 ~42 -2
- Architecture: +5 ~8 -0

## Specs

~ requirement apply-preflight-scan#Task 间矛盾检测
  ~ property apply-preflight-scan#Task 间矛盾检测.body
  + scenario apply-preflight-scan#Task 间矛盾检测#Scenario anchor 使用 exact canonical title
  - scenario apply-preflight-scan#Task 间矛盾检测#labeled scenario Verifies 使用 clean title 匹配
  ~ scenario apply-preflight-scan#Task 间矛盾检测#扫描干净时无声继续
  ~ scenario apply-preflight-scan#Task 间矛盾检测#检测到 task 间文件声明互斥
  + scenario apply-preflight-scan#Task 间矛盾检测#检测到 task 需求与 Spec 冲突
  - scenario apply-preflight-scan#Task 间矛盾检测#检测到 task 需求与 spec 冲突
+ requirement arch-plan-remove-command#Architecture removal impact planning
+ requirement arch-plan-remove-command#Change-aware removal planning
+ requirement arch-plan-remove-command#Removal planning output contract
~ requirement arch-validate-command#arch validate SHALL 支持 --delta 选项
  ~ property arch-validate-command#arch validate SHALL 支持 --delta 选项.body
  + scenario arch-validate-command#arch validate SHALL 支持 --delta 选项#Empty delta 被拒绝
  + scenario arch-validate-command#arch validate SHALL 支持 --delta 选项#Formal snapshot 不被修改
  + scenario arch-validate-command#arch validate SHALL 支持 --delta 选项#Partial target 失败
  + scenario arch-validate-command#arch validate SHALL 支持 --delta 选项#Raw extend delta 被拒绝
  - scenario arch-validate-command#arch validate SHALL 支持 --delta 选项#验证 delta 文件
  + scenario arch-validate-command#arch validate SHALL 支持 --delta 选项#验证合法 delta 文件
~ requirement architecture-delta-artifact#Change SHALL 使用 architecture-delta.c4 表达架构增量
  ~ property architecture-delta-artifact#Change SHALL 使用 architecture-delta.c4 表达架构增量.body
  + scenario architecture-delta-artifact#Change SHALL 使用 architecture-delta.c4 表达架构增量#Delta 文件必须包含真实 operation
  ~ scenario architecture-delta-artifact#Change SHALL 使用 architecture-delta.c4 表达架构增量#创建 graph delta
  ~ scenario architecture-delta-artifact#Change SHALL 使用 architecture-delta.c4 表达架构增量#只有 contract delta
~ requirement architecture-delta-artifact#Delta 合并 SHALL 原子性更新 formal 模型
  ~ property architecture-delta-artifact#Delta 合并 SHALL 原子性更新 formal 模型.body
  + scenario architecture-delta-artifact#Delta 合并 SHALL 原子性更新 formal 模型#Formal snapshot 变更
  ~ scenario architecture-delta-artifact#Delta 合并 SHALL 原子性更新 formal 模型#任一 module 失败回滚
  - scenario architecture-delta-artifact#Delta 合并 SHALL 原子性更新 formal 模型#联合合并成功
  + scenario architecture-delta-artifact#Delta 合并 SHALL 原子性更新 formal 模型#联合编译成功
~ requirement architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法
  ~ property architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法.body
  + scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#Metamodel target state
  + scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#Relationship identity
  - scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#Staged validation 忽略运行缓存
  ~ scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#修改 existing element
  + scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#修改 kind 或 identity
  + scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#修改 parent
  - scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#扩展任意 existing element
  + scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#新增 element
  - scenario architecture-delta-artifact#Delta 文件 SHALL 使用 LikeC4 extend 语法#添加 semantic relationship
~ requirement architecture-delta-artifact#Delta 文件 SHALL 引用 change-local specs
  ~ property architecture-delta-artifact#Delta 文件 SHALL 引用 change-local specs.body
  + scenario architecture-delta-artifact#Delta 文件 SHALL 引用 change-local specs#Element 删除不级联删除 binding
  ~ scenario architecture-delta-artifact#Delta 文件 SHALL 引用 change-local specs#Spec 绑定新 element
~ requirement architecture-delta-artifact#Delta 验证 SHALL 检查 extend 目标存在
  ~ property architecture-delta-artifact#Delta 验证 SHALL 检查 extend 目标存在.body
  + scenario architecture-delta-artifact#Delta 验证 SHALL 检查 extend 目标存在#Declared MODIFIED 无 effective change
  - scenario architecture-delta-artifact#Delta 验证 SHALL 检查 extend 目标存在#Extend target 不存在
  + scenario architecture-delta-artifact#Delta 验证 SHALL 检查 extend 目标存在#Operation identity precondition
  - scenario architecture-delta-artifact#Delta 验证 SHALL 检查 extend 目标存在#Spec target 只存在于同一 delta
  + scenario architecture-delta-artifact#Delta 验证 SHALL 检查 extend 目标存在#删除存在未处理依赖
  + scenario architecture-delta-artifact#Delta 验证 SHALL 检查 extend 目标存在#同一 identity operation 冲突
+ requirement architecture-delta-artifact#Element replacement review hint
~ requirement archive-sync-workflow#archive SHALL 删除 architecture-delta.c4
  ~ property archive-sync-workflow#archive SHALL 删除 architecture-delta.c4.body
  + scenario archive-sync-workflow#archive SHALL 删除 architecture-delta.c4#封存已消费 delta 与 review report
  ~ scenario archive-sync-workflow#archive SHALL 删除 architecture-delta.c4#未同步 delta 阻塞 archive
  - scenario archive-sync-workflow#archive SHALL 删除 architecture-delta.c4#清理已消费 delta
~ requirement archive-sync-workflow#sync SHALL 合并 architecture-delta.c4
  ~ property archive-sync-workflow#sync SHALL 合并 architecture-delta.c4.body
  ~ scenario archive-sync-workflow#sync SHALL 合并 architecture-delta.c4#Spec binding 由 frontmatter formalize
  + scenario archive-sync-workflow#sync SHALL 合并 architecture-delta.c4#严格 removal
  ~ scenario archive-sync-workflow#sync SHALL 合并 architecture-delta.c4#合并 semantic relationships
  - scenario archive-sync-workflow#sync SHALL 合并 architecture-delta.c4#合并任意 kind child element
  + scenario archive-sync-workflow#sync SHALL 合并 architecture-delta.c4#合并任意 kind element target
  ~ scenario archive-sync-workflow#sync SHALL 合并 architecture-delta.c4#合并失败回滚
~ requirement artifact-file-definitions#结构化文件定义
  ~ property artifact-file-definitions#结构化文件定义.body
  - scenario artifact-file-definitions#结构化文件定义#Agent requests instructions
  + scenario artifact-file-definitions#结构化文件定义#Generated review artifact definition
  + scenario artifact-file-definitions#结构化文件定义#Validation contract 保持只读
  + scenario artifact-file-definitions#结构化文件定义#不完整 definition 被拒绝
  + scenario artifact-file-definitions#结构化文件定义#内置 artifact definition 可解析
~ requirement artifact-file-definitions#Agent definition-first authoring
  ~ property artifact-file-definitions#Agent definition-first authoring.body
  + scenario artifact-file-definitions#Agent definition-first authoring#Blocked artifact 仍可理解
  - scenario artifact-file-definitions#Agent definition-first authoring#Definition conflicts with prose guidance
  + scenario artifact-file-definitions#Agent definition-first authoring#Generic Specs guidance 不编排 derived operations
  + scenario artifact-file-definitions#Agent definition-first authoring#Instructions JSON 返回 definition 与 current state
  + scenario artifact-file-definitions#Agent definition-first authoring#文本输出按 definition-first 顺序展示
~ requirement artifact-file-definitions#Spec-driven 文件语义边界
  ~ property artifact-file-definitions#Spec-driven 文件语义边界.body
  + scenario artifact-file-definitions#Spec-driven 文件语义边界#Architecture Source 无变化
  + scenario artifact-file-definitions#Spec-driven 文件语义边界#Behavior Source 无变化
  - scenario artifact-file-definitions#Spec-driven 文件语义边界#Change affects architecture
  + scenario artifact-file-definitions#Spec-driven 文件语义边界#Proposal 分离 source impact
  + scenario artifact-file-definitions#Spec-driven 文件语义边界#Review artifact 不参与 compilation
  + scenario artifact-file-definitions#Spec-driven 文件语义边界#Specs 与 Architecture delta 不争夺语义所有权
~ requirement cli-archive#Archive Process
  ~ property cli-archive#Archive Process.body
  + scenario cli-archive#Archive Process#Final report generation 失败
  ~ scenario cli-archive#Archive Process#已归档 change 检测
  ~ scenario cli-archive#Archive Process#归档失败不回写
  ~ scenario cli-archive#Archive Process#直接归档
~ requirement cli-archive#Archive Validation
  ~ property cli-archive#Archive Validation.body
  ~ scenario cli-archive#Archive Validation#Force archive without validation
  ~ scenario cli-archive#Archive Validation#Pre-archive validation
  + scenario cli-archive#Archive Validation#跨平台 archive report path
+ requirement cli-diff#Change semantic diff command
+ requirement cli-diff#Diff projections share one result
+ requirement cli-diff#Effective change review artifact
+ requirement cli-diff#Partial diff diagnostics
- requirement cli-scenario-labels#Scenario label derivation
- requirement cli-scenario-labels#Scenario label fix command
~ requirement cli-sync#不触发归档
  ~ property cli-sync#不触发归档.body
  ~ scenario cli-sync#不触发归档#同步后 change 目录保持不变
~ requirement cli-sync#幂等性
  ~ property cli-sync#幂等性.body
  - scenario cli-sync#幂等性#labeled scenario 不触发重复 pending
  + scenario cli-sync#幂等性#removal-only delta 清空 Spec
  - scenario cli-sync#幂等性#removal-only delta 清空 spec 后重复执行
  ~ scenario cli-sync#幂等性#removal-only delta 的目标 headers 已缺失
  - scenario cli-sync#幂等性#removed scenario block 不触发重复 pending
  - scenario cli-sync#幂等性#unlabeled scenario differences 不阻塞 sync
  + scenario cli-sync#幂等性#完整 MODIFIED Requirement 已同步
  ~ scenario cli-sync#幂等性#重复执行产生相同结果
~ requirement cli-sync#同步执行
  ~ property cli-sync#同步执行.body
  ~ scenario cli-sync#同步执行#--no-verify 跳过 gate
  + scenario cli-sync#同步执行#sync 不修改 change review source
  - scenario cli-sync#同步执行#sync 不写入 scenario labels
  ~ scenario cli-sync#同步执行#verify gate 通过后执行同步
~ requirement cli-sync#Semantic Delta SHALL 原子提升
  ~ property cli-sync#Semantic Delta SHALL 原子提升.body
  ~ scenario cli-sync#Semantic Delta SHALL 原子提升#Contract failure 回滚 graph
  ~ scenario cli-sync#Semantic Delta SHALL 原子提升#Graph 与 contract 联合成功
  + scenario cli-sync#Semantic Delta SHALL 原子提升#Stale Formal snapshot
  ~ scenario cli-sync#Semantic Delta SHALL 原子提升#Windows 原子 sync
+ requirement cli-sync#Sync 按实际 OPSX operations 判断同步需求
+ requirement cli-sync#Sync 拒绝非 canonical 空 OPSX delta
~ requirement cli-sync#Sync-created specs SHALL use runtime projection
  ~ property cli-sync#Sync-created specs SHALL use runtime projection.body
  ~ scenario cli-sync#Sync-created specs SHALL use runtime projection#Existing formal spec update does not inject unrelated boilerplate
  ~ scenario cli-sync#Sync-created specs SHALL use runtime projection#New formal spec uses projected prose policy
  - scenario cli-sync#Sync-created specs SHALL use runtime projection#Removed scenario labels 不进入 formal specs
  + scenario cli-sync#Sync-created specs SHALL use runtime projection#Scenario label 阻止 sync
  - scenario cli-sync#Sync-created specs SHALL use runtime projection#Scenario operation labels 不进入 formal specs
~ requirement cli-validate#Artifact-scoped change validation
  ~ property cli-validate#Artifact-scoped change validation.body
  + scenario cli-validate#Artifact-scoped change validation#Architecture artifact scope
  - scenario cli-validate#Artifact-scoped change validation#Architecture delta artifact scope validates only architecture-delta
  - scenario cli-validate#Artifact-scoped change validation#Explicit change validation defaults to full change validation
  + scenario cli-validate#Artifact-scoped change validation#Explicit change 默认完整 validation
  + scenario cli-validate#Artifact-scoped change validation#Missing active change
  - scenario cli-validate#Artifact-scoped change validation#Missing explicit change fails deterministically
  + scenario cli-validate#Artifact-scoped change validation#Specs artifact scope
  - scenario cli-validate#Artifact-scoped change validation#Specs artifact scope validates only delta specs
  + scenario cli-validate#Artifact-scoped change validation#Unknown artifact scope
  - scenario cli-validate#Artifact-scoped change validation#Unknown artifact scope fails deterministically
+ requirement cli-validate#Change validation effective preview
~ requirement cli-validate#Scenario operation label 校验
  ~ property cli-validate#Scenario operation label 校验.body
  + scenario cli-validate#Scenario operation label 校验#ADDED label 报错
  - scenario cli-validate#Scenario operation label 校验#ADDED requirement 无标签 scenario 通过校验
  + scenario cli-validate#Scenario operation label 校验#Canonical unlabeled Scenario 通过
  + scenario cli-validate#Scenario operation label 校验#Change-local label 报错
  - scenario cli-validate#Scenario operation label 校验#MODIFIED label 不允许出现在 ADDED requirement 中
  - scenario cli-validate#Scenario operation label 校验#MODIFIED requirement 下无标签 scenario 通过校验
  + scenario cli-validate#Scenario operation label 校验#REMOVED label block 报错
  - scenario cli-validate#Scenario operation label 校验#REMOVED scenario 不允许出现在 ADDED requirement 中
  + scenario cli-validate#Scenario operation label 校验#Unknown bracket prefix
  - scenario cli-validate#Scenario operation label 校验#surviving scenario 数量必须非零
  - scenario cli-validate#Scenario operation label 校验#合法 scenario labels 通过 change validation
  - scenario cli-validate#Scenario operation label 校验#未知 label 报错
  - scenario cli-validate#Scenario operation label 校验#非法 label 位置报错
~ requirement cli-validate#Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels
  ~ property cli-validate#Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels.body
  + scenario cli-validate#Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels#CRLF 行尾
  - scenario cli-validate#Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels#全部真实 scenario 为 REMOVED 时仍失败
  + scenario cli-validate#Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels#只有 fence 内示例
  + scenario cli-validate#Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels#非 fence Scenario 与 fence 示例并存
  - scenario cli-validate#Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels#非 fence 的 unlabeled scenario 与 fence 内示例并存
~ requirement cli-validate#Validation SHALL provide actionable remediation steps
  ~ property cli-validate#Validation SHALL provide actionable remediation steps.body
  ~ scenario cli-validate#Validation SHALL provide actionable remediation steps#Missing required sections
  ~ scenario cli-validate#Validation SHALL provide actionable remediation steps#Missing requirement descriptive text
  ~ scenario cli-validate#Validation SHALL provide actionable remediation steps#No deltas found in change
  + scenario cli-validate#Validation SHALL provide actionable remediation steps#RENAMED section 被拒绝
  ~ scenario cli-validate#Validation SHALL provide actionable remediation steps#Section-type 与主 spec header 不一致
  ~ scenario cli-validate#Validation SHALL provide actionable remediation steps#仅 metadata 行承载 MUST 正文
  ~ scenario cli-validate#Validation SHALL provide actionable remediation steps#跨行 body 上的 SHALL 或 MUST 被识别
~ requirement cli-view#Dashboard Display
  ~ property cli-view#Dashboard Display.body
  + scenario cli-view#Dashboard Display#Active change selector
  + scenario cli-view#Dashboard Display#Active change 热更新
  + scenario cli-view#Dashboard Display#Archive change 不显示
  + scenario cli-view#Dashboard Display#Full context 与 Diff only
  + scenario cli-view#Dashboard Display#Specs-only change 显示
  + scenario cli-view#Dashboard Display#分区 diagnostics
  ~ scenario cli-view#Dashboard Display#启动 Web 浏览器
  ~ scenario cli-view#Dashboard Display#未找到项目
  ~ scenario cli-view#Dashboard Display#跨平台路径处理
  ~ scenario cli-view#Dashboard Display#项目根发现
~ requirement opsx-conventions#Archive Process Enhancement
  ~ property opsx-conventions#Archive Process Enhancement.body
  + scenario opsx-conventions#Archive Process Enhancement#Applying Requirement operations
  - scenario opsx-conventions#Archive Process Enhancement#Archiving changes with deltas
  - scenario opsx-conventions#Archive Process Enhancement#Handling conflicts during archive
  + scenario opsx-conventions#Archive Process Enhancement#Handling conflicts during sync or archive
~ requirement opsx-conventions#Change Review
  ~ property opsx-conventions#Change Review.body
  + scenario opsx-conventions#Change Review#Review projections 一致
  ~ scenario opsx-conventions#Change Review#Reviewing changes
~ requirement opsx-conventions#Change Storage Convention
  ~ property opsx-conventions#Change Storage Convention.body
  ~ scenario opsx-conventions#Change Storage Convention#Creating change proposals with additions
  ~ scenario opsx-conventions#Change Storage Convention#Creating change proposals with modifications
  ~ scenario opsx-conventions#Change Storage Convention#Creating change proposals with removals
  + scenario opsx-conventions#Change Storage Convention#Delta operation 使用三种 sections
  - scenario opsx-conventions#Change Storage Convention#Delta operation 保持现有格式
  ~ scenario opsx-conventions#Change Storage Convention#Graph 与 contract modules 同属一个 delta
  ~ scenario opsx-conventions#Change Storage Convention#Using standard output symbols
~ requirement opsx-conventions#Change-local specs express target steady state
  ~ property opsx-conventions#Change-local specs express target steady state.body
  ~ scenario opsx-conventions#Change-local specs express target steady state#ADDED 正文直接描述行为
  ~ scenario opsx-conventions#Change-local specs express target steady state#MODIFIED 包含完整目标状态
  - scenario opsx-conventions#Change-local specs express target steady state#Programmatic labels 不改变正文语义
  + scenario opsx-conventions#Change-local specs express target steady state#Scenario operations 由 Diff IR 派生
  ~ scenario opsx-conventions#Change-local specs express target steady state#Scenario 删除通过省略表达
~ requirement opsx-conventions#Header-Based Requirement Identification
  ~ property opsx-conventions#Header-Based Requirement Identification.body
  ~ scenario opsx-conventions#Header-Based Requirement Identification#Handling requirement renames
  ~ scenario opsx-conventions#Header-Based Requirement Identification#Matching requirements programmatically
  ~ scenario opsx-conventions#Header-Based Requirement Identification#Validating header uniqueness
~ requirement opsx-conventions#Project Structure
  ~ property opsx-conventions#Project Structure.body
  + scenario opsx-conventions#Project Structure#初始化与 change 目录结构
  - scenario opsx-conventions#Project Structure#初始化项目结构
~ requirement opsx-propose-skill#propose skill SHALL 生成 architecture-delta.c4
  ~ property opsx-propose-skill#propose skill SHALL 生成 architecture-delta.c4.body
  - scenario opsx-propose-skill#propose skill SHALL 生成 architecture-delta.c4#Architecture scope is present
  + scenario opsx-propose-skill#propose skill SHALL 生成 architecture-delta.c4#Graph no-op
  + scenario opsx-propose-skill#propose skill SHALL 生成 architecture-delta.c4#指导生成 OPSX Architecture delta
  + scenario opsx-propose-skill#propose skill SHALL 生成 architecture-delta.c4#禁止 raw extend reconciliation
~ requirement opsx-propose-skill#propose skill SHALL 指导 relationship 类型选择
  ~ property opsx-propose-skill#propose skill SHALL 指导 relationship 类型选择.body
  - scenario opsx-propose-skill#propose skill SHALL 指导 relationship 类型选择#A semantic interaction is required
  + scenario opsx-propose-skill#propose skill SHALL 指导 relationship 类型选择#修改 endpoint 或 kind
  + scenario opsx-propose-skill#propose skill SHALL 指导 relationship 类型选择#提供 relationship kinds 参考
~ requirement opsx-propose-skill#propose skill SHALL 指导验证 delta
  ~ property opsx-propose-skill#propose skill SHALL 指导验证 delta.body
  - scenario opsx-propose-skill#propose skill SHALL 指导验证 delta#Delta authoring completes
  + scenario opsx-propose-skill#propose skill SHALL 指导验证 delta#验证与审阅 delta
~ requirement propose-workflow#Post-propose validation 保持 warning-only
  ~ property propose-workflow#Post-propose validation 保持 warning-only.body
  + scenario propose-workflow#Post-propose validation 保持 warning-only#Combined validation 与 review generation
  ~ scenario propose-workflow#Post-propose validation 保持 warning-only#Lightweight auxiliary checks
  - scenario propose-workflow#Post-propose validation 保持 warning-only#Staged validation
  - scenario propose-workflow#Post-propose validation 保持 warning-only#Validation 不阻塞 propose handoff
  + scenario propose-workflow#Post-propose validation 保持 warning-only#Warning-only handoff
~ requirement propose-workflow#Post-propose validation 使用分级 gate
  ~ property propose-workflow#Post-propose validation 使用分级 gate.body
  ~ scenario propose-workflow#Post-propose validation 使用分级 gate#Combined Semantic Delta validation
  + scenario propose-workflow#Post-propose validation 使用分级 gate#Effective diff 不符合 intent
  - scenario propose-workflow#Post-propose validation 使用分级 gate#Lightweight scaffolding checks
  ~ scenario propose-workflow#Post-propose validation 使用分级 gate#Validation 全部通过
  - scenario propose-workflow#Post-propose validation 使用分级 gate#WARNING 不阻塞
~ requirement propose-workflow#Propose 使用 definition-first authoring
  ~ property propose-workflow#Propose 使用 definition-first authoring.body
  - scenario propose-workflow#Propose 使用 definition-first authoring#Scenario labels preview 后生成
  + scenario propose-workflow#Propose 使用 definition-first authoring#Scenario operations 通过 diff 审阅
  ~ scenario propose-workflow#Propose 使用 definition-first authoring#Specs boundary 不重复定义
  ~ scenario propose-workflow#Propose 使用 definition-first authoring#Specs 按 Behavior Source 生成
~ requirement propose-workflow#Propose 状态输出保持收敛
  ~ property propose-workflow#Propose 状态输出保持收敛.body
  ~ scenario propose-workflow#Propose 状态输出保持收敛#Blocker 状态
  ~ scenario propose-workflow#Propose 状态输出保持收敛#Readiness 状态
  ~ scenario propose-workflow#Propose 状态输出保持收敛#最终总结
~ requirement snack-skill#Snack 执行一次自检与程序化 labels
  ~ property snack-skill#Snack 执行一次自检与程序化 labels.body
  + scenario snack-skill#Snack 执行一次自检与程序化 labels#Unexpected effective operation
  + scenario snack-skill#Snack 执行一次自检与程序化 labels#输出 reconciliation result
  - scenario snack-skill#Snack 执行一次自检与程序化 labels#输出结果
+ requirement spec-content-browser#Active change diff loading and isolation
+ requirement spec-content-browser#Active change Specs semantic diff
~ requirement specs-sync-skill#Delta Reconciliation Logic
  ~ property specs-sync-skill#Delta Reconciliation Logic.body
  ~ scenario specs-sync-skill#Delta Reconciliation Logic#ADDED requirement already exists
  ~ scenario specs-sync-skill#Delta Reconciliation Logic#ADDED requirements
  ~ scenario specs-sync-skill#Delta Reconciliation Logic#MODIFIED requirements
  + scenario specs-sync-skill#Delta Reconciliation Logic#New Spec
  - scenario specs-sync-skill#Delta Reconciliation Logic#New capability spec
  ~ scenario specs-sync-skill#Delta Reconciliation Logic#REMOVED requirements
  ~ scenario specs-sync-skill#Delta Reconciliation Logic#REMOVED requirements already absent
  - scenario specs-sync-skill#Delta Reconciliation Logic#RENAMED requirements
  + scenario specs-sync-skill#Delta Reconciliation Logic#RENAMED section 被拒绝
  - scenario specs-sync-skill#Delta Reconciliation Logic#Removed scenario block 在合入时被省略
  - scenario specs-sync-skill#Delta Reconciliation Logic#Scenario labels 在合入时被清洗
  + scenario specs-sync-skill#Delta Reconciliation Logic#Scenario operation label 被拒绝
  - scenario specs-sync-skill#Delta Reconciliation Logic#未标注 scenarios 仍可合入
~ requirement specs-sync-skill#Skill Output
  ~ property specs-sync-skill#Skill Output.body
  ~ scenario specs-sync-skill#Skill Output#No changes needed
  + scenario specs-sync-skill#Skill Output#Show Architecture sync summary
  - scenario specs-sync-skill#Skill Output#Show OPSX sync summary
  ~ scenario specs-sync-skill#Skill Output#Show applied changes
~ requirement validate-change#validate change SHALL 支持 architecture-delta.c4
  ~ property validate-change#validate change SHALL 支持 architecture-delta.c4.body
  + scenario validate-change#validate change SHALL 支持 architecture-delta.c4#Graph no-op 不要求 delta 文件
  + scenario validate-change#validate change SHALL 支持 architecture-delta.c4#Partial diagnostics
  + scenario validate-change#validate change SHALL 支持 architecture-delta.c4#Validation 保持只读
  + scenario validate-change#validate change SHALL 支持 architecture-delta.c4#联合 Target Semantic Model
  + scenario validate-change#validate change SHALL 支持 architecture-delta.c4#验证 delta dialect
  - scenario validate-change#validate change SHALL 支持 architecture-delta.c4#验证 delta 文件存在
  - scenario validate-change#validate change SHALL 支持 architecture-delta.c4#验证 delta 语法
  - scenario validate-change#validate change SHALL 支持 architecture-delta.c4#验证 extend 目标存在
~ requirement validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec
  ~ property validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec.body
  + scenario validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec#REMOVED header 不存在于 Formal Spec
  - scenario validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec#REMOVED header 不存在于主 spec
  + scenario validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec#REMOVED header 存在于 Formal Spec
  - scenario validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec#REMOVED header 存在于主 spec
  - scenario validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec#RENAMED FROM header 不存在于主 spec
  - scenario validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec#RENAMED FROM header 存在于主 spec
  + scenario validate-spec-section-type-cross-check#REMOVED/RENAMED requirement header 必须存在于主 spec#RENAMED section 被拒绝

## Architecture

~ element project.root/domain.ai_integration/cap.ai.workflow-generation
  ~ property project.root/domain.ai_integration/cap.ai.workflow-generation.summary
~ element project.root/domain.architecture/cap.architecture.semantic-model
  ~ property project.root/domain.architecture/cap.architecture.semantic-model.summary
~ element project.root/domain.change_workflow/cap.change.lifecycle
  ~ property project.root/domain.change_workflow/cap.change.lifecycle.summary
~ element project.root/domain.change_workflow/cap.change.semantic-delta
  ~ property project.root/domain.change_workflow/cap.change.semantic-delta.summary
~ element project.root/domain.cli/cap.cli.architecture-navigation
  ~ property project.root/domain.cli/cap.cli.architecture-navigation.summary
~ element project.root/domain.cli/cap.cli.change-operations
  ~ property project.root/domain.cli/cap.cli.change-operations.summary
~ element project.root/domain.presentation/cap.presentation.semantic-browser
  ~ property project.root/domain.presentation/cap.presentation.semantic-browser.summary
~ element project.root/domain.validation/cap.validation.semantic-contract
  ~ property project.root/domain.validation/cap.validation.semantic-contract.summary
+ relationship project.root/domain.ai_integration/cap.ai.workflow-generation|consumes|project.root/domain.change_workflow/cap.change.semantic-delta
+ relationship project.root/domain.change_workflow/cap.change.semantic-delta|consumes|project.root/domain.architecture/cap.architecture.semantic-model
+ relationship project.root/domain.cli/cap.cli.architecture-navigation|invokes|project.root/domain.change_workflow/cap.change.semantic-delta
+ relationship project.root/domain.cli/cap.cli.change-operations|invokes|project.root/domain.change_workflow/cap.change.semantic-delta
+ relationship project.root/domain.presentation/cap.presentation.semantic-browser|consumes|project.root/domain.change_workflow/cap.change.semantic-delta

## Diagnostics

None.
