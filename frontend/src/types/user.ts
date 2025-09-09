export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  commission: number;
  timezone: string;
  defaultStrategy?: string;
  favoriteSymbols: string[];
}