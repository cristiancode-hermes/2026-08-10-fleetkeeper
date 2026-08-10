import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { TOKEN_KEY } from './auth.interceptor';
import { User } from './models';

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isManager = computed(() => {
    const u = this.currentUser();
    return !!u && (u.role === 'admin' || u.role === 'manager');
  });
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  /** Restaura la sesión al arrancar (token sobrevive al reload). */
  async restore(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const user = await this.api.get<User>('/auth/me');
      this.currentUser.set(user);
    } catch {
      this.logout(false);
    }
  }

  async login(identifier: string, password: string): Promise<void> {
    const res = await this.api.post<AuthResponse>('/auth/login', {
      identifier,
      password,
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    this.currentUser.set(res.user);
  }

  async register(username: string, email: string, password: string): Promise<void> {
    const res = await this.api.post<AuthResponse>('/auth/register', {
      username,
      email,
      password,
    });
    localStorage.setItem(TOKEN_KEY, res.token);
    this.currentUser.set(res.user);
  }

  async updateProfile(dto: { username?: string; email?: string; theme?: string }): Promise<User> {
    const user = await this.api.patch<User>('/auth/me', dto);
    this.currentUser.set(user);
    return user;
  }

  logout(navigate = true): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
    if (navigate) this.router.navigate(['/login']);
  }
}
