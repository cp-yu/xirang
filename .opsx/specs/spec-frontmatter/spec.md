---
capabilities:
  - cap.spec.frontmatter
---
# spec-frontmatter Specification

## Purpose
此规约记录变更 spec-capability-awareness 引入的行为，请在后续同步或归档前补全正式 Purpose。
## Requirements
### Requirement: 解析 spec 文件的 YAML frontmatter

系统 SHALL 提供 `parseSpecFrontmatter(content: string)`，从 Spec Markdown 提取 singular `element` binding，并返回 `{ element: string | null }`。每个新版 Spec MUST NOT 通过数组绑定多个 elements。

#### Scenario: 正常 frontmatter 解析
- **WHEN** Spec 以 `---\nelement: payment.authorize\n---` 开头
- **THEN** 函数 SHALL 返回 `{ element: "payment.authorize" }`

#### Scenario: element 不是字符串
- **WHEN** frontmatter 的 `element` 缺失、为空或不是字符串
- **THEN** 函数 SHALL 返回 `{ element: null }`

#### Scenario: 多 owner 字段被拒绝
- **WHEN** 新版 Spec frontmatter 包含 `capabilities` 数组或将 `element` 写为数组
- **THEN** validation SHALL 返回 ERROR
- **AND** MUST NOT 静默选择其中一项

#### Scenario: 无 frontmatter
- **WHEN** Spec 不以 `---` 开头
- **THEN** 函数 SHALL 返回 `{ element: null }`

#### Scenario: 畸形 YAML frontmatter
- **WHEN** frontmatter YAML 解析失败
- **THEN** parser SHALL 返回结构化 parse issue
- **AND** validation SHALL 报告该 issue，而非将其伪装成合法无 binding 状态

#### Scenario: frontmatter 后的 markdown 内容不受影响
- **WHEN** frontmatter 后包含 Spec title、requirements 与 scenarios
- **THEN** 函数 SHALL 只解析两个 frontmatter delimiters 之间的文本
- **AND** SHALL NOT 修改 Markdown body

### Requirement: 使用已有 yaml 库解析

系统 SHALL 使用项目已有 `yaml` 依赖解析 frontmatter，不引入新 parsing dependency。文件读取与定位 SHALL 使用 Node.js path API。

#### Scenario: YAML 解析调用
- **WHEN** 检测到完整 frontmatter delimiters
- **THEN** SHALL 提取 frontmatter 文本并调用 `yaml.parse()`

#### Scenario: Windows Spec path
- **WHEN** parser 由 Windows project path 下的 registry 调用
- **THEN** caller SHALL 使用 `path.join()` 定位 Spec
- **AND** parser output SHALL 与 POSIX 环境一致

