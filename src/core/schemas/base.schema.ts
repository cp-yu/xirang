import { z } from 'zod';
import { containsShallOrMust } from '../parsers/section-text.js';
import { VALIDATION_MESSAGES } from '../validation/constants.js';

export const AcceptanceCaseSchema = z.object({
  rawText: z.string().min(1, VALIDATION_MESSAGES.ACCEPTANCE_CASE_EMPTY),
});

export const SectionSchema = z.object({
  text: z.string()
    .min(1, VALIDATION_MESSAGES.SECTION_EMPTY)
    .refine(
      (text) => containsShallOrMust(text),
      VALIDATION_MESSAGES.SECTION_NO_SHALL
    ),
  acceptanceCases: z.array(AcceptanceCaseSchema),
});

export type AcceptanceCase = z.infer<typeof AcceptanceCaseSchema>;
export type Section = z.infer<typeof SectionSchema>;
