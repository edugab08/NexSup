import { IsString, IsOptional, IsEnum, IsUUID, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(5, { message: 'O título precisa ter pelo menos 5 caracteres' })
  title: string;

  @IsString()
  @MinLength(10, { message: 'Descreva o problema com pelo menos 10 caracteres' })
  description: string;

  @IsEnum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'])
  @IsOptional()
  priority?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
