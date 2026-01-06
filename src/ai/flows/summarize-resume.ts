
'use server';

/**
 * @fileOverview Cleans and summarizes resume text.
 *
 * - summarizeResume - A function that takes raw resume text, cleans it, and provides a summary.
 * - SummarizeResumeInput - The input type for the summarizeResume function.
 * - SummarizeResumeOutput - The return type for the summarizeResume function.
 */

import { ai } from '@/ai/genkit';
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


const summarizeResumePrompt = ai.definePrompt({
    name: 'summarizeResumePrompt',
    input: { schema: SummarizeResumeInputSchema },
    output: { schema: SummarizeResumeOutputSchema },
    prompt: `You are an expert document processor and career coach. Your task is to process the following raw text extracted from a resume.

    Raw Resume Text:
    {{{resumeText}}}

    Please perform the following actions:
    1.  **Clean and Format:** Clean up the text by removing any PDF parsing artifacts, extra whitespace, and messy formatting. Re-organize it into a clean, readable, well-structured text format. Use markdown for headings and lists where appropriate.
    2.  **Summarize Profile:** Based on the cleaned content, write a concise, professional summary of the candidate's profile. This summary should be 2-3 sentences long and highlight their key skills, years of experience, and main qualifications.
    
    Return the result as a JSON object with 'cleanedText' and 'summary' fields.`,
});


const summarizeResumeFlow = ai.defineFlow(
    {
      name: 'summarizeResumeFlow',
      inputSchema: SummarizeResumeInputSchema,
      outputSchema: SummarizeResumeOutputSchema,
    },
    async (input) => {
        const { output } = await summarizeResumePrompt(input);
        return output!;
    }
);

export async function summarizeResume(
    input: SummarizeResumeInput
  ): Promise<SummarizeResumeOutput> {
    return summarizeResumeFlow(input);
}
