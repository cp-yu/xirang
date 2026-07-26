# Optimizer Self-Read Protocol

Read context in this order:
1. Validate changeName, changeDir, and projectRoot.
2. Read changeDir/.verify-result.json, including Phase 1, findings, history, and failedDirections.
3. Read proposal.md, design.md, every Semantic Delta unit under changeDir/{metamodel,elements,relationships,views}/, and optimization config.
4. Read `baseCommit` from changeDir/.apply-isolation.json and validate that Git resolves it; fail closed if the immutable evidence baseline is absent or invalid.
5. Run `git diff <baseCommit>...HEAD --name-only` and `git status --short`; their union is the base scope and is used only for navigation.
6. Read final contents of implementation evidence and base scope files.
7. Apply Dependency Expansion (One Hop).

## Dependency Expansion (One Hop)

Expand direct imports, callers, and directed semantic relationships from `xirang arch query <identity> --relations --depth 1 --json`. Interpret each relationship by its declared meaning and stop after one hop. Use path.relative to reject paths outside projectRoot, apply gitignore filtering, and exclude node_modules, dist, build, and .git. If relations are missing, continue with imports and callers.

Expansion candidates MUST NOT be actionable finding targets. Actionable locations MUST remain inside base scope files only; report scope-outside opportunities as deferred.