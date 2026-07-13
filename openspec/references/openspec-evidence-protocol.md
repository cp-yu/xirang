# Impact Sweeper Evidence Protocol

1. Query OPSX v2 first through one batch `openspec opsx query <node-id...> --json`; use `--depth 2` when broader relation context is needed. Preserve each relation's canonical from/type/to direction. `belongs_to` supplies domain context only; no relation alone proves `mustChange`.
2. Build cap→spec coverage with `openspec list --specs --json`, then read contracts linked to candidate capabilities.
3. Collect current code evidence after semantic mapping. If CodeGraph is available, use its CLI/MCP symbol, call, import, and blast-radius evidence as an optional accelerator. Never install it automatically and never read `.codegraph/codegraph.db`.
4. If CodeGraph is unavailable or fails, continue with ACE, `rg`, `read`, and `git ls-files`; disclose reduced evidence coverage in `unknown` or `questions` rather than blocking.
5. Do not read `openspec/project.opsx.yaml`, `openspec/project.opsx.relations.yaml`, or any code-map file directly. Use CLI output for OPSX details.
6. When optionalChangeName is provided, inspect only that change's artifacts; exclude archive history.
7. Classify findings as `mustChange`, `mustVerify`, `contextual`, `unknown`, or `architectureDrift`. Every finding includes target, relationPath, reason, and evidence.
8. Use `architectureDrift` when OPSX relation evidence conflicts with current call/import/symbol evidence, preserving both sides.
9. Do not silently upgrade ambiguity: insufficient evidence remains `unknown`, and scope-affecting gaps become `questions`.
10. While reading affected specs, run the terminology awareness step.