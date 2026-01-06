import {genkit} from 'genkit';
import {groq} from 'genkitx-groq';

export const ai = genkit({
  plugins: [groq()],
  model: 'llama3-8b-8192',
});
