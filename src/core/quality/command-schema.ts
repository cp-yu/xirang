import { z } from 'zod';

const text = z.string().trim().min(1);
const findings = z.array(text);

export const reviewKindSchema = z.enum(['full-change', 'incremental', 'supplemental']);

export const reviewSchema = z.object({
  reviewKind: reviewKindSchema,
  commit: text,
  result: z.enum(['PASS', 'FAIL']),
  summary: text,
  findings,
}).strict();

export const optSchema = z.discriminatedUnion('disposition', [
  z.object({ disposition: z.literal('not_performed'), reason: text }).strict(),
  z.object({
    disposition: z.literal('delivered'),
    opinions: z.array(z.object({ opinionId: text, baseCommit: text, resultCommit: text, summary: text, findings }).strict()).min(1),
  }).strict(),
]);

export const sealSchema = z.object({
  commit: text,
  canRun: z.boolean(),
  testsExpectedToPass: z.boolean(),
  testScope: text,
  assessment: text,
}).strict();

export const qualityOptionMetadata = {
  version: { flags: '--version <number>', label: 'expected record revision' },
  input: { flags: '--input <json>', label: 'JSON payload' },
  from: { flags: '--from <file>', label: 'JSON file' },
  json: { flags: '--json', label: 'Output JSON' },
} as const;

export const commandSchemas = { review: reviewSchema, opt: optSchema, seal: sealSchema };
export type ReviewPayload = z.infer<typeof reviewSchema>;
export type OptPayload = z.infer<typeof optSchema>;
export type SealPayload = z.infer<typeof sealSchema>;
