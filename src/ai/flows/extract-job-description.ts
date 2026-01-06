'use server';
/**
 * @fileOverview Extracts job details from a given URL.
 *
 * - extractJobDescription - A function that takes a job URL and returns the job title, company name, and description.
 * - ExtractJobDescriptionInput - The input type for the extractJobDescription function.
 * - ExtractJobDescriptionOutput - The return type for the extractJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractJobDescriptionInputSchema = z.object({
  jobUrl: z.string().url().describe('The URL of the job posting.'),
});
export type ExtractJobDescriptionInput = z.infer<typeof ExtractJobDescriptionInputSchema>;

const ExtractJobDescriptionOutputSchema = z.object({
  jobTitle: z.string().describe('The extracted job title from the URL.'),
  companyName: z.string().describe('The extracted company name from the URL.'),
  jobDescription: z.string().describe('The extracted job description from the URL.'),
});
export type ExtractJobDescriptionOutput = z.infer<typeof ExtractJobDescriptionOutputSchema>;

const fetchWebsiteContent = ai.defineTool(
    {
      name: 'fetchWebsiteContent',
      description: 'Fetches the text content of a given URL.',
      input: {schema: z.object({url: z.string().url()})},
      output: {schema: z.string()},
    },
    async ({url}) => {
      try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
        if (!response.ok) {
            console.error(`Error fetching URL: Status ${response.status}`);
            return "Could not fetch content.";
        }
        const text = await response.text();
        // Simple HTML to text conversion
        let bodyContent = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        bodyContent = bodyContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
        bodyContent = bodyContent.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        bodyContent = bodyContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
        bodyContent = bodyContent.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
        bodyContent = bodyContent.replace(/<[^>]+>/g, '\n');
        bodyContent = bodyContent.replace(/[ \t]+/g, ' ');
        bodyContent = bodyContent.replace(/(\n\s*){3,}/g, '\n\n');

        // Limit the content to avoid being too large for the model
        return bodyContent.substring(0, 30000); 
      } catch (e) {
          console.error(`Error fetching URL: ${e}`);
          return "Could not fetch content.";
      }
    }
);


const extractJobDescriptionPrompt = ai.definePrompt({
    name: 'extractJobDescriptionPrompt',
    input: { schema: z.object({ jobUrl: z.string() }) },
    output: { schema: ExtractJobDescriptionOutputSchema },
    tools: [fetchWebsiteContent],
    prompt: `You are an expert data extractor. A user has provided a URL to a job posting.
    Fetch the content of the webpage using the fetchWebsiteContent tool.
    From the content, extract the following information:
    1.  Job Title
    2.  Company Name
    3.  Job Description (This is usually under a heading like "About the job", "Job details", or "Description").

    Return the extracted data as a JSON object. If you cannot find a piece of information, return an empty string for that field.
    
    URL: {{{jobUrl}}}`,
});

const extractJobDescriptionFlow = ai.defineFlow(
  {
    name: 'extractJobDescriptionFlow',
    inputSchema: ExtractJobDescriptionInputSchema,
    outputSchema: ExtractJobDescriptionOutputSchema,
  },
  async (input) => {
    const primaryModel = 'googleai/gemini-2.5-flash';
    const backupModel = 'googleai/gemini-2.0-flash';
    
    try {
        const { output } = await extractJobDescriptionPrompt(input, {model: primaryModel});
        return output || { jobTitle: "", companyName: "", jobDescription: "" };
    } catch (e: any) {
        const isQuotaError = (e.cause as any)?.status === 429;

        if (isQuotaError) {
            console.warn(`Quota exceeded for ${primaryModel}. Trying backup model ${backupModel}.`);
            const { output } = await extractJobDescriptionPrompt(input, {model: backupModel});
            return output || { jobTitle: "", companyName: "", jobDescription: "" };
        }
        // Re-throw other errors
        console.error("An unexpected error occurred during job description extraction:", e);
        throw e;
    }
  }
);


export async function extractJobDescription(
  input: ExtractJobDescriptionInput
): Promise<ExtractJobDescriptionOutput> {
  const result = await extractJobDescriptionFlow(input);
  return result;
}
