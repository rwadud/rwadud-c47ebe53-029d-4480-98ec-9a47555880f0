import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@stms/data';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = '/api/categories';

  constructor(private http: HttpClient) { }

  getCategories() {
    return this.http.get<Category[]>(this.apiUrl);
  }

  createCategory(dto: CreateCategoryDto) {
    return this.http.post<Category>(this.apiUrl, dto);
  }

  updateCategory(id: number, dto: UpdateCategoryDto) {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, dto);
  }

  deleteCategory(id: number) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`);
  }
}
