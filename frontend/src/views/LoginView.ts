import html from './html/LoginView.html?raw';
import styles from '../style.css?inline';

export class LoginView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        this.shadowRoot!.adoptedStyleSheets = [sheet];

        this.shadowRoot!.innerHTML = html;

        this.setupEvents();
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
        const form = root.querySelector('#login-form') as HTMLFormElement;
        const toggleBtn = root.querySelector('#toggle-password');
        const passInput = root.querySelector('#password') as HTMLInputElement;

        toggleBtn?.addEventListener('click', () => {
            const isPassword = passInput.type === 'password';
            passInput.type = isPassword ? 'text' : 'password';
            root.querySelector('.eye-show')?.classList.toggle('hidden');
            root.querySelector('.eye-hide')?.classList.toggle('hidden');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const res = await fetch('/api/login', { method: 'POST', body: formData });
            alerts.forEach(el => el.classList.add('hidden'));
            
            if (res.ok) (window as any).navigate('/home');
            else if (res.status === 401) root.querySelector('#login-error')?.classList.remove('hidden');
            else if (res.status === 404) root.querySelector('#login-required')?.classList.remove('hidden');
            else if (res.status === 403) root.querySelector('#login-required')?.classList.remove('hidden');
            else root.querySelector('#login-error')?.classList.remove('hidden');
        });

        this.checkUrlParams(root);
    }
}
customElements.define('login-view', LoginView);