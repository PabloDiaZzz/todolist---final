import html from './html/UserAdminItem.html?raw';
import type { UserTasksDTO, UsuarioDTO } from '../types/api-types';
import { updateCachedData } from '../utils/store';

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
        const form = this.querySelector('.promote-form') as HTMLFormElement;

        usernameEl.textContent = this._user.username ?? '';
        roleEl.textContent = this._user.role ?? '';

        if (this._user.role === 'ROLE_ADMIN') {
            form.remove();
        } else {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const originalRole = this._user.role;
                this._user.role = 'ROLE_ADMIN';
                roleEl.textContent = 'ROLE_ADMIN';
                form.style.display = 'none';
                updateCachedData<UsuarioDTO>('/api/admin/users', oldUsers =>
                    oldUsers.map(u => u.username === this._user.username ? { ...u, role: 'ROLE_ADMIN' } : u)
                );
                this.dispatchEvent(new CustomEvent('sync-memory', { bubbles: true, composed: true }));

                try {
                    const response = await fetch(`/api/admin/users/${this._user.username}/promote`, {
                        method: 'PATCH'
                    });

                    if (!response.ok) throw new Error('Error al promover');
                    form.remove();

                } catch (error) {
                    console.error('Error al promover al usuario:', error);
                    this._user.role = originalRole;
                    roleEl.textContent = originalRole ?? '';
                    form.style.display = '';
                    
                    updateCachedData<UsuarioDTO>('/api/admin/users', oldUsers =>
                        oldUsers.map(u => u.username === this._user.username ? { ...u, role: originalRole } : u)
                    );
                    this.dispatchEvent(new CustomEvent('sync-memory', { bubbles: true, composed: true }));
                    alert('Error de conexión: No se pudo hacer Admin al usuario.');
                }
            });
        }

        this.setupEvents();
    }

    private setupEvents() {
        const nameBtn = this.querySelector('.user-name-btn') as HTMLButtonElement;
        nameBtn.addEventListener('click', async () => {
            const userTasks: UserTasksDTO = await fetch(`/api/admin/users/${this._user.username}/full-profile`).then(res => res.json())
            window.navigate(`/userinfo`, userTasks);
        });
    }
}

customElements.define('user-admin-item', UserAdminItem);