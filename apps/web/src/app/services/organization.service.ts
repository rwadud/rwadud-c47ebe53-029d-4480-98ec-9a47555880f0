import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Organization, CreateOrgDto, UpdateOrgDto } from '@stms/data';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly apiUrl = '/api/organizations';

  constructor(private http: HttpClient) { }

  getOrganizations() {
    return this.http.get<Organization[]>(this.apiUrl);
  }

  createOrganization(dto: CreateOrgDto) {
    return this.http.post<Organization>(this.apiUrl, dto);
  }

  updateOrganization(id: number, dto: UpdateOrgDto) {
    return this.http.put<Organization>(`${this.apiUrl}/${id}`, dto);
  }

  deleteOrganization(id: number) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`);
  }
}
