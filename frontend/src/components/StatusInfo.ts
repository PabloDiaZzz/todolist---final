export class StatusInfo extends HTMLElement {
    static get observedAttributes() {
        return ['type', 'text', 'color'];
    }

    private badge: HTMLSpanElement;

    constructor() {
        super();
        this.badge = document.createElement('span');
        this.appendChild(this.badge);
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    private render() {
        const type = this.getAttribute('type') || 'custom';
        
        let text = '';
        let color = '';

        const stateMap: Record<string, { text: string, color: string }> = {
            completada: { text: 'Completada', color: 'green' },
            pendiente: { text: 'Pendiente', color: 'yellow' },
            vencida: { text: 'Vencida', color: 'red' }
        };

        if (stateMap[type]) {
            text = stateMap[type].text;
            color = stateMap[type].color;
        } else {
            text = this.getAttribute('text') || '';
            color = this.getAttribute('color') || 'gray'; 
        }

        this.badge.textContent = text;

        const baseClasses = 'px-2 py-0.5 rounded-2xl text-sm font-semibold inline-block transition-colors';

        // 1. Dividimos el mapa en 'light' y 'dark' para poder combinarlos dinámicamente
        const colorMap: Record<string, { light: string, dark: string }> = {
            green: { light: 'bg-green-200 text-green-600', dark: 'dark:bg-green-800/50 dark:text-green-400' },
            yellow: { light: 'bg-yellow-200 text-yellow-600', dark: 'dark:bg-yellow-800/50 dark:text-yellow-400' },
            red: { light: 'bg-red-200 text-red-600', dark: 'dark:bg-red-800/50 dark:text-red-400' },
            blue: { light: 'bg-blue-200 text-blue-600', dark: 'dark:bg-blue-800/50 dark:text-blue-400' },
            gray: { light: 'bg-gray-200 text-gray-600', dark: 'dark:bg-gray-800/50 dark:text-gray-400' },
            purple: { light: 'bg-purple-200 text-purple-600', dark: 'dark:bg-purple-800/50 dark:text-purple-400' },
            pink: { light: 'bg-pink-200 text-pink-600', dark: 'dark:bg-pink-800/50 dark:text-pink-400' },
            orange: { light: 'bg-orange-200 text-orange-600', dark: 'dark:bg-orange-800/50 dark:text-orange-400' },
            brown: { light: 'bg-brown-200 text-brown-600', dark: 'dark:bg-brown-800/50 dark:text-brown-400' },
            indigo: { light: 'bg-indigo-200 text-indigo-600', dark: 'dark:bg-indigo-800/50 dark:text-indigo-400' },
            cyan: { light: 'bg-cyan-200 text-cyan-600', dark: 'dark:bg-cyan-800/50 dark:text-cyan-400' },
            lime: { light: 'bg-lime-200 text-lime-600', dark: 'dark:bg-lime-800/50 dark:text-lime-400' },
            teal: { light: 'bg-teal-200 text-teal-600', dark: 'dark:bg-teal-800/50 dark:text-teal-400' },
            fuchsia: { light: 'bg-fuchsia-200 text-fuchsia-600', dark: 'dark:bg-fuchsia-800/50 dark:text-fuchsia-400' },
            slate: { light: 'bg-slate-200 text-slate-600', dark: 'dark:bg-slate-800/50 dark:text-slate-400' },
            emerald: { light: 'bg-emerald-200 text-emerald-600', dark: 'dark:bg-emerald-800/50 dark:text-emerald-400' }
        };

        let appliedColor = '';
        
        // 2. Separamos el string de color por espacios
        const colorParts = color.trim().split(/\s+/);

        if (colorParts.length === 1 && colorMap[colorParts[0]]) {
            // Caso A: Un solo color válido (ej: "green") -> Usamos su light y su dark
            appliedColor = `${colorMap[colorParts[0]].light} ${colorMap[colorParts[0]].dark}`;
        } else if (colorParts.length === 2 && colorMap[colorParts[0]] && colorMap[colorParts[1]]) {
            // Caso B: Dos colores válidos (ej: "gray blue") -> Light del primero, Dark del segundo
            appliedColor = `${colorMap[colorParts[0]].light} ${colorMap[colorParts[1]].dark}`;
        } else {
            // Caso C: No coincide con el diccionario, se asume que son clases de Tailwind puras
            appliedColor = color;
        }

        this.badge.className = `${baseClasses} ${appliedColor}`;
    }
}

customElements.define('status-info', StatusInfo);