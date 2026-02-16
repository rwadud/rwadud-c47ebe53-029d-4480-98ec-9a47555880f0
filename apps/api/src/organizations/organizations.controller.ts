import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard, RbacGuard, RequirePermissions } from '@stms/auth';
import { Permission, CreateOrgDto, UpdateOrgDto } from '@stms/data';
import { OrgScopeService } from '../common/services/org-scope.service';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly orgScopeService: OrgScopeService,
    private readonly orgsService: OrganizationsService,
  ) { }

  @Get()
  async findAll(@Request() req: any) {
    return this.orgScopeService.getVisibleOrgs(req.user);
  }

  @Post()
  @UseGuards(RbacGuard)
  @RequirePermissions(Permission.ORG_MANAGE)
  create(@Body() dto: CreateOrgDto, @Request() req: any) {
    return this.orgsService.create(dto, req.user);
  }

  @Put(':id')
  @UseGuards(RbacGuard)
  @RequirePermissions(Permission.ORG_MANAGE)
  update(@Param('id') id: string, @Body() dto: UpdateOrgDto, @Request() req: any) {
    return this.orgsService.update(Number(id), dto, req.user);
  }

  @Delete(':id')
  @UseGuards(RbacGuard)
  @RequirePermissions(Permission.ORG_MANAGE)
  delete(@Param('id') id: string, @Request() req: any) {
    return this.orgsService.delete(Number(id), req.user);
  }
}
