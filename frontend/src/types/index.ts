export type Role = 'COORDINATOR' | 'CANDIDATE';

export interface UserSession {
  id?: number;
  email: string;
  role: 'COORDINATOR' | 'CANDIDATE';
  mustChangePassword: boolean;
  displayName: string;
}

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
}

export interface Assignment {
  id: number;
  learnerId: number;
  activityId: number;
  activityTitle: string;
  activityTopic: string;
  plannedHours: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface CohortSummary {
  totalLearners: number;
  totalAssignments: number;
  completedAssignments: number;
}

export interface CreatedCredentials {
  learnerId: number;
  displayName: string;
  email: string;
  cohort: string;
  temporaryPassword: string;
  expiresAt: string;
}
