import { UserRole } from '@models/user-role.model';
import { JanitorSpecialization } from '@models/janitor-specialication.model';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  specialization?: JanitorSpecialization;
  isActive: boolean;
  createdAt: string;
}
