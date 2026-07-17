## MODIFIED Requirements

### Requirement: Validation SHALL provide actionable remediation steps

校验输出 SHALL 为每个错误提供可执行修复指引，包括期望结构、示例标题与建议命令。Requirement 正文校验 SHALL 基于完整 requirement body（header 之后、scenario 之前的全部有效行），而不仅是首条正文行；keyword 检测 SHALL 在该完整 body 上执行。

#### Scenario: [MODIFIED] No deltas found in change

- **WHEN** 校验一个解析到零个 delta 的 change
- **THEN** 显示 “No deltas found” 类错误并给出指引：
  - 说明 change specs 必须包含 `## ADDED Requirements`、`## MODIFIED Requirements`、`## REMOVED Requirements` 或 `## RENAMED Requirements`
  - 提醒文件须位于 `openspec/changes/{id}/specs/<capability>/spec.md`
  - 明确注明：“Spec delta files cannot start with titles before the operation headers”
  - 建议运行 `openspec change show {id} --json --deltas-only` 调试

#### Scenario: [MODIFIED] Missing required sections

- **WHEN** 缺少必需章节
- **THEN** 给出期望标题与最小骨架：
  - Spec：`## Purpose`、`## Requirements`
  - Change：`## Why`、`## What Changes`
  - 提供可复制的缺失章节示例片段
  - 指向 `openspec/AGENTS.md` 中的快速参考模板

#### Scenario: [MODIFIED] Missing requirement descriptive text

- **WHEN** requirement 标题后、scenario 前缺少描述正文
- **THEN** 报错说明 `### Requirement:` 后必须先有叙述正文，再写 `#### Scenario:`
  - 给出合规示例：`### Requirement: Foo` 后接 `The system SHALL ...`
  - 建议在列出 scenarios 前用 1–2 句描述规范性的行为
  - 引用 `openspec/AGENTS.md` 预校验清单

#### Scenario: Section-type 与主 spec header 不一致

- **WHEN** change spec 中 MODIFIED/REMOVED/RENAMED 引用的 requirement header 在主 spec 中不存在
- **OR** change spec 中 ADDED 的 requirement header 在主 spec 中已存在
- **THEN** emit ERROR 并包含修复建议：
  - 对 MODIFIED 不存在：建议改为 `## ADDED Requirements`
  - 对 ADDED 已存在：建议改为 `## MODIFIED Requirements`
  - 对 REMOVED/RENAMED 不存在：说明目标 header 不存在于主 spec

#### Scenario: [ADDED] 跨行 body 上的 SHALL 或 MUST 被识别

- **WHEN** change delta 中 requirement 的首条正文行不含 `SHALL`/`MUST`，但同一 body 的后续非 fence 行包含 whole-word `SHALL` 或 `MUST`
- **THEN** `openspec validate <change> --type change` SHALL NOT 仅因 keyword 不在首行而报告 missing keyword ERROR

#### Scenario: [ADDED] 仅 metadata 行承载 MUST 正文

- **WHEN** requirement body 在 scenario 之前仅包含形如 `**Constraint**: The system MUST ...` 的 metadata 行
- **THEN** validation SHALL 将该 metadata 行视为 requirement body 并接受其中的 whole-word `MUST`/`SHALL`

## ADDED Requirements

### Requirement: Requirement reader SHALL be fence-aware for body and scenarios

Change delta 与 formal spec 校验 SHALL 使用同一套 fence-aware requirement 读取规则：跳过 fenced code block（含 fence 行本身）内的内容；requirement body 提取与 scenario 计数均不得把 fence 内文本当作真实正文或真实 scenario。在 CRLF/LF/CR 行尾规范化后，上述规则 SHALL 保持一致。

#### Scenario: Fence 内 Scenario 不计入 surviving

- **WHEN** change delta 中某个 ADDED 或 MODIFIED requirement 在 fenced code block 内包含 `#### Scenario:` 示例，且 fence 外没有任何 unlabeled、`[ADDED]` 或 `[MODIFIED]` scenario
- **THEN** `openspec validate <change> --type change` SHALL report ERROR，要求至少一个 surviving scenario
- **AND** SHALL NOT 将 fence 内 scenario 计为 surviving

#### Scenario: Fence 后的正文用于 keyword 检测

- **WHEN** requirement header 之后首先出现 fenced code block，随后在非 fence 行出现含 whole-word `SHALL` 或 `MUST` 的正文，再出现真实 `#### Scenario:`
- **THEN** validation SHALL 接受该 requirement 的 keyword 检测
- **AND** SHALL NOT 将 fence 打开行当作 requirement text

#### Scenario: CRLF 下 fence 与跨行 body 行为一致

- **WHEN** 同一 change delta 使用 CRLF 行尾，且包含跨行 `SHALL`/`MUST` 与 fenced scenario 示例
- **THEN** validation 结果 SHALL 与等价 LF 内容一致（keyword 与 surviving scenario 判定相同）

### Requirement: Surviving scenario 计数 SHALL ignore fenced examples while preserving operation labels

Surviving scenario 计数 SHALL 仅考虑非 fence 行上的 `#### Scenario:` 标题，并继续应用 scenario operation labels：`[REMOVED]` 不计入 surviving；unlabeled、`[ADDED]`、`[MODIFIED]` 计入。Validate SHALL NOT 因本读取规则改变 label 语法合法性规则。

#### Scenario: 非 fence 的 unlabeled scenario 与 fence 内示例并存

- **WHEN** requirement 同时包含 fence 外 unlabeled `#### Scenario:` 与 fence 内 `#### Scenario:` 示例
- **THEN** surviving 计数 SHALL 至少为 1
- **AND** `openspec validate <change> --type change` SHALL NOT 仅因 fence 内示例而失败

#### Scenario: 全部真实 scenario 为 REMOVED 时仍失败

- **WHEN** requirement 的全部非 fence `#### Scenario:` 均标记为 `[REMOVED]`，即使 fence 内另有 scenario 示例
- **THEN** `openspec validate <change> --type change` SHALL report ERROR，说明至少需要一个 unlabeled、`[ADDED]` 或 `[MODIFIED]` scenario
