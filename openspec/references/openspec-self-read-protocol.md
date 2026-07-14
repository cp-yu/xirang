# Optimizer Self-Read Protocol

Read context in this order:
1. Validate changeName, changeDir, and projectRoot.
2. Read changeDir/.verify-result.json, including Phase 1, findings, history, and failedDirections.
3. Read proposal.md, specs/*/spec.md, design.md, and optimization config.
4. Resolve originalBranch from changeDir/.apply-isolation.json; if absent run git symbolic-ref refs/remotes/origin/HEAD --short; fail closed if unresolved.
5. Run git diff <originalBranch>...HEAD --name-only to build the base scope; use it only for navigation.
6. Read final contents of implementation evidence and base scope files.
7. Apply Dependency Expansion (One Hop).

## Dependency Expansion (One Hop)

Expand direct imports, callers, and directed OPSX semantic relations from project.opsx.relations.yaml. Interpret each relation by its Registry meaning and stop after one hop. Use path.relative to reject paths outside projectRoot, apply gitignore filtering, and exclude node_modules, dist, build, and .git. If relations are missing, continue with imports and callers.

Expansion candidates MUST NOT be actionable finding targets. Actionable locations MUST remain inside base scope files only; report scope-outside opportunities as deferred.