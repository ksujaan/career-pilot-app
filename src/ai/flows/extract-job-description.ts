'use server';
/**
 * @fileOverview Extracts job details from a given URL using a hybrid approach.
 *
 * - extractJobDescription - A function that takes a job URL and returns the job title, company name, and description.
 * - ExtractJobDescriptionInput - The input type for the extractJobDescription function.
 * - ExtractJobDescriptionOutput - The return type for the extractJobDescription function.
 */

import { z } from 'zod';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

async function fetchWebsiteData(url: string): Promise<string> {
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
        if (!response.ok) {
            throw new Error(`Failed to fetch content. Status: ${response.status}`);
        }
        const text = await response.text();
        
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
        
        return content.trim().substring(0, 15000);
    } catch (e: any) {
        console.error(`Error processing URL: ${e.message}`);
        throw new Error(`An error occurred while fetching the URL: ${e.message}`);
    }
}

export async function extractJobDescription(
  input: ExtractJobDescriptionInput
): Promise<ExtractJobDescriptionOutput> {
  try {
    const websiteContent = await fetchWebsiteData(input.jobUrl);

    if (!websiteContent) {
        throw new Error("Could not retrieve content from the URL.");
    }
    
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are an expert data extraction agent. Your task is to extract the job title, company name, and full job description from the provided text content of a webpage.
                
                You must return the data in a valid JSON object with the following keys: "jobTitle", "companyName", "jobDescription".
                
                From the extracted text, identify and return the following three fields:
                1.  **jobTitle**: The title of the position (e.g., "Software Engineer"). If you see a job title and location, only extract the job title.
                2.  **companyName**: The name of the company hiring (e.g., "Google").
                3.  **jobDescription**: The full text of the job description, including responsibilities, qualifications, etc. Look for "About the job" or similar headings.
                
                If you cannot confidently determine one of the fields, return an empty string for it.`
            },
            {
                role: "user",
                content: `Here is the website content:\n\n${websiteContent}`
            }
        ],
        model: "llama3-70b-8192",
        response_format: { type: "json_object" },
    });

    const output = chatCompletion.choices[0]?.message?.content;
    
    if (!output) {
        throw new Error("AI failed to generate a response.");
    }

    const parsedOutput = JSON.parse(output);
    return ExtractJobDescriptionOutputSchema.parse(parsedOutput);

  } catch (e: any) {
      console.error(`An unexpected error occurred during job description extraction:`, e);
      // Re-throw the original error to be caught by the frontend
      throw e;
  }
}
