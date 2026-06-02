import { useEffect, useState } from 'react';
import type { Timestamp } from 'firebase/firestore';
import * as CommonButtons from '@/CommonButtons';

export interface Props {
    id: string;
    targetSeconds: number;
    startedAt: Timestamp | null;
    isOwner?: boolean;
    sharedBy?: string;
    onReset?: () => void;
    onDelete?: () => void;
    onShare?: () => void;
    onSetTarget?: (seconds: number) => void;
}

function _formatTime(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export function FastWatch({
    targetSeconds,
    startedAt,
    isOwner = true,
    sharedBy,
    onReset,
    onDelete,
    onShare,
    onSetTarget,
}: Props) {
    const [now, setNow] = useState(() => Date.now());
    const [targetEditing, setTargetEditing] = useState(false);
    const [targetInput, setTargetInput] = useState('');

    const running = startedAt !== null;

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [running]);

    const currentElapsed = running ? (now - startedAt!.toMillis()) / 1000 : 0;
    const reached = currentElapsed >= targetSeconds;

    function commitTarget() {
        const hours = parseFloat(targetInput);
        if (!isNaN(hours) && hours > 0) {
            onSetTarget?.(Math.round(hours * 3600));
        }
        setTargetEditing(false);
    }

    return (
        <div className={`fastwatch-card${reached ? ' fastwatch-reached' : ''}`}>
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
            {isOwner && _Controls(onReset)}
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

function _Controls(onReset?: () => void) {
    return (
        <div className="fastwatch-controls">
            <button data-testid="reset-button" className="btn-ghost" onClick={onReset}>
                Reset
            </button>
        </div>
    );
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
