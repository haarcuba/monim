import { Timestamp } from 'firebase/firestore';
import { formatDatetimeLocal } from './datetime';

interface Props {
    onReset?: () => void;
    startEditing?: boolean;
    startInput?: string;
    setStartInput?: (v: string) => void;
    setStartEditing?: (v: boolean) => void;
    commitStart?: () => void;
    startedAt?: Timestamp | null;
}

export function Controls({
    onReset,
    startEditing,
    startInput,
    setStartInput,
    setStartEditing,
    commitStart,
    startedAt,
}: Props) {
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
                        if (startedAt) setStartInput?.(formatDatetimeLocal(startedAt.toMillis()));
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
