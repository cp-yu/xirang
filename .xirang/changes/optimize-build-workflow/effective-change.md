# Effective Change

Change: optimize-build-workflow
Status: Passed
Formal fingerprint: 4a380f5d2e23158079a008b06668d89b5c0618f06753ff20a42e8a7ada0e722b
Change fingerprint: 4026b8ebbd78edb9318dda2f56fa2a7c0e6c447bd05417642b6498bd2511d0ab

## Summary

- Total: 56
- Operations: +52 ~4 -0

## Semantic Delta

~ element-declaration element-contract
  ~ property element-contract.summary
+ element-declaration requirement
+ element-declaration scenario
+ relationship apply-role|responsible-for|apply
+ relationship archive-role|responsible-for|change-closure
+ relationship explore-role|responsible-for|explore
+ relationship optimizer|responsible-for|optimization
+ relationship project-build-role|responsible-for|semantic-model-build
+ relationship propose-role|responsible-for|propose
+ relationship reviewer|responsible-for|review
+ relationship snack-role|responsible-for|snack
+ relationship-kind responsible-for
+ requirement deterministic-operations#区分初始化来源与 Formal Comparison
+ requirement deterministic-operations#Comparison 不参与 Review Digest
+ requirement deterministic-operations#Formal 存在时生成 Promotion Diff
+ requirement deterministic-operations#Formal 缺失时报告 Diff 不可用
+ requirement element-contract#完整表达自身抽象层级语义
+ requirement element-contract#允许 Children 精化与共同实现
+ requirement project-build-role#编排 Modeling Decision Gate
~ requirement project-build-role#呈现 Candidate 并请求确认
  ~ property project-build-role#呈现 Candidate 并请求确认.body
  + scenario project-build-role#呈现 Candidate 并请求确认#Candidate 完成全部审查
  - scenario project-build-role#呈现 Candidate 并请求确认#Candidate 校验通过
+ requirement project-build-role#委托 Clean-context Semantic Review
+ requirement project-build-role#执行 Promotion 后检查
+ requirement project-tooling-configuration#投影共享 Element Contract 语义
+ requirement propose#遵循共享 Contract 语义
+ requirement realization#以两个维度完整描述落实
+ requirement realization#允许跨维度语义覆盖
+ requirement requirement#表达可独立演进的规范承诺
+ requirement requirement#作为 Contract 的差量单位
+ requirement scenario#保持规范约束力
+ requirement scenario#不默认穷尽适用情况
+ requirement scenario#从属于 Requirement 差量
+ requirement scenario#具体化宿主 Requirement
+ requirement semantic-delta-entry#将 Scenario 变化归入 Requirement
~ requirement semantic-delta-entry#以实体粒度作用
  ~ property semantic-delta-entry#以实体粒度作用.body
+ requirement semantic-model-build#按 BFS 语义层编写 Candidate
+ requirement semantic-model-build#按独立演进边界编写 Requirements
+ requirement semantic-model-build#保留独立整体约束
+ requirement semantic-model-build#后置条件失败时不自动重试
+ requirement semantic-model-build#仅记录例外 Provenance
+ requirement semantic-model-build#缺少 Clean Context 时 Fail Closed
+ requirement semantic-model-build#确定性校验后执行独立语义审查
+ requirement semantic-model-build#先初始化再记录构建依据
+ requirement semantic-model-build#显式处理 Active Candidate
+ requirement semantic-model-build#在编写前通过 Modeling Decision Gate
+ requirement semantic-model-build#只以阻塞语义问题拒绝审查
+ requirement semantic-model-build#Candidate 修改后重新审查
+ requirement semantic-model-build#Promotion 后验证 Build 后置条件
+ requirement semantic-model#保持 Requirement Name 唯一
+ requirement semantic-model#保持 Scenario Name 唯一
+ requirement semantic-model#验证 Authored View 引用
+ requirement semantic-model#验证 Element Kind 引用
+ requirement semantic-model#验证 Kind Constraint 引用
+ requirement semantic-model#验证 Relationship Kind 引用
+ requirement semantic-model#要求 Requirement 包含 Scenario
~ requirement semantic-model#自声明实体类型
  ~ property semantic-model#自声明实体类型.body
  ~ scenario semantic-model#自声明实体类型#Element 单元位于错误分区
+ requirement snack#遵循共享 Contract 语义

## Diagnostics

None.
