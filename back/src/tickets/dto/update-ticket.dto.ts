import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class UpdateTicketDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;

  @IsEnum(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO', 'RESOLVIDO', 'FECHADO', 'REABERTO'])
  @IsOptional()
  status?: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO' | 'REABERTO';

  @IsEnum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'])
  @IsOptional()
  priority?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

  @IsUUID() @IsOptional() assignedTo?: string;
  @IsUUID() @IsOptional() departmentId?: string;
  @IsUUID() @IsOptional() categoryId?: string;
}
