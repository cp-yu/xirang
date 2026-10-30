### Task 1: 验证 Change-derived View 渲染

**Goal**: 确认本 Change 的 Semantic Delta 在 Change-derived View 中正确呈现 ADDED 差异

**Files**:
- Create: `.xirang/changes/test-change-derived-view/elements/test-entity.md`
- Create: `.xirang/changes/test-change-derived-view/metamodel/test-component.md`
- Create: `.xirang/changes/test-change-derived-view/metamodel/test-references.md`
- Create: `.xirang/changes/test-change-derived-view/relationships/test-references.yaml`

**Sections**:
- 本 Change 只新增语义实体用于观察 Change-derived View，不修改任何代码

#### Checks

- [ ] C1 验证 Change 编译通过
  - Verifies: `elements/test-entity.md` / Section "被 Change-derived View 正确识别"
  - Test action: reuse
  - Command: `xirang validate --change test-change-derived-view --json`
  - Expect: `valid: true`，entries 包含 element-declaration / element-kind / relationship-kind / relationship 四类实体的 ADDED 条目

- [ ] C2 验证伪代码形式的 Acceptance Case 正文被接受
  - Verifies: `elements/test-entity.md` / Section "支持伪代码形式的 Acceptance Case 正文"
  - Test action: reuse
  - Command: `xirang validate --change test-change-derived-view --json`
  - Expect: `valid: true`，伪代码正文（如 `if a[j] < a[i]: swap(a[i], a[j])`）不产生正文格式错误
