# **App Name**: CareerPilot

## Core Features:

- Profile Storage: Securely store the user's resume/CV data in local storage.
- Application Input: Provide a form to input Company Name, Job Title, and Job Description for each application.
- Application Tracking: Track all previous applications with their status (Drafted, Applied, Interviewing, Rejected) in a sortable list/table.
- Draft Generation: Use the Gemini API to analyze the stored resume and the Job Description to generate a customized Cover Letter and a concise, high-conversion cold email; the LLM will use its reasoning ability as a tool to decide when and if to incorporate information from the user's resume into the generated Cover Letter.
- Copy to Clipboard: Implement a 'Copy to Clipboard' button for the generated Cover Letter and cold email drafts.
- Application Status Updates: Allow users to modify the status of existing applications (Drafted, Applied, Interviewing, Rejected).

## Style Guidelines:

- Primary color: Slate blue (#708090) to convey professionalism and stability.
- Background color: Off-white (#F8F8FF) for a clean, minimalist look.
- Accent color: Soft teal (#66CDAA) for interactive elements and highlights.
- Body and headline font: 'Inter', a sans-serif, for a clean, modern, neutral style.
- Use simple, consistent icons from a set like 'Feather' or 'Heroicons' for navigation and actions.
- Implement a clean layout using a sidebar or tabs for navigation between 'New Entry', 'Tracker', and 'Profile'.
- Use subtle animations for loading states, transitions, and user feedback (e.g., a brief highlight on a 'Copy to Clipboard' action).