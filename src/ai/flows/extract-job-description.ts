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
import {defineTool, tool} from 'genkit';

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
      // In a real-world scenario, you would use a library like node-fetch or axios
      // and a library like Cheerio to scrape and clean the HTML content.
      // For this example, we'll simulate a fetch and return a placeholder.
      // This part of the implementation would need to be built out.
      console.log(`Fetching content from ${url}`);
      // This is a placeholder. A real implementation would fetch the URL
      // and extract the main content.
      try {
        const response = await fetch(url);
        const text = await response.text();
        // A real implementation would parse the HTML and extract the relevant text.
        // This is a simplified version.
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/);
        let bodyContent = bodyMatch ? bodyMatch[1] : '';
        // rudimentary tag stripping
        bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        bodyContent = bodyContent.replace(/<[^>]+>/g, '\n');
        bodyContent = bodyContent.replace(/\s{2,}/g, ' ');

        return bodyContent.substring(0, 5000); // Limit context size
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
  
  Analyze the content and identify the main job description. Exclude headers, footers, navigation bars, and any other irrelevant information. Return only the core job description text.`,
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
  return extractJobDescriptionFlow(input);
}
