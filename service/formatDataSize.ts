export default function formatDataSize(num: number){
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unit = 0;
    while(num >= 1024 && unit < units.length - 1) {
        num /= 1024;
        unit++;
    }
    return `${num.toFixed(2)}${units[unit]}`;
}