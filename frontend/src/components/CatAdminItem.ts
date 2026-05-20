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

            let count = 0;
            try {
                const countRes = await fetch(`/api/admin/categories/${this._cat.id}/tasks/count`);
                if (countRes.ok) {
                    count = await countRes.json();
                }
            } catch (err) {
                console.error('Error al comprobar el uso de la categoría:', err);
            }

            const confirmed = await this.showConfirmModal(count);
            if (!confirmed) return;

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

    private showConfirmModal(count: number): Promise<boolean> {
        return new Promise((resolve) => {
            const rootNode = this.getRootNode() as ShadowRoot | Document;
            
            // Create backdrop overlay with transition animation start state (opacity-0)
            const backdrop = document.createElement('div');
            backdrop.className = 'fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300 opacity-0';
            
            const message = count > 0 
                ? `Esta categoría está siendo usada por <strong class="text-blue-600 dark:text-indigo-400 font-semibold">${count} tareas</strong>. ¿Estás seguro de que deseas borrarla? <span class="block text-xs text-gray-400 dark:text-gray-500 mt-2 font-normal">Las tareas no se eliminarán.</span>`
                : `¿Estás seguro de que deseas borrar la categoría <strong class="text-blue-600 dark:text-indigo-400 font-semibold">"${this._cat.title}"</strong>? <span class="block text-xs text-gray-400 dark:text-gray-500 mt-2 font-normal">Esta acción no se puede deshacer.</span>`;

            // Create beautiful card structure with transition animation start state (scale-95 opacity-0)
            backdrop.innerHTML = `
                <div class="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl p-6 max-w-sm w-full transform scale-95 opacity-0 transition-all duration-300 flex flex-col items-center">
                    <div class="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-indigo-400 mb-4 animate-pulse">
                        <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    
                    <h3 class="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Eliminar Categoría</h3>
                    
                    <p class="text-sm text-center text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-normal">
                        ${message}
                    </p>
                    
                    <div class="flex gap-3 justify-center w-full">
                        <button type="button" class="btn-cancel w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer text-center border-0">
                            Cancelar
                        </button>
                        <button type="button" class="btn-confirm w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer text-center border-0">
                            Eliminar
                        </button>
                    </div>
                </div>
            `;
            
            // Append inside theme-wrapper so dark mode classes apply correctly, or fallback to rootNode
            const themeWrapper = rootNode.getElementById('theme-wrapper');
            if (themeWrapper) {
                themeWrapper.appendChild(backdrop);
            } else {
                rootNode.appendChild(backdrop);
            }
            
            const card = backdrop.firstElementChild as HTMLElement;
            
            // Trigger animation in next tick
            requestAnimationFrame(() => {
                backdrop.classList.replace('opacity-0', 'opacity-100');
                card.classList.replace('scale-95', 'scale-100');
                card.classList.replace('opacity-0', 'opacity-100');
            });

            // Remove scale/transform properties once the entry transition ends to prevent sub-pixel rendering blurriness
            card.addEventListener('transitionend', (e) => {
                if (e.target === card && (e.propertyName === 'transform' || e.propertyName === 'scale')) {
                    card.classList.remove('scale-100', 'transform');
                }
            }, { once: true });
            
            const cleanup = (confirmed: boolean) => {
                // Re-add scale/transform classes to allow the exit animation to trigger correctly
                card.classList.add('transform', 'scale-100');
                
                requestAnimationFrame(() => {
                    backdrop.classList.replace('opacity-100', 'opacity-0');
                    card.classList.replace('scale-100', 'scale-95');
                    card.classList.replace('opacity-100', 'opacity-0');
                });
                
                setTimeout(() => {
                    backdrop.remove();
                    resolve(confirmed);
                }, 300);
            };
            
            backdrop.querySelector('.btn-cancel')!.addEventListener('click', () => cleanup(false));
            backdrop.querySelector('.btn-confirm')!.addEventListener('click', () => cleanup(true));
            
            // Dismiss on backdrop click
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    cleanup(false);
                }
            });
            
            // Dismiss on escape key
            const handleKeydown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    cleanup(false);
                    document.removeEventListener('keydown', handleKeydown);
                }
            };
            document.addEventListener('keydown', handleKeydown);
        });
    }
}

customElements.define('cat-admin-item', CatAdminItem);