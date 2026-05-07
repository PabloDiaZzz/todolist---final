import html from './html/ForgotPasswordView.html?raw';
import styles from '../style.css?inline';
import { syncThemeWithObserver } from '../utils/theme';

export class ForgotPasswordView extends HTMLElement {
    private themeObserver: MutationObserver | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        this.shadowRoot!.adoptedStyleSheets = [sheet];

        this.shadowRoot!.innerHTML = `
            <div id="theme-wrapper" class="font-sans antialiased h-dvh flex items-center justify-center text-slate-900 dark:text-white relative overflow-hidden">
                ${html}
            </div>
        `;

        const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper');

        this.themeObserver = syncThemeWithObserver(themeWrapper);

        this.setupEvents();
    }

    disconnectedCallback() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
    }

    private setupEvents() {
        const root = this.shadowRoot!;
        const form = root.querySelector('#forgot-form') as HTMLFormElement;
        const alertError = root.querySelector('#forgot-alert') as HTMLDivElement;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const res = await fetch('/api/auth/forgot-password', { method: 'POST', body: formData });

            if (res.ok) {
                alertError.classList.remove('hidden');
                alertError.classList.add('bg-emerald-100', 'text-emerald-700', 'dark:bg-emerald-900/30', 'dark:text-emerald-400');
                alertError.textContent = await res.text();
            } else {
                alertError.classList.remove('hidden');
                alertError.classList.add('bg-red-100', 'text-red-700', 'dark:bg-red-900/30', 'dark:text-red-400');
                alertError.textContent = await res.text();
            }
        });
    }
}
customElements.define('forgot-password-view', ForgotPasswordView);