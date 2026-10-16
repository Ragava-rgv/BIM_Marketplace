import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Same 'jwt-access' passport strategy as JwtAuthGuard, but never throws — if no/invalid token
    is present, req.user is simply left undefined instead of rejecting the request. Used on
    routes that must work for guests and logged-in users alike but still want the user's
    identity when available (e.g. listing detail view-count logic). */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt-access') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
