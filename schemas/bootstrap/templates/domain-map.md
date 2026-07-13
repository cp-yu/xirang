# Domain Map: {{ domain_id }}

## Domain

- id: {{ domain_id }}
- intent: {{ intent }}

## Capabilities

<!--
- id: cap.<domain>.<action>
  intent: 一句话描述 capability
-->

## Relations

<!-- 无法精确分类时不要创建 relation，并在 review 中记录 gap。
- `belongs_to` (capability → domain): 记录 capability 的架构所有权。
- `invokes` (caller → callee): 一个 capability 在运行时主动调用另一个 capability。
- `consumes` (consumer → provider): 交互核心是读取或依赖提供内容。
- `precedes` (earlier → later): 执行顺序是正确性合同。
- `constrains` (constraint owner → constrained capability): 存在独立且稳定的行为约束。
- `validates` (validator → subject): 交互结果是明确的有效性判定。

- from: cap.example.feature
  type: belongs_to
  to: {{ domain_id }}
-->

## Review Gaps

<!-- 无法从当前证据精确选择 relation 时记录，不要创建通用 relation：
- evidence: import src/example.ts -> src/dependency.ts
  reason: 无法证明该交互是 invokes 还是 consumes
-->

## Spec Groups (coarse granularity only)

<!-- 每个 entry 生成一个包含完整 capabilities frontmatter 的 candidate spec：
- folder: <single_posix_segment>
  capabilities: [cap.x, cap.y]
  purpose: 一句话描述 spec 目的
  requirements:
    - title: Requirement 名称
      text: The system SHALL ...
      scenarios:
        - title: Scenario 名称
          steps:
            - keyword: WHEN
              text: ...
            - keyword: THEN
              text: ...
-->
