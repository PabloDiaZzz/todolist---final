import style from "../style.css?inline";
import html from "./html/SettingsView.html?raw";
import type { UsuarioDTO, UpdatePasswordRequest } from "../types/api-types";
import { syncThemeWithObserver } from "../utils/theme";
import { authService } from "../services/AuthService";


export function applySelectedTheme(theme: string) {
    localStorage.setItem('app-theme', theme);
    if (theme === 'LIGHT') {
        document.documentElement.classList.remove('dark');
    } else if (theme === 'DARK') {
        document.documentElement.classList.add('dark');
    } else {
        
        const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (darkQuery.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
}

export default class SettingsView extends HTMLElement {
    private themeObserver: MutationObserver | null = null;
    private user!: UsuarioDTO;
    private systemThemeMedia: MediaQueryList | null = null;
    private systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot!.innerHTML = html;
    }

    async connectedCallback() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(style);
        this.shadowRoot!.adoptedStyleSheets = [sheet];

        const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper');
        this.themeObserver = syncThemeWithObserver(themeWrapper);

        
        const loggedIn = await authService.checkSession();
        if (!loggedIn || !authService.getUser()) {
            (window as any).navigate('/login?required');
            return;
        }

        this.user = authService.getUser()!;
        this.render();
        this.setupEvents();
        this.setupSystemThemeListener(this.user.theme ?? 'SYSTEM');
        this.updateTabs('profile');
    }

    disconnectedCallback() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
        this.cleanupSystemThemeListener();
    }

    private setupSystemThemeListener(theme: string) {
        this.cleanupSystemThemeListener();

        if (theme === 'SYSTEM') {
            this.systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
            this.systemThemeListener = (e: MediaQueryListEvent) => {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            };
            this.systemThemeMedia.addEventListener('change', this.systemThemeListener);
        }
    }

    private cleanupSystemThemeListener() {
        if (this.systemThemeMedia && this.systemThemeListener) {
            this.systemThemeMedia.removeEventListener('change', this.systemThemeListener);
        }
        this.systemThemeMedia = null;
        this.systemThemeListener = null;
    }

    private setupEvents() {
        const root = this.shadowRoot!;

        
        const tabBtns = root.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                if (targetTab) {
                    this.updateTabs(targetTab);
                }
            });
        });

        
        this.setupProfileForm(root);

        
        this.setupPasswordForm(root);

        
        this.setupThemeCards(root);

        
        this.setupDataTools(root);

        
        this.setupDangerZone(root);
    }

    private updateTabs(activeTab: string) {
        const root = this.shadowRoot!;
        const activeClasses = ['bg-blue-600', 'text-white', 'dark:bg-indigo-600', 'dark:text-white'];
        const inactiveClasses = [
            'text-gray-600', 'dark:text-gray-400', 
            'hover:bg-gray-100', 'dark:hover:bg-slate-700/50', 
            'hover:text-slate-800', 'dark:hover:text-white'
        ];

        const tabBtns = root.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            const tab = btn.getAttribute('data-tab');
            const isDanger = tab === 'danger';
            
            if (tab === activeTab) {
                btn.classList.add('active');
                if (isDanger) {
                    btn.classList.remove('text-red-500', 'hover:bg-red-50', 'dark:hover:bg-red-950/20');
                    btn.classList.add('bg-red-600', 'text-white');
                } else {
                    btn.classList.add(...activeClasses);
                    btn.classList.remove(...inactiveClasses);
                }
            } else {
                btn.classList.remove('active');
                if (isDanger) {
                    btn.classList.remove('bg-red-600', 'text-white');
                    btn.classList.add('text-red-500', 'hover:bg-red-50', 'dark:hover:bg-red-950/20');
                } else {
                    btn.classList.remove(...activeClasses);
                    btn.classList.add(...inactiveClasses);
                }
            }
        });

        const contents = root.querySelectorAll('.tab-content');
        contents.forEach(content => {
            const id = content.getAttribute('id');
            if (id === `tab-content-${activeTab}`) {
                content.classList.remove('hidden');
                
                content.animate([
                    { opacity: 0, transform: 'translateY(6px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], {
                    duration: 250,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
                });
            } else {
                content.classList.add('hidden');
            }
        });
    }

    private setupProfileForm(root: ShadowRoot) {
        const profileForm = root.getElementById('profile-form') as HTMLFormElement;
        const fullnameInput = root.getElementById('profile-fullname') as HTMLInputElement;
        const usernameInput = root.getElementById('profile-username') as HTMLInputElement;
        const emailInput = root.getElementById('profile-email') as HTMLInputElement;

        const usernameFeedback = root.getElementById('username-feedback') as HTMLParagraphElement;
        const emailFeedback = root.getElementById('email-feedback') as HTMLParagraphElement;

        
        fullnameInput.value = this.user.fullName ?? '';
        usernameInput.value = this.user.username ?? '';
        emailInput.value = this.user.email ?? '';

        let usernameAvailable = true;
        let emailAvailable = true;
        let usernameTimer: ReturnType<typeof setTimeout>;
        let emailTimer: ReturnType<typeof setTimeout>;

        const checkField = async (
            input: HTMLInputElement,
            feedback: HTMLParagraphElement,
            url: string,
            param: string,
            currentValue: string,
            label: string,
            setAvailable: (v: boolean) => void
        ) => {
            const value = input.value.trim();
            if (value === currentValue) {
                feedback.textContent = '';
                feedback.classList.add('hidden');
                input.classList.remove('border-red-500', 'border-green-500');
                setAvailable(true);
                return;
            }
            if (value.length < 3) {
                feedback.textContent = 'Mínimo 3 caracteres';
                feedback.className = 'text-xs font-semibold text-red-500';
                feedback.classList.remove('hidden');
                input.classList.add('border-red-500');
                setAvailable(false);
                return;
            }
            feedback.textContent = 'Comprobando...';
            feedback.className = 'text-xs font-semibold text-gray-400 dark:text-gray-500';
            feedback.classList.remove('hidden');

            try {
                const res = await fetch(`${url}?${param}=${encodeURIComponent(value)}`, { headers: authService.getAuthHeaders() });
                const exists = await res.json();
                if (exists) {
                    feedback.textContent = `${label} ya en uso`;
                    feedback.className = 'text-xs font-semibold text-red-500';
                    input.classList.remove('border-green-500');
                    input.classList.add('border-red-500');
                    setAvailable(false);
                } else {
                    feedback.textContent = 'Disponible';
                    feedback.className = 'text-xs font-semibold text-green-500';
                    input.classList.remove('border-red-500');
                    input.classList.add('border-green-500');
                    setAvailable(true);
                }
            } catch {
                feedback.textContent = 'Error al comprobar disponibilidad';
                feedback.className = 'text-xs font-semibold text-red-500';
                setAvailable(false);
            }
        };

        usernameInput.addEventListener('input', () => {
            clearTimeout(usernameTimer);
            usernameTimer = setTimeout(() => {
                checkField(
                    usernameInput, usernameFeedback,
                    '/api/auth/check-username', 'username',
                    this.user.username ?? '', 'Usuario',
                    (v) => { usernameAvailable = v; }
                );
            }, 400);
        });

        emailInput.addEventListener('input', () => {
            clearTimeout(emailTimer);
            emailTimer = setTimeout(() => {
                checkField(
                    emailInput, emailFeedback,
                    '/api/auth/check-email', 'email',
                    this.user.email ?? '', 'Correo electrónico',
                    (v) => { emailAvailable = v; }
                );
            }, 400);
        });

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!usernameAvailable || !emailAvailable) {
                this.showToast('Por favor, corrige los campos con errores.', true);
                return;
            }

            const fullName = fullnameInput.value.trim();
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();

            if (!fullName || !username || !email) {
                this.showToast('Todos los campos de perfil son requeridos.', true);
                return;
            }

            try {
                const res = await fetch('/api/user/profile', {
                    method: 'PATCH',
                    headers: authService.getAuthHeaders(),
                    body: JSON.stringify({
                        username,
                        fullName,
                        email,
                        theme: this.user.theme ?? 'SYSTEM'
                    })
                });

                if (res.ok) {
                    const updatedUser: UsuarioDTO = await res.json();
                    this.user = updatedUser;
                    
                    
                    await authService.checkSession();

                    this.showToast('¡Perfil actualizado correctamente!');
                    
                    
                    usernameInput.classList.remove('border-green-500');
                    emailInput.classList.remove('border-green-500');
                    usernameFeedback.classList.add('hidden');
                    emailFeedback.classList.add('hidden');
                } else {
                    const errorMsg = await res.text();
                    this.showToast(errorMsg || 'Error al actualizar perfil.', true);
                }
            } catch (err) {
                this.showToast('Error de red al actualizar perfil.', true);
            }
        });
    }

    private setupPasswordForm(root: ShadowRoot) {
        const passwordForm = root.getElementById('password-form') as HTMLFormElement;
        const currentInput = root.getElementById('pass-current') as HTMLInputElement;
        const newInput = root.getElementById('pass-new') as HTMLInputElement;
        const confirmInput = root.getElementById('pass-confirm') as HTMLInputElement;
        const feedback = root.getElementById('password-feedback') as HTMLParagraphElement;

        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentVal = currentInput.value;
            const newVal = newInput.value;
            const confirmVal = confirmInput.value;

            if (newVal !== confirmVal) {
                feedback.textContent = 'La nueva contraseña y la confirmación no coinciden.';
                feedback.className = 'text-xs font-semibold text-red-500 mt-1';
                feedback.classList.remove('hidden');
                return;
            }

            if (newVal.length < 4) {
                feedback.textContent = 'La nueva contraseña debe tener al menos 4 caracteres.';
                feedback.className = 'text-xs font-semibold text-red-500 mt-1';
                feedback.classList.remove('hidden');
                return;
            }

            feedback.classList.add('hidden');

            try {
                const reqBody: UpdatePasswordRequest = {
                    currentPassword: currentVal,
                    newPassword: newVal
                };

                const res = await fetch('/api/user/password', {
                    method: 'PATCH',
                    headers: authService.getAuthHeaders(),
                    body: JSON.stringify(reqBody)
                });

                if (res.ok) {
                    this.showToast('¡Contraseña actualizada correctamente!');
                    passwordForm.reset();
                } else {
                    if (res.status === 400) {
                        feedback.textContent = 'La contraseña actual es incorrecta.';
                    } else {
                        feedback.textContent = 'Error al actualizar contraseña. Inténtalo de nuevo.';
                    }
                    feedback.className = 'text-xs font-semibold text-red-500 mt-1';
                    feedback.classList.remove('hidden');
                }
            } catch (err) {
                this.showToast('Error de red al actualizar contraseña.', true);
            }
        });
    }

    private setupThemeCards(root: ShadowRoot) {
        const cards = root.querySelectorAll('.theme-card');

        
        const currentTheme = this.user.theme ?? 'SYSTEM';
        this.updateThemeCardsStyle(currentTheme);

        cards.forEach(card => {
            card.addEventListener('click', async () => {
                const selectedTheme = card.getAttribute('data-theme-val');
                if (selectedTheme) {
                    this.updateThemeCardsStyle(selectedTheme);
                    applySelectedTheme(selectedTheme);
                    this.setupSystemThemeListener(selectedTheme);

                    
                    try {
                        const res = await fetch('/api/user/profile', {
                            method: 'PATCH',
                            headers: authService.getAuthHeaders(),
                            body: JSON.stringify({
                                username: this.user.username,
                                fullName: this.user.fullName,
                                email: this.user.email,
                                theme: selectedTheme
                            })
                        });

                        if (res.ok) {
                            const updatedUser = await res.json();
                            this.user = updatedUser;
                            await authService.checkSession();
                            this.showToast('Preferencia visual guardada.');
                        } else {
                            this.showToast('Error al persistir el tema visual.', true);
                        }
                    } catch (err) {
                        this.showToast('Error de red al guardar tema visual.', true);
                    }
                }
            });
        });
    }

    private updateThemeCardsStyle(theme: string) {
        const cards = this.shadowRoot!.querySelectorAll('.theme-card');
        cards.forEach(card => {
            const themeVal = card.getAttribute('data-theme-val');
            if (themeVal === theme) {
                card.classList.replace('border-gray-200', 'border-blue-600') || card.classList.add('border-blue-600');
                card.classList.replace('dark:border-slate-700/60', 'dark:border-indigo-500') || card.classList.add('dark:border-indigo-500');
                card.classList.replace('bg-gray-50', 'bg-blue-50/10') || card.classList.add('bg-blue-50/10');
                card.classList.replace('dark:bg-slate-900/40', 'dark:bg-indigo-950/20') || card.classList.add('dark:bg-indigo-950/20');
            } else {
                card.classList.remove('border-blue-600', 'dark:border-indigo-500', 'bg-blue-50/10', 'dark:bg-indigo-950/20');
                card.classList.add('border-gray-200', 'dark:border-slate-700/60', 'bg-gray-50', 'dark:bg-slate-900/40');
            }
        });
    }

    private setupDataTools(root: ShadowRoot) {
        const clearCompletedBtn = root.getElementById('clear-completed-btn') as HTMLButtonElement;
        const exportJsonBtn = root.getElementById('export-json-btn') as HTMLButtonElement;

        clearCompletedBtn.addEventListener('click', async () => {
            const confirmVal = confirm('¿Estás seguro de que deseas eliminar de forma permanente todas tus tareas completadas? Esta acción es irreversible.');
            if (!confirmVal) return;

            try {
                const res = await fetch('/api/tasks/completed', {
                    method: 'DELETE',
                    headers: authService.getAuthHeaders(),
                });

                if (res.ok) {
                    this.showToast('¡Tareas completadas vaciadas correctamente!');
                } else {
                    this.showToast('Error al vaciar tareas completadas.', true);
                }
            } catch (err) {
                this.showToast('Error de conexión al vaciar tareas.', true);
            }
        });

        exportJsonBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/tasks', {headers: authService.getAuthHeaders()});
                if (!res.ok) {
                    this.showToast('No se pudieron obtener tus tareas.', true);
                    return;
                }

                const tasks = await res.json();
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
                const dlAnchorElem = document.createElement('a');
                dlAnchorElem.setAttribute("href", dataStr);
                dlAnchorElem.setAttribute("download", "mis-tareas.json");
                
                document.body.appendChild(dlAnchorElem);
                dlAnchorElem.click();
                dlAnchorElem.remove();

                this.showToast('¡Tareas exportadas correctamente!');
            } catch (err) {
                this.showToast('Error al exportar tareas a JSON.', true);
            }
        });
    }

    private setupDangerZone(root: ShadowRoot) {
        const deleteInput = root.getElementById('delete-confirm-input') as HTMLInputElement;
        const deleteBtn = root.getElementById('delete-account-btn') as HTMLButtonElement;

        deleteInput.addEventListener('input', () => {
            const confirmVal = deleteInput.value.trim();
            if (confirmVal === this.user.username) {
                deleteBtn.removeAttribute('disabled');
                deleteBtn.classList.replace('bg-gray-300', 'bg-red-500');
                deleteBtn.classList.remove('cursor-not-allowed');
            } else {
                deleteBtn.setAttribute('disabled', 'true');
                deleteBtn.classList.replace('bg-red-500', 'bg-gray-300');
                deleteBtn.classList.add('cursor-not-allowed');
            }
        });

        deleteBtn.addEventListener('click', async () => {
            if (deleteBtn.hasAttribute('disabled')) return;

            const doubleConfirm = confirm('⚠️ ADVERTENCIA CRÍTICA ⚠️\n¿Estás completamente seguro de que deseas eliminar permanentemente tu cuenta de usuario y todas tus tareas?\nEsta acción es irreversible y no se podrá restaurar ningún dato.');
            if (!doubleConfirm) return;

            
            deleteBtn.setAttribute('disabled', 'true');
            deleteBtn.classList.add('cursor-not-allowed', 'opacity-70');
            const originalHTML = deleteBtn.innerHTML;
            
            
            deleteBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style="width: 1rem; height: 1rem; vertical-align: middle;">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span style="vertical-align: middle;">Eliminando cuenta...</span>
            `;

            
            const sidebar = root.querySelector('aside') as HTMLElement;
            if (sidebar) {
                sidebar.classList.add('pointer-events-none', 'opacity-50');
                sidebar.style.pointerEvents = 'none';
            }
            deleteInput.setAttribute('readonly', 'true');

            try {
                const res = await fetch('/api/user/me', {
                    method: 'DELETE',
                    headers: authService.getAuthHeaders(),
                });

                if (res.ok) {
                    this.showToast('Cuenta eliminada con éxito. Redirigiendo...');
                    await authService.logout();
                    
                    setTimeout(() => {
                        (window as any).navigate('/login?deleted=true');
                    }, 1000);
                } else {
                    const errText = await res.text();
                    this.showToast(errText || 'Error al eliminar cuenta.', true);
                    
                    
                    deleteBtn.removeAttribute('disabled');
                    deleteBtn.classList.remove('cursor-not-allowed', 'opacity-70');
                    deleteBtn.innerHTML = originalHTML;
                    if (sidebar) {
                        sidebar.classList.remove('pointer-events-none', 'opacity-50');
                        sidebar.style.pointerEvents = '';
                    }
                    deleteInput.removeAttribute('readonly');
                }
            } catch (err) {
                this.showToast('Error de red al eliminar la cuenta.', true);
                
                
                deleteBtn.removeAttribute('disabled');
                deleteBtn.classList.remove('cursor-not-allowed', 'opacity-70');
                deleteBtn.innerHTML = originalHTML;
                if (sidebar) {
                    sidebar.classList.remove('pointer-events-none', 'opacity-50');
                    sidebar.style.pointerEvents = '';
                }
                deleteInput.removeAttribute('readonly');
            }
        });
    }

    private showToast(message: string, isError: boolean = false) {
        const root = this.shadowRoot!;
        const toast = root.getElementById('toast') as HTMLElement;
        const toastMsg = root.getElementById('toast-message') as HTMLElement;

        if (!toast || !toastMsg) return;

        toastMsg.textContent = message;

        if (isError) {
            toast.className = "fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-600 text-white border border-red-500 shadow-2xl px-5 py-4 rounded-2xl transition-all duration-300 translate-y-0 opacity-100";
        } else {
            toast.className = "fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 border border-gray-200/80 dark:border-slate-700/60 text-slate-800 dark:text-white shadow-2xl px-5 py-4 rounded-2xl backdrop-blur-md transition-all duration-300 translate-y-0 opacity-100";
        }

        
        setTimeout(() => {
            if (isError) {
                toast.className = "fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-red-600 text-white border border-red-500 shadow-2xl px-5 py-4 rounded-2xl transition-all duration-300 translate-y-2 opacity-0 pointer-events-none";
            } else {
                toast.className = "fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 border border-gray-200/80 dark:border-slate-700/60 text-slate-800 dark:text-white shadow-2xl px-5 py-4 rounded-2xl backdrop-blur-md transition-all duration-300 translate-y-2 opacity-0 pointer-events-none";
            }
        }, 3000);
    }

    private render() {
        
    }
}

customElements.define("settings-view", SettingsView);
