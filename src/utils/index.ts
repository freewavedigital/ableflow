export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export function nanoid(length = 8): string {
    return Math.random().toString(36).slice(2, 2 + length);
}