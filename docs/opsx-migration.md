# Legacy Workspace Migration

This page covers explicit migration from older OPSX layouts. It is not part of the canonical runtime workflow.

OPSX uses `.opsx/` as its only project workspace. It does not probe another directory name, move content automatically, or maintain a compatibility mirror.

For a repository that has not adopted this layout:

1. Commit or back up current work.
2. Create `.opsx/` and move active Specs, changes, references, configuration, and architecture source explicitly.
3. Update automation and documentation to invoke `opsx`.
4. Keep archived changes unchanged as audit history.
5. Run complete Spec and Semantic Model validation.

```bash
opsx validate --all --strict
opsx arch validate
opsx view
```

For a legacy unversioned LikeC4 model, use `opsx migrate semantic-model` to generate a reviewed v1 candidate. For the older OPSX YAML architecture bundle only, use the retained `opsx migrate opsx-to-likec4` converter. Both paths are described in [Migration Guide](migration-guide.md); neither adds runtime fallback behavior.
