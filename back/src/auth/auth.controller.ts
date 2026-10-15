import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

export class LoginDto {
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // O auto-cadastro foi removido: contas são criadas apenas por um administrador
  // através de POST /users (rota protegida). Não há registro público.

  // Limite estrito contra força-bruta: padrão 5 tentativas de login por minuto por IP
  // (configurável via LOGIN_THROTTLE_LIMIT; em produção mantenha 5)
  @Throttle({ default: { ttl: 60_000, limit: Number(process.env.LOGIN_THROTTLE_LIMIT) || 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('me')
  @HttpCode(HttpStatus.OK)
  me(@Body('token') token: string) {
    // Rota utilitária para validar token (usado pelo front)
    return this.authService.validateToken(token);
  }
}
