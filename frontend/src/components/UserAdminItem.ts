import html from './html/UserAdminItem.html?raw';
import type { UserTasksDTO, UsuarioDTO } from '../types/api-types';

export class UserAdminItem extends HTMLElement {
    private _user!: UsuarioDTO & { id?: number };

    set user(data: UsuarioDTO & { id?: number }) {
        this._user = data;
        this.render();
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

                try {
                    const response = await fetch(`/api/admin/users/${this._user.id}/promote`, {
                        method: 'PATCH'
                    });

                    if (response.ok) {
                        this.dispatchEvent(new CustomEvent('user-promoted', { bubbles: true, composed: true }));
                    }
                } catch (error) {
                    console.error('Error al promover al usuario:', error);
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