## REMOVED Requirements

### Requirement: Agent command generation SHALL support separate external command slugs
**Reason**: Project Setup 和固定 workflows 不再生成 slash-command workflow artifacts。

**Migration**: 使用 tool-native `opsx-build` skill surface。

### Requirement: Command artifact detection SHALL resolve workflows through explicit command slug mapping
**Reason**: 退役的 command artifact detection 和 migration surface 被删除。

**Migration**: managed workflow detection 使用 skill manifest 和显式 skill names。

### Requirement: Generating slash commands for a tool SHALL honor configured external command slugs
**Reason**: Slash-command workflow generation 不属于当前 setup contract。

**Migration**: 使用 generated skills 和 `opsx candidate` CLI surface。
