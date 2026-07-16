export interface ImpactSweepEvidenceItem {
  target: string;
  relationPath: Array<{
    from: string;
    type: string;
    to: string;
  }>;
  reason: string;
  evidence: string[];
}

export interface ImpactSweepReport {
  concept: string;
  projectRoot: string;
  termMappings: Array<{
    userTerm: string;
    projectTerms: string[];
    evidence: string[];
  }>;
  opsx: {
    nodes: Array<{
      id: string;
      reason: string;
    }>;
    relationsExpanded: Array<{
      from: string;
      to: string;
      type: string;
    }>;
  };
  mustChange: ImpactSweepEvidenceItem[];
  mustVerify: ImpactSweepEvidenceItem[];
  contextual: ImpactSweepEvidenceItem[];
  unknown: ImpactSweepEvidenceItem[];
  architectureDrift: ImpactSweepEvidenceItem[];
  questions: string[];
  /**
   * Terminology observation results, used to detect consistency between user input and spec terminology.
   *
   * Example:
   * {
   *   "terminologyObservations": {
   *     "userInput": "workflow",
   *     "foundInSpecs": [
   *       {
   *         "term": "process",
   *         "specs": ["apply-change-workflow"],
   *         "count": 3
   *       }
   *     ]
   *   }
   * }
   */
  terminologyObservations?: TerminologyObservations;
}

export interface TerminologyObservations {
  userInput: string;
  foundInSpecs: TerminologyOccurrence[];
}

export interface TerminologyOccurrence {
  term: string;
  specs: string[];
  count: number;
}
