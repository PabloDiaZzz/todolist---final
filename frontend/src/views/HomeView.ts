import html from './html/HomeView.html?raw';
import styles from '../style.css?inline';
import type { UsuarioDTO } from '../types/api-types';
import type { Category } from '../types/api-types';
import type { TaskRequestDTO } from '../types/api-types';
import type { TaskResponseDTO } from '../types/api-types';
import '../components/TaskItem';

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

        this.setupEvents();
    }

    private async setupEvents() {
        const root = this.shadowRoot!;
        const userName = root.getElementById('user-name')!;

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

        const taskForm = root.getElementById('task-form') as HTMLFormElement;
        taskForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(taskForm);
            const categoryString = formData.get('categoryId') as string;
            const categoryNumber = categoryString ? parseInt(categoryString) : undefined;

            const task: TaskRequestDTO = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                categoryId: categoryNumber as number,
                tagsInput: formData.get('tagsInput') as string
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
        });

        const categorySelect = root.getElementById('category-select')!;
        const categoryOptionsSelect = root.getElementById('category-options-filter')!;
        const categories: Category[] = await fetch('/api/cats').then(res => res.json());
        Array.from(categories).forEach((category: Category) => {
            if (category.id == undefined) return;
            const option = document.createElement('option');
            option.value = category.id.toString();
            option.textContent = category.title ?? '';
            categorySelect.appendChild(option);
            categoryOptionsSelect.appendChild(option.cloneNode(true));
        });
        userName.textContent = user.fullName ?? '';
        this.loadTasks();
        root.addEventListener('task-updated', () => this.loadTasks());

        const taskOptions = root.getElementById('task-options')!;
        taskOptions.addEventListener('click', () => {
            taskOptions.setAttribute('data-active', 'true');
        });

        root.addEventListener('click', (e) => {
            if (e.target !== taskOptions && !taskOptions.contains(e.target as Node) && taskOptions.dataset.active === 'true') {
                taskOptions.setAttribute('data-active', 'false');
            }
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