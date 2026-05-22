import html from './html/TaskItem.html?raw';
import type { TaskResponseDTO } from '../types/api-types';
import { updateCachedData } from '../utils/store';
import type { StatusInfo } from './StatusInfo';
import { authService } from '../services/AuthService';

export class TaskItem extends HTMLElement {
    private _task!: TaskResponseDTO;
    private _isSyncing: boolean = false

    set syncing(val: boolean) {
        this._isSyncing = val;
        this.render();
    }

    set task(data: TaskResponseDTO) {
        this._task = data;
        this.render();
    }

    get task(): TaskResponseDTO {
        return this._task;
    }

    private setupEventListeners() {
        const toggleBtn = this.querySelector('.toggle-btn') as HTMLButtonElement;
        const deleteBtn = this.querySelector('.delete-btn') as HTMLButtonElement;
        const editBtn = this.querySelector('.edit-btn') as HTMLButtonElement;
        const infoBtn = this.querySelector('.info-btn') as HTMLButtonElement;

        toggleBtn?.addEventListener('click', async () => {
            if (this._isSyncing) return;
            const task = this._task;
            const originalState = task.completed;
            task.completed = !originalState;
            this.render();
            updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
                oldTasks.map(t => t.id === task.id ? { ...t, completed: task.completed } : t)
            );
            
            try {
                const response = await fetch(`/api/tasks/${task.id}/toggle`, { method: 'PATCH', headers: authService.getAuthHeaders() });
                if (!response.ok) throw new Error('Error al actualizar');
            } catch (error) {
                task.completed = originalState;
                updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
                    oldTasks.map(t => t.id === task.id ? { ...t, completed: task.completed } : t)
                );
                this.render();
            }
        });

        deleteBtn?.addEventListener('click', async () => {
            if (this._isSyncing) return;
            const task = this._task;
            if (deleteBtn.dataset.state === 'initial') {
                deleteBtn.dataset.state = 'confirm';
                deleteBtn.classList.add('hover:bg-red-500', 'dark:hover:bg-red-500', 'text-white', 'dark:text-white');
                deleteBtn.classList.remove('hover:bg-red-50', 'dark:hover:bg-red-900/30');
                
                const onMouseLeave = () => {
                    deleteBtn.dataset.state = 'initial';
                    deleteBtn.classList.add('hover:bg-red-50', 'dark:hover:bg-red-900/30');
                    deleteBtn.classList.remove('hover:bg-red-500', 'dark:hover:bg-red-500', 'text-white', 'dark:text-white');
                };
                deleteBtn.addEventListener('mouseleave', onMouseLeave, { once: true });
            } else if (deleteBtn.dataset.state === 'confirm') {
                this.style.display = 'none';
                updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks => oldTasks.filter(t => t.id !== task.id));
                const container = this.parentElement;
                try {
                    const response = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE', headers: authService.getAuthHeaders() });
                    if (!response.ok) throw new Error('Error al borrar');

                    this.remove();

                    if (container && container.children.length === 0) {
                        const noTasks = container.parentElement?.querySelector('#no-tasks');
                        noTasks?.classList.replace('hidden', 'flex');
                    }
                } catch (err) {
                    this.style.display = '';
                    updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks => [...oldTasks, task]);

                    deleteBtn.dataset.state = 'initial';
                    deleteBtn.classList.add('hover:bg-red-50', 'dark:hover:bg-red-900/30');
                    deleteBtn.classList.remove('hover:bg-red-500', 'dark:hover:bg-red-500', 'text-white', 'dark:text-white');
                    alert('Error de conexión al borrar la tarea.');
                }
            }
        });

        editBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('task-edit', { bubbles: true, composed: true, detail: { taskElement: this, task: this._task } }));
        });

        infoBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('task-info', { bubbles: true, composed: true, detail: this._task }));
        });

    }

    private render() {
        const isFirstRender = !this.querySelector('.task-wrapper');
        if (isFirstRender) {
            this.innerHTML = html;
            this.setupEventListeners();
        }

        const task = this._task;
        const categoryTemplate = this.querySelector('#category-template') as HTMLTemplateElement;
        const tagTemplate = this.querySelector('#tag-template') as HTMLTemplateElement;
        const titleEl = this.querySelector('.title-text') as HTMLHeadingElement;
        const descEl = this.querySelector('.description-text') as HTMLPreElement;
        const dateEl = this.querySelector('.date-text') as StatusInfo;

        titleEl!.textContent = task.title!;
        descEl!.textContent = task.description ?? '';

        const deadline = task.deadline ? new Date(task.deadline) : null;
        if (!deadline) {
            dateEl?.classList.add('hidden');
        } else {
            dateEl?.classList.remove('hidden');
            if (Date.now() > deadline.getTime()) {
                dateEl?.setAttribute('color', 'red');
                dateEl?.setAttribute('text', deadline.toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }));
            } else {
                dateEl?.setAttribute('color', 'yellow');
                dateEl?.setAttribute('text', deadline.toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }));
            }
        }

        const starIcon = this.querySelector('.star-icon');
        const starBtn = this.querySelector('.star-btn') as HTMLButtonElement;
        if (starIcon && starBtn) {
            starIcon.classList.remove('animate-star-pop', 'animate-star-shrink');
            if (task.important) {
                starIcon.classList.add('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
                starIcon.classList.remove('text-gray-400', 'dark:text-slate-500', 'fill-none');
                
                
                starBtn.classList.remove('hidden');
            } else {
                starIcon.classList.remove('text-amber-500', 'fill-amber-500', 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]');
                starIcon.classList.add('text-gray-400', 'dark:text-slate-500', 'fill-none');
                
                
                starBtn.classList.add('hidden');
            }
        }

        const wrapper = this.querySelector('.task-wrapper');
        const statusIcon = this.querySelector('.status-icon');
        const content = this.querySelector('.task-content');
        const tagsContainer = this.querySelector('.tags-container');
        const categoryContainer = this.querySelector('.category-container');
        const deleteBtn = this.querySelector('.delete-btn') as HTMLButtonElement;
        const editBtn = this.querySelector('.edit-btn') as HTMLButtonElement;
        const infoBtn = this.querySelector('.info-btn') as HTMLButtonElement;
        const toggleBtn = this.querySelector('.toggle-btn') as HTMLButtonElement;

        statusIcon?.classList.remove('bg-green-500', 'border-transparent', 'border-2', 'border-gray-400');
        if (statusIcon) statusIcon.innerHTML = '';

        if (task.completed) {
            wrapper?.classList.add('opacity-75');
            statusIcon?.classList.add('bg-green-500', 'border-transparent');
            if (statusIcon) statusIcon.innerHTML = '<span class="text-white text-sm font-bold">✓</span>';
            content?.classList.add('line-through', 'text-gray-400', 'dark:text-gray-500');
            
            editBtn.disabled = true;
            editBtn.classList.add('opacity-50', 'cursor-not-allowed');
            editBtn.classList.remove('cursor-pointer', 'hover:bg-blue-200', 'dark:hover:bg-blue-900/30');
            editBtn.classList.remove('text-blue-600', 'dark:text-indigo-400');
            editBtn.classList.add('text-gray-300', 'dark:text-gray-600');
            dateEl?.setAttribute('color', 'green');
        } else {
            wrapper?.classList.remove('opacity-75');
            statusIcon?.classList.add('border-2', 'border-gray-400');
            content?.classList.remove('line-through', 'text-gray-400', 'dark:text-gray-500');
            
            editBtn.disabled = false;
            editBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'text-gray-300', 'dark:text-gray-600');
            editBtn.classList.add('cursor-pointer', 'hover:bg-blue-200', 'dark:hover:bg-blue-900/30', 'text-blue-600', 'dark:text-indigo-400');
        }

        infoBtn?.classList.remove('invisible');

        if (this._isSyncing) {
            if (toggleBtn) toggleBtn.disabled = true;
            if (deleteBtn) deleteBtn.disabled = true;
            this.classList.add('opacity-70', 'cursor-progress');
        } else {
            if (toggleBtn) toggleBtn.disabled = false;
            if (deleteBtn) deleteBtn.disabled = false;
            this.classList.remove('opacity-70', 'cursor-progress');
        }

        if (categoryContainer) {
            categoryContainer.innerHTML = '';
            if (task.categories && categoryTemplate) {
                task.categories.forEach(cat => {
                    const clone = categoryTemplate.content.cloneNode(true) as DocumentFragment;
                    const span = clone.querySelector('span');
                    if (span) span.textContent = cat.title ?? '';
                    categoryContainer.appendChild(clone);
                });
            }
        }

        if (tagsContainer) {
            tagsContainer.innerHTML = '';
            if (task.tags && tagTemplate) {
                task.tags.forEach(tag => {
                    const clone = tagTemplate.content.cloneNode(true) as DocumentFragment;
                    const span = clone.querySelector('span');
                    if (span) span.textContent = `#${tag.name}`;
                    tagsContainer.appendChild(clone);
                });
            }
        }
    }
}
customElements.define('task-item', TaskItem);