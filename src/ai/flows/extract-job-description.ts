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
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/);
        let bodyContent = bodyMatch ? bodyMatch[1] : '';
        
        bodyContent = bodyContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        bodyContent = bodyContent.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
        bodyContent = bodyContent.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
        bodyContent = bodyContent.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
        bodyContent = bodyContent.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
        bodyContent = bodyContent.replace(/<[^>]+>/g, '\n');
        bodyContent = bodyContent.replace(/[ \t]+/g, ' ');
        bodyContent = bodyContent.replace(/(\n\s*){3,}/g, '\n\n');

        return bodyContent.substring(0, 30000); // Increased limit
      } catch (e) {
          console.error(`Error fetching URL: ${e}`);
          return "Could not fetch content.";
      }
    }
);

function extractDetails(content: string): ExtractJobDescriptionOutput {
    let jobTitle = "";
    let companyName = "";
    let jobDescription = "";

    const titleRegex = [
        /<h1[^>]*>([^<]+)<\/h1>/i,
        /job title[:\s]+([^\n]+)/i,
    ];
    for (const regex of titleRegex) {
        const match = content.match(regex);
        if (match && match[1]) {
            jobTitle = match[1].trim();
            break;
        }
    }

    const companyRegex = [
        /company[:\s]+([^\n]+)/i,
        /at\s+([A-Z][a-zA-Z\s&]+)/, // "at Google"
    ];
     for (const regex of companyRegex) {
        const match = content.match(regex);
        if (match && match[1]) {
            companyName = match[1].trim();
            break;
        }
    }

    const descriptionRegex = [
        /About the job\n([\s\S]+)/i,
        /Job Description\n([\s\S]+)/i,
        /Responsibilities\n([\s\S]+)/i,
    ];

    for (const regex of descriptionRegex) {
        const match = content.match(regex);
        if (match && match[1]) {
            // Take the first big chunk of text after the header
            jobDescription = match[1].split(/\n\s*\n/)[0].trim();
            break;
        }
    }
    
    // Fallback if no specific section is found
    if (!jobDescription) {
        jobDescription = content;
    }

    return { jobTitle, companyName, jobDescription };
}


const extractJobDescriptionFlow = ai.defineFlow(
  {
    name: 'extractJobDescriptionFlow',
    inputSchema: ExtractJobDescriptionInputSchema,
    outputSchema: ExtractJobDescriptionOutputSchema,
  },
  async (input) => {
    const content = await fetchWebsiteContent({ url: input.jobUrl });
    if (content === "Could not fetch content.") {
        return { jobTitle: "", companyName: "", jobDescription: "" };
    }
    return extractDetails(content);
  }
);


export async function extractJobDescription(
  input: ExtractJobDescriptionInput
): Promise<ExtractJobDescriptionOutput> {
  const result = await extractJobDescriptionFlow(input);
  return result;
}
