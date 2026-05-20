import style from "../style.css?inline";
import html from "./html/UserInfoView.html?raw";
import type { Category, TaskResponseDTO, UserTasksDTO, UsuarioDTO } from "../types/api-types";
import { syncThemeWithObserver } from "../utils/theme";
import { authService } from "../services/AuthService";
import { setupPrefetch } from "../utils/prefetch";
import "../components/TaskInfo";
import { prefetchCache } from "../utils/store";
import { isEqual } from "lodash";
import type { TaskInfo } from "../components/TaskInfo";

export default class UserInfoView extends HTMLElement {
    private themeObserver: MutationObserver | null = null;
    private tasks: TaskResponseDTO[] = [];
    private user!: UsuarioDTO;
    private cats!: Category[];

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot!.innerHTML = html;
    }

    set data(userTasks: UserTasksDTO) {
        if (!userTasks || !userTasks.user) {
            console.warn("Datos de usuario perdidos en memoria. Redirigiendo...");
            (window as any).navigate('/admin');
            return;
        }
        this.user = userTasks.user!;
        this.tasks = userTasks.tasks || [];
        this.render();
        this.setupEvents();
    }

    connectedCallback() {
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(style)
        this.shadowRoot!.adoptedStyleSheets = [sheet]

        const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper');
        this.themeObserver = syncThemeWithObserver(themeWrapper);
    }

    disconnectedCallback() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
    }

    async setupEvents() {
        const root = this.shadowRoot!

        if (prefetchCache.has('/api/cats')) {
            this.cats = prefetchCache.get('/api/cats');
        }

        try {
            const res = await fetch('/api/cats');
            if (res.ok) {
                const freshCats = await res.json();
                if (!isEqual(this.cats, freshCats)) {
                    this.cats = freshCats;
                    prefetchCache.set('/api/cats', this.cats);
                    this.render();
                }
            }
        } catch (error) {
            console.warn("Info: Usando categorías en caché (sin conexión).");
        }

        const adminBtn = root.getElementById("admin-button") as HTMLButtonElement;
        if (adminBtn) {
            adminBtn.onclick = () => {
                window.navigate('/admin')
            }
            const urlsPrefetch = [
                '/api/admin/tasks',
                '/api/admin/users',
                '/api/cats'
            ]
            setupPrefetch(adminBtn, urlsPrefetch, {
                timeout: 150,
                once: true,
                checkNetwork: true,
            })
        }

        root.addEventListener('task-info', ((e: CustomEvent<TaskResponseDTO>) => {
            this.showInfoTask(e.detail)
        }) as EventListener)

        root.getElementById('close-task-info')!.addEventListener('click', () =>
            (root.getElementById('task-info') as HTMLDialogElement).close()
        )

        root.addEventListener('click', (e) => {
            const target = e.target as Node;
            const openMenus = root.querySelectorAll('.category-dropdown-menu:not(.hidden)');
            openMenus.forEach(menu => {
                const container = menu.closest('[id*="dropdown-container"]');
                if (container && !container.contains(target)) {
                    menu.classList.add('hidden');
                    const icon = container.querySelector('.category-dropdown-btn svg');
                    if (icon) icon.classList.remove('rotate-180');
                }
            });
        });

        this.setupEditProfile(root);
    }

    private setupEditProfile(root: ShadowRoot) {
        const editBtn = root.getElementById('edit-profile-btn') as HTMLButtonElement;
        const editIcon = root.getElementById('edit-icon') as HTMLElement;
        const saveIcon = root.getElementById('save-icon') as HTMLElement;

        const fullnameText = root.getElementById('user-info-fullname') as HTMLParagraphElement;
        const usernameText = root.getElementById('user-info-username') as HTMLParagraphElement;
        const emailText = root.getElementById('user-info-email') as HTMLParagraphElement;
        const titleText = root.getElementById('user-info-title') as HTMLHeadingElement;
        const usernameSub = root.getElementById('user-info-username-sub') as HTMLParagraphElement;

        const fullnameInput = root.getElementById('edit-fullname') as HTMLInputElement;
        const usernameInput = root.getElementById('edit-username') as HTMLInputElement;
        const emailInput = root.getElementById('edit-email') as HTMLInputElement;
        const usernameFeedback = root.getElementById('username-feedback') as HTMLParagraphElement;
        const emailFeedback = root.getElementById('email-feedback') as HTMLParagraphElement;

        let isEditing = false;
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
            clearTimeout(usernameTimer); // reuse; each field has own timer via closure

            if (value === currentValue) {
                feedback.textContent = '';
                feedback.className = 'hidden text-xs font-medium';
                input.classList.remove('border-red-500', 'border-green-500');
                setAvailable(true);
                return;
            }
            if (value.length < 3) {
                feedback.textContent = 'Mínimo 3 caracteres';
                feedback.className = 'text-xs font-medium text-gray-400 dark:text-gray-500';
                setAvailable(false);
                return;
            }
            feedback.textContent = 'Comprobando...';
            feedback.className = 'text-xs font-medium text-gray-400 dark:text-gray-500';
            try {
                const res = await fetch(`${url}?${param}=${encodeURIComponent(value)}`);
                const exists = await res.json();
                if (exists) {
                    feedback.textContent = `${label} en uso`;
                    feedback.className = 'text-xs font-medium text-red-500';
                    input.classList.replace('border-green-500', 'border-red-500') || input.classList.add('border-red-500');
                    setAvailable(false);
                } else {
                    feedback.textContent = 'Disponible';
                    feedback.className = 'text-xs font-medium text-green-500';
                    input.classList.replace('border-red-500', 'border-green-500') || input.classList.add('border-green-500');
                    setAvailable(true);
                }
            } catch {
                feedback.textContent = 'Error de conexión';
                feedback.className = 'text-xs font-medium text-red-500';
                setAvailable(false);
            }
        };

        usernameInput.addEventListener('input', () => {
            clearTimeout(usernameTimer);
            usernameTimer = setTimeout(() => checkField(
                usernameInput, usernameFeedback,
                '/api/auth/check-username', 'username',
                this.user.username ?? '', 'Nombre de usuario',
                (v) => { usernameAvailable = v; }
            ), 500);
        });

        emailInput.addEventListener('input', () => {
            clearTimeout(emailTimer);
            emailTimer = setTimeout(() => checkField(
                emailInput, emailFeedback,
                '/api/auth/check-email', 'email',
                this.user.email ?? '', 'Correo electrónico',
                (v) => { emailAvailable = v; }
            ), 500);
        });

        editBtn.addEventListener('click', async () => {
            if (!isEditing) {
                isEditing = true;
                editIcon.classList.add('hidden');
                saveIcon.classList.remove('hidden');

                fullnameText.classList.add('hidden');
                usernameText.classList.add('hidden');
                emailText.classList.add('hidden');

                fullnameInput.value = this.user.fullName ?? '';
                usernameInput.value = this.user.username ?? '';
                emailInput.value = this.user.email ?? '';

                [usernameFeedback, emailFeedback].forEach(fb => { fb.textContent = ''; fb.className = 'hidden text-xs font-medium'; });
                usernameAvailable = true;
                emailAvailable = true;

                fullnameInput.classList.remove('hidden');
                usernameInput.classList.remove('hidden');
                emailInput.classList.remove('hidden');

                fullnameInput.focus();
            } else {
                if (!usernameAvailable || !emailAvailable) return;

                const newFullName = fullnameInput.value.trim();
                const newUsername = usernameInput.value.trim();
                const newEmail = emailInput.value.trim();

                if (!newFullName || !newUsername || !newEmail) return;

                try {
                    const res = await fetch(`/api/admin/users/${encodeURIComponent(this.user.username!)}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: newUsername, fullName: newFullName, email: newEmail })
                    });

                    if (!res.ok) {
                        if (res.status === 409) {
                            usernameFeedback.textContent = 'Ya está en uso';
                            usernameFeedback.className = 'text-xs font-medium text-red-500';
                        }
                        return;
                    }

                    const updatedUser: UsuarioDTO = await res.json();
                    this.user = { ...this.user, ...updatedUser };

                } catch {
                    alert('Error de conexión al guardar.');
                    return;
                }

                isEditing = false;
                editIcon.classList.remove('hidden');
                saveIcon.classList.add('hidden');

                fullnameInput.classList.add('hidden');
                usernameInput.classList.add('hidden');
                emailInput.classList.add('hidden');

                [usernameFeedback, emailFeedback].forEach(fb => {
                    fb.textContent = '';
                    fb.className = 'hidden text-xs font-medium';
                });

                fullnameText.classList.remove('hidden');
                usernameText.classList.remove('hidden');
                emailText.classList.remove('hidden');

                fullnameText.textContent = this.user.fullName ?? '';
                usernameText.textContent = `@${this.user.username}`;
                emailText.textContent = this.user.email ?? '';
                titleText.textContent = this.user.fullName ?? this.user.username ?? '';
                usernameSub.textContent = `@${this.user.username}`;
            }
        });
    }



    render() {
        const userName = this.shadowRoot!.getElementById("user-name");
        const userInfoTitle = this.shadowRoot!.getElementById("user-info-title");
        const userInfoFullname = this.shadowRoot!.getElementById("user-info-fullname");
        const userInfoUsernameSub = this.shadowRoot!.getElementById("user-info-username-sub");
        const userInfoUsername = this.shadowRoot!.getElementById("user-info-username");
        const userInfoEmail = this.shadowRoot!.getElementById("user-info-email");
        const userInfoRole = this.shadowRoot!.getElementById("user-info-role");
        const userTaskCount = this.shadowRoot!.getElementById("user-info-task-count");
        const taskList = this.shadowRoot!.getElementById("task-list");

        userName!.textContent = authService.getUser()?.fullName ?? '';
        userInfoTitle!.textContent = this.user.fullName ?? this.user.username ?? '';
        userInfoFullname!.textContent = this.user.fullName ?? '';
        userInfoUsernameSub!.textContent = `@${this.user.username}`;
        userInfoUsername!.textContent = `@${this.user.username}`;
        userInfoEmail!.textContent = this.user.email ?? '';
        userTaskCount!.textContent = `${this.tasks.length} ${this.tasks.length === 1 ? 'tarea' : 'tareas'}`;

        // Badge de rol
        if (userInfoRole) {
            userInfoRole.className = 'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border border-white/30 bg-white/15 text-white backdrop-blur-sm';
            if (this.user.role === 'ROLE_ADMIN') {
                userInfoRole.textContent = 'Administrador';
            } else if (this.user.role === 'ROLE_USER') {
                userInfoRole.textContent = 'Usuario';
            } else if (this.user.role === 'ROLE_MANAGER') {
                userInfoRole.textContent = 'Gestor';
            } else {
                userInfoRole.textContent = 'No autorizado';
            }
        }

        if (taskList) {
            taskList.innerHTML = '';
            this.tasks.forEach(task => {
                const taskElement = document.createElement('task-info') as TaskInfo;
                taskElement.task = task;
                taskList!.appendChild(taskElement);
            });
        }
    }

    private async showInfoTask(task: TaskResponseDTO) {
        const taskElement = document.createElement('task-item') as any
        taskElement.task = task
        const dialog = this.shadowRoot!.getElementById(
            'task-info'
        ) as HTMLDialogElement
        const title = this.shadowRoot!.getElementById(
            'task-info-title'
        ) as HTMLHeadingElement
        const desc = this.shadowRoot!.getElementById(
            'task-info-desc'
        ) as HTMLParagraphElement
        const deadline = this.shadowRoot!.getElementById(
            'task-info-deadline'
        ) as HTMLParagraphElement
        const categories = this.shadowRoot!.getElementById(
            'task-info-categories'
        ) as HTMLDivElement
        const tags = this.shadowRoot!.getElementById(
            'task-info-tags'
        ) as HTMLDivElement
        const completed = this.shadowRoot!.getElementById(
            'task-info-status'
        ) as HTMLElement
        const createdAt = this.shadowRoot!.getElementById(
            'task-info-created-at'
        ) as HTMLParagraphElement
        const updatedAt = this.shadowRoot!.getElementById(
            'task-info-updated-at'
        ) as HTMLParagraphElement
        const dateConfig: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }

        Array.from([createdAt, updatedAt, deadline]).forEach(el => {
            el.parentElement!.onclick = async () => {
                const textToCopy = el.textContent?.trim()

                if (
                    !textToCopy ||
                    textToCopy === 'No establecida' ||
                    textToCopy === '¡Copiado!'
                )
                    return

                try {
                    await navigator.clipboard.writeText(textToCopy)
                    const originalText = el.textContent
                    const originalLabel =
                        el.parentElement!.style.getPropertyValue('--label')
                    el.textContent = '¡Copiado!'
                    el.parentElement!.style.setProperty('--label', "'¡Copiado!'")

                    setTimeout(() => {
                        el.textContent = originalText

                        if (originalLabel) {
                            el.parentElement!.style.setProperty('--label', originalLabel)
                        } else {
                            el.parentElement!.style.removeProperty('--label')
                        }
                    }, 500)
                } catch (err) {
                    console.error('Error al copiar al portapapeles: ', err)
                }
            }
        })

        title.textContent = task.title ?? ''
        desc.textContent = task.description ?? ''
        deadline.textContent = task.deadline
            ? new Date(task.deadline).toLocaleString('es-ES', dateConfig)
            : 'No establecida'
        categories.innerHTML =
            taskElement.querySelector('.category-container')?.innerHTML ?? ''
        tags.innerHTML =
            taskElement.querySelector('.tags-container')?.innerHTML ?? ''
        let statusType = 'pendiente';
        if (task.completed) {
            statusType = 'completada'
        } else if (task.deadline && Date.now() > new Date(task.deadline).getTime()) {
            statusType = 'vencida'
        }
        completed.setAttribute('type', statusType)
        createdAt.textContent = task.createdAt
            ? new Date(task.createdAt).toLocaleString('es-ES', dateConfig)
            : ''
        updatedAt.textContent = task.lastEdit
            ? new Date(task.lastEdit).toLocaleString('es-ES', dateConfig)
            : ''
        dialog.showModal()
    }
}

customElements.define("user-info-view", UserInfoView);
