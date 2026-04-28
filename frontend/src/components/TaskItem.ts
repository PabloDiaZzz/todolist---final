import html from './html/TaskItem.html?raw';
import type { TaskResponseDTO as Task } from '../types/api-types';

export class TaskItem extends HTMLElement {
    private _task!: Task;

    set task(data: Task) {
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
        else dateEl!.textContent = deadline.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (deadline && Date.now() > deadline.getTime()) {
            dateEl?.classList.add('text-red-600', 'dark:text-red-400', 'bg-red-200', 'dark:bg-red-800/50');
            dateEl?.classList.remove('text-yellow-600', 'dark:text-yellow-400', 'bg-yellow-200', 'dark:bg-yellow-800/50');
        } else if (deadline) {
            dateEl?.classList.add('text-yellow-600', 'dark:text-yellow-400', 'bg-yellow-200', 'dark:bg-yellow-800/50');
            dateEl?.classList.remove('text-red-600', 'dark:text-red-400', 'bg-red-200', 'dark:bg-red-800/50');
        }

        const wrapper = this.querySelector('.task-wrapper');
        const statusIcon = this.querySelector('.status-icon');
        const content = this.querySelector('.task-content');
        const tagsContainer = this.querySelector('.tags-container');
        const categoryContainer = this.querySelector('.category-container');
        const deleteBtn = this.querySelector('.delete-btn') as HTMLButtonElement;
        const editBtn = this.querySelector('.edit-btn') as HTMLButtonElement;

        const toggleBtn = this.querySelector('.toggle-btn');
        toggleBtn?.addEventListener('click', async () => {
            await fetch(`/api/tasks/${task.id}/toggle`, { method: 'PATCH' });
            this.dispatchEvent(new CustomEvent('task-updated', { bubbles: true, composed: true }));
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
                })
            } else if (deleteBtn.dataset.state === 'confirm') {
                await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
                this.dispatchEvent(new CustomEvent('task-updated', { bubbles: true, composed: true }));
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
            dateEl?.classList.remove('text-red-600', 'dark:text-red-400', 'bg-red-200', 'dark:bg-red-800/50');
            dateEl?.classList.remove('text-yellow-600', 'dark:text-yellow-400', 'bg-yellow-200', 'dark:bg-yellow-800/50');
            dateEl?.classList.add('text-green-600', 'dark:text-green-400', 'bg-green-200', 'dark:bg-green-800/50');
        } else {
            editBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            editBtn.classList.add('hover:bg-blue-200', 'dark:hover:bg-blue-900/30');
            editBtn.disabled = false;
        }

        editBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('task-edit', { bubbles: true, composed: true, detail: task }));
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