
'use server';

/**
 * @fileOverview Cleans and summarizes resume text.
 *
 * - summarizeResume - A function that takes raw resume text, cleans it, and provides a summary.
 */

import { ai } from '@/ai/genkit';
import {
    SummarizeResumeInputSchema,
    SummarizeResumeOutputSchema,
    type SummarizeResumeInput,
    type SummarizeResumeOutput
} from '@/lib/schema/resume';


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
        const { output } = await summarizeResumePrompt(input, { model: 'groq/llama3-8b-8192' });
        return output!;
    }
);

export async function summarizeResume(
    input: SummarizeResumeInput
  ): Promise<SummarizeResumeOutput> {
    return summarizeResumeFlow(input);
}
