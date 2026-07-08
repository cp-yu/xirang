# Apply Step 2: Pre-flight Scan

Before entering branch isolation, scan all tasks in tasks.md for contradictions and dependency-ordering issues across Goals, Files, Requirements, and Checks:
- Conflicting declarations on the same file or interface across different tasks
- Task declarations that conflict with change-local specs or design.md
- Earlier task depending on output of a later task, for example Task N's Files declares Modify on a path created by Task M's Files where M > N
- Present all findings at once; proceed silently when the scan is clean