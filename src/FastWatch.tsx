import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Timestamp } from 'firebase/firestore';
import * as CommonButtons from '@/CommonButtons';
import { EditableName } from '@/EditableName';

export interface Props {
    id: string;
    name: string;
    targetSeconds: number;
    startedAt: Timestamp | null;
    isOwner?: boolean;
    sharedBy?: string;
    onRename?: (name: string) => void;
    onReset?: () => void;
    onDelete?: () => void;
    onShare?: () => void;
    onSetTarget?: (seconds: number) => void;
    onSetStart?: (startedAt: Timestamp) => void;
    debounceMS?: number;
}

function _formatDatetimeLocal(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function _formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export function FastWatch({
    name,
    targetSeconds,
    startedAt,
    isOwner = true,
    sharedBy,
    onRename,
    onReset,
    onDelete,
    onShare,
    onSetTarget,
    onSetStart,
    debounceMS = 300,
}: Props) {
    const debouncedOnRename = useDebouncedCallback(
        (newName: string) => onRename?.(newName),
        debounceMS
    );
    const [now, setNow] = useState(() => Date.now());
    const [targetEditing, setTargetEditing] = useState(false);
    const [targetInput, setTargetInput] = useState('');
    const [startEditing, setStartEditing] = useState(false);
    const [startInput, setStartInput] = useState('');

    const running = startedAt !== null;

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [running]);

    const currentElapsed = running ? (now - startedAt!.toMillis()) / 1000 : 0;
    const reached = currentElapsed >= targetSeconds;

    function commitStart() {
        const ms = new Date(startInput).getTime();
        if (!isNaN(ms)) {
            onSetStart?.(Timestamp.fromMillis(ms));
        }
        setStartEditing(false);
    }

    function commitTarget() {
        const hours = parseFloat(targetInput);
        if (!isNaN(hours) && hours > 0) {
            onSetTarget?.(Math.round(hours * 3600));
        }
        setTargetEditing(false);
    }

    return (
        <div className={`fastwatch-card${reached ? ' fastwatch-reached' : ''}`}>
            {_Name(name, isOwner, debouncedOnRename)}
            {_TimeRow(
                currentElapsed,
                targetSeconds,
                isOwner,
                targetEditing,
                targetInput,
                setTargetInput,
                setTargetEditing,
                commitTarget
            )}
            {isOwner && _Controls(onReset, startEditing, startInput, setStartInput, setStartEditing, commitStart, startedAt)}
            {_Actions(isOwner, onShare, onDelete, sharedBy)}
        </div>
    );
}

function _TimeRow(
    currentElapsed: number,
    targetSeconds: number,
    isOwner: boolean,
    targetEditing: boolean,
    targetInput: string,
    setTargetInput: (v: string) => void,
    setTargetEditing: (v: boolean) => void,
    commitTarget: () => void
) {
    return (
        <div className="fastwatch-time-row">
            <span data-testid="elapsed-display" className="fastwatch-time">
                {_formatTime(currentElapsed)}
            </span>
            <span className="fastwatch-separator">/</span>
            <span data-testid="target-display" className="fastwatch-target">
                {_formatTime(targetSeconds)}
            </span>
            {isOwner && !targetEditing && (
                <button
                    data-testid="set-target-button"
                    className="btn-ghost btn-icon"
                    aria-label="Set target"
                    onClick={() => {
                        setTargetInput(String(targetSeconds / 3600));
                        setTargetEditing(true);
                    }}
                >
                    ✎
                </button>
            )}
            {targetEditing && (
                <input
                    data-testid="set-target-input"
                    className="fastwatch-target-input"
                    value={targetInput}
                    autoFocus
                    onChange={(e) => setTargetInput(e.target.value)}
                    onBlur={commitTarget}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') commitTarget();
                    }}
                />
            )}
        </div>
    );
}

function _Controls(
    onReset?: () => void,
    startEditing?: boolean,
    startInput?: string,
    setStartInput?: (v: string) => void,
    setStartEditing?: (v: boolean) => void,
    commitStart?: () => void,
    startedAt?: Timestamp | null
) {
    return (
        <div className="fastwatch-controls">
            <button data-testid="reset-button" className="btn-ghost" onClick={onReset}>
                Reset
            </button>
            {!startEditing && (
                <button
                    data-testid="set-start-button"
                    className="btn-ghost btn-icon"
                    aria-label="Set start time"
                    onClick={() => {
                        if (startedAt) setStartInput?.(_formatDatetimeLocal(startedAt.toMillis()));
                        setStartEditing?.(true);
                    }}
                >
                    ✎
                </button>
            )}
            {startEditing && (
                <input
                    data-testid="set-start-input"
                    type="datetime-local"
                    className="fastwatch-start-input"
                    value={startInput}
                    autoFocus
                    onChange={(e) => setStartInput?.(e.target.value)}
                    onBlur={commitStart}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') commitStart?.();
                    }}
                />
            )}
        </div>
    );
}

function _Name(name: string, isOwner: boolean, onRename: (name: string) => void) {
    if (isOwner) {
        return <EditableName name={name} onChange={onRename} />;
    }
    return <div className="fastwatch-name">{name}</div>;
}

function _Actions(
    isOwner: boolean,
    onShare?: () => void,
    onDelete?: () => void,
    sharedBy?: string
) {
    return (
        <div className="fastwatch-actions">
            {isOwner && CommonButtons.ShareDelete(onShare, onDelete)}
            {sharedBy && (
                <small data-testid="shared-by" className="shared-by">
                    {sharedBy}
                </small>
            )}
        </div>
    );
}
