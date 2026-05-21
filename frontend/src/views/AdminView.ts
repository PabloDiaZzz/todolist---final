import html from './html/AdminView.html?raw';
import style from '../style.css?inline';
import type { Category, TaskResponseDTO, TaskUserDTO, UsuarioDTO } from '../types/api-types';
import '../components/UserAdminItem';
import '../components/CatAdminItem';
import '../components/TaskAdminItem';
import '../components/StatusInfo';
import '../components/AppHeader';
import type { UserAdminItem } from '../components/UserAdminItem';
import type { CatAdminItem } from '../components/CatAdminItem';
import type { TaskAdminItem } from '../components/TaskAdminItem';
import { isEqual } from 'lodash';
import { authService } from '../services/AuthService';
import { syncThemeWithObserver } from '../utils/theme';
import { prefetchCache, updateCachedData } from '../utils/store';

function sanitizeTaskUser(tu: TaskUserDTO) {
    if (!tu || !tu.task) return tu;
    const { lastEdit, ...restTask } = tu.task;
    return {
        author: tu.author,
        task: {
            ...restTask,
            categories: restTask.categories?.map(({ id, title }) => ({ id, title })).sort((a, b) => (a.id ?? 0) - (b.id ?? 0)) ?? [],
            tags: restTask.tags?.map(({ name }) => ({ name })).sort((a, b) => (a.name || '').localeCompare(b.name || '')) ?? []
        }
    };
}

function areTaskUserListsEqual(a: TaskUserDTO[], b: TaskUserDTO[]): boolean {
    if (a.length !== b.length) return false;
    return isEqual(a.map(sanitizeTaskUser), b.map(sanitizeTaskUser));
}

export class AdminView extends HTMLElement {

    private themeObserver: MutationObserver | null = null;
    private me!: UsuarioDTO;
    private cats: Category[] = [];
    private tasks: TaskUserDTO[] = [];
    private users: UsuarioDTO[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(style);
        this.shadowRoot!.adoptedStyleSheets = [sheet];
        this.shadowRoot!.innerHTML = html;
        const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper')

        this.themeObserver = syncThemeWithObserver(themeWrapper);

        this.setupEvents()
    }

