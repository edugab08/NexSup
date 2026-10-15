import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';

// Usado apenas pela rota protegida POST /users (admin).
// Diferente do registro público, aqui o admin pode definir o papel.
export class AdminCreateUserDto {
  @IsString()
  @MinLength(2, { message: 'Informe o nome' })
  name: string;

  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha precisa ter pelo menos 8 caracteres' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'A senha deve conter ao menos uma letra e um número',
  })
  password: string;

  @IsEnum(['USER', 'AGENT', 'ADMIN'], { message: 'Papel inválido' })
  @IsOptional()
  role?: 'USER' | 'AGENT' | 'ADMIN';
}
