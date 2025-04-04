import { applyDecorators, UseGuards } from '@nestjs/common';
import { ValidRoles } from '../interfaces';
import { RoleProtected } from './role-protected/role-protected.decorator';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { JwtApiKeyAuthGuard } from '../guards/jwt-api-key.guard';

export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(JwtApiKeyAuthGuard, UserRoleGuard),
  );
}
