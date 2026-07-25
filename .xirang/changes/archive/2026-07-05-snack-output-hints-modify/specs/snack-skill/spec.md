## MODIFIED Requirements

### Requirement: 输出提示包含三条快速路径

snack skill SHALL 在完成制品生成与自检后，输出提示信息，以四个编号选项明确列出快速同步、快速归档、同步并归档、继续开发四种后续操作路径，以及验证结果。

#### Scenario: 输出完成路径提示

- **WHEN** 制品生成与 validate 自检完成
- **THEN** 输出包含：
  - "⚠️ Generated specs are based on code inference. Review items marked [REVIEW NEEDED]"
  - "1. **Quick sync**: `openspec sync \"<change-name>\" --no-verify`"
  - "2. **Quick archive**: `openspec archive \"<change-name>\" --no-verify`"
  - "3. **Sync and archive**: `openspec sync \"<change-name>\" --no-verify && openspec archive \"<change-name>\" --no-verify`"
  - "4. **Continue development**: review change → modify code → run snack again → continue iterating"

#### Scenario: 输出 validate 自检结果

- **WHEN** `openspec validate` 运行完成
- **THEN** 输出 validate 最终结果：通过则提示已自检通过；仍有 ERROR/WARNING 则逐条列出并提示用户审查
