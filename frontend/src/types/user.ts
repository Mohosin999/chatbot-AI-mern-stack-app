export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}
