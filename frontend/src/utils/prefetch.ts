import { prefetchCache } from "./store";

interface PrefetchOptions {
    timeout?: number;
    once?: boolean;
    checkNetwork?: boolean;
    onSuccess?: (url: string, data: any) => void;
}

export function setupPrefetch(
    element: HTMLElement,
    urls: string | string[],
    options: PrefetchOptions = {}
) {
    const { timeout = 150, once = true, checkNetwork = true, onSuccess } = options;
    let timer: number | null = null;
    let hasPrefetched = false;

    const canPrefetch = () => {
        if (!checkNetwork) return true;

        const conn = (navigator as any).connection;
        if (conn) {
            if (conn.saveData) return false;

            const slowConnections = ['adaptive', '2g', 'slow-2g', '3g'];
            if (slowConnections.includes(conn.effectiveType)) return false;
        }
        return true;
    };

    const startPrefetch = () => {
        if (once && hasPrefetched) return;
        if (!canPrefetch()) return;

        timer = window.setTimeout(() => {
            hasPrefetched = true;
            const urlList = Array.isArray(urls) ? urls : [urls];
            urlList.forEach(async (url) => {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json().catch(() => ({}));
                        prefetchCache.set(url, data);
                        if (onSuccess) onSuccess(url, data);
                    }
                } catch (err) {
                    console.error(`[Prefetch] Error en ${url}:`, err);
                }
            });
        }, timeout);
    };

    const cancelPrefetch = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    element.addEventListener('mouseenter', startPrefetch);
    element.addEventListener('mouseleave', cancelPrefetch);
    element.addEventListener('focus', startPrefetch);
    element.addEventListener('blur', cancelPrefetch);

    return () => {
        element.removeEventListener('mouseenter', startPrefetch);
        element.removeEventListener('mouseleave', cancelPrefetch);
        element.removeEventListener('focus', startPrefetch);
        element.removeEventListener('blur', cancelPrefetch);
    };
}