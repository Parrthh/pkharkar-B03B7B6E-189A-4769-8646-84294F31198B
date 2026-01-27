import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '@org/data';

@Controller()
export class UserController {
    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: Request) {
        return req.user as JwtPayload;
    }
}