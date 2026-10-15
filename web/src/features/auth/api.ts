import { http } from '@/lib/http';

export type GoogleLoginResponse = {
  token: string;
  email: string;
  name: string;
};

export const authApi = {
  googleLogin: (idToken: string) =>
    http.post<GoogleLoginResponse>('/auth/google', { idToken }),
};
