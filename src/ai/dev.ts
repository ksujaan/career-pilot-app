import { config } from 'dotenv';
config();

import '@/ai/flows/generate-custom-application-drafts.ts';
import '@/ai/flows/extract-job-description.ts';
import '@/ai/flows/summarize-resume.ts';
