import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IOrganization, CreateOrgDto, UpdateOrgDto } from '@stms/data';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly apiUrl = '/api/organizations';

  constructor(private http: HttpClient) { }

  getOrganizations() {
    return this.http.get<IOrganization[]>(this.apiUrl);
  }

  createOrganization(dto: CreateOrgDto) {
    return this.http.post<IOrganization>(this.apiUrl, dto);
  }

  updateOrganization(id: number, dto: UpdateOrgDto) {
    return this.http.put<IOrganization>(`${this.apiUrl}/${id}`, dto);
  }

  deleteOrganization(id: number) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`);
  }
}
