export type UserRole = 'support' | 'admin' | 'developer';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
}
