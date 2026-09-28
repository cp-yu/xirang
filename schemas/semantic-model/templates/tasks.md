### Task 1: <!-- concise task name -->

**Goal**: <!-- what this task accomplishes -->

**Files**:
- Create: `<!-- path/to/new-file -->`
- Modify: `<!-- path/to/existing-file -->`
- Test: `<!-- path/to/test-file -->`

**Sections**:
- <!-- concrete implementation obligation with Contract reference and already-GREEN dependencies; at most 5 high-level entries -->
- <!-- include affected prompt source, managed projection, and verification in this loop; do not redefine behavior -->

#### Checks

- [ ] C1 <!-- Verification check -->
  - Verifies: `elements/<identity>.md` / Section "<section name>" / Acceptance Case "<acceptance case name>"
  - Test action: modify
  - Command: `<!-- command or test -->`
  - Expect: <!-- observable result -->

### Task 2: <!-- deletion task example -->

**Goal**: <!-- remove deprecated feature -->

**Files**:
- Delete: `<!-- path/to/deprecated-file -->`
- Modify: `<!-- path/to/file-with-references -->`

**Sections**:
- <!-- entry describing what is removed and why -->

#### Checks

- [ ] C2 <!-- Deletion verification check -->
  - Verifies: `elements/<identity>.md` / REMOVED Section "<section name>"
  - Test action: one-time
  - Command: `<!-- absence assertion command, e.g., grep or test -->`
  - Expect: <!-- no matches or references found -->

### Task 3: <!-- refactor task example -->

**Goal**: <!-- refactor existing code without behavior change -->

**Files**:
- Modify: `<!-- path/to/refactored-file -->`
- Test: `<!-- path/to/test-file -->`

**Sections**:
- <!-- entry describing behavior preservation -->

#### Checks

- [ ] C3 <!-- Behavior equivalence check -->
  - Preserves: `.xirang/model/elements/<identity>.md` / Section "<section name>" / Acceptance Case "<acceptance case name>"
  - Test action: reuse
  - Command: `<!-- behavior test command -->`
  - Expect: <!-- old form (old function, old path, old duplication) no longer exists -->
