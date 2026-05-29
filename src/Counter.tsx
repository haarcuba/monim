import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { SetButton } from '@/SetButton';
import { EditableName } from '@/EditableName';

export interface Changes {
    name?: string;
    count?: number;
}

type OnChange = (changes: { id: string } & Changes) => void;

export interface Props {
    id: string;
    name: string;
    count: number;
    isOwner?: boolean;
    sharedBy?: string;
    history?: CounterHistoryEntry[];
    onChange?: OnChange;
    onShare?: () => void;
    debounceMS?: number;
}

export interface CounterHistoryEntry {
    operation: 'increment' | 'decrement' | 'set';
    value: number;
    timestampMs: number;
}

export function Counter({
    id,
    name,
    count,
    isOwner = true,
    sharedBy,
    history = [],
    onChange,
    onShare,
    debounceMS = 300,
}: Props) {
    const [showHistory, setShowHistory] = useState(false);
    const sortedHistory = [...history].sort((a, b) => b.timestampMs - a.timestampMs);

    const debouncedOnChange = useDebouncedCallback(
        (changes: { name?: string; count?: number }) => onChange?.({ id, ...changes }),
        debounceMS
    );

    return (
        <div>
            <EditableName
                name={name}
                onChange={(newName) => debouncedOnChange({ name: newName })}
            />
            {name !== '' && (
                <>
                    {isOwner && _OwnerControls1(id, count, onChange)}
                    <div data-testid="counter">{count}</div>
                    {isOwner && _OwnerControls2(id, count, onChange, onShare)}
                    <button onClick={() => setShowHistory((v) => !v)}>
                        {showHistory ? 'Hide History' : 'View History'}
                    </button>
                    {showHistory && <HistoryTable history={sortedHistory} />}
                    {sharedBy && <small data-testid="shared-by">{sharedBy}</small>}
                </>
            )}
        </div>
    );
}

function HistoryTable({ history }: { history: CounterHistoryEntry[] }) {
    return (
        <table data-testid="history-table">
            <thead>
                <tr>
                    <th>Value</th>
                    <th>Timestamp (relative)</th>
                    <th>Timestamp (full)</th>
                </tr>
            </thead>
            <tbody>
                {history.map((entry, i) => (
                    <tr key={`${entry.timestampMs}-${entry.operation}-${i}`}>
                        <td>{entry.value}</td>
                        <td>{formatRelativeTime(entry.timestampMs)}</td>
                        <td>{formatFullDateTime(entry.timestampMs)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function formatRelativeTime(timestampMs: number, nowMs = Date.now()) {
    const deltaSeconds = Math.round((timestampMs - nowMs) / 1000);
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    const absoluteSeconds = Math.abs(deltaSeconds);
    if (absoluteSeconds < 60) return formatter.format(deltaSeconds, 'second');
    if (absoluteSeconds < 3600) return formatter.format(Math.round(deltaSeconds / 60), 'minute');
    if (absoluteSeconds < 86400) return formatter.format(Math.round(deltaSeconds / 3600), 'hour');
    return formatter.format(Math.round(deltaSeconds / 86400), 'day');
}

function formatFullDateTime(timestampMs: number) {
    const d = new Date(timestampMs);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function _OwnerControls1(id: string, count: number, onChange?: OnChange) {
    return (
        <>
            <button onClick={() => onChange?.({ id, count: count - 1 })}>dec</button>
        </>
    );
}

function _OwnerControls2(id: string, count: number, onChange?: OnChange, onShare?: () => void) {
    return (
        <>
            <button onClick={() => onChange?.({ id, count: count + 1 })}>inc</button>
            <SetButton onSet={(v) => onChange?.({ id, count: v })} parse={Number} value={count} />
            <button data-testid="share-button" onClick={onShare}>
                sharing...
            </button>
        </>
    );
}
