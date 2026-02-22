export interface AuthUser {
  id: string;
  name: string;
  displayName: string;
  avatar: string;
  email: string;
  isAdmin?: boolean;
}
