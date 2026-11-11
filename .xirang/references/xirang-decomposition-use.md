**Structural Decomposition Guidance**

- Before forming or reorganizing an Element hierarchy, run `xirang config project --select decomposition --json` and read the normalized `decomposition` value from its JSON output. Do not inspect or reinterpret the raw config, and do not substitute another method.
- Read the guidance file at that resolved path in full. When it is missing or unreadable, stop hierarchy formation and ask the user once.
- Decomposition guidance selects the dimension used for hierarchy abstraction and refinement. It does not override authorized user intent, the Xirang Semantic Model, Element Contracts, Relationships, evidence authority, or the current workflow's read/write boundary.
- Keep every same sibling set on one dimension, make it MECE for the confirmed scope, and confirm breadth-first. Do not mix responsibility, lifecycle, deployment, or implementation dimensions within one sibling set.