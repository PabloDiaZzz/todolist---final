import html from './html/UserAdminItem.html?raw';
import type { UserTasksDTO, UsuarioDTO } from '../types/api-types';
import { updateCachedData } from '../utils/store';
import { authService } from '../services/AuthService';

export class UserAdminItem extends HTMLElement {
    private _user!: UsuarioDTO;

    set user(data: UsuarioDTO) {
        this._user = data;
        this.render();
    }

    get user(): UsuarioDTO {
        return this._user;
    }

    private render() {
        this.innerHTML = html;

        const usernameEl = this.querySelector('.username-text')!;
        const roleEl = this.querySelector('.role-text')!;
        const select = this.querySelector('.role-select') as HTMLSelectElement;

        usernameEl.textContent = this._user.username ?? '';
        roleEl.textContent = this._user.role ?? '';

        if (this._user.role === 'ROLE_ADMIN') {
            select.remove();
        } else {
            const optionsDiv = select.querySelector('div')!;
            const buttonSpan = select.querySelector('button span')!;
            
            const buttonText = 'Cambiar Rol';
            if (this._user.role === 'ROLE_USER') {
                optionsDiv.innerHTML = `
                    <option value="" disabled selected class="hidden">${buttonText}</option>
                    <option value="ROLE_ADMIN" class="hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs font-semibold">Hacer Admin</option>
                    <option value="ROLE_MANAGER" class="hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs font-semibold">Hacer Gestor</option>
                `;
            } else if (this._user.role === 'ROLE_MANAGER') {
                optionsDiv.innerHTML = `
                    <option value="" disabled selected class="hidden">${buttonText}</option>
                    <option value="ROLE_ADMIN" class="hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs font-semibold">Hacer Admin</option>
                    <option value="ROLE_USER" class="hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs font-semibold">Hacer Usuario</option>
                `;
            }

            if (buttonSpan) {
                buttonSpan.textContent = buttonText;
            }

            select.addEventListener('change', async () => {
                const selectedRole = select.value;
                if (!selectedRole) return;

                const originalRole = this._user.role;
                this._user.role = selectedRole;
                roleEl.textContent = selectedRole;

                if (selectedRole === 'ROLE_ADMIN') {
                    select.remove();
                } else {
                    this.render();
                }

                updateCachedData<UsuarioDTO>('/api/admin/users', oldUsers =>
                    oldUsers.map(u => u.username === this._user.username ? { ...u, role: selectedRole } : u)
                );
                this.dispatchEvent(new CustomEvent('sync-memory', { bubbles: true, composed: true }));

                try {
                    const response = await fetch(`/api/admin/users/${this._user.username}/promote?role=${selectedRole}`, {
                        method: 'PATCH',
                        headers: authService.getAuthHeaders()
                    });

                    if (!response.ok) throw new Error('Error al cambiar de rol');

                } catch (error) {
                    console.error('Error al cambiar rol del usuario:', error);
                    this._user.role = originalRole;
                    
                    
                    this.render();
                    
                    updateCachedData<UsuarioDTO>('/api/admin/users', oldUsers =>
                        oldUsers.map(u => u.username === this._user.username ? { ...u, role: originalRole } : u)
                    );
                    this.dispatchEvent(new CustomEvent('sync-memory', { bubbles: true, composed: true }));
                    alert('Error de conexión: No se pudo cambiar el rol del usuario.');
                }
            });
        }

        this.setupEvents();
    }

    private setupEvents() {
        const nameBtn = this.querySelector('.user-name-btn') as HTMLButtonElement;
        nameBtn.addEventListener('click', async () => {
            const userTasks: UserTasksDTO = await fetch(`/api/admin/users/${this._user.username}/full-profile`, { headers: authService.getAuthHeaders() }).then(res => res.json())
            window.navigate(`/userinfo`, userTasks);
        });
    }
}

customElements.define('user-admin-item', UserAdminItem);