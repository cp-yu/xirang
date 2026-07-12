# Optimizer Output Protocol

Return one strict JSON envelope and no surrounding prose:

```json
{
  "blockingObservations": [],
  "actions": [
    {
      "action": "add",
      "finding": {
        "status": "pending",
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
        "priorityReason": "why this ranks here"
      }
    }
  ],
  "findings": []
}
```

Allowed levels are high, medium, low. Existing findings use retain, reprioritize, resolve, invalidate, reject, merge, or masterChallenge with their stable ID. New findings MUST omit id. To depend on another add in the same envelope, use { "actionIndex": 0 }; the CLI replaces it with a timestamp ID.

Return every worthwhile finding, ordered by current priority. Do not emit executable patches, diffs, fixed taxonomies, or prose outside JSON. An empty actionable result still includes actions resolving every non-terminal finding. blockingObservations contain location, issue, and evidence.