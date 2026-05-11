import html from './html/TaskItem.html?raw';
import type { TaskResponseDTO } from '../types/api-types';
import { updateCachedData } from '../utils/store';

export class TaskItem extends HTMLElement {
    private _task!: TaskResponseDTO;

    set task(data: TaskResponseDTO) {
        this._task = data;
        this.render();
    }

    private render() {
        this.innerHTML = html;
        const task = this._task;
        const categoryTemplate = this.querySelector('#category-template') as HTMLTemplateElement;
        const tagTemplate = this.querySelector('#tag-template') as HTMLTemplateElement;
        const titleEl = this.querySelector('.tittle-text');
        const descEl = this.querySelector('.description-text');
        const dateEl = this.querySelector('.date-text');

        const deadline = task.deadline ? new Date(task.deadline) : null;

        titleEl!.textContent = task.title!;
        descEl!.textContent = task.description ?? '';
        if (!deadline) dateEl?.remove();

        if (deadline && Date.now() > deadline.getTime()) {
            dateEl?.setAttribute('color', 'red');
            dateEl?.setAttribute('text', deadline.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }));
        } else if (deadline) {
            dateEl?.setAttribute('color', 'yellow');
            dateEl?.setAttribute('text', deadline.toLocaleString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }));
        }

        const wrapper = this.querySelector('.task-wrapper');
        const statusIcon = this.querySelector('.status-icon');
        const content = this.querySelector('.task-content');
        const tagsContainer = this.querySelector('.tags-container');
        const categoryContainer = this.querySelector('.category-container');
        const deleteBtn = this.querySelector('.delete-btn') as HTMLButtonElement;
        const editBtn = this.querySelector('.edit-btn') as HTMLButtonElement;
        const infoBtn = this.querySelector('.info-btn');

        const toggleBtn = this.querySelector('.toggle-btn');
        toggleBtn?.addEventListener('click', async () => {
            const originalState = task.completed;
            task.completed = !originalState;
            this.render();
            updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
                oldTasks.map(t => t.id === task.id ? { ...t, completed: task.completed } : t)
            );
            
            try {
                const response = await fetch(`/api/tasks/${task.id}/toggle`, { method: 'PATCH' });
                if (!response.ok) throw new Error('Error al actualizar');
            } catch (error) {
                task.completed = originalState;
                updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks =>
                    oldTasks.map(t => t.id === task.id ? { ...t, completed: task.completed } : t)
                );
                this.render();
            }
        });

        this.querySelector('.delete-btn')?.addEventListener('click', async () => {
            if (deleteBtn.dataset.state === 'initial') {
                deleteBtn.dataset.state = 'confirm';
                deleteBtn.classList.add('hover:bg-red-500', 'dark:hover:bg-red-500', 'text-white', 'dark:text-white');
                deleteBtn.classList.remove('hover:bg-red-50', 'dark:hover:bg-red-900/30');
                deleteBtn.addEventListener('mouseleave', () => {
                    deleteBtn.dataset.state = 'initial';
                    deleteBtn.classList.add('hover:bg-red-50', 'dark:hover:bg-red-900/30');
                    deleteBtn.classList.remove('hover:bg-red-500', 'dark:hover:bg-red-500', 'text-white', 'dark:text-white');
                }, { once: true });
            } else if (deleteBtn.dataset.state === 'confirm') {
                this.style.display = 'none';
                updateCachedData<TaskResponseDTO>('/api/tasks', oldTasks => oldTasks.filter(t => t.id !== task.id));
                const container = this.parentElement;
                try {
                    const response = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
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

        if (task.completed) {
            wrapper?.classList.add('opacity-75');
            statusIcon?.classList.replace('border-2', 'bg-green-500');
            statusIcon?.classList.replace('border-gray-400', 'border-transparent');
            if (statusIcon) statusIcon.innerHTML = '<span class="text-white text-sm font-bold">✓</span>';
            content?.classList.add('line-through', 'text-gray-400', 'dark:text-gray-500');
            editBtn.disabled = true;
            editBtn.classList.add('opacity-50', 'cursor-not-allowed');
            editBtn.classList.remove('hover:bg-blue-200', 'dark:hover:bg-blue-900/30');
            editBtn.classList.remove('text-blue-600', 'dark:text-indigo-400');
            editBtn.classList.add('text-gray-300', 'dark:text-gray-600');
            dateEl?.setAttribute('color', 'green');
            infoBtn?.classList.add('invisible');
        } else {
            editBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            editBtn.classList.add('hover:bg-blue-200', 'dark:hover:bg-blue-900/30');
            editBtn.disabled = false;
            infoBtn?.classList.remove('invisible');
        }

        editBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('task-edit', { bubbles: true, composed: true, detail: { taskElement: this, task: task } }));
        });

        infoBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('task-info', { bubbles: true, composed: true, detail: task }));
        })

        if (task.categories && categoryTemplate && categoryContainer) {
            task.categories.forEach(cat => {
                const clone = categoryTemplate.content.cloneNode(true) as DocumentFragment;
                const span = clone.querySelector('span');
                if (span) span.textContent = cat.title ?? '';
                categoryContainer.appendChild(clone);
            });
        }

        if (task.tags && tagTemplate && tagsContainer) {
            task.tags.forEach(tag => {
                const clone = tagTemplate.content.cloneNode(true) as DocumentFragment;
                const span = clone.querySelector('span');
                if (span) span.textContent = `#${tag.name}`;
                tagsContainer.appendChild(clone);
            });
        }
    }
}
customElements.define('task-item', TaskItem);