'use server';

/**
 * @fileOverview Cleans and summarizes resume text.
 *
 * - summarizeResume - A function that takes raw resume text, cleans it, and provides a summary.
 */
import { z } from 'zod';
import Groq from 'groq-sdk';
import {
    SummarizeResumeInputSchema,
    SummarizeResumeOutputSchema,
    type SummarizeResumeInput,
    type SummarizeResumeOutput
} from '@/lib/schema/resume';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


export async function summarizeResume(
    input: SummarizeResumeInput
  ): Promise<SummarizeResumeOutput> {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert document processor and career coach. Your task is to process the following raw text extracted from a resume.

                    You must return the data in a valid JSON object with the following keys: "cleanedText", "summary".

                    Please perform the following actions:
                    1.  **Clean and Format:** Clean up the text by removing any PDF parsing artifacts, extra whitespace, and messy formatting. Re-organize it into a clean, readable, well-structured text format. Use markdown for headings and lists where appropriate.
                    2.  **Summarize Profile:** Based on the cleaned content, write a concise, professional summary of the candidate's profile. This summary should be 2-3 sentences long and highlight their key skills, years of experience, and main qualifications.`
                },
                {
                    role: "user",
                    content: `Raw Resume Text:
                    ${input.resumeText}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
        });

        const output = chatCompletion.choices[0]?.message?.content;
        
        if (!output) {
            throw new Error("AI failed to generate a response.");
        }

        const parsedOutput = JSON.parse(output);
        return SummarizeResumeOutputSchema.parse(parsedOutput);

    } catch (e: any) {
        console.error(`An unexpected error occurred during resume summarization:`, e);
        throw e;
    }
}
