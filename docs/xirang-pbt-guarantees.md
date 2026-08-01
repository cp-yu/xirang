# Xirang Property-Based Test Guarantees

Current property-based tests exercise Xirang parsers, path handling, validation invariants, and deterministic artifact generation. The Semantic Model is persisted under `.xirang/model/{metamodel,elements,relationships,views}/`; LikeC4 is generated from the complete model into `.xirang/.cache-likec4/` for visualization only and must not be treated as durable source.

Cross-platform path properties must cover POSIX and Windows separators without accepting backslashes in contract access paths. Contract access properties must preserve these invariants:

- only project-relative `.xirang/model/**` unit paths are accepted; Element lookups resolve by stable `identity`, never by constructed file path
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
