export interface JwtPayload {
  email?: string;
  username?: string;
  sub: number;
  roles: string[];
}
