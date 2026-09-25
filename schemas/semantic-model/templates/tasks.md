### Task 1: <!-- concise task name -->

**Goal**: <!-- what this task accomplishes -->

**Files**:
- Create: `<!-- path/to/new-file -->`
- Modify: `<!-- path/to/existing-file -->`
- Test: `<!-- path/to/test-file -->`

**Requirements**:
- <!-- concrete implementation obligation with Contract reference and already-GREEN dependencies; at most 5 high-level requirements -->
- <!-- include affected prompt source, managed projection, and verification in this loop; do not redefine behavior -->

#### Checks

- [ ] C1 <!-- Verification check -->
  - Verifies: `elements/<identity>.md` / Requirement "<requirement name>" / Scenario "<scenario name>"
  - Command: `<!-- command or test -->`
  - Expect: <!-- observable result -->

### Task 2: <!-- deletion task example -->

**Goal**: <!-- remove deprecated feature -->

**Files**:
- Delete: `<!-- path/to/deprecated-file -->`
- Modify: `<!-- path/to/file-with-references -->`
- Test: `<!-- path/to/test-file -->`

**Requirements**:
- <!-- requirement describing what is removed and why -->

#### Checks

- [ ] C2 <!-- Deletion verification check -->
  - Verifies: `elements/<identity>.md` / REMOVED Requirement "<requirement name>"
  - Command: `<!-- absence assertion command, e.g., grep or test -->`
  - Expect: <!-- no matches or references found -->

### Task 3: <!-- refactor task example -->

**Goal**: <!-- refactor existing code without behavior change -->

**Files**:
- Modify: `<!-- path/to/refactored-file -->`
- Test: `<!-- path/to/test-file -->`

**Requirements**:
- <!-- requirement describing behavior preservation -->

#### Checks

- [ ] C3 <!-- Behavior equivalence check -->
  - Preserves: `.xirang/model/elements/<identity>.md` / Requirement "<requirement name>" / Scenario "<scenario name>"
  - Command: `<!-- behavior test command -->`
  - Expect: <!-- old form (old function, old path, old duplication) no longer exists -->
