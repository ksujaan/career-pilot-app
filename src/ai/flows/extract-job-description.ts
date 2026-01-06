'use server';
/**
 * @fileOverview Extracts job description from a given URL.
 *
 * - extractJobDescription - A function that takes a job URL and returns the job description.
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
        const response = await fetch(url);
        const text = await response.text();
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/);
        let bodyContent = bodyMatch ? bodyMatch[1] : '';
        // A more robust tag stripping process
        bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        bodyContent = bodyContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
        bodyContent = bodyContent.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        bodyContent = bodyContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
        bodyContent = bodyContent.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
        bodyContent = bodyContent.replace(/<[^>]+>/g, '\n');
        bodyContent = bodyContent.replace(/(\n\s*){3,}/g, '\n\n');

        return bodyContent.substring(0, 10000); // Limit context size
      } catch (e) {
          console.error(`Error fetching URL: ${e}`);
          return "Could not fetch content.";
      }
    }
);

const extractJobDescriptionPrompt = ai.definePrompt({
  name: 'extractJobDescriptionPrompt',
  input: {schema: ExtractJobDescriptionInputSchema},
  output: {schema: ExtractJobDescriptionOutputSchema},
  tools: [fetchWebsiteContent],
  prompt: `You are an expert web scraper and data extractor. Your task is to extract the job description from the provided URL. Use the fetchWebsiteContent tool to get the website's content.

  Job URL: {{{jobUrl}}}
  
  Analyze the content and identify the main job description. Exclude headers, footers, navigation bars, and any other irrelevant information. Return only the core job description text, including responsibilities, qualifications, and other relevant details.`,
});

const extractJobDescriptionFlow = ai.defineFlow(
  {
    name: 'extractJobDescriptionFlow',
    inputSchema: ExtractJobDescriptionInputSchema,
    outputSchema: ExtractJobDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await extractJobDescriptionPrompt(input);
    return output!;
  }
);


export async function extractJobDescription(
  input: ExtractJobDescriptionInput
): Promise<ExtractJobDescriptionOutput> {
  const result = await extractJobDescriptionFlow(input);
  return result || { jobDescription: "" };
}
