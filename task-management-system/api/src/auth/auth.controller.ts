import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginRequestDto, LoginResponseDto } from '@org/data';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
        return this.authService.login(dto);
    }
}