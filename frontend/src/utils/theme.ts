/**
 * Sincroniza un elemento del Shadow DOM con el tema global de la aplicación.
 * @param wrapperElement El elemento contenedor dentro del Shadow DOM (ej: #theme-wrapper)
 * @returns El MutationObserver creado (para poder desconectarlo después)
 */
export function syncThemeWithObserver(wrapperElement: HTMLElement | null | undefined): MutationObserver | null {
    if (!wrapperElement) return null;

    const syncTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            wrapperElement.classList.add('dark');
        } else {
            wrapperElement.classList.remove('dark');
        }
    };

    // Sincronización inicial
    syncTheme();

    // Crear y arrancar el observador
    const observer = new MutationObserver(() => syncTheme());
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    return observer;
}