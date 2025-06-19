import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { ICategory } from '../../../models/category';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiUrl = '/api/categories';
  private _categories$ = new BehaviorSubject<ICategory[]>([]);
  public categories$ = this._categories$.asObservable();

  constructor(private http: HttpClient) { }

  fetchCategories(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(this.apiUrl);
  }

  loadCategories(): void {
    this.fetchCategories().subscribe(list => this._categories$.next(list));
  }
}
