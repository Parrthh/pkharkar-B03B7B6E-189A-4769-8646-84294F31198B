import { Role } from './roles.js';

export interface JwtPayload {
    sub: string;              // userId
    email: string;
    role: Role;
    organizationId: string;
}