import {genkit} from 'genkit';
import {groq} from 'genkitx-groq';

export const ai = genkit({
  plugins: [groq({apiKey: process.env.GROQ_API_KEY})],
  model: 'groq/llama3-8b-8192',
});