    disconnectedCallback() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
    }

    async setupEvents() {
        const root = this.shadowRoot!
        const buscarCatContainer = root.getElementById('buscar-cat-container') as HTMLDivElement;
        const buscarCatInput = root.getElementById('buscar-cat-input') as HTMLInputElement
        const createCatForm = root.getElementById('create-cat-form') as HTMLFormElement

        await this.loadData();

        root.addEventListener('sync-memory', () => {
            this.users = prefetchCache.get('/api/admin/users') || [];
            this.cats = prefetchCache.get('/api/cats') || [];
        });

        const buscarUserContainer = root.getElementById('buscar-user-container') as HTMLDivElement;
        const buscarUserInput = root.getElementById('buscar-user-input') as HTMLInputElement;
        const buscarTaskContainer = root.getElementById('buscar-task-container') as HTMLDivElement;
        const buscarTaskInput = root.getElementById('buscar-task-input') as HTMLInputElement;

        root.addEventListener('click', (e) => {
            if (buscarCatContainer && buscarCatContainer.contains(e.target as Node)) {
                buscarCatContainer.dataset.active = 'true';
            } else if (buscarCatContainer) {
                buscarCatContainer.dataset.active = 'false';
            }

            if (buscarUserContainer && buscarUserContainer.contains(e.target as Node)) {
                buscarUserContainer.dataset.active = 'true';
            } else if (buscarUserContainer) {
                buscarUserContainer.dataset.active = 'false';
            }

            if (buscarTaskContainer && buscarTaskContainer.contains(e.target as Node)) {
                buscarTaskContainer.dataset.active = 'true';
            } else if (buscarTaskContainer) {
                buscarTaskContainer.dataset.active = 'false';
            }
        })

        if (buscarCatInput) {
            buscarCatInput.addEventListener('input', () => {
                const searchValue = buscarCatInput.value.toLowerCase();
                const filteredCats = this.cats.filter(cat => cat.title!.toLowerCase().includes(searchValue));
                this.displayCats(filteredCats);
            })
        }

        if (buscarUserInput) {
            buscarUserInput.addEventListener('input', () => {
                this.displayUsers();
            })
        }

        if (buscarTaskInput) {
            buscarTaskInput.addEventListener('input', () => {
                this.displayTasks();
            })
        }

        createCatForm.onsubmit = async (e) => {
            e.preventDefault()
            const formData = new FormData(createCatForm)
            const title = (formData.get('title') as string).trim().charAt(0).toUpperCase() + (formData.get('title') as string).trim().slice(1).toLowerCase();
            const fakeId = Date.now();
            const localCat: Category = { id: fakeId, title };
            this.cats = updateCachedData<Category>('/api/cats', oldCats => [...oldCats, localCat]);
            this.displayCats();
            createCatForm.reset();
            
            try {
                const response = await fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title })
                })

                if (!response.ok) throw new Error('Error al crear');

                const realCat: Category = await response.json();
                this.cats = updateCachedData<Category>('/api/cats', oldCats =>
                    oldCats.map(c => c.id === fakeId ? realCat : c)
                );
                const catElements = this.shadowRoot!.querySelectorAll('cat-admin-item') as NodeListOf<any>;
                catElements.forEach(el => {
                    if (el.cat?.id === fakeId) el.cat = realCat;
                });

            } catch (err) {
                console.error('Error al crear categoría', err);
                this.cats = updateCachedData<Category>('/api/cats', oldCats => oldCats.filter(c => c.id !== fakeId));
                this.displayCats();
                alert("Error de conexión al crear la categoría.");
            }
        };

        root.addEventListener('task-info', ((e: CustomEvent<TaskResponseDTO>) => {
            this.showInfoTask(e.detail);
        }) as EventListener);

        root.getElementById('close-task-info')!.addEventListener('click', () => {
            (root.getElementById('task-info') as HTMLDialogElement).close();
        });
    }

    private displayCats(cats: Category[] = this.cats) {
        if (!Array.isArray(cats)) {
            cats = [];
        }
        const catsContainer = this.shadowRoot!.querySelector('.cats-list') as HTMLUListElement
        const buscarCatInput = this.shadowRoot!.getElementById('buscar-cat-input') as HTMLInputElement
        catsContainer.innerHTML = '';
        cats = [...cats]
            .filter(cat => cat && cat.title!.toLowerCase()
                .includes(buscarCatInput.value.toLowerCase()))
            .sort((a: Category, b: Category) => a.title!.localeCompare(b.title!))

        const noCats = this.shadowRoot!.getElementById('no-cats') as HTMLDivElement
        if (cats.length === 0) {
            noCats.classList.add('flex')
            noCats.classList.remove('hidden')
        } else {
            noCats.classList.remove('flex')
            noCats.classList.add('hidden')
        }
        cats.forEach(cat => {
            const li = document.createElement('cat-admin-item') as CatAdminItem;
            li.cat = cat
            catsContainer.appendChild(li)
        })
    }

    private displayTasks() {
        if (!Array.isArray(this.tasks)) {
            this.tasks = [];
        }
        const tasksContainer = this.shadowRoot!.querySelector('.tasks-list') as HTMLUListElement;
        if (!tasksContainer) return;

        const buscarTaskInput = this.shadowRoot!.getElementById('buscar-task-input') as HTMLInputElement;
        const searchValue = buscarTaskInput ? buscarTaskInput.value.toLowerCase() : '';

        tasksContainer.innerHTML = '';

        const otherUsersTasks = this.tasks.filter(task => {
            if (!task || !task.task || !task.author) return false;
            
            if (this.me && task.author.username === this.me.username) return false;
            
            if (!searchValue) return true;
            
            const titleMatches = task.task.title?.toLowerCase().includes(searchValue);
            const authorUsernameMatches = task.author.username?.toLowerCase().includes(searchValue);
            const authorNameMatches = task.author.fullName?.toLowerCase().includes(searchValue);
            return !!(titleMatches || authorUsernameMatches || authorNameMatches);
        });

        otherUsersTasks.sort((a, b) => (b.task?.id ?? 0) - (a.task?.id ?? 0));

        const noTasks = this.shadowRoot!.getElementById('no-tasks') as HTMLDivElement;
        if (noTasks) {
            if (otherUsersTasks.length === 0) {
                noTasks.classList.add('flex');
                noTasks.classList.remove('hidden');
            } else {
                noTasks.classList.remove('flex');
                noTasks.classList.add('hidden');
            }
        }

        otherUsersTasks.forEach(taskUser => {
            const li = document.createElement('task-admin-item') as TaskAdminItem;
            li.taskUser = taskUser;
            tasksContainer.appendChild(li);
        });
    }

    private displayUsers(users: UsuarioDTO[] = this.users) {
        if (!Array.isArray(users)) {
            users = [];
        }
        const usersContainer = this.shadowRoot!.querySelector('.users-list') as HTMLUListElement;
        const buscarUserInput = this.shadowRoot!.getElementById('buscar-user-input') as HTMLInputElement;
        const searchValue = buscarUserInput ? buscarUserInput.value.toLowerCase() : '';

        usersContainer.innerHTML = '';
        const filteredUsers = [...users]
            .filter(user => user && !isEqual(user, this.me))
            .filter(user => {
                if (!searchValue) return true;
                const usernameMatches = user.username?.toLowerCase().includes(searchValue);
                const fullNameMatches = user.fullName?.toLowerCase().includes(searchValue);
                const emailMatches = user.email?.toLowerCase().includes(searchValue);
                return usernameMatches || fullNameMatches || emailMatches;
            })
            .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

        const noUsers = this.shadowRoot!.getElementById('no-users') as HTMLDivElement;
        if (filteredUsers.length === 0) {
            noUsers.classList.add('flex');
            noUsers.classList.remove('hidden');
        } else {
            noUsers.classList.remove('flex');
            noUsers.classList.add('hidden');
        }
        filteredUsers.forEach(user => {
            const li = document.createElement('user-admin-item') as UserAdminItem;
            li.user = user;
            usersContainer.appendChild(li);
        });
    }

    private async loadData() {
        this.me = authService.getUser()!;
        
        const usersSection = this.shadowRoot!.getElementById('users-section')!;
        const tasksSection = this.shadowRoot!.getElementById('tasks-section')!;
        const adminMain = this.shadowRoot!.getElementById('admin-main')!;
        
        if (authService.isManager()) {
            usersSection.classList.add('hidden');
            usersSection.classList.remove('flex');
            tasksSection.classList.add('hidden');
            tasksSection.classList.remove('flex');
            
            if (adminMain) {
                adminMain.classList.remove('md:grid-cols-3', 'max-w-6xl');
                adminMain.classList.add('md:grid-cols-1', 'max-w-2xl');
            }
        }

        if (!authService.isManager() && prefetchCache.has('/api/admin/tasks')) {
            this.tasks = prefetchCache.get('/api/admin/tasks');
            this.displayTasks();
        }
        if (prefetchCache.has('/api/cats')) {
            this.cats = prefetchCache.get('/api/cats');
            this.displayCats();
        }
        if (!authService.isManager() && prefetchCache.has('/api/admin/users')) {
            this.users = prefetchCache.get('/api/admin/users');
            this.displayUsers();
        }

        const fetches: Promise<any>[] = [
            fetch('/api/cats').then(res => res.ok ? res.json() : [])
        ];

        if (!authService.isManager()) {
            fetches.push(fetch('/api/admin/tasks').then(res => res.ok ? res.json() : []));
            fetches.push(fetch('/api/admin/users').then(res => res.ok ? res.json() : []));
        } else {
            fetches.push(Promise.resolve([]));
            fetches.push(Promise.resolve([]));
        }

        await Promise.all(fetches).then(([freshCats, freshTasks, users]) => {
            const tasksChanged = !areTaskUserListsEqual(this.tasks, freshTasks);
            const catsChanged = !isEqual(this.cats, freshCats);
            const usersChanged = !isEqual(this.users, users);

            if (!authService.isManager()) {
                if (tasksChanged) {
                    this.tasks = freshTasks;
                    prefetchCache.set('/api/admin/tasks', freshTasks);
                    this.displayTasks();
                } else {
                    this.tasks = freshTasks;
                    prefetchCache.set('/api/admin/tasks', freshTasks);
                }
            }

            if (catsChanged) {
                this.cats = freshCats;
                prefetchCache.set('/api/cats', freshCats);
                this.displayCats();
            }

            if (!authService.isManager() && usersChanged) {
                this.users = users;
                prefetchCache.set('/api/admin/users', users);
                this.displayUsers();
            }
        });
    }

    private async showInfoTask(task: TaskResponseDTO) {
        const dialog = this.shadowRoot!.getElementById(
            'task-info'
        ) as HTMLDialogElement;
        if (!dialog) return;

        const title = this.shadowRoot!.getElementById(
            'task-info-title'
        ) as HTMLHeadingElement;
        const desc = this.shadowRoot!.getElementById(
            'task-info-desc'
        ) as HTMLParagraphElement;
        const deadline = this.shadowRoot!.getElementById(
            'task-info-deadline'
        ) as HTMLParagraphElement;
        const categories = this.shadowRoot!.getElementById(
            'task-info-categories'
        ) as HTMLDivElement;
        const tags = this.shadowRoot!.getElementById(
            'task-info-tags'
        ) as HTMLDivElement;
        const completed = this.shadowRoot!.getElementById(
            'task-info-status'
        ) as HTMLElement;
        const createdAt = this.shadowRoot!.getElementById(
            'task-info-created-at'
        ) as HTMLParagraphElement;
        const updatedAt = this.shadowRoot!.getElementById(
            'task-info-updated-at'
        ) as HTMLParagraphElement;

        const dateConfig: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };

        
        Array.from([createdAt, updatedAt, deadline]).forEach(el => {
            if (!el) return;
            el.parentElement!.onclick = async () => {
                const textToCopy = el.textContent?.trim();

                if (
                    !textToCopy ||
                    textToCopy === 'No establecida' ||
                    textToCopy === '¡Copiado!'
                )
                    return;

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    const originalText = el.textContent;
                    const originalLabel =
                        el.parentElement!.style.getPropertyValue('--label');
                    el.textContent = '¡Copiado!';
                    el.parentElement!.style.setProperty('--label', "'¡Copiado!'");

                    setTimeout(() => {
                        el.textContent = originalText;

                        if (originalLabel) {
                            el.parentElement!.style.setProperty('--label', originalLabel);
                        } else {
                            el.parentElement!.style.removeProperty('--label');
                        }
                    }, 500);
                } catch (err) {
                    console.error('Error al copiar al portapapeles: ', err);
                }
            };
        });

        title.textContent = task.title ?? '';
        desc.textContent = task.description ?? '';
        deadline.textContent = task.deadline
            ? new Date(task.deadline).toLocaleString('es-ES', dateConfig)
            : 'No establecida';

        
        categories.innerHTML = '';
        if (task.categories) {
            task.categories.forEach(cat => {
                const span = document.createElement('span');
                span.className = 'bg-blue-200 dark:bg-indigo-900/50 px-2.5 py-1 rounded-md font-semibold text-blue-800 dark:text-indigo-300 text-xs';
                span.textContent = cat.title ?? '';
                categories.appendChild(span);
            });
        }

        
        tags.innerHTML = '';
        if (task.tags) {
            task.tags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'bg-gray-300 dark:bg-slate-700 px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 text-xs';
                span.textContent = `#${tag.name}`;
                tags.appendChild(span);
            });
        }

        let statusType = 'pendiente';
        if (task.completed) {
            statusType = 'completada';
        } else if (task.deadline && Date.now() > new Date(task.deadline).getTime()) {
            statusType = 'vencida';
        }
        completed.setAttribute('type', statusType);

        createdAt.textContent = task.createdAt
            ? new Date(task.createdAt).toLocaleString('es-ES', dateConfig)
            : '';
        updatedAt.textContent = task.lastEdit
            ? new Date(task.lastEdit).toLocaleString('es-ES', dateConfig)
            : '';

        dialog.showModal();
    }
}
customElements.define('admin-view', AdminView);