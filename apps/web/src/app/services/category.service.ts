import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ICategory, CreateCategoryDto, UpdateCategoryDto } from '@stms/data';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = '/api/categories';

  constructor(private http: HttpClient) { }

  getCategories() {
    return this.http.get<ICategory[]>(this.apiUrl);
  }

  createCategory(dto: CreateCategoryDto) {
    return this.http.post<ICategory>(this.apiUrl, dto);
  }

  updateCategory(id: number, dto: UpdateCategoryDto) {
    return this.http.put<ICategory>(`${this.apiUrl}/${id}`, dto);
  }

  deleteCategory(id: number) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`);
  }
}
