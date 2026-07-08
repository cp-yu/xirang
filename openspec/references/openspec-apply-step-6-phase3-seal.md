# Apply Step 6: Phase 3 Seal

Run `openspec verify seal "<change-name>" --json`. If seal fails, preserve diagnostics, convert them into remediation context, map the remediation to the affected task, and return to Phase 0 recovery. Do not pause on the first seal failure.