# Xirang Property-Based Test Guarantees

Current property-based tests exercise Xirang parsers, path handling, validation invariants, and deterministic artifact generation. The active architecture contract is LikeC4 under `.xirang/architecture/`; no property test should treat a parallel YAML graph as durable source.

Cross-platform path properties must cover POSIX and Windows separators without accepting backslashes in Spec API paths. Spec access properties must preserve these invariants:

- only project-relative `.xirang/specs/**/*.md` paths are accepted
- `.` and `..` segments are rejected
- absolute and Windows drive paths are rejected
- an element may read only paths indexed by its current model metadata
- realpath containment blocks symlink escapes
- watcher events contain one normalized project-relative path

Run the root property tests with:

```bash
pnpm test
```

The real browser contract is covered separately by `pnpm test:e2e`.
