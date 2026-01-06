import {genkit} from 'genkit';
import {groq} from 'genkitx-groq';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [groq({apiKey: process.env.GROQ_API_KEY}), googleAI()],
  model: 'llama3-8b-8192',
});
