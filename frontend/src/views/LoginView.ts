import html from './html/LoginView.html?raw';
import styles from '../style.css?inline';
import { syncThemeWithObserver } from '../utils/theme';
import { prefetchCache } from '../utils/store';
import { authService } from '../services/AuthService';

export class LoginView extends HTMLElement {
    private themeObserver: MutationObserver | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        this.shadowRoot!.adoptedStyleSheets = [sheet];

        this.shadowRoot!.innerHTML = html;

        const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper');

        this.themeObserver = syncThemeWithObserver(themeWrapper);

        this.setupEvents();
    }

    disconnectedCallback() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
    }

    private checkUrlParams(root: ShadowRoot) {
        const params = new URLSearchParams(window.location.search);

        if (params.has('logout')) {
            root.querySelector('#logout-success')?.classList.remove('hidden');
        } else if (params.has('required')) {
            root.querySelector('#login-required')?.classList.remove('hidden');
        } else if (params.has('error')) {
            root.querySelector('#login-error')?.classList.remove('hidden');
        }

        if (params.has('logout') || params.has('required') || params.has('error')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    private setupEvents() {
        const root = this.shadowRoot!;
        const alerts = root.querySelectorAll('.alert');
        const form = root.getElementById('login-form') as HTMLFormElement;
        const toggleBtn = root.getElementById('toggle-password') as HTMLButtonElement;
        const passInput = root.getElementById('password') as HTMLInputElement;

        toggleBtn?.addEventListener('click', () => {
            const isPassword = passInput.type === 'password';
            passInput.type = isPassword ? 'text' : 'password';
            root.querySelector('.eye-show')?.classList.toggle('hidden');
            root.querySelector('.eye-hide')?.classList.toggle('hidden');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            const originalText = submitBtn.textContent || 'Iniciar sesión';

            submitBtn.textContent = 'Iniciando sesión...';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

            alerts.forEach(el => el.classList.add('hidden'));

            try {
                const formData = new FormData(form);
                const username = formData.get('username') as string;
                const password = formData.get('password') as string;

                const success = await authService.login(username, password);

                if (success) {
                    const tasks = await fetch('/api/tasks', { headers: authService.getAuthHeaders() }).then(r => r.json()).catch(() => null);
                    const cats = await fetch('/api/cats', { headers: authService.getAuthHeaders() }).then(r => r.json()).catch(() => null);
                    if (tasks) prefetchCache.set('/api/tasks', tasks);
                    if (cats) prefetchCache.set('/api/cats', cats);

                    (window as any).navigate('/home');
                } else {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
                    root.querySelector('#login-error')?.classList.remove('hidden');
                }
            } catch (error) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
                root.querySelector('#login-error')?.classList.remove('hidden');
            }
        });

        const goToRegister = root.getElementById('go-to-register') as HTMLButtonElement;
        const goToForgot = root.getElementById('go-to-forgot-password') as HTMLButtonElement;

        if (goToRegister) {
            goToRegister.onclick = () => window.navigate('/register');
            goToRegister.onkeydown = (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.navigate('/register');
                }
            };
        }

        if (goToForgot) {
            goToForgot.onclick = () => window.navigate('/forgot-password');
            goToForgot.onkeydown = (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.navigate('/forgot-password');
                }
            };
        }

        this.checkUrlParams(root);
    }
}
customElements.define('login-view', LoginView);