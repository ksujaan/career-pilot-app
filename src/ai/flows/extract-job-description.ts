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

const extractWebsiteData = ai.defineTool(
    {
      name: 'extractWebsiteData',
      description: 'Fetches and extracts structured job data from a given URL.',
      input: {schema: z.object({url: z.string().url()})},
      output: {schema: ExtractJobDescriptionOutputSchema},
    },
    async ({url}) => {
        try {
            const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
            if (!response.ok) {
                console.error(`Error fetching URL: Status ${response.status}`);
                return { jobTitle: "", companyName: "", jobDescription: "" };
            }
            const text = await response.text();

            // Simple HTML to text conversion for cleanup
            const cleanText = (html: string) => {
                let content = html;
                content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
                content = content.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
                content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
                content = content.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
                content = content.replace(/<[^>]+>/g, '\n');
                content = content.replace(/[ \t]+/g, ' ');
                content = content.replace(/(\n\s*){3,}/g, '\n\n');
                return content;
            };
            
            const bodyText = cleanText(text);

            // Simple Regex to find job description section
            const jobDescriptionRegex = /(About the job|Job description|Job details)[\s\S]*/i;
            const descriptionMatch = bodyText.match(jobDescriptionRegex);
            const jobDescription = descriptionMatch ? descriptionMatch[0].trim().substring(0, 5000) : ""; // Limit length

            // For title and company, we can try to get it from the <title> tag as a fallback
            const titleRegex = /<title>(.*?)<\/title>/i;
            const titleMatch = text.match(titleRegex);
            let pageTitle = titleMatch ? titleMatch[1] : "";

            let jobTitle = "";
            let companyName = "";

            if (pageTitle.includes(" | ")) {
                const parts = pageTitle.split(" | ");
                jobTitle = parts[0];
                companyName = parts[1];
            } else if (pageTitle.includes(" at ")) {
                const parts = pageTitle.split(" at ");
                jobTitle = parts[0];
                companyName = parts[1];
            } else if (pageTitle.includes(" - ")) {
                 const parts = pageTitle.split(" - ");
                jobTitle = parts[0];
                companyName = parts[1];
            }

            return {
                jobTitle: jobTitle.trim(),
                companyName: companyName.trim(),
                jobDescription: jobDescription,
            };

        } catch (e) {
            console.error(`Error processing URL: ${e}`);
            return { jobTitle: "", companyName: "", jobDescription: "" };
        }
    }
);


const extractJobDescriptionFlow = ai.defineFlow(
  {
    name: 'extractJobDescriptionFlow',
    inputSchema: ExtractJobDescriptionInputSchema,
    outputSchema: ExtractJobDescriptionOutputSchema,
  },
  async ({ jobUrl }) => {
    // Directly call the tool and return its result. No LLM needed.
    const result = await extractWebsiteData({ url: jobUrl });
    return result;
  }
);


export async function extractJobDescription(
  input: ExtractJobDescriptionInput
): Promise<ExtractJobDescriptionOutput> {
  const result = await extractJobDescriptionFlow(input);
  return result;
}
