import { Spec, Requirement, Scenario } from '../schemas/index.js';
import {
  buildCodeFenceMask,
  extractRequirementBody,
  extractRequirementDisplayText,
} from './requirement-text.js';

export interface Section {
  level: number;
  title: string;
  content: string;
  children: Section[];
}

export class MarkdownParser {
  private lines: string[];
  private codeFenceLineMask: boolean[];
  /** Full requirement bodies (header fallback) for shared keyword validation. */
  private lastRequirementKeywordTexts: string[] = [];

  constructor(content: string) {
    const normalized = MarkdownParser.normalizeContent(content);
    this.lines = normalized.split('\n');
    this.codeFenceLineMask = buildCodeFenceMask(this.lines);
  }

  /** Full bodies aligned with the last parseSpec requirements list. */
  getRequirementKeywordTexts(): string[] {
    return this.lastRequirementKeywordTexts;
  }

  protected static normalizeContent(content: string): string {
    return content.replace(/\r\n?/g, '\n');
  }

  parseSpec(name: string): Spec {
    const sections = this.parseSections();
    const purpose = this.findSection(sections, 'Purpose')?.content || '';
    
    const requirementsSection = this.findSection(sections, 'Requirements');
    
    if (!purpose) {
      throw new Error('Spec must have a Purpose section');
    }
    
    if (!requirementsSection) {
      throw new Error('Spec must have a Requirements section');
    }

    const requirements = this.parseRequirements(requirementsSection);

    return {
      name,
      overview: purpose.trim(),
      requirements,
      metadata: {
        version: '1.0.0',
        format: 'xirang',
      },
    };
  }

  protected parseSections(): Section[] {
    const sections: Section[] = [];
    const stack: Section[] = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (this.codeFenceLineMask[i]) {
        continue;
      }
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const content = this.getContentUntilNextHeader(i + 1, level);
        
        const section: Section = {
          level,
          title,
          content,
          children: [],
        };

        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          sections.push(section);
        } else {
          stack[stack.length - 1].children.push(section);
        }
        
        stack.push(section);
      }
    }
    
    return sections;
  }

  protected getContentUntilNextHeader(startLine: number, currentLevel: number): string {
    const contentLines: string[] = [];
    
    for (let i = startLine; i < this.lines.length; i++) {
      const line = this.lines[i];
      const headerMatch = this.codeFenceLineMask[i] ? null : line.match(/^(#{1,6})\s+/);
      
      if (headerMatch && headerMatch[1].length <= currentLevel) {
        break;
      }
      
      contentLines.push(line);
    }
    
    return contentLines.join('\n').trim();
  }

  protected findSection(sections: Section[], title: string): Section | undefined {
    for (const section of sections) {
      if (section.title.toLowerCase() === title.toLowerCase()) {
        return section;
      }
      const child = this.findSection(section.children, title);
      if (child) {
        return child;
      }
    }
    return undefined;
  }

  protected parseRequirements(section: Section): Requirement[] {
    const requirements: Requirement[] = [];
    this.lastRequirementKeywordTexts = [];
    
    for (const child of section.children) {
      // Display: first prose line. Keyword validation: full fence-aware body (or header fallback).
      const bodyLines = child.content ? child.content.split('\n') : [];
      const body = extractRequirementBody(bodyLines);
      this.lastRequirementKeywordTexts.push(body || child.title.trim());
      const text = extractRequirementDisplayText(child.title, body);
      
      const scenarios = this.parseScenarios(child);
      
      requirements.push({
        text,
        scenarios,
      });
    }
    
    return requirements;
  }

  protected parseScenarios(requirementSection: Section): Scenario[] {
    const scenarios: Scenario[] = [];
    
    for (const scenarioSection of requirementSection.children) {
      // Store the raw text content of the scenario section
      if (scenarioSection.content.trim()) {
        scenarios.push({
          rawText: scenarioSection.content
        });
      }
    }
    
    return scenarios;
  }
}
