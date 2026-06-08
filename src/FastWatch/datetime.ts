export function formatDatetimeLocal(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTime(totalSeconds: number): string {
    const secondsElapsed = Math.floor(totalSeconds);
    const days = Math.floor(secondsElapsed / 86400);
    const hours = Math.floor((secondsElapsed % 86400) / 3600);
    const minutes = Math.floor((secondsElapsed % 3600) / 60);
    const seconds = secondsElapsed % 60;
    const formattedHHMMss = [hours, minutes, seconds]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
    return days > 0 ? `${days}d ${formattedHHMMss}` : formattedHHMMss;
}
