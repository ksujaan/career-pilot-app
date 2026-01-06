import { z } from 'zod';

export const SummarizeResumeInputSchema = z.object({
  resumeText: z.string().describe('The raw text content extracted from a resume PDF.'),
});
export type SummarizeResumeInput = z.infer<typeof SummarizeResumeInputSchema>;

export const SummarizeResumeOutputSchema = z.object({
  cleanedText: z.string().describe('The cleaned and formatted resume text.'),
  summary: z.string().describe('A concise, professional summary of the candidate\'s profile.'),
});
export type SummarizeResumeOutput = z.infer<typeof SummarizeResumeOutputSchema>;
