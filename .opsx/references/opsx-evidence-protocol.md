# Impact Sweeper Evidence Protocol

1. Query known stable identities with `opsx arch query <elementId> --relations --depth 2 --json`. Preserve each relationship's canonical source/kind/target direction.
2. Use parent and children as abstraction/refinement context only; adjacency alone does not prove `mustChange`.
3. Run `opsx list --specs --json` and use the Element Contract registry to read Specs owned by candidate elements.
4. Collect current code evidence after semantic mapping. If CodeGraph is available, use its CLI/MCP symbol, call, import, and blast-radius evidence as an optional accelerator. Never install it automatically and never read `.codegraph/codegraph.db`.
5. If CodeGraph is unavailable or fails, continue with ACE, `rg`, `read`, and `git ls-files`; disclose reduced evidence coverage in `unknown` or `questions` rather than blocking.
6. Use canonical `elementId` values in the report. A current FQN MAY accompany an element only as source navigation evidence.
7. When optionalChangeName is provided, inspect only that change's artifacts; exclude archive history.
8. Classify findings as `mustChange`, `mustVerify`, `contextual`, `unknown`, or `architectureDrift`. Every finding includes target, relationPath, reason, and evidence.
9. Use `architectureDrift` when Semantic Model relationship evidence conflicts with current call/import/symbol evidence, preserving both sides.
10. Do not silently upgrade ambiguity: insufficient evidence remains `unknown`, and scope-affecting gaps become `questions`.
11. While reading affected Specs, run the terminology awareness step.