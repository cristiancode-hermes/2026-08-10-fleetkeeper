import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

/** Base relativa — Caddy hace reverse-proxy a la API en producción. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly base = '/api';

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    let p = new HttpParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
      }
    }
    return firstValueFrom(this.http.get<T>(`${this.base}${path}`, { params: p }));
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.post<T>(`${this.base}${path}`, body));
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return firstValueFrom(this.http.patch<T>(`${this.base}${path}`, body));
  }

  delete<T = void>(path: string): Promise<T> {
    return firstValueFrom(this.http.delete<T>(`${this.base}${path}`));
  }

  csvUrl(path: string): string {
    return `${this.base}${path}`;
  }
}
