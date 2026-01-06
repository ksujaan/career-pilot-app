'use server';

import { z } from 'zod';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GenerateCustomApplicationDraftsInputSchema = z.object({
  resume: z.string().describe("The user's resume/CV content."),
  jobDescription: z.string().describe('The job description for the position.'),
  companyName: z.string().describe('The name of the company.'),
  jobTitle: z.string().describe('The title of the job.'),
});
export type GenerateCustomApplicationDraftsInput = z.infer<typeof GenerateCustomApplicationDraftsInputSchema>;

const GenerateCustomApplicationDraftsOutputSchema = z.object({
  subjectLine: z.string().describe('A high-open-rate subject line for the cold email.'),
  coverLetter: z.string().describe('A customized cover letter for the job application.'),
  coldEmail: z.string().describe('A concise, high-conversion cold email for the recruiter.'),
});
export type GenerateCustomApplicationDraftsOutput = z.infer<typeof GenerateCustomApplicationDraftsOutputSchema>;

export async function generateCustomApplicationDrafts(
  input: GenerateCustomApplicationDraftsInput
): Promise<GenerateCustomApplicationDraftsOutput> {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `### ROLE
You are an Elite Career Strategist and Recruitment Copywriter. Your writing style is modern, punchy, and "Human-First."

### OBJECTIVE
Generate a high-impact Subject Line, Cover Letter, and Cold Email for the role of ${input.jobTitle} at ${input.companyName}.

### STRATEGIC INSTRUCTIONS
1. **The Subject Line:** Create a subject line that is short (4-7 words) and looks like an internal memo or a direct question. Avoid "Application for..." or "Job Seeker...".
2. **The Bridge Strategy:** Connect specific pain points in the Job Description to the user's past wins.
3. **The Hook:** Start the cover letter and email with a statement of value or an observation. Never start with "My name is" or "I am writing to."
4. **Cold Email:** Keep it under 100 words.
5. **Tone:** Professional but conversational. Eliminate robotic adjectives like "passionate," "driven," or "motivated."

### STYLE EXAMPLES
- **Good Subject Line:** "Question regarding [Team Name] data goals" or "[Role Title] / [User's Best Skill]"
- **Good Hook:** "I noticed ${input.companyName} is expanding its footprint in [Industry Sector]..."

### NEGATIVE CONSTRAINTS (NEVER USE)
- "I hope this email finds you well"
- "To whom it may concern"
- "Thank you for your time and consideration"
- "I believe I am the ideal candidate because..."

### OUTPUT FORMAT
You must return a valid JSON object with the keys: "subjectLine", "coverLetter", and "coldEmail".`
        },
        {
          role: "user",
          content: `### DATA
- **Job Title:** ${input.jobTitle}
- **Company:** ${input.companyName}
- **Job Description:** ${input.jobDescription}
- **User Resume:** ${input.resume || "No resume provided. Write a high-quality template based on the job description alone."}

### TASK
Based on the data above, generate the JSON output.`
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
    return GenerateCustomApplicationDraftsOutputSchema.parse(parsedOutput);

  } catch (e: any) {
    console.error(`An unexpected error occurred during draft generation:`, e);
    throw e;
  }
}
