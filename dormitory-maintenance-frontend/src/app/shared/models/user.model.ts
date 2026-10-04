export type UserRole = 'student' | 'janitor' | 'admin';

export type JanitorSpecialization = 'plumbing' | 'electrical' | 'furniture' | 'heating' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  specialization?: JanitorSpecialization;
  isActive: boolean;
  createdAt: string;
}
