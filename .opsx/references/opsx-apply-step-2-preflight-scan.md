# Apply Step 2: Pre-flight Scan

Before isolation, scan all tasks in tasks.md for contradictions and dependency-ordering issues across Goals, Files, Requirements, and Checks:
- Conflicting declarations on the same file or interface across different tasks
- Task declarations that conflict with change-local specs or design.md
- Earlier task depending on output of a later task, for example Task N's Files declares Modify on a path created by Task M's Files where M > N
- When matching a Check `Verifies:` anchor to a Scenario heading, remove the scenario operation label such as `[ADDED]`, `[MODIFIED]`, or `[REMOVED]` and compare the label-free title
- Present all findings at once, then wait for the user to modify `tasks.md` or explicitly confirm that the findings are ignored
- proceed silently when the scan is clean