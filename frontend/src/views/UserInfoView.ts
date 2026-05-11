import style from "../style.css?inline";
import html from "./html/UserInfoView.html?raw";
import type { TaskResponseDTO, UserTasksDTO, UsuarioDTO } from "../types/api-types";
import { syncThemeWithObserver } from "../utils/theme";
import { authService } from "../services/AuthService";
import { setupPrefetch } from "../utils/prefetch";

export default class UserInfoView extends HTMLElement {
    private themeObserver: MutationObserver | null = null;
    private tasks: TaskResponseDTO[] = [];
    private user!: UsuarioDTO;

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    set data(userTasks: UserTasksDTO) {
        this.user = userTasks.user!;
        this.tasks = userTasks.tasks || [];
        this.render();
    }

    connectedCallback() {
        const sheet = new CSSStyleSheet()
        sheet.replaceSync(style)
        this.shadowRoot!.adoptedStyleSheets = [sheet]
    }

    disconnectedCallback() {
        if (this.themeObserver) {
            this.themeObserver.disconnect();
        }
    }

    render() {
        this.shadowRoot!.innerHTML = html

        const themeWrapper = this.shadowRoot!.getElementById('theme-wrapper');
        this.themeObserver = syncThemeWithObserver(themeWrapper);

        console.log(this.user)
        console.log(this.tasks)

        const userName = this.shadowRoot!.getElementById("user-name");
        const userInfoTitle = this.shadowRoot!.getElementById("user-info-title");
        const userInfoFullname = this.shadowRoot!.getElementById("user-info-fullname");
        const adminBtn = this.shadowRoot!.getElementById("admin-button");

        userName!.textContent = authService.getUser()?.fullName ?? ''
        userInfoTitle!.textContent = `${this.user.username}`
        userInfoFullname!.textContent = `${this.user.fullName}`

        adminBtn!.onclick = () => {
            window.navigate('/admin')
        }

        if (adminBtn) {
            const urlsPrefetch = [
                '/api/admin/tasks',
                '/api/admin/users',
                '/api/cats'
            ]
            setupPrefetch(adminBtn, urlsPrefetch, {
                timeout: 150,
                once: true,
                checkNetwork: true,
            })
        }
    }
}

customElements.define("user-info-view", UserInfoView);
