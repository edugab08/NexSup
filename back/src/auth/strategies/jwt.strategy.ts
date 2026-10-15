import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'nexsupport-secret',
    });
  }

  async validate(payload: any) {
    // Garante que o usuário ainda existe e está ativo
    const user = await this.usersService.findOne(payload.sub).catch(() => null);
    if (!user || !user.active) {
      throw new UnauthorizedException('Conta inativa ou inexistente');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
