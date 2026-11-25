export type Role = 'COORDINATOR' | 'CANDIDATE';

export interface UserSession {
  accountId: number;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

export type AuthUser = UserSession;

export interface Activity {
  id: number;
  title: string;
  topic: string;
  plannedHours: number;
}

export interface Learner {
  id: number;
  displayName: string;
  email: string;
  cohort: string;
  mustChangePassword: boolean;
}

export interface CreatedCredentials {
  learnerId: number;
  displayName: string;
  email: string;
  cohort: string;
  temporaryPassword: string;
  expiresAt: string;
}

export interface Assignment {
  id: number;
  learnerId: number;
  activityId: number;
  activityTitle: string;
  activityTopic: string;
  plannedHours: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  certificateName?: string | null;
  certificateData?: string | null;
}

export interface CohortSummary {
  totalLearners: number;
  totalAssignments: number;
  completedAssignments: number;
}