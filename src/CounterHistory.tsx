import type { Timestamp } from 'firebase/firestore';
import { useCounterHistory } from '@/useCounterHistory';

interface Props {
    counterId: string;
    ownerUid: string;
    counterName: string;
    onBack: () => void;
}

export function CounterHistory({ counterId, ownerUid, counterName, onBack }: Props) {
    const entries = useCounterHistory(ownerUid, counterId);

    return (
        <div className="history-view">
            <button data-testid="back-button" className="btn-ghost" onClick={onBack}>
                ← Back
            </button>
            <h2>{counterName} — history</h2>
            <table className="history-table">
                <thead>
                    <tr>
                        <th>Op</th>
                        <th>Value</th>
                        <th>When</th>
                        <th>Date / Time</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((e) => (
                        <tr key={e.id}>
                            <td data-testid="history-op">{e.operation}</td>
                            <td data-testid="history-value">{e.value}</td>
                            <td data-testid="history-relative">{_relativeTime(e.timestamp)}</td>
                            <td data-testid="history-full">
                                <code>{_fullTime(e.timestamp)}</code>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function _relativeTime(timestamp: Timestamp | null): string {
    if (!timestamp) return '—';
    const diffMs = timestamp.toMillis() - Date.now();
    const absDiffMs = Math.abs(diffMs);

    const units: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
        { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
        { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
        { unit: 'day', ms: 24 * 60 * 60 * 1000 },
        { unit: 'hour', ms: 60 * 60 * 1000 },
        { unit: 'minute', ms: 60 * 1000 },
        { unit: 'second', ms: 1000 },
    ];

    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    for (const { unit, ms } of units) {
        if (absDiffMs >= ms) {
            return rtf.format(Math.round(diffMs / ms), unit);
        }
    }
    return rtf.format(0, 'second');
}

function _fullTime(timestamp: Timestamp | null): string {
    if (!timestamp) return '—';
    const date = timestamp.toDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
}
