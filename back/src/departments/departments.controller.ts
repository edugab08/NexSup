import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsUUID, MinLength } from 'class-validator';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateDepartmentDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() active?: boolean;
}

export class AddMemberDto {
  @IsUUID()
  userId: string;
}

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  // Qualquer usuário logado pode listar setores (para escolher ao abrir chamado)
  @Get()
  findAll() {
    return this.departments.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'AGENT')
  findOne(@Param('id') id: string) {
    return this.departments.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateDepartmentDto) {
    return this.departments.create(dto.name, dto.description);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departments.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.departments.remove(id);
  }

  @Post(':id/members')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.departments.addMember(id, dto.userId);
  }

  @Delete(':id/members/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.departments.removeMember(id, userId);
  }
}
