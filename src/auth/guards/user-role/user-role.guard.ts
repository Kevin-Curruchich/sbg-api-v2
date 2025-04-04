import { Reflector } from '@nestjs/core';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { META_ROLES } from 'src/auth/decorators/role-protected/role-protected.decorator';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validRoles) return true;
    if (validRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as {
      user_id: string;
      username: string;
      role_id: string;
    };

    if (!user) {
      throw new BadRequestException('User Not Found');
    }

    const hasRole = validRoles.includes(user.role_id);

    if (hasRole) {
      return true;
    }

    throw new ForbiddenException(`User ${user.username} needs a valid role`);
  }
}
