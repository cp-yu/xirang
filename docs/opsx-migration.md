# OPSX Workspace Migration

OPSX uses `.opsx/` as its only project workspace. It does not probe another directory name, move content automatically, or maintain a compatibility mirror.

For a repository that has not adopted this layout:

1. Commit or back up current work.
2. Create `.opsx/` and move active Specs, changes, references, configuration, and architecture source explicitly.
3. Update automation and documentation to invoke `opsx`.
4. Keep archived changes unchanged as audit history.
5. Run strict behavior and architecture validation.

```bash
opsx validate --all --strict
opsx arch validate
opsx view
```

For the former OPSX YAML architecture bundle, use the explicit `opsx migrate opsx-to-likec4` command described in [Migration Guide](migration-guide.md). That converter does not add a runtime fallback.
