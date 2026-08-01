### Task 1: 验证 Change-derived View 渲染

**Goal**: 确认本 Change 的 Semantic Delta 在 Change-derived View 中正确呈现 ADDED 差异

**Files**:
- Create: `.xirang/changes/test-change-derived-view/elements/test-entity.md`
- Create: `.xirang/changes/test-change-derived-view/metamodel/test-component.md`
- Create: `.xirang/changes/test-change-derived-view/metamodel/test-references.md`
- Create: `.xirang/changes/test-change-derived-view/relationships/test-references.yaml`

**Requirements**:
- 验证本 Change 的 Semantic Delta 包含四种实体类型的 ADDED 条目

#### Checks

- [ ] C1 验证 Change 编译通过
  - Verifies: `elements/test-entity.md` / Requirement "被 Change-derived View 正确识别" / Scenario "查看 Change-derived View"
  - Command: `xirang validate --change "test-change-derived-view" --json`
  - Expect: `valid: true` 且 `summary.total` 等于 4（element-declaration + element-kind + relationship-kind + relationship）