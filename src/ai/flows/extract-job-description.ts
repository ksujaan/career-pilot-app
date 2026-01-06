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
  tools: [fetchWebsiteContent],
  prompt: `You are an expert web scraper and data extractor. Your task is to extract the job title, company name, and the main job description from the provided URL. Use the fetchWebsiteContent tool to get the website's content.

  Job URL: {{{jobUrl}}}
  
  Analyze the content and identify the following information:
  1. The job title.
  2. The company name.
  3. The core job description, including responsibilities, qualifications, and other relevant details. Exclude headers, footers, navigation bars, and any other irrelevant information.
  
  Please provide the output in a JSON object with the keys "jobTitle", "companyName", and "jobDescription". If any field cannot be found, return an empty string for that field.`,
});


const extractJobDescriptionFlow = ai.defineFlow(
  {
    name: 'extractJobDescriptionFlow',
    inputSchema: ExtractJobDescriptionInputSchema,
    outputSchema: ExtractJobDescriptionOutputSchema,
  },
  async (input) => {
    const result = await extractJobDescriptionPrompt(input);
    try {
        const output = result.output();
        if (output) {
            // The output from the prompt is a string that we expect to be JSON
            const parsed = JSON.parse(output as string);
            return ExtractJobDescriptionOutputSchema.parse(parsed);
        }
    } catch (e) {
        console.error("Error parsing job description JSON:", e);
        // Ignore parsing errors and fall through to the default
    }
    return { jobTitle: "", companyName: "", jobDescription: "" };
  }
);


export async function extractJobDescription(
  input: ExtractJobDescriptionInput
): Promise<ExtractJobDescriptionOutput> {
  const result = await extractJobDescriptionFlow(input);
  return result;
}
