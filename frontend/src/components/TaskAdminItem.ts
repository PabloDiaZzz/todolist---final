import html from './html/TaskAdminItem.html?raw';
import type { TaskUserDTO } from '../types/api-types';

export class TaskAdminItem extends HTMLElement {
    private _taskUser!: TaskUserDTO;

    set taskUser(data: TaskUserDTO) {
        this._taskUser = data;
        this.render();
    }

    get taskUser(): TaskUserDTO {
        return this._taskUser;
    }

    private render() {
        this.innerHTML = html;
        if (!this._taskUser || !this._taskUser.task || !this._taskUser.author) return;

        const titleBtn = this.querySelector('.task-title-btn') as HTMLButtonElement;
        const authorText = this.querySelector('.author-text') as HTMLParagraphElement;

        const task = this._taskUser.task;
        const author = this._taskUser.author;

        titleBtn.textContent = task.title ?? '';
        
        if (author.fullName) {
            authorText.textContent = `Autor: ${author.fullName} (@${author.username})`;
        } else {
            authorText.textContent = `Autor: @${author.username}`;
        }

        titleBtn.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('task-info', { bubbles: true, composed: true, detail: task }));
        });
    }
}

customElements.define('task-admin-item', TaskAdminItem);
