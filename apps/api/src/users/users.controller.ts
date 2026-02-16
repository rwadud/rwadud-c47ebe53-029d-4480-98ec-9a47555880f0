import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard, RbacGuard, RequirePermissions } from '@stms/auth';
import { Permission, CreateUserDto, UpdateUserDto } from '@stms/data';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RbacGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @RequirePermissions(Permission.USER_MANAGE)
  findAll(@Request() req: any) {
    return this.usersService.findAll(req.user);
  }

  @Post()
  @RequirePermissions(Permission.USER_MANAGE)
  create(@Body() dto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(dto, req.user);
  }

  @Put(':id')
  @RequirePermissions(Permission.USER_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: any) {
    return this.usersService.update(Number(id), dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USER_MANAGE)
  delete(@Param('id') id: string, @Request() req: any) {
    return this.usersService.delete(Number(id), req.user);
  }
}
