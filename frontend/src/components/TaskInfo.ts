import html from './html/TaskInfo.html?raw';
import type { TaskResponseDTO } from '../types/api-types';
import { updateCachedData } from '../utils/store';

export class TaskInfo extends HTMLElement {
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

        if (task.completed) {
            wrapper?.classList.add('opacity-75');
            statusIcon?.classList.replace('border-2', 'bg-green-500');
            statusIcon?.classList.replace('border-gray-400', 'border-transparent');
            if (statusIcon) statusIcon.innerHTML = '<span class="text-white text-sm font-bold">✓</span>';
            content?.classList.add('line-through', 'text-gray-400', 'dark:text-gray-500');
            dateEl?.setAttribute('color', 'green');
        }

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
customElements.define('task-info', TaskInfo);