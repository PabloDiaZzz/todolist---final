import html from './html/HomeView.html?raw';
import styles from '../style.css?inline';
import type { UsuarioDTO } from '../types/api-types';
import type { Category } from '../types/api-types';
import type { TaskRequestDTO } from '../types/api-types';
import type { TaskResponseDTO } from '../types/api-types';
import '../components/TaskItem';
import { Datepicker } from 'flowbite';

declare module 'flowbite' {
    interface DatepickerOptions {
        container?: HTMLElement | string;
    }
}

export class HomeView extends HTMLElement {
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
        
        const syncTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                themeWrapper?.classList.add('dark');
            } else {
                themeWrapper?.classList.remove('dark');
            }
        };

        syncTheme();

        const observer = new MutationObserver(() => syncTheme());
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        this.setupEvents();
    }

    private async setupEvents() {
        const root = this.shadowRoot!;
        const userName = root.getElementById('user-name')!;

        const dropdownBtn = root.getElementById('category-dropdown-btn')!;
        const dropdownMenu = root.getElementById('category-dropdown-menu')!;
        const dropdownLabel = root.getElementById('category-dropdown-label')!;
        const searchInput = root.getElementById('category-search') as HTMLInputElement;
        const categoryList = root.getElementById('category-list')!;
        const dropdownIcon = dropdownBtn.querySelector('svg')!;
        const dateInput = root.getElementById('date-input') as HTMLInputElement;
        const timeInput = root.getElementById('time-input') as HTMLInputElement;
        

        const dp = new Datepicker(dateInput, {
            autohide: true,
            format: 'dd/mm/yyyy',
            orientation: 'bottom',
            language: 'es',
            minDate: Date.now().toString(),
            buttons: true,
            autoSelectToday: 1,
            container: root.getElementById('theme-wrapper') as HTMLElement
        });

        let allCategories: Category[] = [];
        let selectedCategories: Category[] = [];

        const user: UsuarioDTO = await fetch('/api/user/me').then(res => res.json());

        const logoutForm = root.getElementById('logout-form')!;
        logoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await fetch('/api/logout', { method: 'POST' });
            (window as any).navigate('/login?logout');
        });

        const adminButton = root.getElementById('admin-button')!;
        if (user.role !== 'ROLE_ADMIN') {
            adminButton.classList.add('hidden');
        } else {
            adminButton.classList.remove('hidden');
        }

        allCategories = await fetch('/api/cats').then(res => res.json());
        const renderCategoryList = (searchTerm = '') => {
            categoryList.innerHTML = '';
            const filtered = allCategories.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

            filtered.forEach(cat => {
                if (cat.id === undefined) return;
                const isSelected = selectedCategories.some(sc => sc.id === cat.id);

                const div = document.createElement('div');
                div.className = `flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-lg transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer';
                checkbox.checked = isSelected;

                const span = document.createElement('span');
                span.className = 'text-sm font-medium text-gray-700 dark:text-gray-200';
                span.textContent = cat.title;

                div.appendChild(checkbox);
                div.appendChild(span);

                // Al hacer clic en la fila, alternamos la selección
                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (e.target !== checkbox) checkbox.checked = !checkbox.checked;

                    if (checkbox.checked) {
                        selectedCategories.push(cat);
                    } else {
                        selectedCategories = selectedCategories.filter(sc => sc.id !== cat.id);
                    }
                    updateUI();
                });

                categoryList.appendChild(div);
            });
        };

        const updateUI = () => {
            dropdownLabel.textContent = `Categorías: ${selectedCategories.length}`;

            renderList(searchInput.value);
        };

        const resetUI = () => {
            selectedCategories = [];
            updateUI();
        };

        const renderList = renderCategoryList;
        renderList();

        userName.textContent = user.fullName ?? '';
        this.loadTasks();
        root.addEventListener('task-updated', () => this.loadTasks());

        const taskOptions = root.getElementById('task-options')!;
        taskOptions.addEventListener('click', () => {
            taskOptions.setAttribute('data-active', 'true');
        });

        root.addEventListener('click', (e) => {
            const target = e.target as Node;
            const pickerEl = document.querySelector('.datepicker-picker');
            if (target !== taskOptions && !taskOptions.contains(target) && taskOptions.dataset.active === 'true') {
                taskOptions.setAttribute('data-active', 'false');
            }

            if (target !== dateInput && pickerEl && !pickerEl.contains(target)) {
                dp.hide();
            }

            if (!dropdownBtn.contains(target) && !dropdownMenu.contains(target)) {
                dropdownMenu.classList.add('hidden');
                dropdownIcon.classList.remove('rotate-180');
            }
        });

        dropdownBtn.addEventListener('click', () => {
            dropdownMenu.classList.toggle('hidden');
            dropdownIcon.classList.toggle('rotate-180');
            if (!dropdownMenu.classList.contains('hidden')) searchInput.focus();
        });

        searchInput.addEventListener('input', (e) => {
            renderList((e.target as HTMLInputElement).value);
        });

        root.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target as Node) && !dropdownMenu.contains(e.target as Node)) {
                dropdownMenu.classList.add('hidden');
            }
        });

        const taskForm = root.getElementById('task-form') as HTMLFormElement;
        taskForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData: FormData = new FormData(taskForm);
            const dateStr = formData.get('date') as string;
            const timeStr = formData.get('time') as string;

            let finalDeadline: string | undefined = undefined;

            if (dateStr && timeStr) {
                const [day, month, year] = dateStr.split('/');
                finalDeadline = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timeStr}:00`;
            }

            const task: TaskRequestDTO = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                categoryIds: selectedCategories.map(c => c.id!),
                tagsInput: formData.get('tagsInput') as string,
                deadline: finalDeadline,
            };

            await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task)
            });

            this.loadTasks();
            taskForm.reset();
            resetUI();
            timeInput.value = '23:59';
        });
    }

    private async loadTasks() {
        const container = this.shadowRoot!.getElementById('tasks-container');
        try {
            const response = await fetch('/api/tasks');
            const tasks: TaskResponseDTO[] = await response.json();

            if (container) {
                container.innerHTML = '';

                const noTasks = this.shadowRoot!.getElementById('no-tasks');
                const taskOptions = this.shadowRoot!.getElementById('task-options')!;
                if (tasks.length === 0) {
                    noTasks?.classList.remove('hidden');
                    noTasks?.classList.add('flex');
                } else {
                    noTasks?.classList.add('hidden');
                    noTasks?.classList.remove('flex');
                }
                if (tasks.length < 2) {
                    taskOptions.classList.add('opacity-0')
                    taskOptions.classList.remove('opacity-100')
                    taskOptions.classList.add('pointer-events-none')
                } else {
                    taskOptions.classList.remove('opacity-0')
                    taskOptions.classList.add('opacity-100')
                    taskOptions.classList.remove('pointer-events-none')
                }
                tasks.forEach((taskData: TaskResponseDTO) => {
                    const taskElement = document.createElement('task-item') as any;
                    taskElement.task = taskData;
                    container.appendChild(taskElement);
                });
            }
        } catch (err) {
            console.error("Error cargando tareas:", err);
        }
    }
}
customElements.define('home-view', HomeView);