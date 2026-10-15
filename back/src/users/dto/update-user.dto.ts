import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsString() @IsOptional() name?: string;
  @IsEmail() @IsOptional() email?: string;

  @IsEnum(['USER', 'AGENT', 'ADMIN'])
  @IsOptional()
  role?: 'USER' | 'AGENT' | 'ADMIN';

  @IsString() @IsOptional() phone?: string;
  @IsBoolean() @IsOptional() active?: boolean;
}
