export const prefetchCache = new Map<string, any>();

if (import.meta.env.DEV) (window as any).appCache = prefetchCache;

export function updateCachedData<T>(
    key: string,
    updater: (oldData: T[]) => T[]
): T[] {
    const cachedData = (prefetchCache.get(key) as T[]) || [];

    const newData = updater(cachedData);

    prefetchCache.set(key, newData);
    return newData;
}