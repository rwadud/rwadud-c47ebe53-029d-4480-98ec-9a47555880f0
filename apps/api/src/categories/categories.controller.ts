import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Request, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard, RbacGuard, RequirePermissions } from '@stms/auth';
import { Permission, CreateCategoryDto, UpdateCategoryDto } from '@stms/data';

@Controller('categories')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @RequirePermissions(Permission.CATEGORY_CREATE)
  create(@Body() dto: CreateCategoryDto, @Request() req: any) {
    return this.categoriesService.create(dto, req.user);
  }

  @Get()
  @RequirePermissions(Permission.CATEGORY_VIEW)
  findAll(@Request() req: any) {
    return this.categoriesService.findAll(req.user);
  }

  @Put(':id')
  @RequirePermissions(Permission.CATEGORY_EDIT)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @Request() req: any,
  ) {
    return this.categoriesService.update(id, dto, req.user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.CATEGORY_DELETE)
  delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.categoriesService.delete(id, req.user);
  }
}
