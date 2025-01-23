export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Device {
  id: string;
  name: string;
  userId: string;
  configGenerated: boolean;
  configPath?: string;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
