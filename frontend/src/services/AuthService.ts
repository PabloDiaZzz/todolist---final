import type { UsuarioDTO } from '../types/api-types';

class AuthService {
    private currentUser: UsuarioDTO | null = null;

    getUser(): UsuarioDTO | null {
        return this.currentUser;
    }

    isLoggedIn(): boolean {
        return this.currentUser !== null;
    }

    isAdmin(): boolean {
        return this.currentUser?.role === 'ROLE_ADMIN';
    }

    isManager(): boolean {
        return this.currentUser?.role === 'ROLE_MANAGER';
    }

    getAuthHeaders(includeContentType: boolean = true): Record<string, string> {
        const token = this.getToken();
        const headers: Record<string, string> = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    async login(username: string, password: string): Promise<boolean> {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();


                localStorage.setItem('token', data.token);


                return await this.checkSession();
            }

            console.error('Credenciales incorrectas en el login');
        } catch (error) {
            console.error('Error durante el proceso de login:', error);
        }

        this.currentUser = null;
        return false;
    }

    async checkSession(): Promise<boolean> {
        const token = localStorage.getItem('token');

        if (!token) {
            this.currentUser = null;
            return false;
        }

        try {
            const response = await fetch('/api/user/me', {
                headers: {

                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
                return true;
            }
        } catch (error) {
            console.error('Error al comprobar la sesión con JWT:', error);
        }

        localStorage.removeItem('token');
        this.currentUser = null;
        return false;
    }

    async logout(): Promise<void> {
        localStorage.removeItem('token');
        this.currentUser = null;
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}

export const authService = new AuthService();