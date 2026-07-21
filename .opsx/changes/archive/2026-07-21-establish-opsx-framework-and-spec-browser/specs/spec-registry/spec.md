## MODIFIED Requirements

### Requirement: 运行时构建 cap↔spec 双向映射

系统 SHALL 提供 `buildSpecRegistry(projectRoot: string)` 函数，扫描 `.opsx/specs/*/spec.md` 的 frontmatter，构建并返回包含双向映射的 registry 对象。

#### Scenario: [MODIFIED] 构建双向映射

- **WHEN** `.opsx/specs/cli-archive/spec.md` 的 frontmatter 声明 `capabilities: [cap.cli.archive, cap.change-workflow.archive]`
- **THEN** registry 的 `capToSpecs` SHALL 包含 `cap.cli.archive → ["cli-archive"]` 和 `cap.change-workflow.archive → ["cli-archive"]`
- **AND** registry 的 `specToCaps` SHALL 包含 `cli-archive → ["cap.cli.archive", "cap.change-workflow.archive"]`

#### Scenario: 多个 spec 关联同一 cap

- **WHEN** `specs/cli-archive/spec.md` 和 `specs/archive-verify-gate/spec.md` 的 frontmatter 均声明 `cap.cli.archive`
- **THEN** `capToSpecs.get("cap.cli.archive")` SHALL 返回 `["archive-verify-gate", "cli-archive"]`（按字母序排列）

#### Scenario: 无 frontmatter 的 spec 被跳过

- **WHEN** `specs/legacy-cleanup/spec.md` 无 frontmatter
- **THEN** registry 的 `specToCaps` 中 SHALL NOT 包含 `legacy-cleanup`
- **AND** 该 spec SHALL NOT 出现在任何 `capToSpecs` 的值中

#### Scenario: [MODIFIED] specs 目录为空或不存在

- **WHEN** `.opsx/specs/` 目录不存在或为空
- **THEN** 函数 SHALL 返回空的 `capToSpecs` 和 `specToCaps` Map
- **AND** SHALL NOT 抛出异常

### Requirement: Registry 扫描使用跨平台路径

`buildSpecRegistry` SHALL 使用 `path.join()` 构建所有文件路径，不硬编码路径分隔符。

#### Scenario: [MODIFIED] Windows 路径处理

- **WHEN** 在 Windows 平台执行 `buildSpecRegistry`
- **THEN** SHALL 使用 `path.join(projectRoot, '.opsx', 'specs')` 构建基础路径
- **AND** SHALL 正确处理反斜杠路径分隔符
