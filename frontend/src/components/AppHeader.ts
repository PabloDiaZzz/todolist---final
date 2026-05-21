import html from './html/AppHeader.html?raw';
import { authService } from '../services/AuthService';
import { setupPrefetch } from '../utils/prefetch';

export class AppHeader extends HTMLElement {
    static get observedAttributes() {
        return ['current-view'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(_name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    private render() {
        this.innerHTML = html;
        const currentView = this.getAttribute('current-view') || 'home';

        const headerTitle = this.querySelector('#header-title') as HTMLHeadingElement;
        const userName = this.querySelector('#user-name') as HTMLParagraphElement;
        const adminBtn = this.querySelector('#admin-button') as HTMLButtonElement;
        const managerBtn = this.querySelector('#manager-button') as HTMLButtonElement;
        const userBtn = this.querySelector('#user-button') as HTMLButtonElement;
        const logoutForm = this.querySelector('#logout-form') as HTMLFormElement;

        
        const user = authService.getUser();
        if (user) {
            userName.textContent = user.fullName ? `${user.fullName} (@${user.username})` : `@${user.username}`;
        } else {
            userName.textContent = '';
        }

        
        if (currentView === 'home') {
            headerTitle.textContent = 'Aplicación ToDo List';
            headerTitle.className = 'font-semibold text-color text-lg sm:text-2xl';

            if (authService.isAdmin()) {
                adminBtn.classList.remove('hidden');
                adminBtn.onclick = () => (window as any).navigate('/admin');
                setupPrefetch(adminBtn, ['/api/admin/tasks', '/api/admin/users', '/api/cats'], {
                    timeout: 150,
                    once: true,
                    checkNetwork: true,
                });
            }

            if (authService.isManager()) {
                managerBtn.classList.remove('hidden');
                managerBtn.onclick = () => (window as any).navigate('/manager');
                setupPrefetch(managerBtn, ['/api/admin/tasks', '/api/cats'], {
                    timeout: 150,
                    once: true,
                    checkNetwork: true,
                });
            }
        } else if (currentView === 'admin') {
            let title = 'Panel de Control';
            if (authService.isManager()) {
                title += ' (GESTOR)';
            } else {
                title += ' (ADMIN)';
            }
            headerTitle.textContent = title;
            headerTitle.className = 'text-lg sm:text-2xl font-semibold text-blue-600 dark:text-indigo-400';

            userBtn.classList.remove('hidden');
            userBtn.onclick = () => (window as any).navigate('/');
            setupPrefetch(userBtn, ['/api/tasks', '/api/cats'], {
                timeout: 150,
                once: true,
                checkNetwork: true,
            });
        } else if (currentView === 'userinfo') {
            headerTitle.textContent = 'Panel de Control (ADMIN)';
            headerTitle.className = 'font-semibold text-blue-600 dark:text-indigo-400 text-lg sm:text-2xl';

            adminBtn.classList.remove('hidden');
            adminBtn.onclick = () => (window as any).navigate('/admin');
            setupPrefetch(adminBtn, ['/api/admin/tasks', '/api/admin/users', '/api/cats'], {
                timeout: 150,
                once: true,
                checkNetwork: true,
            });
        }

        const settingsBtn = this.querySelector('#settings-button') as HTMLButtonElement;
        if (settingsBtn) {
            if (currentView === 'settings') {
                settingsBtn.title = 'Inicio';
                settingsBtn.innerHTML = `<svg class="size-6 fill-current"><use href="/main.svg#home"></use></svg>`;
                settingsBtn.onclick = () => (window as any).navigate('/home');
            } else {
                settingsBtn.title = 'Configuración';
                settingsBtn.innerHTML = `<svg class="size-6 fill-current"><use href="/main.svg#settings"></use></svg>`;
                settingsBtn.onclick = () => (window as any).navigate('/settings');
            }
        }

        
        if (logoutForm) {
            logoutForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await authService.logout();
                (window as any).navigate('/login?logout');
            });
        }
    }
}

customElements.define('app-header', AppHeader);
