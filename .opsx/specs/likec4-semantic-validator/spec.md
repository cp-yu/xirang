# likec4-semantic-validator Specification

## Purpose
This specification records behavior introduced by change opsx-to-likec4-mega-refactor. Replace this Purpose with the formal capability intent before archive.
## Requirements
### Requirement: 语义验证器 SHALL 检查 ownership cardinality

语义验证器 SHALL 将 LikeC4 nesting 解释为 abstraction/refinement containment，而非 domain ownership。新版 model SHALL 恰有一个 Project Root；每个非 root element SHALL 恰有一个 parent，containment SHALL 无环，并 SHALL 遵守 Metamodel 中显式声明的 parent/child constraints。

#### Scenario: 检测缺失 Project Root
- **WHEN** 新版 model 不包含 Project Root
- **THEN** SHALL 返回 `MISSING_PROJECT_ROOT` ERROR

#### Scenario: 检测多个 Project Roots
- **WHEN** 新版 model 包含多个 root elements
- **THEN** SHALL 返回 `MULTIPLE_PROJECT_ROOTS` ERROR
- **AND** SHALL 列出 root element IDs

#### Scenario: 检测 containment cycle
- **WHEN** parent chain 形成 cycle
- **THEN** SHALL 返回 `CONTAINMENT_CYCLE` ERROR
- **AND** SHALL 展示 cycle path

#### Scenario: 默认开放与显式约束
- **WHEN** Metamodel 未声明 kind pair constraint
- **THEN** nesting SHALL 通过
- **WHEN** Metamodel 明确禁止该 parent/child pair
- **THEN** SHALL 返回 `INVALID_CONTAINMENT` ERROR

### Requirement: 验证器 SHALL 检测 precedes cycle

验证器 SHALL 确保 `precedes` relations 形成有向无环图，并 SHALL 对任意 element kinds 使用 canonical `elementId` 报告 path。

#### Scenario: 检测简单 cycle
- **GIVEN** `precedes` relations 为 A → B、B → C、C → A
- **WHEN** 运行语义验证
- **THEN** SHALL 返回包含 A → B → C → A 的 ERROR

#### Scenario: 检测自环
- **WHEN** element 声明 A `precedes` A
- **THEN** SHALL 返回 self-loop ERROR

#### Scenario: DAG 通过验证
- **WHEN** `precedes` relations 形成 DAG
- **THEN** cycle validation SHALL 通过

### Requirement: 验证器 SHALL 检查 metadata 完整性

验证器 SHALL 检查每个新版 element 包含唯一、非空 `elementId` 与 `summary`，并 SHALL 通过 Spec registry 检查 singular binding 与 contract completeness。验证器 MUST NOT 要求 `capabilityId` 或 `metadata.specs`。

#### Scenario: 缺失 elementId
- **WHEN** 新版 element 未声明 `elementId`
- **THEN** SHALL 返回 `MISSING_ELEMENT_ID` ERROR

#### Scenario: 重复 elementId
- **WHEN** 多个 elements 声明相同 `elementId`
- **THEN** SHALL 返回 `DUPLICATE_ELEMENT_ID` ERROR
- **AND** SHALL 列出冲突 FQNs

#### Scenario: Required contract 缺失
- **WHEN** element kind 的 `contractPolicy` 为 `required`
- **AND** registry 未发现任何 Spec 绑定该 element
- **THEN** SHALL 返回 `MISSING_REQUIRED_CONTRACT` ERROR

#### Scenario: Optional contract 缺失
- **WHEN** element kind 的 `contractPolicy` 为 `optional`
- **AND** element 没有 Spec
- **THEN** SHALL NOT 产生 issue

### Requirement: 验证器 SHALL 提供结构化错误输出

验证结果 SHALL 区分 errors 与 warnings，并为 root、element identity、containment、contracts 与 relations 提供稳定 code、message 和可选 element ID。

#### Scenario: 结构化验证结果
- **WHEN** 运行完整 validation
- **THEN** SHALL 返回：
```typescript
{
  success: boolean,
  errors: Array<{ code: string; message: string; element?: string }>,
  warnings: Array<{ code: string; message: string; element?: string }>
}
```
- **AND** errors SHALL 阻止 validation 通过
- **AND** warnings SHALL NOT 阻止通过

#### Scenario: 验证通过时无 errors
- **WHEN** root、identity、containment、contracts 与 relations 全部合法
- **THEN** result SHALL 为 success 且 errors 为空

