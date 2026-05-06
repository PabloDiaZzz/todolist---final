import html from './html/CatAdminItem.html?raw';
import style from '../style.css?inline';
import type { Category } from '../types/api-types';

export class CatAdminItem extends HTMLElement {
    private _cat!: Category;

    set cat(data: Category) {
        this._cat = data;
        this.render();
    }

    private render() {
        this.innerHTML = html;

        const catTitle = this.querySelector('.cat-title')!;
        const form = this.querySelector('.delete-cat-form') as HTMLFormElement;

        catTitle.textContent = this._cat.title ?? '';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const response = await fetch(`/api/admin/categories/${this._cat.id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    this.dispatchEvent(new CustomEvent('cat-deleted', { bubbles: true, composed: true }));
                }
            } catch (error) {
                console.error('Error al borrar la categoría:', error);
            }
        });
    }
}

customElements.define('cat-admin-item', CatAdminItem);