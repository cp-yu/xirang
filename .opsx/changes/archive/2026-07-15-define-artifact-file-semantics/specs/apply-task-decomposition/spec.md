## MODIFIED Requirements

### Requirement: 任务执行失败处理

系统 SHALL 在 task 执行遇到非预期失败时先诊断再修复，每次修复只改变一个变量，并在同一 task 累计 3 次修复仍未解决时停止并呈现证据。连续 2 次相同 normalized error signature SHALL 保持快速 pause。补充上下文时，Agent SHALL 使用 change artifacts、formal Specs、OPSX v2 两文件语义导航、CLI relation query 与当前代码 evidence；MUST NOT 读取或要求 OPSX code-map。

#### Scenario: [MODIFIED] 任务需求不明确
- **WHEN** Master agent 发现 Goal 或 Requirements 过于模糊
- **THEN** SHALL 使用 proposal、design、change-local specs、tasks、formal Specs、OPSX project/domain/capability context 与相关项目文件补足上下文
- **AND** SHALL 对已知 node IDs 使用 `openspec opsx query <node-id...> --json` 获取 directed relations
- **AND** SHALL NOT 仅因首次发现模糊点就询问用户

#### Scenario: [MODIFIED] 项目上下文不足
- **WHEN** Master agent 无法找到相关现有代码或模式
- **THEN** SHALL 使用 OPSX 语义边界定位 capability，并使用 CodeGraph 或 ACE/`rg`/`read` 获取当前 implementation evidence
- **AND** MUST NOT 从 OPSX 读取 code paths 或 code-map
- **AND** SHALL 将缺失上下文转化为当前 task 的可验证探索或检查步骤

#### Scenario: [MODIFIED] 任务过于复杂
- **WHEN** Master agent 判断 task 过大
- **THEN** SHALL 在当前 task 内按最小可验证批次执行
- **AND** SHALL NOT 因可拆分而创建新的中间 artifacts

#### Scenario: [MODIFIED] 同一错误重复失败快速暂停
- **WHEN** 同一 task 的同一 normalized error signature 连续失败 2 次
- **THEN** 系统 SHALL pause
- **AND** pause 输出 SHALL 包含 task、check、command、failure kind、error summary 与已尝试 remediation

#### Scenario: [MODIFIED] 累计修复次数达到上限
- **WHEN** 同一 task 累计 3 次修复仍未解决
- **THEN** 系统 SHALL 停止修复并呈现已尝试路径、根因判断与怀疑方向
- **AND** SHALL 等待用户指导
