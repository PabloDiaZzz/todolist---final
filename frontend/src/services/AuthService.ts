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

    async checkSession(): Promise<boolean> {
        try {
            const response = await fetch('/api/user/me', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
                return true;
            }
        } catch (error) {
            console.error('Error al comprobar la sesión:', error);
        }
        
        this.currentUser = null;
        return false;
    }

    async logout(): Promise<void> {
        try {
            await fetch('/api/logout', { method: 'POST' });
        } catch (error) {
            console.error('Error cerrando sesión:', error);
        } finally {
            this.currentUser = null;
        }
    }
}

export const authService = new AuthService();