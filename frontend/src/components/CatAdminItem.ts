import html from './html/CatAdminItem.html?raw';
import type { Category } from '../types/api-types';
import { updateCachedData } from '../utils/store';

export class CatAdminItem extends HTMLElement {
    private _cat!: Category;

    set cat(data: Category) {
        this._cat = data;
        this.render();
    }

    get cat(): Category {
        return this._cat;
    }

    private render() {
        this.innerHTML = html;

        const catTitle = this.querySelector('.cat-title')!;
        const form = this.querySelector('.delete-cat-form') as HTMLFormElement;

        catTitle.textContent = this._cat.title ?? '';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.style.display = 'none';
            updateCachedData<Category>('/api/cats', oldCats => oldCats.filter(c => c.id !== this._cat.id));
            this.dispatchEvent(new CustomEvent('sync-memory', { bubbles: true, composed: true }));

            const container = this.parentElement;
            const noCatsBanner = container?.parentElement?.querySelector('#no-cats');

            if (container && noCatsBanner) {
                const visibleItems = Array.from(container.children).filter(el => (el as HTMLElement).style.display !== 'none');
                if (visibleItems.length === 0) {
                    noCatsBanner.classList.replace('hidden', 'flex');
                }
            }

            try {
                const response = await fetch(`/api/admin/categories/${this._cat.id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Error al borrar');
                this.remove();

            } catch (error) {
                console.error('Error al borrar la categoría:', error);
                this.style.display = '';
                updateCachedData<Category>('/api/cats', oldCats => [...oldCats, this._cat]);
                this.dispatchEvent(new CustomEvent('sync-memory', { bubbles: true, composed: true }));
                alert('Error de conexión al borrar la categoría.');
            }
        });
    }
}

customElements.define('cat-admin-item', CatAdminItem);