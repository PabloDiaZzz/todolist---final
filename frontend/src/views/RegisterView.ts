import html from './html/RegisterView.html?raw';
import styles from '../style.css?inline';
import { syncThemeWithObserver } from '../utils/theme';

export class RegisterView extends HTMLElement {
    private root: ShadowRoot;
    private themeObserver: MutationObserver | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.root = this.shadowRoot!;
    }

    connectedCallback() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(styles);
        this.root.adoptedStyleSheets = [sheet];

        this.root.innerHTML = html;

        const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper');

        this.themeObserver = syncThemeWithObserver(themeWrapper);

        this.setupEvents();
    }

    disconnectedCallback() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
    }

    private setupValidation(input: HTMLInputElement, feedback: HTMLElement, apiUrl: string, paramName: string, label: string) {
        try {
            let loaderInterval: number;
            let debounceTimer: number;

            const startLoader = () => {
                let dots = 0;
                clearInterval(loaderInterval);
                loaderInterval = setInterval(() => {
                    dots = (dots + 1) % 4;
                    feedback.textContent = "Comprobando" + ".".repeat(dots);
                }, 300);
            };

            const stopLoader = () => clearInterval(loaderInterval);

            input.addEventListener('input', () => {
                const value = input.value.trim();

                if (value.length === 0) {
                    stopLoader();
                    clearTimeout(debounceTimer);
                    feedback.textContent = "";
                    input.classList.remove('border-red-500', 'border-green-500');
                    return;
                }

                if (value.length < 3) {
                    feedback.textContent = "Mínimo 3 caracteres";
                    feedback.className = "min-h-4 px-1 text-xs font-medium text-gray-500 dark:text-gray-400";
                    return;
                }

                clearTimeout(debounceTimer);
                feedback.textContent = "Comprobando";
                feedback.className = "min-h-4 px-1 text-xs font-medium text-gray-500 dark:text-gray-400";

                debounceTimer = setTimeout(async () => {
                    startLoader();
                    try {
                        const response = await fetch(`${apiUrl}?${paramName}=${encodeURIComponent(value)}`);
                        const exists = await response.json();
                        stopLoader();

                        if (exists) {
                            feedback.textContent = `Este ${label} ya está en uso`;
                            feedback.className = "min-h-4 px-1 text-xs font-medium text-red-500";
                            input.classList.replace('border-green-500', 'border-red-500') || input.classList.add('border-red-500');
                        } else {
                            feedback.textContent = `${label} disponible`;
                            feedback.className = "min-h-4 px-1 text-xs font-medium text-green-500";
                            input.classList.replace('border-red-500', 'border-green-500') || input.classList.add('border-green-500');
                        }
                    } catch (error) {
                        stopLoader();
                        feedback.textContent = "Error de conexión";
                        console.error(error);
                    }
                }, 500);
            });
        } catch (ignore) { }
    }

    private setUpRegister(root: ShadowRoot) {
        const pass = root.getElementById('password') as HTMLInputElement;
        const confirmPass = root.getElementById('confirmPassword') as HTMLInputElement;
        const matchFeedback = root.getElementById('pass-match-feedback');
        const complexityFeedback = root.getElementById('pass-complexity-feedback');

        if (!pass || !confirmPass || !matchFeedback || !complexityFeedback) return;

        const checkMatch = () => {
            confirmPass.classList.remove('border-gray-300', 'dark:border-slate-600', 'border-red-500', 'border-green-500');

            if (pass.value !== confirmPass.value) {
                confirmPass.classList.add('border-red-500');
                matchFeedback.textContent = "Las contraseñas no coinciden";
                matchFeedback.className = "min-h-4 text-xs px-1 font-medium text-red-500";
            } else {
                confirmPass.classList.add('border-gray-300', 'dark:border-slate-600');
                if (pass.value !== "") {
                    matchFeedback.textContent = "Las contraseñas coinciden";
                    matchFeedback.className = "min-h-4 text-xs px-1 font-medium text-green-500";
                } else {
                    matchFeedback.textContent = "";
                }
            }
        };

        confirmPass.addEventListener('input', checkMatch);
        pass.addEventListener('input', checkMatch);

        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.]).{8,}$/;
        pass.addEventListener('input', () => {
            pass.classList.remove('border-gray-300', 'dark:border-slate-600', 'border-red-500', 'border-green-500');

            if (pass.value === "") {
                pass.classList.add('border-gray-300', 'dark:border-slate-600');
                complexityFeedback.textContent = "";
                return;
            }

            if (!passwordRegex.test(pass.value)) {
                pass.classList.add('border-amber-500');
                complexityFeedback.textContent = "Debe incluir mayúscula, número y símbolo (min. 8)";
                complexityFeedback.className = "min-h-4 text-xs px-1 font-medium text-amber-500";
            } else {
                pass.classList.add('border-gray-300', 'dark:border-slate-600');
                complexityFeedback.textContent = "Contraseña segura";
                complexityFeedback.className = "min-h-4 text-xs px-1 font-medium text-green-500";
            }
        });
    }

    private setupEvents() {
        const root = this.root;
        const form = root.querySelector('#register-form') as HTMLFormElement;
        const toggleBtn = root.querySelectorAll('.toggle-password');
        const errorAlert = root.querySelector('#register-alert') as HTMLDivElement;

        toggleBtn.forEach(btn => {
            btn.addEventListener('click', () => {
                const passInput = btn.parentElement?.querySelector('.pass-input') as HTMLInputElement;
                const isPassword = passInput.type === 'password';
                passInput.type = isPassword ? 'text' : 'password';
                btn.querySelector('.eye-show')?.classList.toggle('hidden');
                btn.querySelector('.eye-hide')?.classList.toggle('hidden');
            });
        });

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorAlert.classList.add('hidden');

            const formData = new FormData(form);
            const password = formData.get('password') as string;
            const confirmPassword = formData.get('confirmPassword') as string;

            if (password !== confirmPassword) {
                errorAlert.textContent = "Las contraseñas no coinciden.";
                errorAlert.classList.remove('hidden');
                return;
            }

            const paramsRegister = new URLSearchParams();
            paramsRegister.append('username', formData.get('username') as string);
            paramsRegister.append('fullName', formData.get('fullName') as string);
            paramsRegister.append('email', formData.get('email') as string);
            paramsRegister.append('password', password);
            paramsRegister.append('confirmPassword', confirmPassword);

            try {
                // --- PETICIÓN 1: REGISTRO ---
                const resRegister = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: paramsRegister.toString()
                });

                if (resRegister.ok) {
                    // --- PETICIÓN 2: AUTO-LOGIN ---
                    const paramsLogin = new URLSearchParams();
                    paramsLogin.append('username', formData.get('username') as string);
                    paramsLogin.append('password', password);

                    const resLogin = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: paramsLogin.toString()
                    });

                    if (resLogin.ok) {
                        // Todo perfecto, lo llevamos directo a sus tareas
                        (window as any).navigate('/home');
                    } else {
                        // Raro que pase, pero si falla el auto-login, lo mandamos al Login manual
                        (window as any).navigate('/login');
                    }

                } else {
                    // --- ¡AQUÍ FALTABA TU ELSE! ---
                    // Manejar si el registro falla (ej. Usuario ya existe en BD)
                    const errorMsg = await resRegister.text();
                    errorAlert.textContent = errorMsg || "Error al registrar. Revisa los datos o prueba otro usuario.";
                    errorAlert.classList.remove('hidden');
                }

            } catch (err) {
                console.error("Error conectando con el servidor:", err);
                errorAlert.textContent = "Error de conexión con el servidor.";
                errorAlert.classList.remove('hidden');
            }
        });

        this.setupValidation(
            root.querySelector('#username') as HTMLInputElement,
            root.querySelector('#username-feedback') as HTMLElement,
            '/api/auth/check-username',
            'username',
            'nombre de usuario'
        );

        this.setupValidation(
            root.querySelector('#email') as HTMLInputElement,
            root.querySelector('#email-feedback') as HTMLElement,
            '/api/auth/check-email',
            'email',
            'correo electrónico'
        );
        this.setUpRegister(root);
    }
}

customElements.define('register-view', RegisterView);

