// use server'

/**
 * @fileOverview Generates customized cover letters and cold emails based on a resume/CV and job description.
 *
 * - generateCustomApplicationDrafts - A function that takes resume, job description, company name, and job title as input and returns a cover letter and cold email.
 * - GenerateCustomApplicationDraftsInput - The input type for the generateCustomApplicationDrafts function.
 * - GenerateCustomApplicationDraftsOutput - The return type for the generateCustomApplicationDrafts function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomApplicationDraftsInputSchema = z.object({
  resume: z.string().describe('The user\'s resume/CV content.'),
  jobDescription: z.string().describe('The job description for the position.'),
  companyName: z.string().describe('The name of the company.'),
  jobTitle: z.string().describe('The title of the job.'),
});
export type GenerateCustomApplicationDraftsInput = z.infer<typeof GenerateCustomApplicationDraftsInputSchema>;

const GenerateCustomApplicationDraftsOutputSchema = z.object({
  coverLetter: z.string().describe('A customized cover letter for the job application.'),
  coldEmail: z.string().describe('A concise, high-conversion cold email for the recruiter.'),
});
export type GenerateCustomApplicationDraftsOutput = z.infer<typeof GenerateCustomApplicationDraftsOutputSchema>;

export async function generateCustomApplicationDrafts(
  input: GenerateCustomApplicationDraftsInput
): Promise<GenerateCustomApplicationDraftsOutput> {
  return generateCustomApplicationDraftsFlow(input);
}

const generateCustomApplicationDraftsPrompt = ai.definePrompt({
  name: 'generateCustomApplicationDraftsPrompt',
  input: {schema: GenerateCustomApplicationDraftsInputSchema},
  output: {schema: GenerateCustomApplicationDraftsOutputSchema},
  prompt: `You are an expert career coach. You will generate a cover letter and a cold email based on the user's resume and the job description.

  Company Name: {{{companyName}}}
  Job Title: {{{jobTitle}}}

  Resume/CV:
  {{#if resume}}
  {{{resume}}}
  {{else}}
  The user has not provided a resume. Please generate a cover letter and cold email that is not tailored to a specific resume.
  {{/if}}

  Job Description:
  {{{jobDescription}}}

  Please follow these instructions carefully:

  1.  Cover Letter: Write a professional cover letter that is tailored to the job description. Make sure it is well-written and error-free. Focus on highlighting how the user's skills and experience align with the job requirements. Use the resume only as needed, if available.
  2.  Cold Email: Write a concise, high-conversion cold email to the recruiter. This email should be attention-grabbing and should highlight the user's key qualifications for the role. Keep it short and to the point.
  `,
});

const generateCustomApplicationDraftsFlow = ai.defineFlow(
  {
    name: 'generateCustomApplicationDraftsFlow',
    inputSchema: GenerateCustomApplicationDraftsInputSchema,
    outputSchema: GenerateCustomApplicationDraftsOutputSchema,
  },
  async input => {
    const {output} = await generateCustomApplicationDraftsPrompt(input, { model: 'groq/llama3-8b-8192' });
    return output!;
  }
);
