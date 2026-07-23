## MODIFIED Requirements

### Requirement: OPSX Semantic Model SHALL 统一表达 human intent
OPSX SHALL 将 formal LikeC4 graph modules 与 singular element-bound Markdown contract modules 解释为同一个权威 Semantic Model。Project Build Candidate SHALL 使用相同的完整模型边界；promotion SHALL 完整替换 graph 与 contracts，而不是逐文件 merge。

#### Scenario: Agent 读取 formal 统一模型
- **WHEN** Agent 需要理解或实现项目 intent
- **THEN** SHALL 读取 `.opsx/architecture/**/*.c4` 中的 graph semantics
- **AND** SHALL 读取 `.opsx/specs/**/*.md` 中与相关 elements 对应的 contracts
- **AND** SHALL 将两类 modules 作为同一个 OPSX Semantic Model 消费

#### Scenario: Candidate promotion
- **WHEN** valid Candidate 被用户授权并成功 promotion
- **THEN** `.opsx/architecture/` 与 `.opsx/specs/` SHALL 完全等于 Candidate target trees
- **AND** Candidate 中不存在的旧 formal modules 或 Specs SHALL NOT 继续存在

#### Scenario: 程序化解析不创建第二权威模型
- **WHEN** CLI 为 query、validation、diff、promotion 或 view 临时解析 source
- **THEN** runtime representation MAY 作为实现数据
- **AND** MUST NOT 被持久化或声明为独立 source of truth

### Requirement: Language version SHALL 控制 dialect 演进
OPSX graph source SHALL 使用显式 language version 选择 model semantics。缺失 version 的输入 MAY 由用户选择为 Project Build evidence 或指定起点，但 runtime MUST NOT 静默转换或自动 promotion。

#### Scenario: 新版 source 选择 v1 semantics
- **WHEN** graph source 声明 language version `1`
- **THEN** parser 与 validator SHALL 启用 Project Root、通用 elementId、Metamodel constraints 与 singular Spec binding 规则

#### Scenario: Legacy source 作为 Build input
- **WHEN** 用户将 legacy source 选为指定构建起点或 evidence
- **THEN** Agent MAY 读取并将用户批准的语义编译到 Candidate
- **AND** CLI SHALL NOT 提供 `opsx migrate` 或 runtime fallback conversion
- **AND** 写入 formal source SHALL 仍要求 Candidate validation 与 human-authorized digest
