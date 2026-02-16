import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../organizations/organization.entity';
import { ITokenPayload } from '@stms/data';

@Injectable()
export class OrgScopeService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) { }

  /**
   * Returns the list of organization IDs visible to the given user.
   * - Parent org users see all org IDs (parent + all children)
   * - Child org users see only their own org ID
   */
  async getVisibleOrgIds(user: ITokenPayload): Promise<number[]> {
    if (user.isParentOrg) {
      const allOrgs = await this.orgRepo.find();
      return allOrgs
        .filter(
          (org) =>
            org.id === user.organizationId ||
            org.parentId === user.organizationId,
        )
        .map((org) => org.id);
    }
    return [user.organizationId];
  }

  async getOrg(orgId: number): Promise<Organization | null> {
    return this.orgRepo.findOne({ where: { id: orgId } });
  }

  async getVisibleOrgs(user: ITokenPayload): Promise<Organization[]> {
    if (user.isParentOrg) {
      const allOrgs = await this.orgRepo.find();
      return allOrgs.filter(
        (org) =>
          org.id === user.organizationId ||
          org.parentId === user.organizationId,
      );
    }
    return this.orgRepo.find({ where: { id: user.organizationId } });
  }
}
