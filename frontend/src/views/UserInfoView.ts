import style from "../style.css?inline";
import html from "./html/UserInfoView.html?raw";
import type { TaskResponseDTO, UserTasksDTO, UsuarioDTO } from "../types/api-types";
import { syncThemeWithObserver } from "../utils/theme";

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
    }
}

customElements.define("user-info-view", UserInfoView);
