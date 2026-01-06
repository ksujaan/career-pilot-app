'use server';
/**
 * @fileOverview Extracts job details from a given URL using a hybrid approach.
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

// This tool's only job is to fetch the raw text from a URL.
// The complex parsing is left to the LLM.
const extractWebsiteData = ai.defineTool(
    {
      name: 'extractWebsiteData',
      description: 'Fetches the text content from a given URL.',
      inputSchema: z.object({url: z.string().url()}),
      outputSchema: z.string(),
    },
    async ({url}) => {
        try {
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
            if (!response.ok) {
                console.error(`Error fetching URL: Status ${response.status}`);
                return `Failed to fetch content from URL. Status: ${response.status}`;
            }
            const text = await response.text();
            
            // Basic HTML to text conversion to clean up the content for the LLM
            let content = text;
            content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
            content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
            content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
            content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
            content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
            content = content.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
            content = content.replace(/<[^>]+>/g, '\n');
            content = content.replace(/[ \t]+/g, ' ');
            content = content.replace(/(\n\s*){3,}/g, '\n\n');
            
            // Limit content to prevent overly large payloads to the LLM
            return content.trim().substring(0, 15000);
        } catch (e: any) {
            console.error(`Error processing URL: ${e}`);
            return `An error occurred while fetching the URL: ${e.message}`;
        }
    }
);

const extractJobDescriptionPrompt = ai.definePrompt({
    name: 'extractJobDescriptionPrompt',
    input: { schema: ExtractJobDescriptionInputSchema },
    output: { schema: ExtractJobDescriptionOutputSchema },
    tools: [extractWebsiteData],
    prompt: `You are an expert data extraction agent. Your task is to extract the job title, company name, and full job description from the content of the provided URL.

    Use the 'extractWebsiteData' tool to fetch the content from the job URL: {{{jobUrl}}}
    
    From the extracted text, identify and return the following three fields:
    1.  **jobTitle**: The title of the position (e.g., "Software Engineer").
    2.  **companyName**: The name of the company hiring (e.g., "Google").
    3.  **jobDescription**: The full text of the job description, including responsibilities, qualifications, etc.
    
    If you cannot confidently determine one of the fields, return an empty string for it.
    `,
});

const extractJobDescriptionFlow = ai.defineFlow(
  {
    name: 'extractJobDescriptionFlow',
    inputSchema: ExtractJobDescriptionInputSchema,
    outputSchema: ExtractJobDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await extractJobDescriptionPrompt(input);
    return output || { jobTitle: "", companyName: "", jobDescription: "" };
  }
);


export async function extractJobDescription(
  input: ExtractJobDescriptionInput
): Promise<ExtractJobDescriptionOutput> {
  const result = await extractJobDescriptionFlow(input);
  return result;
}
