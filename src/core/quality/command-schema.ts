import { z } from 'zod';

const text = z.string().trim().min(1);
const strings = z.array(text);
const scope = z.enum(['baseline', 'incremental', 'defect-repair']);
const reviewResult = z.enum(['PASS', 'PASS_WITH_WARNINGS', 'FAIL_NEEDS_CORRECTIONS']);
const issue = z.object({ severity: z.enum(['CRITICAL', 'WARNING', 'SUGGESTION']), message: text }).passthrough();
const writeBack = z.object({
  taskLine: z.string().nullable().optional(),
  action: z.enum(['unmark', 'append_correction']),
  correctionType: z.enum(['code_fix', 'artifact_fix']).optional(),
  section: z.string().optional(),
  summary: text.optional(),
  nextAction: text.optional(),
}).strict().superRefine((entry, context) => {
  if (!entry.summary && !entry.nextAction) context.addIssue({ code: 'custom', message: 'Writeback needs a summary or nextAction.' });
  if (!entry.correctionType) context.addIssue({ code: 'custom', message: 'Writeback requires correctionType.' });
  if (entry.action === 'unmark' && !entry.taskLine) context.addIssue({ code: 'custom', message: 'Unmark requires an exact taskLine.' });
  if (entry.action === 'append_correction' && entry.taskLine !== null) context.addIssue({ code: 'custom', message: 'Appended corrections require taskLine=null.' });
});
const summary = z.union([text, z.record(z.string(), z.unknown())]);
const applicability = z.object({
  evidenceId: text.optional(), reviewId: text.optional(), scope: text,
  differenceBasis: text, reason: text, affected: z.literal(false),
}).strict().refine(value => Boolean(value.evidenceId) !== Boolean(value.reviewId), 'Exactly one evidenceId or reviewId is required.');
const verificationPlan = z.object({ scope: text, reason: text }).strict();
const baselineDefect = z.object({
  problem: text, repairScope: text, repairEvidenceIds: strings, reviewId: text,
}).strict();

export const reviewBeginSchema = z.object({
  scope: scope.default('baseline'), assignment: text, delegationIds: strings.optional(),
  revalidation: z.object({ reason: text, previousFlowStopped: z.literal(true) }).strict().optional(),
}).strict().superRefine((value, context) => {
  if (value.revalidation && (value.scope !== 'baseline' || value.delegationIds !== undefined)) {
    context.addIssue({ code: 'custom', path: ['scope'], message: 'Revalidation requires baseline scope without delegationIds.' });
  }
});

export const reviewSubmitSchema = z.object({
  result: reviewResult, issues: z.array(issue), evidenceFiles: strings,
  summary, writeBackPlan: z.array(writeBack).default([]),
}).strict();

export const delegationStartSchema = z.object({
  action: z.literal('start'), scope: text, constraints: strings.optional(),
  baselineReviewId: text, recoveryCommit: text,
}).strict();
export const delegationSaveSchema = z.object({
  action: z.literal('save'), delegationId: text, report: text, evidenceIds: strings,
  delivery: z.enum(['progress', 'delivered']), unresolved: z.boolean(),
}).strict();
export const delegationSkipSchema = z.object({
  action: z.literal('skip'), basis: z.enum(['disabled', 'user_refusal']), reason: text,
}).strict();

export const completionPlanSchema = z.object({
  action: z.literal('plan'), delegationIds: strings, verificationPlan: z.array(verificationPlan),
  reasons: text, requiredEvidenceIds: strings, requiredReviewIds: strings,
  baselineDefects: z.array(baselineDefect), applicability: z.array(applicability),
  recoveryConfirmed: z.boolean(), unresolvedIssues: strings,
}).strict();
export const completionCompleteSchema = z.object({
  action: z.literal('complete'), planId: text, reasons: text,
}).strict();

export const qualityOptionMetadata = {
  begin: { flags: '--begin', label: 'begin' },
  review: { flags: '--review <id>', label: 'review id' },
  version: { flags: '--version <number>', label: 'quality version' },
  input: { flags: '--input <json>', label: 'JSON input' },
  from: { flags: '--from <file>', label: 'JSON file' },
  json: { flags: '--json', label: 'JSON output' },
  delegation: { flags: '--delegation <id>', label: 'delegation id' },
  scope: { flags: '--scope <text>', label: 'scope' },
  kind: { flags: '--kind <kind>', label: 'checkpoint kind', required: true },
  commit: { flags: '--commit <sha>', label: 'commit SHA', required: true },
} as const;

export const commandSchemas = {
  reviewBegin: reviewBeginSchema,
  reviewSubmit: reviewSubmitSchema,
  delegationStart: delegationStartSchema,
  delegationSave: delegationSaveSchema,
  delegationSkip: delegationSkipSchema,
  completionPlan: completionPlanSchema,
  completionComplete: completionCompleteSchema,
};

export type ReviewBeginPayload = z.infer<typeof reviewBeginSchema>;
export type ReviewSubmitPayload = z.infer<typeof reviewSubmitSchema>;
export type DelegationStartPayload = z.infer<typeof delegationStartSchema>;
export type DelegationSavePayload = z.infer<typeof delegationSaveSchema>;
export type DelegationSkipPayload = z.infer<typeof delegationSkipSchema>;
export type CompletionPlanPayload = z.infer<typeof completionPlanSchema>;
export type CompletionCompletePayload = z.infer<typeof completionCompleteSchema>;
