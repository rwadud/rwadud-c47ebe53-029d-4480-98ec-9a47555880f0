import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User, CreateUserDto, UpdateUserDto } from '@stms/data';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = '/api/users';

  constructor(private http: HttpClient) { }

  getUsers() {
    return this.http.get<Omit<User, 'organization'>[]>(this.apiUrl);
  }

  createUser(dto: CreateUserDto) {
    return this.http.post<User>(this.apiUrl, dto);
  }

  updateUser(id: number, dto: UpdateUserDto) {
    return this.http.put<User>(`${this.apiUrl}/${id}`, dto);
  }

  deleteUser(id: number) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`);
  }
}
