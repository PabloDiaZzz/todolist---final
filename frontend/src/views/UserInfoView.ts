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
    }

    render() {
        const userName = this.shadowRoot!.getElementById("user-name");
        const userInfoTitle = this.shadowRoot!.getElementById("user-info-title");
        const userInfoFullname = this.shadowRoot!.getElementById("user-info-fullname");
        const userInfoEmail = this.shadowRoot!.getElementById("user-info-email");
        const taskList = this.shadowRoot!.getElementById("task-list");

        userName!.textContent = authService.getUser()?.fullName ?? ''
        userInfoTitle!.textContent = `${this.user.username}`
        userInfoFullname!.textContent = `${this.user.fullName}`
        userInfoEmail!.textContent = `${this.user.email}`

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
