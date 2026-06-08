import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Timestamp } from 'firebase/firestore';
import { Name } from './Name';
import { TimeRow } from './TimeRow';
import { Controls } from './Controls';
import { Actions } from './Actions';

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
            <Name name={name} isOwner={isOwner} onRename={debouncedOnRename} />
            <TimeRow
                currentElapsed={currentElapsed}
                targetSeconds={targetSeconds}
                isOwner={isOwner}
                targetEditing={targetEditing}
                targetInput={targetInput}
                setTargetInput={setTargetInput}
                setTargetEditing={setTargetEditing}
                commitTarget={commitTarget}
            />
            {isOwner && (
                <Controls
                    onReset={onReset}
                    startEditing={startEditing}
                    startInput={startInput}
                    setStartInput={setStartInput}
                    setStartEditing={setStartEditing}
                    commitStart={commitStart}
                    startedAt={startedAt}
                />
            )}
            <Actions isOwner={isOwner} onShare={onShare} onDelete={onDelete} sharedBy={sharedBy} />
        </div>
    );
}
