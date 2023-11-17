export default function formatString(str: string, args: Record<string, string>): string {
    return str.replace(/{(\w+)}/g, (_, key) => args[key] || '');
}