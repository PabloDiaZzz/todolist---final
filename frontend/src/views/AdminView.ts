import html from './html/AdminView.html?raw';
import style from '../style.css?inline';
import type { Category, TaskResponseDTO, UsuarioDTO } from '../types/api-types';
import '../components/UserAdminItem';
import '../components/CatAdminItem';
import type { UserAdminItem } from '../components/UserAdminItem';
import type { CatAdminItem } from '../components/CatAdminItem';
import isEqual from 'lodash/isEqual';

export class AdminView extends HTMLElement {

    private me!: UsuarioDTO;
    private cats: Category[] = [];
    private todos: TaskResponseDTO[] = [];
    private users: UsuarioDTO[] = [];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(style);
        this.shadowRoot!.adoptedStyleSheets = [sheet];
        this.shadowRoot!.innerHTML = html;
        const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper')

        const syncTheme = () => {
            const isDark = document.documentElement.classList.contains('dark')
            if (isDark) {
                themeWrapper?.classList.add('dark')
            } else {
                themeWrapper?.classList.remove('dark')
            }
        }

        syncTheme()

        const observer = new MutationObserver(() => syncTheme())
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        })

        this.setupEvents()
    }
    async setupEvents() {
        const root = this.shadowRoot!
        const userName = root.getElementById('user-name')!
        const buscarCatContainer = root.getElementById('buscar-cat-container') as HTMLDivElement;
        const buscarCatInput = root.getElementById('buscar-cat-input') as HTMLInputElement
        const createCatForm = root.getElementById('create-cat-form') as HTMLFormElement

        await Promise.all([
            fetch('/api/user/me').then(res => res.json()),
            fetch('/api/cats').then(res => res.json()),
            fetch('/api/admin/tasks').then(res => res.json()),
            fetch('/api/admin/users').then(res => res.json())
        ]).then(([user, cats, tasks, users]) => {
            this.me = user;
            this.users = users;
            this.cats = cats;
            this.todos = tasks;

            userName.textContent = user.fullName ?? '';
        });

        this.displayTasks();
        this.displayUsers();
        this.displayCats();

        root.addEventListener('user-promoted', () => this.setupEvents());
        root.addEventListener('cat-deleted', () => this.setupEvents());

        root.addEventListener('click', (e)=> {
            if (buscarCatContainer.contains(e.target as Node)) {
                buscarCatContainer.dataset.active = 'true';
            } else {
                buscarCatContainer.dataset.active = 'false';
            }
        })

        const logoutForm = root.getElementById('logout-form') as HTMLFormElement
        if (logoutForm) {
            logoutForm.addEventListener('submit', async (e) => {
                e.preventDefault()
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/login'
            })
        }

        buscarCatInput.addEventListener('input', () => {
            const searchValue = buscarCatInput.value.toLowerCase();
            const filteredCats = this.cats.filter(cat => cat.title.toLowerCase().includes(searchValue));
            this.displayCats(filteredCats);
        })

        createCatForm.onsubmit = async (e) => {
            e.preventDefault()
            const formData = new FormData(createCatForm)
            const title = formData.get('title') as string
            await fetch('/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            })
            createCatForm.reset()
            this.loadData();
        }
    }

    private displayCats(cats: Category[] = this.cats) {
        const catsContainer = this.shadowRoot!.querySelector('.cats-list') as HTMLUListElement
        catsContainer.innerHTML = '';
        cats = [...cats].sort((a: Category, b: Category) => a.title.localeCompare(b.title))
        const noCats = this.shadowRoot!.getElementById('no-cats') as HTMLDivElement
        if (cats.length === 0) {
            noCats.classList.add('flex')
            noCats.classList.remove('hidden')
        } else {
            noCats.classList.remove('flex')
            noCats.classList.add('hidden')
        }
        cats.forEach(cat => {
            const li = document.createElement('cat-admin-item') as CatAdminItem;
            li.cat = cat
            catsContainer.appendChild(li)
        })
    }

    private displayTasks() {

    }

    private displayUsers() {
        const usersContainer = this.shadowRoot!.querySelector('.users-list') as HTMLUListElement
        usersContainer.innerHTML = '';
        const users = this.users.filter(user => !isEqual(user, this.me));
        if (users.length === 0) {
            const noUsers = this.shadowRoot!.getElementById('no-users') as HTMLDivElement
            noUsers.classList.add('flex')
            noUsers.classList.remove('hidden')
        }
        users.forEach(user => {
            const li = document.createElement('user-admin-item') as UserAdminItem;
            li.user = user
            usersContainer.appendChild(li)
        })
    }
    
    private async loadData() {
        const userName = this.shadowRoot!.getElementById('user-name')!
        await Promise.all([
            fetch('/api/user/me').then(res => res.json()),
            fetch('/api/cats').then(res => res.json()),
            fetch('/api/admin/tasks').then(res => res.json()),
            fetch('/api/admin/users').then(res => res.json())
        ]).then(([user, cats, tasks, users]) => {
            this.me = user;
            this.users = users;
            this.cats = cats;
            this.todos = tasks;

            userName.textContent = user.fullName ?? '';
        });

        this.displayTasks();
        this.displayUsers();
        this.displayCats();
    }
}
customElements.define('admin-view', AdminView);