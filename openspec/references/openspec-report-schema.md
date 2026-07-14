# Impact Sweeper JSON Report Schema

```json
{
  "concept": "string",
  "projectRoot": "string",
  "termMappings": [{ "userTerm": "string", "projectTerms": ["string"], "evidence": ["string"] }],
  "opsx": {
    "nodes": [{ "id": "string", "reason": "string" }],
    "relationsExpanded": [{ "from": "string", "type": "string", "to": "string" }]
  },
  "mustChange": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "mustVerify": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "contextual": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "unknown": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["string"] }],
  "architectureDrift": [{ "target": "string", "relationPath": [], "reason": "string", "evidence": ["OPSX evidence", "code evidence"] }],
  "questions": ["string"],
  "terminologyObservations": {
    "userInput": "string",
    "foundInSpecs": [{ "term": "string", "specs": ["string"], "count": 1 }]
  }
}
```

Field names are canonical. Omit `terminologyObservations` only when extraction is unavailable. Reports under `openspec/sweeper/` are working notes, never sync/archive inputs.