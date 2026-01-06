import type { Timestamp } from "firebase/firestore";

export const APPLICATION_STATUSES = ["Drafted", "Applied", "Interviewing", "Rejected"] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  coverLetter: string;
  coldEmail: string;
  status: ApplicationStatus;
  createdAt: string; // Storing as ISO string
}

export interface UserProfile {
    resume?: string;
    resumeSummary?: string;
    resumeFileName?: string;
}
