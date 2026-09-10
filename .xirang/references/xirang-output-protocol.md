# Optimizer Output Protocol

Return one strict JSON round ledger and no surrounding prose:

```json
{
  "directions": [
    {
      "location": { "files": ["src/file.ts"], "symbols": ["symbol"] },
      "opportunity": "specific current problem",
      "impact": "concrete benefit",
      "evidence": ["current-code evidence"],
      "recommendation": "modification advice",
      "keyDesign": "target structure, algorithm, or data flow",
      "preservationConstraints": ["behavior that must remain"],
      "implementationOutline": ["ordered implementation guidance"],
      "validation": ["tests and claims they prove"],
      "impactLevel": "high",
      "confidence": "high",
      "risk": "low",
      "cost": "low",
      "dependencies": [],
      "priorityReason": "why this direction ranks here"
    }
  ],
  "attempt": { "directionId": "OPT-…", "status": "verified", "summary": "round outcome" },
  "stopReason": "NO_ACTIONABLE",
  "summary": "one-line conclusion the master records when the loop stops"
}
```

- `impactLevel`, `confidence`, `risk`, and `cost` accept high, medium, or low.
- New directions MUST omit `id`; the CLI assigns and echoes every identifier. To depend on another direction of the same request, use `{ "actionIndex": 0 }`.
- To update a direction the CLI already recorded, send `{ "id": "OPT-…", "status": "rejected|deferred", "reason": "...", "evidence": ["..."] }`.
- `attempt` reports the previous round outcome for the direction the CLI selected; `stopReason` finalizes the loop and is required when you stop.
- Always emit the top-level `summary` with your conclusion for this round; a round that stops the loop must carry it, and the master forwards it verbatim.
- Do not emit executable patches, diffs, fixed taxonomies, or prose outside JSON.
