
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

    
    syncTheme();

    
    const observer = new MutationObserver(() => syncTheme());
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    return observer;
}