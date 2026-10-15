import { IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';

export class FilterTicketDto {
  @IsEnum(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO', 'RESOLVIDO', 'FECHADO', 'REABERTO'])
  @IsOptional()
  status?: string;

  @IsEnum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'])
  @IsOptional()
  priority?: string;

  @IsUUID() @IsOptional() categoryId?: string;
  @IsUUID() @IsOptional() departmentId?: string;
  @IsUUID() @IsOptional() assignedTo?: string;
  @IsUUID() @IsOptional() userId?: string;

  @IsString() @IsOptional() search?: string;
}
