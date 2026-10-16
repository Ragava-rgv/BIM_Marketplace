import { UserRole } from '@prisma/client';

export interface JwtAccessPayload {
  sub: string;
  role: UserRole;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  role: UserRole;
  jti: string;
  type: 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}
