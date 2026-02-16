import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, Request, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard, RbacGuard, RequirePermissions } from '@stms/auth';
import { Permission, CreateTaskDto, UpdateTaskDto, ReorderTaskDto, TaskStatus } from '@stms/data';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  create(@Body() dto: CreateTaskDto, @Request() req: any) {
    return this.tasksService.create(dto, req.user);
  }

  @Get()
  @RequirePermissions(Permission.TASK_VIEW)
  findAll(
    @Request() req: any,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.tasksService.findAll(req.user, {
      status, priority, categoryId, sortBy, sortOrder,
    });
  }

  @Put(':id')
  @RequirePermissions(Permission.TASK_EDIT_OWN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @Request() req: any,
  ) {
    return this.tasksService.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE_OWN)
  delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.tasksService.delete(id, req.user);
  }

  @Patch('reorder')
  @RequirePermissions(Permission.TASK_EDIT_OWN)
  reorder(@Body() items: ReorderTaskDto[], @Request() req: any) {
    return this.tasksService.reorder(items, req.user);
  }
}
