import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles =
            this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? [];

        // No role requirement => allow
        if (requiredRoles.length === 0) return true;

        const req = context.switchToHttp().getRequest();
        const user = req.user as { role?: string } | undefined; // set by JwtStrategy

        if (!user?.role) throw new ForbiddenException('Missing role');

        const ok = requiredRoles.includes(user.role);
        if (!ok) throw new ForbiddenException('Insufficient role');

        return true;
    }
}