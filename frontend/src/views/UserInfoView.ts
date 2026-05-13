import style from "../style.css?inline";
import html from "./html/UserInfoView.html?raw";
import type { Category, TaskRequestDTO, TaskResponseDTO, UserTasksDTO, UsuarioDTO } from "../types/api-types";
import { syncThemeWithObserver } from "../utils/theme";
import { authService } from "../services/AuthService";
import { setupPrefetch } from "../utils/prefetch";
import type { TaskItem } from "../components/TaskItem";
import "../components/TaskItem";
import { prefetchCache, updateCachedData } from "../utils/store";
import { Datepicker } from "flowbite";
import { isEqual } from "lodash";

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

        root.addEventListener('task-edit', ((e: CustomEvent<{ taskElement: TaskItem, task: TaskResponseDTO }>) => {
            this.showEditTask(e.detail.taskElement, e.detail.task)
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
                const taskElement = document.createElement('task-item') as TaskItem;
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

    private showEditTask(_taskElement: TaskItem, task: TaskResponseDTO) {
        const dialog = this.shadowRoot!.getElementById('task-edit') as HTMLDialogElement
        const modalBox = this.shadowRoot!.getElementById('edit-modal-box') as HTMLElement;
        const form = this.shadowRoot!.getElementById('edit-form') as HTMLFormElement;
        const title = this.shadowRoot!.getElementById('edit-title') as HTMLInputElement
        const desc = this.shadowRoot!.getElementById('edit-desc') as HTMLTextAreaElement
        const dateDeadline = this.shadowRoot!.getElementById('date-deadline-edit') as HTMLInputElement
        const timeDeadline = this.shadowRoot!.getElementById('time-deadline-edit') as HTMLInputElement
        const tags = this.shadowRoot!.getElementById('edit-tags') as HTMLInputElement
        const cancel = this.shadowRoot!.getElementById('cancel-edit-task') as HTMLButtonElement
        const dateConfig: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }
        const dp = new Datepicker(dateDeadline, {
            autohide: true,
            format: 'dd/mm/yyyy',
            orientation: 'top',
            language: 'es',
            minDate: Date.now().toString(),
            buttons: true,
            autoSelectToday: 1,
            container: modalBox
        })

        title.value = task.title ?? ''
        desc.value = task.description ?? ''
        if (task.deadline) {
            const d = new Date(task.deadline);
            dateDeadline.value = d.toLocaleDateString('es-ES', dateConfig);
            dp.setDate(d);
            timeDeadline.value = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else {
            dateDeadline.value = '';
            timeDeadline.value = '00:00';
        }
        this.loadCatsDropdown('category-edit-dropdown-container', task.categories ?? []);
        tags.value = task.tags?.map(t => t.name).join(', ') || '';
        cancel.onclick = () => {
            dp.destroy()
            dialog.close()
        }
        modalBox.onclick = (e) => {
            if (dateDeadline.contains(e.target as Node)) return;
            dp.hide()
        }
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                dp.destroy()
                dialog.close()
                document.body.classList.remove('overflow-hidden');
            }
        };
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            let finalDeadline: string | undefined = undefined;

            if (dateDeadline.value && timeDeadline.value) {
                const [day, month, year] = dateDeadline.value.split('/');
                finalDeadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timeDeadline.value}:00`;
            }
            const checkedBoxes = modalBox.querySelectorAll('.category-list input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
            const categoryIds = Array.from(checkedBoxes).map(cb => Number(cb.value));
            const taskSubmit: TaskRequestDTO = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                deadline: finalDeadline,
                categoryIds: categoryIds,
                tagsInput: formData.get('tagsInput') as string
            };
            const originalTask = { ...task };

            const localTask: TaskResponseDTO = {
                ...task,
                title: taskSubmit.title,
                description: taskSubmit.description,
                deadline: taskSubmit.deadline,
                categories: this.cats.filter(c => taskSubmit.categoryIds?.includes(c.id!)),
                tags: taskSubmit.tagsInput ? taskSubmit.tagsInput.split(',').map(name => ({ name: name.trim() })) : [],
                lastEdit: new Date().toISOString()
            };

            updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
                oldTasks.map(t => t.id === task.id ? localTask : t)
            );

            this.tasks = this.tasks.map(t => t.id === task.id ? localTask : t);

            _taskElement.task = localTask;

            dp.destroy();
            dialog.close();
            document.body.classList.remove('overflow-hidden');

            try {
                const response = await fetch('/api/tasks/' + task.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(taskSubmit)
                });

                if (!response.ok) throw new Error('Error al editar la tarea');

                const realTask: TaskResponseDTO = await response.json();

                updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
                    oldTasks.map(t => t.id === task.id ? realTask : t)
                );
                this.tasks = this.tasks.map(t => t.id === task.id ? realTask : t);
                _taskElement.task = realTask;

            } catch (err) {
                console.error('Error al editar la tarea:', err);

                updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
                    oldTasks.map(t => t.id === task.id ? originalTask : t)
                );
                this.tasks = this.tasks.map(t => t.id === task.id ? originalTask : t);
                _taskElement.task = originalTask;

                alert("Error de conexión: No se pudieron guardar los cambios.");
            }
        }
        dialog.show();
    }

    private loadCatsDropdown(id: string, selectedCategories: Category[] = []) {
        const root = this.shadowRoot!
        const container = root.getElementById(id)! as HTMLDivElement
        const dropdownBtn = container.querySelector('.category-dropdown-btn') as HTMLButtonElement
        const dropdownMenu = container.querySelector('.category-dropdown-menu') as HTMLDivElement
        const dropdownLabel = container.querySelector('.category-dropdown-label') as HTMLSpanElement
        const searchInput = container.querySelector('.category-search') as HTMLInputElement
        const categoryList = container.querySelector('.category-list')! as HTMLDivElement
        const dropdownIcon = dropdownBtn.querySelector('svg')! as SVGElement

        const renderCategoryList = (searchTerm = '') => {
            categoryList.innerHTML = ''
            const filtered = this.cats.filter(c =>
                (c.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
            )

            filtered.forEach(cat => {
                if (cat.id === undefined) return
                const isSelected = selectedCategories.some(sc => sc.id === cat.id)

                const div = document.createElement('div')
                div.className = `flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-lg transition-colors ${isSelected
                    ? 'bg-blue-50 dark:bg-indigo-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`

                const checkbox = document.createElement('input')
                checkbox.type = 'checkbox'
                checkbox.value = String(cat.id);
                checkbox.className =
                    'w-4 h-4 text-blue-500 dark:text-indigo-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-indigo-500 cursor-pointer'
                checkbox.checked = isSelected

                const span = document.createElement('span')
                span.className = 'text-sm font-medium text-gray-700 dark:text-gray-200'
                span.textContent = cat.title ?? ''

                div.appendChild(checkbox)
                div.appendChild(span)

                div.onclick = e => {
                    e.stopPropagation()
                    if (e.target !== checkbox) checkbox.checked = !checkbox.checked

                    if (checkbox.checked) {
                        selectedCategories.push(cat)
                    } else {
                        selectedCategories = selectedCategories.filter(
                            sc => sc.id !== cat.id
                        )
                    }
                    updateUI()
                }

                categoryList.appendChild(div)
            })
        }

        dropdownBtn.onclick = (e) => {
            e.preventDefault();
            dropdownMenu.classList.toggle('hidden')
            dropdownIcon.classList.toggle('rotate-180')
            if (!dropdownMenu.classList.contains('hidden')) searchInput.focus()
        }

        searchInput.oninput = (e) => {
            renderCategoryList((e.target as HTMLInputElement).value)
        }

        const updateUI = () => {
            dropdownLabel.textContent = `Categorías: ${selectedCategories.length}`

            renderList(searchInput.value)
        }

        const renderList = renderCategoryList
        renderList();
        updateUI();
    }
}

customElements.define("user-info-view", UserInfoView);
